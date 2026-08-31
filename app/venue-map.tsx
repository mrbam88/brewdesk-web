"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Venue } from "@/lib/venue-engine";
import { scoreTier, workFitLabel } from "@/lib/work-fit";

type VenueMapProps = {
  venues: Venue[];
  center: { lat: number; lng: number };
  onSelect: (venueId: string) => void;
};

const CLUSTER_RADIUS_PX = 68;
const DEFAULT_ZOOM = 14;
const MAX_FIT_ZOOM = 14;

function pinIcon(score: number) {
  return L.divIcon({
    className: `work-fit-pin work-fit-pin--${scoreTier(score)}`,
    html: `<div class="work-fit-pin-inner" aria-hidden="true">${score}</div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

function clusterIcon(count: number) {
  const label = count === 1 ? "spot" : "spots";
  return L.divIcon({
    className: "spot-cluster",
    html: `<div class="spot-cluster-inner" aria-hidden="true"><strong>${count}</strong><span>${label}</span></div>`,
    iconSize: [64, 64],
    iconAnchor: [32, 32],
  });
}

function waitForPaneSize(map: L.Map): Promise<L.Point> {
  return new Promise((resolve) => {
    let frames = 0;
    const tick = () => {
      map.invalidateSize({ animate: false });
      const size = map.getSize();
      if ((size.x >= 40 && size.y >= 40) || frames > 90) {
        resolve(size);
        return;
      }
      frames += 1;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function sheetPaddingPx(map: L.Map): number {
  if (typeof window === "undefined") return 0;
  if (!window.matchMedia("(max-width: 799px)").matches) return 0;
  return Math.round(map.getSize().y * 0.38);
}

function clusterVenues(map: L.Map, venues: Venue[]): Venue[][] {
  if (venues.length === 0) return [];
  if (map.getZoom() >= 17) return venues.map((venue) => [venue]);

  const points = venues.map((venue) => ({
    venue,
    point: map.latLngToLayerPoint([venue.lat, venue.lng]),
  }));
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

function applyCamera(map: L.Map, venues: Venue[], center: { lat: number; lng: number }) {
  map.invalidateSize({ animate: false });
  if (venues.length === 0) {
    map.setView([center.lat, center.lng], DEFAULT_ZOOM, { animate: false });
    return;
  }
  const bounds = L.latLngBounds(venues.map((venue) => [venue.lat, venue.lng]));
  const extra = sheetPaddingPx(map);
  map.fitBounds(bounds, {
    paddingTopLeft: [28, 28],
    paddingBottomRight: [28, 28 + extra],
    maxZoom: MAX_FIT_ZOOM,
    animate: false,
  });
}

function FitPinsAndClusters({ venues, center, onSelect }: VenueMapProps) {
  const map = useMap();
  const onSelectRef = useRef(onSelect);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const lat = center.lat;
  const lng = center.lng;

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });
    observer.observe(container);
    const onWindowResize = () => map.invalidateSize({ animate: false });
    window.addEventListener("resize", onWindowResize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onWindowResize);
    };
  }, [map]);

  useEffect(() => {
    let cancelled = false;

    function draw() {
      if (cancelled) return;
      layerRef.current?.clearLayers();
      if (!layerRef.current) {
        layerRef.current = L.layerGroup().addTo(map);
      }
      const groups = clusterVenues(map, venues);
      for (const group of groups) {
        if (group.length === 1) {
          const venue = group[0];
          const marker = L.marker([venue.lat, venue.lng], {
            icon: pinIcon(venue.workScore),
            title: `${venue.name}, ${workFitLabel(venue.workScore)}`,
          });
          marker.on("click", () => onSelectRef.current(venue.id));
          layerRef.current.addLayer(marker);
          continue;
        }
        const bounds = L.latLngBounds(group.map((venue) => [venue.lat, venue.lng]));
        const marker = L.marker(bounds.getCenter(), {
          icon: clusterIcon(group.length),
          title: `${group.length} spots`,
          keyboard: true,
        });
        marker.on("click", () => {
          map.fitBounds(bounds, {
            padding: [36, 36],
            maxZoom: 18,
            animate: true,
          });
        });
        layerRef.current.addLayer(marker);
      }
    }

    async function setup() {
      await waitForPaneSize(map);
      if (cancelled) return;
      applyCamera(map, venues, { lat, lng });
      draw();
    }

    void setup();
    map.on("zoomend", draw);

    return () => {
      cancelled = true;
      map.off("zoomend", draw);
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, venues, lat, lng]);

  return null;
}

export default function VenueMap(props: VenueMapProps) {
  return (
    <MapContainer
      center={[props.center.lat, props.center.lng]}
      zoom={DEFAULT_ZOOM}
      className="venue-map-canvas"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitPinsAndClusters {...props} />
    </MapContainer>
  );
}
