/**
 * Public venue-engine client. Contract is owned by bamware-venue-engine —
 * do not invent params or response fields. Shape changes break native clients.
 *
 * Live API: https://venuekit-ashen.vercel.app
 * Nearby listing: GET /v1/venues?lat=&lng=&radius_m=&limit=&sort=
 * Envelope: { count, venues, meta: { coverage } }
 * Detail: GET /v1/venues/:id → { venue, observations }
 *
 * Ranking is the engine's workScore (iOS label: Work Fit). Default sort is
 * work_score — laptop policy, seating, Wi-Fi, outlets, noise. Do not recompute.
 *
 * This module is meant to run in the browser (no Next.js rewrite/proxy) so
 * CORS on the engine origin is actually exercised.
 */

export const VENUE_ENGINE_ORIGIN =
  process.env.NEXT_PUBLIC_VENUE_ENGINE_URL ??
  "https://venuekit-ashen.vercel.app";

/** Union Square — same viewport as the engine README / iOS coverage center. */
export const DEFAULT_VIEWPORT = {
  lat: 40.7359,
  lng: -73.9911,
} as const;

/** Matches VenuesModel.radiusM on iOS. */
export const DEFAULT_RADIUS_M = 2500;

export type Claim = {
  value: string;
  detail?: string;
  mbpsRange?: [number, number];
  timeWindow?: string | null;
  source: string;
  confidence: number;
  observedAt: string;
};

export type Venue = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  neighborhood: string;
  borough: string;
  hoursRaw?: string;
  venueType: string;
  workScore: number;
  distance_m?: number;
  lastVerified?: string;
  vibeTags?: string[];
  tier?: "researched" | "osm-baseline";
  attributes: {
    wifi: Claim;
    outlets: Claim;
    laptopPolicy: Claim;
    noise: Claim;
    seating?: Claim;
    outdoorSeating?: Claim;
  };
};

export type VenueSearchResult = {
  count: number;
  venues: Venue[];
  meta: { coverage: "researched" | "baseline" | "none" };
};

export type VenueDetailResult = {
  venue: Venue;
};

export type NearbyQuery = {
  lat: number;
  lng: number;
  radius_m?: number;
  limit?: number;
  sort?: "work_score" | "distance";
};

export function nearbyVenuesUrl(query: NearbyQuery): string {
  const url = new URL("/v1/venues", VENUE_ENGINE_ORIGIN);
  url.searchParams.set("lat", String(query.lat));
  url.searchParams.set("lng", String(query.lng));
  url.searchParams.set("radius_m", String(query.radius_m ?? DEFAULT_RADIUS_M));
  url.searchParams.set("limit", String(query.limit ?? 50));
  url.searchParams.set("sort", query.sort ?? "work_score");
  return url.toString();
}

export function venueDetailUrl(id: string): string {
  return new URL(`/v1/venues/${encodeURIComponent(id)}`, VENUE_ENGINE_ORIGIN).toString();
}

export async function fetchNearbyVenues(
  query: NearbyQuery,
): Promise<VenueSearchResult> {
  const url = nearbyVenuesUrl(query);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`venue engine ${response.status}`);
  }
  return (await response.json()) as VenueSearchResult;
}

export async function fetchVenueDetail(id: string): Promise<VenueDetailResult> {
  const response = await fetch(venueDetailUrl(id), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`venue engine ${response.status}`);
  }
  return (await response.json()) as VenueDetailResult;
}
