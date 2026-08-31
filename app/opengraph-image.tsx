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
const STREET = "#d7ccba";
const PARK = "#c5d7c4";

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
        width: 78,
        height: 78,
        borderRadius: 39,
        backgroundColor: color,
        color: CREAM,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 30,
        fontWeight: 700,
        border: "4px solid #fffdf8",
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
          position: "relative",
          backgroundColor: CREAM,
          color: INK,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 36,
            width: 1128,
            height: 430,
            borderRadius: 28,
            backgroundColor: "#e8dfd0",
            display: "flex",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 90,
              top: 0,
              width: 10,
              height: 430,
              backgroundColor: STREET,
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 310,
              top: 0,
              width: 8,
              height: 430,
              backgroundColor: STREET,
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 640,
              top: 0,
              width: 12,
              height: 430,
              backgroundColor: STREET,
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 920,
              top: 0,
              width: 8,
              height: 430,
              backgroundColor: STREET,
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 120,
              width: 1128,
              height: 10,
              backgroundColor: STREET,
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 270,
              width: 1128,
              height: 8,
              backgroundColor: STREET,
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 380,
              top: 160,
              width: 240,
              height: 96,
              borderRadius: 18,
              backgroundColor: PARK,
              display: "flex",
            }}
          />
          <Pin left={180} top={70} score={72} color={GOOD} />
          <Pin left={470} top={210} score={69} color={GOOD} />
          <Pin left={760} top={50} score={81} color={FOREST} />
          <Pin left={980} top={280} score={58} color={MIXED} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 56,
            bottom: 28,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 52,
              fontWeight: 700,
              color: FOREST,
            }}
          >
            BrewDesk
          </div>
          <div style={{ display: "flex", fontSize: 26, color: INK, marginTop: 4 }}>
            find where work actually works
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
