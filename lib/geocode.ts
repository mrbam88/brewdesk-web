/**
 * OpenStreetMap Nominatim only — no Google Places.
 * Called from the browser so we use the visitor's IP (Nominatim blocks
 * many cloud egress ranges).
 */

export type GeocodedPlace = {
  label: string;
  lat: number;
  lng: number;
};

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  municipality?: string;
  suburb?: string;
  neighbourhood?: string;
  city_district?: string;
  county?: string;
  state?: string;
};

type NominatimHit = {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
};

const NOMINATIM = "https://nominatim.openstreetmap.org";

const US_STATE_ABBR: Record<string, string> = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
  "District of Columbia": "DC",
};

function locality(address: NominatimAddress | undefined): string | undefined {
  if (!address) return undefined;
  return (
    address.neighbourhood ||
    address.suburb ||
    address.city_district ||
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.municipality
  );
}

export function formatNominatimLabel(hit: {
  display_name: string;
  address?: NominatimAddress;
}): string {
  const city = locality(hit.address);
  const state = hit.address?.state;
  const abbr = state ? (US_STATE_ABBR[state] ?? state) : undefined;

  if (city && abbr) {
    if (city === "New York" && abbr === "NY") return "New York, NY";
    return `${city}, ${abbr}`;
  }
  if (city) return city;

  return hit.display_name
    .split(",")
    .slice(0, 2)
    .map((part) => part.trim())
    .join(", ");
}

async function nominatimGet(url: URL): Promise<Response> {
  return fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
}

export async function geocodePlace(query: string): Promise<GeocodedPlace | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const url = new URL("/search", NOMINATIM);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "us");

  const response = await nominatimGet(url);
  if (!response.ok) return null;
  const hits = (await response.json()) as NominatimHit[];
  const hit = hits[0];
  if (!hit) return null;

  return {
    label: formatNominatimLabel(hit),
    lat: Number(hit.lat),
    lng: Number(hit.lon),
  };
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  const url = new URL("/reverse", NOMINATIM);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", "14");

  const response = await nominatimGet(url);
  if (!response.ok) return null;
  const hit = (await response.json()) as NominatimHit;
  if (!hit?.lat) return null;
  return formatNominatimLabel(hit);
}
