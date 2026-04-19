import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "transparent",
          color: "#ffffff",
          display: "flex",
          height: "100%",
          justifyContent: "flex-start",
          padding: "0",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 9,
            width: 76,
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.95)",
              borderRadius: 999,
              display: "flex",
              height: 14,
              width: 68,
            }}
          />
          <div
            style={{
              background: "rgba(255,255,255,0.82)",
              borderRadius: 999,
              display: "flex",
              height: 14,
              width: 46,
            }}
          />
          <div
            style={{
              background: "rgba(255,255,255,0.7)",
              borderRadius: 999,
              display: "flex",
              height: 14,
              width: 23,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            marginLeft: 14,
          }}
        >
          Flow
        </div>
      </div>
    ),
    {
      width: 300,
      height: 96,
    },
  );
}
