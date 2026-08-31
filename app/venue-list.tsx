"use client";

import Link from "next/link";
import type { Venue } from "@/lib/venue-engine";
import {
  formatClaimValue,
  formatDistance,
  scoreTier,
  workFitLabel,
  workFitPieces,
} from "@/lib/work-fit";

export function VenueList({ venues }: { venues: Venue[] }) {
  if (venues.length === 0) {
    return <p className="muted">No spots in this view.</p>;
  }

  return (
    <ol className="venue-list">
      {venues.map((venue) => (
        <li key={venue.id}>
          <Link href={`/spots/${encodeURIComponent(venue.id)}`} className="venue-row">
            <span
              className={`work-fit-badge work-fit-badge--${scoreTier(venue.workScore)}`}
              aria-label={workFitLabel(venue.workScore)}
            >
              <strong>{venue.workScore}</strong>
              <span>Work Fit</span>
            </span>
            <span className="venue-row-body">
              <span className="venue-row-name">{venue.name}</span>
              <span className="muted">
                {venue.neighborhood}
                {formatDistance(venue.distance_m)
                  ? ` · ${formatDistance(venue.distance_m)}`
                  : ""}
              </span>
              <span className="venue-row-signals">
                {workFitPieces(venue)
                  .map((piece) =>
                    piece.claim
                      ? `${piece.title} ${formatClaimValue(piece.claim.value)}`
                      : `${piece.title} unobserved`,
                  )
                  .join(" · ")}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
