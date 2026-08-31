"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_VIEWPORT,
  VENUE_ENGINE_ORIGIN,
  fetchNearbyVenues,
  nearbyVenuesUrl,
  type VenueSearchResult,
} from "@/lib/venue-engine";

type ProbeState =
  | { status: "loading"; url: string }
  | { status: "ok"; url: string; data: VenueSearchResult }
  | { status: "error"; url: string; message: string };

export function NearbyProbe() {
  const [state, setState] = useState<ProbeState>({
    status: "loading",
    url: nearbyVenuesUrl(DEFAULT_VIEWPORT),
  });

  useEffect(() => {
    let cancelled = false;
    const url = nearbyVenuesUrl(DEFAULT_VIEWPORT);
    fetchNearbyVenues(DEFAULT_VIEWPORT)
      .then((data) => {
        if (!cancelled) setState({ status: "ok", url, data });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: "error", url, message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function fetchAgain() {
    const url = nearbyVenuesUrl(DEFAULT_VIEWPORT);
    setState({ status: "loading", url });
    fetchNearbyVenues(DEFAULT_VIEWPORT)
      .then((data) => {
        setState({ status: "ok", url, data });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: "error", url, message });
      });
  }

  return (
    <section>
      <p>
        Engine: <code>{VENUE_ENGINE_ORIGIN}</code>
      </p>
      <p>
        Browser fetch: <code>{state.url}</code>
      </p>
      <p>
        Viewport: Union Square ({DEFAULT_VIEWPORT.lat}, {DEFAULT_VIEWPORT.lng})
        — seed data from the venue engine README. No auth.
      </p>
      <p>
        <button type="button" onClick={fetchAgain}>
          Fetch again
        </button>
      </p>

      {state.status === "loading" ? <p>Talking to the venue engine…</p> : null}

      {state.status === "error" ? (
        <div>
          <p>Engine call failed: {state.message}</p>
          <p>
            If this is a CORS error (TypeError: Failed to fetch), the engine
            must allow this page&apos;s origin (typically http://localhost:3000).
          </p>
        </div>
      ) : null}

      {state.status === "ok" ? (
        <div>
          <p>
            Got {state.data.count} nearby result
            {state.data.count === 1 ? "" : "s"} (coverage:{" "}
            {state.data.meta.coverage}).
          </p>
          {state.data.venues.length === 0 ? (
            <p>No venues in this viewport.</p>
          ) : (
            <ol>
              {state.data.venues.map((venue) => (
                <li key={venue.id}>
                  <strong>{venue.name}</strong> — {venue.neighborhood},{" "}
                  {venue.borough}
                  <br />
                  workScore {venue.workScore}
                  {venue.distance_m !== undefined
                    ? ` · ${venue.distance_m} m`
                    : ""}
                  {` · wifi ${venue.attributes.wifi.value}`}
                  {` · laptops ${venue.attributes.laptopPolicy.value}`}
                  {` · seating ${venue.attributes.seating?.value ?? "unobserved"}`}
                  {` · noise ${venue.attributes.noise.value}`}
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : null}
    </section>
  );
}
