/**
 * Public venue-engine client. Contract is owned by bamware-venue-engine —
 * do not invent params or response fields. Shape changes break native clients.
 *
 * Live API: https://venuekit-ashen.vercel.app
 * Nearby listing: GET /v1/venues?lat=&lng=&radius_m=&limit=
 * Envelope: { count, venues, meta: { coverage } }
 *
 * This module is meant to run in the browser (no Next.js rewrite/proxy) so
 * CORS on the engine origin is actually exercised.
 */

export const VENUE_ENGINE_ORIGIN =
  process.env.NEXT_PUBLIC_VENUE_ENGINE_URL ??
  "https://venuekit-ashen.vercel.app";

/** Union Square — same viewport as the engine README example. */
export const DEFAULT_VIEWPORT = {
  lat: 40.7359,
  lng: -73.9911,
} as const;

export type Claim = {
  value: string;
  source: string;
  confidence: number;
  observedAt: string;
};

export type Venue = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  neighborhood: string;
  borough: string;
  venueType: string;
  workScore: number;
  distance_m?: number;
  attributes: {
    wifi: Claim;
    outlets: Claim;
    laptopPolicy: Claim;
    noise: Claim;
    seating?: Claim;
  };
};

export type VenueSearchResult = {
  count: number;
  venues: Venue[];
  meta: { coverage: "researched" | "baseline" | "none" };
};

export type NearbyQuery = {
  lat: number;
  lng: number;
  radius_m?: number;
  limit?: number;
};

export function nearbyVenuesUrl(query: NearbyQuery): string {
  const url = new URL("/v1/venues", VENUE_ENGINE_ORIGIN);
  url.searchParams.set("lat", String(query.lat));
  url.searchParams.set("lng", String(query.lng));
  url.searchParams.set("radius_m", String(query.radius_m ?? 2000));
  url.searchParams.set("limit", String(query.limit ?? 10));
  return url.toString();
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
