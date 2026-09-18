"use client";

import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { AdvancedMarker, APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import type { Venue } from "@/lib/venue-engine";
import { scoreTier, workFitLabel } from "@/lib/work-fit";

// A rejected, revoked, or over-quota key must degrade to the OSM map, never to
// Next's error page: Google tears its map down on auth failure and the next
// marker attach throws.
const LeafletVenueMap = dynamic(() => import("./venue-map"), {
  ssr: false,
  loading: () => <div className="map-placeholder" aria-hidden="true" />,
});

type VenueMapProps = {
  venues: Venue[];
  center: { lat: number; lng: number };
  onSelect: (venueId: string) => void;
};

type LatLng = { lat: number; lng: number };
type Point = { x: number; y: number };

// Mirrors app/venue-map.tsx (the Leaflet fallback) so both providers frame and
// cluster the same spots the same way.
const CLUSTER_RADIUS_PX = 68;
const DEFAULT_ZOOM = 14;
const MAX_FIT_ZOOM = 14;
const MAX_CLUSTER_ZOOM = 18;
const FIT_PADDING_PX = 28;
const CLUSTER_FIT_PADDING_PX = 36;
const TILE_SIZE = 256;

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
// Advanced Markers need a Map ID; Google's DEMO_MAP_ID keeps dev and preview
// builds working until a real one is configured.
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

/** Web Mercator world pixel coordinates at `zoom` (what Google and Leaflet both render). */
function project({ lat, lng }: LatLng, zoom: number): Point {
  const scale = TILE_SIZE * 2 ** zoom;
  const siny = Math.min(Math.max(Math.sin((lat * Math.PI) / 180), -0.9999), 0.9999);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)) * scale,
  };
}

function unproject({ x, y }: Point, zoom: number): LatLng {
  const scale = TILE_SIZE * 2 ** zoom;
  const lng = (x / scale) * 360 - 180;
  const lat = ((2 * Math.atan(Math.exp((0.5 - y / scale) * 2 * Math.PI)) - Math.PI / 2) * 180) / Math.PI;
  return { lat, lng };
}

function boundsOf(venues: Venue[]) {
  const lats = venues.map((venue) => venue.lat);
  const lngs = venues.map((venue) => venue.lng);
  return {
    south: Math.min(...lats),
    west: Math.min(...lngs),
    north: Math.max(...lats),
    east: Math.max(...lngs),
  };
}

function boundsCenter(bounds: ReturnType<typeof boundsOf>): LatLng {
  return { lat: (bounds.south + bounds.north) / 2, lng: (bounds.west + bounds.east) / 2 };
}

/** Largest whole zoom at which `bounds` fits in a `width` × `height` box (Leaflet getBoundsZoom). */
function zoomToFit(bounds: ReturnType<typeof boundsOf>, width: number, height: number): number {
  const nw = project({ lat: bounds.north, lng: bounds.west }, 0);
  const se = project({ lat: bounds.south, lng: bounds.east }, 0);
  const spanX = Math.abs(se.x - nw.x);
  const spanY = Math.abs(se.y - nw.y);
  if (spanX === 0 && spanY === 0) return Infinity;
  const fit = Math.min(spanX ? width / spanX : Infinity, spanY ? height / spanY : Infinity);
  return Math.floor(Math.log2(fit));
}

// Measure our own wrapper, not map.getDiv(): Google leaves that undefined when
// the key is rejected, and a throw here would take down the whole page.
function sizeOf(el: HTMLElement): Point {
  return { x: el.clientWidth, y: el.clientHeight };
}

