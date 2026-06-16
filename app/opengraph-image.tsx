import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #0F1F66 0%, #1a3078 45%, #0fd5c7 180%)",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            fontWeight: 600,
            opacity: 0.9,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            X
          </div>
          {SITE_NAME}
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            maxWidth: 900,
          }}
        >
          {SITE_TAGLINE}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 28,
            lineHeight: 1.45,
            opacity: 0.92,
            maxWidth: 820,
          }}
        >
          Paiement sécurisé par séquestre au Sénégal · Wave · Orange Money · Anti-arnaque
        </div>
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            gap: 20,
            fontSize: 22,
            opacity: 0.85,
          }}
        >
          <span>xaalispay.com</span>
          <span>·</span>
          <span>Dakar, Sénégal 🇸🇳</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
