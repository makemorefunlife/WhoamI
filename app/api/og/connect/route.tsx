import { ImageResponse } from "next/og";
import { createRouteSupabaseClient } from "@/lib/supabase/serverClient";
import { resolveConnectLinkOwnerName } from "@/lib/relationship/personalConnect/personalConnectLinks";
import { normalizeLocale, type Locale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";

export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

/**
 * Satori (what ImageResponse renders with) ships no CJK glyphs in its
 * default font, so Korean text renders as blank boxes unless we hand it an
 * actual Korean font's bytes. Google Fonts serves woff2 to modern
 * User-Agents and ttf to legacy ones — satori only accepts ttf/otf — so
 * requesting with an old-Firefox UA and subsetting via `text=` keeps this
 * to a few KB instead of the whole ~10MB family.
 *
 * The headline embeds an arbitrary user-entered display name (any of
 * Hangul's 11,172 syllables), so the subset MUST be built from this
 * request's actual rendered text, not a pre-guessed sample — a fixed
 * surname/common-syllable list would silently render blank glyphs for any
 * name outside that guess. Cached per exact text (module-scope Map, capped)
 * since the same shared link is fetched repeatedly by chat-app crawlers.
 */
const koFontCache = new Map<string, Promise<ArrayBuffer | null>>();
const KO_FONT_CACHE_MAX = 200;

async function loadKoreanFont(renderedText: string): Promise<ArrayBuffer | null> {
  const cached = koFontCache.get(renderedText);
  if (cached) return cached;

  const promise = (async () => {
    try {
      const cssRes = await fetch(
        `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&text=${encodeURIComponent(renderedText)}`,
        { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) Gecko/20100101 Firefox/6.0" } },
      );
      if (!cssRes.ok) return null;
      const css = await cssRes.text();
      const match = css.match(/src:\s*url\(([^)]+)\)/);
      if (!match) return null;
      const fontRes = await fetch(match[1]);
      if (!fontRes.ok) return null;
      return await fontRes.arrayBuffer();
    } catch {
      return null;
    }
  })();

  if (koFontCache.size >= KO_FONT_CACHE_MAX) {
    const oldestKey = koFontCache.keys().next().value;
    if (oldestKey !== undefined) koFontCache.delete(oldestKey);
  }
  koFontCache.set(renderedText, promise);
  return promise;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token")?.trim() ?? "";
  const locale: Locale = normalizeLocale(searchParams.get("locale"));
  const messages = getMessages(locale);

  let ownerName: string | null | undefined;
  if (token) {
    const supabase = createRouteSupabaseClient();
    if (supabase) {
      ownerName = await resolveConnectLinkOwnerName(supabase, token);
    }
  }

  const displayName = ownerName ?? messages.connect.someoneFallbackName;
  const headline = ownerName !== undefined ? messages.connect.invitedByTitle(displayName) : messages.connect.invalidTitle;
  const avatarInitial = displayName.trim().slice(0, 1).toUpperCase();
  const renderedText = `${headline}${avatarInitial}Aha it's me!`;

  const fontData = locale === "ko-KR" ? await loadKoreanFont(renderedText) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #234d3c 0%, #1a382c 55%, #12281f 100%)",
          fontFamily: fontData ? "Noto Sans KR" : "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 56 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 168,
              height: 168,
              borderRadius: 9999,
              background: "linear-gradient(160deg, #a5f3d0 0%, #3a8f6e 100%)",
              color: "#12281f",
              fontSize: 64,
              fontWeight: 700,
            }}
          >
            {avatarInitial}
          </div>
          <div
            style={{
              display: "flex",
              width: 120,
              height: 2,
              background:
                "repeating-linear-gradient(90deg, rgba(255,253,248,0.55) 0 14px, transparent 14px 26px)",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 168,
              height: 168,
              borderRadius: 9999,
              border: "3px dashed rgba(255,253,248,0.55)",
              color: "rgba(255,253,248,0.85)",
              fontSize: 72,
              fontWeight: 700,
            }}
          >
            ?
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 56,
            maxWidth: 880,
            textAlign: "center",
            color: "#fffdf8",
            fontSize: 52,
            fontWeight: 700,
            lineHeight: 1.35,
          }}
        >
          {headline}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 32,
            color: "rgba(255,253,248,0.6)",
            fontSize: 30,
            letterSpacing: 2,
          }}
        >
          Aha it&apos;s me!
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: fontData ? [{ name: "Noto Sans KR", data: fontData, weight: 700, style: "normal" }] : undefined,
    },
  );
}
