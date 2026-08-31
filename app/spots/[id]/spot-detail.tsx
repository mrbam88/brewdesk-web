"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchVenueDetail, type Venue } from "@/lib/venue-engine";
import {
  formatClaimValue,
  provenanceLine,
  scoreTier,
  workFitLabel,
  workFitPieces,
} from "@/lib/work-fit";

type DetailState =
  | { status: "loading" }
  | { status: "ok"; venue: Venue }
  | { status: "error"; message: string };

export function SpotDetail({ venueId }: { venueId: string }) {
  const [state, setState] = useState<DetailState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchVenueDetail(venueId)
      .then((result) => {
        if (!cancelled) setState({ status: "ok", venue: result.venue });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: "error", message });
      });
    return () => {
      cancelled = true;
    };
  }, [venueId]);

  return (
    <main className="spot-page">
      <p>
        <Link href="/" className="back-to-map">
          ← Map
        </Link>
      </p>

      {state.status === "loading" ? <p>Loading spot…</p> : null}

      {state.status === "error" ? (
        <p>
          Could not load this spot ({state.message}).{" "}
          <Link href="/">Back to the map</Link>
        </p>
      ) : null}

      {state.status === "ok" ? <SpotEvidence venue={state.venue} /> : null}
    </main>
  );
}

function SpotEvidence({ venue }: { venue: Venue }) {
  return (
    <article>
      <h1>{venue.name}</h1>
      <p className="muted">
        {venue.neighborhood}, {venue.borough}
        {venue.address ? ` · ${venue.address}` : ""}
      </p>

      <p
        className={`work-fit-badge work-fit-badge--lg work-fit-badge--${scoreTier(venue.workScore)}`}
        aria-label={`${workFitLabel(venue.workScore)} out of 100`}
      >
        <strong>{venue.workScore}</strong>
        <span>Work Fit</span>
      </p>

      <h2>Why it scored that way</h2>
      <ul className="evidence-list">
        {workFitPieces(venue).map((piece) => (
          <li key={piece.key} className="evidence-row">
            <div className="evidence-head">
              <span>{piece.title}</span>
              <strong>
                {piece.claim
                  ? formatClaimValue(piece.claim.value)
                  : "Not yet observed"}
              </strong>
            </div>
            {piece.claim ? (
              <p className="muted evidence-source">{provenanceLine(piece.claim)}</p>
            ) : (
              <p className="muted evidence-source">No source yet</p>
            )}
          </li>
        ))}
      </ul>
    </article>
  );
}
