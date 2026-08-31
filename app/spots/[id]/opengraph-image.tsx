import { ImageResponse } from "next/og";
import { fetchVenueDetail } from "@/lib/venue-engine";
import { formatVenueType, scoreTier, workFitLabel } from "@/lib/work-fit";

export const alt = "BrewDesk Work Fit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CREAM = "#f4efe4";
const INK = "#241c16";
const FOREST = "#2c5f4a";
const GOOD = "#4a7c59";
const MIXED = "#b0893e";
const WEAK = "#a33b3b";

function tierColor(score: number): string {
  const tier = scoreTier(score);
  if (tier === "great") return FOREST;
  if (tier === "good") return GOOD;
  if (tier === "mixed") return MIXED;
  return WEAK;
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let name = "BrewDesk";
  let score: number | null = null;
  let detail = "find where work actually works";

  try {
    const { venue } = await fetchVenueDetail(id);
    name = venue.name;
    score = venue.workScore;
    detail = `${formatVenueType(venue.venueType)} · ${venue.neighborhood}`;
  } catch {
    /* generic card */
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: CREAM,
          color: INK,
          padding: 64,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 760 }}>
          <div style={{ display: "flex", fontSize: 28, color: FOREST, fontWeight: 700 }}>
            BrewDesk
          </div>
          <div
            style={{
              display: "flex",
              fontSize: name.length > 28 ? 48 : 64,
              fontWeight: 700,
              lineHeight: 1.1,
              marginTop: 24,
            }}
          >
            {name}
          </div>
          <div style={{ display: "flex", fontSize: 28, marginTop: 16, color: "#6b5d50" }}>
            {score !== null ? `${detail} · ${workFitLabel(score)}` : detail}
          </div>
        </div>
        {score !== null ? (
          <div
            style={{
              width: 180,
              height: 180,
              borderRadius: 90,
              background: tierColor(score),
              color: CREAM,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ display: "flex", fontSize: 64, fontWeight: 700 }}>{score}</div>
            <div style={{ display: "flex", fontSize: 20, letterSpacing: 1 }}>Work Fit</div>
          </div>
        ) : null}
      </div>
    ),
    { ...size },
  );
}
