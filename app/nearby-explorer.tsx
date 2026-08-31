"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DEFAULT_VIEWPORT,
  fetchNearbyVenues,
  type Venue,
  type VenueSearchResult,
} from "@/lib/venue-engine";
import { VenueList } from "./venue-list";

const VenueMap = dynamic(() => import("./venue-map"), {
  ssr: false,
  loading: () => <p className="map-placeholder">Loading map…</p>,
});

type Viewport = { lat: number; lng: number };

type LoadState =
  | { status: "locating" }
  | { status: "loading"; viewport: Viewport; usedDefault: boolean }
  | {
      status: "ok";
      viewport: Viewport;
      usedDefault: boolean;
      data: VenueSearchResult;
    }
  | { status: "error"; viewport: Viewport; usedDefault: boolean; message: string };

function resolveViewport(): Promise<{ viewport: Viewport; usedDefault: boolean }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ viewport: DEFAULT_VIEWPORT, usedDefault: true });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          viewport: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          usedDefault: false,
        });
      },
      () => resolve({ viewport: DEFAULT_VIEWPORT, usedDefault: true }),
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 300_000 },
    );
  });
}

export function NearbyExplorer() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "locating" });

  useEffect(() => {
    let cancelled = false;
    resolveViewport().then(({ viewport, usedDefault }) => {
      if (cancelled) return;
      setState({ status: "loading", viewport, usedDefault });
      return fetchNearbyVenues({ ...viewport, sort: "work_score" })
        .then((data) => {
          if (!cancelled) setState({ status: "ok", viewport, usedDefault, data });
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          const message = err instanceof Error ? err.message : String(err);
          setState({ status: "error", viewport, usedDefault, message });
        });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const venues: Venue[] = state.status === "ok" ? state.data.venues : [];
  const viewport =
    state.status === "locating" ? DEFAULT_VIEWPORT : state.viewport;

  function openSpot(id: string) {
    router.push(`/spots/${encodeURIComponent(id)}`);
  }

  return (
    <div className="nearby-shell">
      <header className="nearby-header">
        <div>
          <h1>BrewDesk</h1>
          <p className="muted nearby-subhead">
            Ranked by Work Fit — laptop, seating, Wi-Fi, noise. No account.
          </p>
        </div>
        {state.status !== "locating" && state.usedDefault ? (
          <p className="location-banner">
            Location is off — showing Union Square, NYC.
          </p>
        ) : null}
        {state.status === "ok" ? (
          <p className="muted">
            {state.data.count} nearby spot{state.data.count === 1 ? "" : "s"}
            {state.data.meta.coverage !== "researched"
              ? ` · ${state.data.meta.coverage} coverage`
              : ""}
          </p>
        ) : null}
      </header>

      <div className="nearby-layout">
        <section className="map-pane" aria-label="Map of nearby work spots">
          {state.status === "ok" || state.status === "loading" ? (
            <VenueMap venues={venues} center={viewport} onSelect={openSpot} />
          ) : (
            <p className="map-placeholder">Finding work spots…</p>
          )}
        </section>

        <section className="list-pane" aria-label="Ranked nearby work spots">
          {state.status === "locating" || state.status === "loading" ? (
            <p>Finding work spots…</p>
          ) : null}
          {state.status === "error" ? (
            <p>
              Engine call failed: {state.message}. If this is a CORS error, the
              engine must allow this origin.
            </p>
          ) : null}
          {state.status === "ok" ? <VenueList venues={venues} /> : null}
        </section>
      </div>
    </div>
  );
}
