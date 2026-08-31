/**
 * Display helpers for the engine's Work Fit contract.
 * workScore is already ranked server-side (laptop > seating > wifi = outlets > noise).
 * iOS shows that number as "Work Fit" — we do the same, never a new formula.
 */

import type { Claim, Venue } from "./venue-engine";

export type ScoreTier = "great" | "good" | "mixed" | "weak";

/** Same bands as VenueKit.ScoreTier. */
export function scoreTier(score: number): ScoreTier {
  if (score >= 75) return "great";
  if (score >= 60) return "good";
  if (score >= 45) return "mixed";
  return "weak";
}

export function workFitLabel(score: number): string {
  return `Work Fit ${score}`;
}

export function formatClaimValue(value: string): string {
  switch (value) {
    case "fast":
      return "Fast";
    case "ok":
      return "OK";
    case "slow":
      return "Slow";
    case "plenty":
      return "Plenty";
    case "some":
      return "Some";
    case "scarce":
      return "Scarce";
    case "unrestricted":
      return "Unrestricted";
    case "time_limited":
      return "Time limited";
    case "weekends_banned":
      return "No laptops on weekends";
    case "discouraged":
      return "Discouraged";
    case "quiet":
      return "Quiet";
    case "moderate":
      return "Moderate";
    case "lively":
      return "Lively";
    case "unknown":
      return "Unknown";
    default:
      return value.replace(/_/g, " ");
  }
}

/** iOS ClaimRow.sourceLabel + ProvenanceStamp.sourceKind. */
export function formatClaimSource(source: string): string {
  switch (source) {
    case "curated":
      return "Curated";
    case "osm":
      return "OpenStreetMap";
    case "estimate":
      return "Unverified estimate";
    case "speed_test":
      return "Measured in app";
    case "user_report":
      return "User report";
    case "field_visit":
      return "Field verified";
    case "site_visit":
      return "Site visit";
    case "owner":
      return "Owner";
    case "agent":
      return "Web research";
    default:
      return source;
  }
}

export function formatObservedAt(observedAt: string): string {
  const day = observedAt.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : observedAt;
}

export function provenanceLine(claim: Claim): string {
  const confidence = Math.round(Math.min(1, Math.max(0, claim.confidence)) * 100);
  return `${formatClaimSource(claim.source)} · ${confidence}% confidence · ${formatObservedAt(claim.observedAt)}`;
}

export type WorkFitPiece = {
  key: "laptopPolicy" | "seating" | "wifi" | "noise";
  title: string;
  claim: Claim | undefined;
};

/** The four work-fit pieces #5 asks for, in scoring-weight order. */
export function workFitPieces(venue: Venue): WorkFitPiece[] {
  return [
    { key: "laptopPolicy", title: "Laptop", claim: venue.attributes.laptopPolicy },
    { key: "seating", title: "Seating", claim: venue.attributes.seating },
    { key: "wifi", title: "Wi-Fi", claim: venue.attributes.wifi },
    { key: "noise", title: "Noise", claim: venue.attributes.noise },
  ];
}

export function formatDistance(meters: number | undefined): string | null {
  if (meters === undefined) return null;
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