function waitForStableSize(el: HTMLElement): Promise<Point> {
  return new Promise((resolve) => {
    let last = { x: 0, y: 0 };
    let stable = 0;
    let frames = 0;
    const tick = () => {
      const size = sizeOf(el);
      const ready = size.x >= 80 && size.y >= 80;
      const same = size.x === last.x && size.y === last.y;
      if (ready && same) {
        stable += 1;
        if (stable >= 4) {
          resolve(size);
          return;
        }
      } else {
        stable = 0;
      }
      last = size;
      frames += 1;
      if (frames > 120) {
        resolve(size);
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function sheetPaddingPx(size: Point): number {
  if (typeof window === "undefined") return 0;
  if (!window.matchMedia("(max-width: 799px)").matches) return 0;
  return Math.round(size.y * 0.38);
}

function applyCamera(map: google.maps.Map, size: Point, venues: Venue[], center: LatLng) {
  // Plant the camera on the requested center at neighborhood zoom first, so a
  // too-wide first layout cannot leave Union Square off the edge (#7).
  map.moveCamera({ center, zoom: DEFAULT_ZOOM });
  if (venues.length === 0) return;

  const bounds = boundsOf(venues);
  const padded = { x: size.x - 2 * FIT_PADDING_PX, y: size.y - 2 * FIT_PADDING_PX };
  if (zoomToFit(bounds, padded.x, padded.y) < DEFAULT_ZOOM) return;

  // Fit with the mobile list sheet as extra bottom padding, capped at MAX_FIT_ZOOM.
  const extra = sheetPaddingPx(size);
  const zoom = Math.min(MAX_FIT_ZOOM, zoomToFit(bounds, padded.x, padded.y - extra));
  const mid = project(boundsCenter(bounds), zoom);
  map.moveCamera({ center: unproject({ x: mid.x, y: mid.y + extra / 2 }, zoom), zoom });
}

function clusterVenues(venues: Venue[], zoom: number): Venue[][] {
  if (venues.length === 0) return [];
  if (zoom >= 17) return venues.map((venue) => [venue]);

  const points = venues.map((venue) => ({ venue, point: project(venue, zoom) }));
  const used = new Set<string>();
  const groups: Venue[][] = [];
  const radiusSq = CLUSTER_RADIUS_PX * CLUSTER_RADIUS_PX;

  for (const candidate of points) {
    if (used.has(candidate.venue.id)) continue;
    const group = [candidate.venue];
    used.add(candidate.venue.id);
    for (const other of points) {
      if (used.has(other.venue.id)) continue;
      const dx = candidate.point.x - other.point.x;
      const dy = candidate.point.y - other.point.y;
      if (dx * dx + dy * dy <= radiusSq) {
        group.push(other.venue);
        used.add(other.venue.id);
      }
    }
    groups.push(group);
  }
  return groups;
}

function zoomToCluster(map: google.maps.Map, group: Venue[]) {
  const bounds = boundsOf(group);
  map.fitBounds(bounds, CLUSTER_FIT_PADDING_PX);
  google.maps.event.addListenerOnce(map, "idle", () => {
    if ((map.getZoom() ?? 0) > MAX_CLUSTER_ZOOM) map.setZoom(MAX_CLUSTER_ZOOM);
  });
}

function PinsAndClusters({
  venues,
  center,
  onSelect,
  container,
}: VenueMapProps & { container: HTMLElement | null }) {
  const map = useMap();
  const onSelectRef = useRef(onSelect);
  const fittedSize = useRef<Point | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const lat = center.lat;
  const lng = center.lng;

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("zoom_changed", () => {
      setZoom(map.getZoom() ?? DEFAULT_ZOOM);
    });
    return () => listener.remove();
  }, [map]);

  useEffect(() => {
    if (!map || !container) return;
    const el = container;
    let cancelled = false;

    function fit() {
      if (cancelled || !map) return;
      const size = sizeOf(el);
      applyCamera(map, size, venues, { lat, lng });
      fittedSize.current = size;
      setZoom(map.getZoom() ?? DEFAULT_ZOOM);
    }

    const observer = new ResizeObserver(() => {
      const prev = fittedSize.current;
      if (!prev) return;
      const size = sizeOf(el);
      if (Math.abs(prev.x - size.x) > 48 || Math.abs(prev.y - size.y) > 48) fit();
    });
    observer.observe(el);

    void waitForStableSize(el).then(fit);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [map, container, venues, lat, lng]);

  const groups = useMemo(() => clusterVenues(venues, zoom), [venues, zoom]);

  return (
    <>
      {groups.map((group) => {
        if (group.length === 1) {
          const venue = group[0];
          return (
            <AdvancedMarker
              key={venue.id}
              position={{ lat: venue.lat, lng: venue.lng }}
              title={`${venue.name}, ${workFitLabel(venue.workScore)}`}
              anchorLeft="-50%"
              anchorTop="-50%"
              className={`work-fit-pin work-fit-pin--${scoreTier(venue.workScore)}`}
              onClick={() => onSelectRef.current(venue.id)}
            >
              <div className="work-fit-pin-inner" aria-hidden="true">
                {venue.workScore}
              </div>
            </AdvancedMarker>
          );
        }
        return (
          <AdvancedMarker
            key={`cluster:${group.map((venue) => venue.id).join(",")}`}
            position={boundsCenter(boundsOf(group))}
            title={`${group.length} spots`}
            anchorLeft="-50%"
            anchorTop="-50%"
            className="spot-cluster"
            onClick={() => map && zoomToCluster(map, group)}
          >
            <div className="spot-cluster-inner" aria-hidden="true">
              <strong>{group.length}</strong>
              <span>spots</span>
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
}

class MapErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

export default function GoogleVenueMap(props: VenueMapProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [authFailed, setAuthFailed] = useState(false);

  useEffect(() => {
    // Google calls this global on InvalidKey / RefererNotAllowed / quota errors.
    window.gm_authFailure = () => setAuthFailed(true);
    return () => {
      delete window.gm_authFailure;
    };
  }, []);

  const fallback = <LeafletVenueMap {...props} />;
  if (authFailed) return fallback;

  return (
    <MapErrorBoundary fallback={fallback}>
      <div ref={setContainer} className="venue-map-canvas">
        <APIProvider apiKey={API_KEY}>
          <Map
            style={{ width: "100%", height: "100%" }}
            mapId={MAP_ID}
            defaultCenter={props.center}
            defaultZoom={DEFAULT_ZOOM}
            gestureHandling="greedy"
            disableDefaultUI
            zoomControl
            clickableIcons={false}
          >
            <PinsAndClusters {...props} container={container} />
          </Map>
        </APIProvider>
      </div>
    </MapErrorBoundary>
  );
}
