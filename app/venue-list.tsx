"use client";

import Link from "next/link";
import type { Venue } from "@/lib/venue-engine";
import {
  formatDistance,
  listChips,
  scoreTier,
  workFitLabel,
} from "@/lib/work-fit";

export function VenueList({ venues }: { venues: Venue[] }) {
  return (
    <ol className="venue-list">
      {venues.map((venue) => {
        const distance = formatDistance(venue.distance_m);
        const chips = listChips(venue);
        return (
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
                <span className="muted venue-row-meta">
                  {venue.neighborhood}
                  {distance ? ` · ${distance}` : ""}
                </span>
                <span className="chip-row">
                  {chips.map((chip) => (
                    <span key={chip} className="factor-chip">
                      {chip}
                    </span>
                  ))}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
