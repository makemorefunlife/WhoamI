import type { MetadataRoute } from "next";
import { headers, cookies } from "next/headers";
import { LOCALE_HEADER, LOCALE_COOKIE } from "@/lib/i18n/locale";

/**
 * Next.js App Router native manifest route — served at /manifest.webmanifest
 * Dynamically resolves request locale (header, cookie, or referer) so mobile
 * "Add to Home Screen" uses the matching start_url and language.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let isKo = false;
  try {
    const h = await headers();
    const fromHeader = h.get(LOCALE_HEADER);
    const referer = h.get("referer") || "";
    if (fromHeader === "ko-KR" || referer.includes("/kr")) {
      isKo = true;
    } else {
      const jar = await cookies();
      const fromCookie = jar.get(LOCALE_COOKIE)?.value;
      if (fromCookie === "ko-KR") {
        isKo = true;
      }
    }
  } catch {
    isKo = false;
  }

  if (isKo) {
    return {
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
  }

  return {
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
}
