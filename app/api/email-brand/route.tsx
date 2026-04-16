import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#0f172a",
          borderRadius: 32,
          color: "#ffffff",
          display: "flex",
          height: "100%",
          justifyContent: "space-between",
          padding: "28px 36px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            width: 124,
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.95)",
              borderRadius: 999,
              display: "flex",
              height: 24,
              width: 112,
            }}
          />
          <div
            style={{
              background: "rgba(255,255,255,0.82)",
              borderRadius: 999,
              display: "flex",
              height: 24,
              width: 76,
            }}
          />
          <div
            style={{
              background: "rgba(255,255,255,0.7)",
              borderRadius: 999,
              display: "flex",
              height: 24,
              width: 38,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            marginLeft: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 52,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            Flow
          </div>
          <div
            style={{
              color: "#e2e8f0",
              display: "flex",
              fontSize: 20,
              fontWeight: 500,
              letterSpacing: "0.05em",
              lineHeight: 1.2,
              marginTop: 12,
              textTransform: "uppercase",
            }}
          >
            Xlabs Technology Management
          </div>
        </div>
      </div>
    ),
    {
      width: 640,
      height: 180,
    },
  );
}
