import { buildAstrologyContextForLlm } from "@/lib/report/reportPromptBuilders";

/** POST /api/astrology 응답 → integrated `astrologyText`에 넣을 문자열 */
export function extractAstrologyTextForIntegrated(
  astroData: Record<string, unknown>,
): string | null {
  const interp =
    typeof astroData.interpretation === "string"
      ? astroData.interpretation.trim()
      : "";
  if (interp) return interp;

  const raw = astroData.raw as
    | { sun?: string; moon?: string; rising?: string }
    | undefined;
  const sun =
    (typeof raw?.sun === "string" ? raw.sun : null) ??
    (typeof astroData.sun === "string" ? astroData.sun : null);
  const moon =
    (typeof raw?.moon === "string" ? raw.moon : null) ??
    (typeof astroData.moon === "string" ? astroData.moon : null);
  const rising =
    (typeof raw?.rising === "string" ? raw.rising : null) ??
    (typeof astroData.rising === "string" ? astroData.rising : null);

  if (sun && moon && rising) {
    return buildAstrologyContextForLlm({ sun, moon, rising });
  }
  return null;
}
