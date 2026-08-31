import { ImageResponse } from "next/og";
import { SITE_TITLE } from "@/lib/site";

export const alt = SITE_TITLE;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CREAM = "#f4efe4";
const INK = "#241c16";
const FOREST = "#2c5f4a";
const GOOD = "#4a7c59";
const MIXED = "#b0893e";

function Pin({
  left,
  top,
  score,
  color,
}: {
  left: number;
  top: number;
  score: number;
  color: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: 72,
        height: 72,
        borderRadius: 36,
        background: color,
        color: CREAM,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 28,
        fontWeight: 700,
        border: "3px solid #fffdf8",
      }}
    >
      {score}
    </div>
  );
}

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: CREAM,
          color: INK,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 40,
            borderRadius: 28,
            background: "#e7dfd0",
            display: "flex",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 80,
              top: 0,
              bottom: 0,
              width: 8,
              background: "#d9cfc0",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 280,
              top: 0,
              bottom: 0,
              width: 6,
              background: "#d9cfc0",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 620,
              top: 0,
              bottom: 0,
              width: 10,
              background: "#d3c8b6",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 140,
              height: 8,
              background: "#d9cfc0",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 310,
              height: 6,
              background: "#d3c8b6",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 220,
              height: 90,
              left: 360,
              top: 200,
              borderRadius: 16,
              background: "#cddfcf",
              display: "flex",
            }}
          />
          <Pin left={200} top={120} score={72} color={GOOD} />
          <Pin left={430} top={250} score={69} color={GOOD} />
          <Pin left={720} top={90} score={81} color={FOREST} />
          <Pin left={860} top={320} score={58} color={MIXED} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 64,
            right: 64,
            bottom: 48,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 56,
              fontWeight: 700,
              color: FOREST,
            }}
          >
            BrewDesk
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: INK,
              marginTop: 8,
            }}
          >
            find where work actually works
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
