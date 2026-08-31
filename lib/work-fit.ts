/**
 * Display helpers for the engine's Work Fit contract.
 * workScore is already ranked server-side (laptop > seating > wifi = outlets > noise).
 * iOS shows that number as "Work Fit" — we do the same, never a new formula.
 */

import type { Claim, Venue } from "./venue-engine";
import { COPY } from "./copy";

export type ScoreTier = "great" | "good" | "mixed" | "weak";

/** Same bands as VenueKit.ScoreTier / iOS. Great 75+; 72 is Good. */
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

/** Human date: Aug 1, 2026 — never 2026-08-01. */
export function formatObservedAt(observedAt: string): string {
  const day = observedAt.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return observedAt;
  const [year, month, date] = day.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, date)));
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

/** The four work-fit pieces, in scoring-weight order. */
export function workFitPieces(venue: Venue): WorkFitPiece[] {
  return [
    { key: "laptopPolicy", title: "Laptop", claim: venue.attributes.laptopPolicy },
    { key: "seating", title: "Seating", claim: venue.attributes.seating },
    { key: "wifi", title: "Wi-Fi", claim: venue.attributes.wifi },
    { key: "noise", title: "Noise", claim: venue.attributes.noise },
  ];
}

/** Observed factor with a real value — not unknown / 0% estimate. */
export function hasWorkFitSignal(claim: Claim | undefined): boolean {
  if (!claim) return false;
  if (claim.value === "unknown") return false;
  if (claim.confidence <= 0) return false;
  return true;
}

/**
 * Compact list/sheet chips. No colons. Unknown seating is omitted entirely
 * (not ghosted, not “Unknown”). Engine words only.
 */
export function listChips(venue: Venue): string[] {
  return workFitPieces(venue).flatMap((piece) => {
    if (piece.key === "seating" && !hasWorkFitSignal(piece.claim)) return [];
    if (!hasWorkFitSignal(piece.claim) || !piece.claim) return [];
    return [`${piece.title} ${formatClaimValue(piece.claim.value)}`];
  });
}

export function formatVenueType(type: string): string {
  switch (type) {
    case "cafe":
      return "Café";
    case "library":
      return "Library";
    case "park":
      return "Park";
    default:
      return type ? type.charAt(0).toUpperCase() + type.slice(1) : "Place";
  }
}

export function formatHours(hoursRaw: string | undefined): string | null {
  if (!hoursRaw?.trim()) return null;
  return hoursRaw.trim();
}

export function mapsSearchUrl(venue: Venue): string {
  return `https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`;
}

/** Miles only (`0.8 mi`). Never km. */
export function formatDistance(meters: number | undefined): string | null {
  if (meters === undefined || Number.isNaN(meters)) return null;
  const miles = meters / 1609.344;
  if (miles < 0.05) return "0.1 mi";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

export function nearbyResultLine(placeLabel: string, count: number): string {
  const spots = count === 1 ? "1 spot nearby" : `${count} spots nearby`;
  return `${placeLabel} · ${spots}`;
}

export function seatingDetailCopy(claim: Claim | undefined): {
  value: string;
  provenance: string | null;
  muted: boolean;
} {
  if (!hasWorkFitSignal(claim) || !claim) {
    return { value: COPY.notEnoughSignal, provenance: null, muted: true };
  }
  return {
    value: formatClaimValue(claim.value),
    provenance: provenanceLine(claim),
    muted: false,
  };
}
