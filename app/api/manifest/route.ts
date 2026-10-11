import { NextResponse } from "next/server";

export const runtime = "nodejs";

const EN_MANIFEST = {
  name: "Aha It's me! — Know yourself",
  short_name: "Aha It's me!",
  description: "Discover your patterns through surveys, charts, and relationships.",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#fffdf8",
  theme_color: "#1a382c",
  icons: [
    {
      src: "/icon.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "/icon.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
};

const KO_MANIFEST = {
  name: "아하잇츠미 (Aha It's me!)",
  short_name: "아하잇츠미",
  description: "설문과 사주, 점성학으로 나만의 패턴과 관계를 발견해 보세요.",
  start_url: "/kr",
  scope: "/kr",
  display: "standalone",
  background_color: "#fffdf8",
  theme_color: "#1a382c",
  icons: [
    {
      src: "/icon.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "/icon.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lang = url.searchParams.get("lang");
  const isKo = lang === "ko" || lang === "kr" || lang === "ko-KR";

  return NextResponse.json(isKo ? KO_MANIFEST : EN_MANIFEST, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    },
  });
}
