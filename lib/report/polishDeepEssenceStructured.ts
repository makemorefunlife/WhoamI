/**
 * Deep Essence structured report — tone polish that cannot break Inner Compass.
 *
 * Blind polishKoStringTree/polishEnStringTree walks every string, including
 * short chips (core_mode), titles, and enum-like values. That can empty a
 * field or warp a label so isDeepEssenceStructuredReport fails, and the UI
 * silently falls back to the plain-prose dump.
 *
 * This helper only polishes known long-form prose paths, never empties a
 * string, and always re-validates. If anything fails, the pre-polish tree wins.
 */
import type { Locale } from "@/lib/i18n/locale";
import { normalizeLocale } from "@/lib/i18n/locale";
import { polishKoTone } from "@/lib/i18n/koToneGuards";
import { polishEnTone } from "@/lib/i18n/enToneGuards";
import {
  isDeepEssenceStructuredReport,
  type DeepEssenceStructuredReport,
} from "@/lib/report/deepEssenceStructuredSchema";

function polishProse(text: string, locale: Locale): string {
  const raw = text.trim();
  if (!raw) return text;
  const next =
    locale === "ko-KR" ? polishKoTone(raw).text : polishEnTone(raw).text;
  const out = next.trim();
  // Never allow tone scrubbing to blank a required schema string.
  return out.length > 0 ? out : text;
}

function mapStrList(list: string[], locale: Locale): string[] {
  return list.map((s) => polishProse(s, locale));
}

const REMEMBER_PREFIX_PATTERN =
  /^(0[123]\s*(Keep|Loosen|Recover|\(Keep\)|\(Loosen\)|\(Recover\))?|무엇을\s*(굳이\s*)?바꾸지\s*않아도\s*되는가\??|무엇을\s*계속\s*증명하거나\s*수행하지\s*않아도\s*되는가\??|내가\s*다시\s*내\s*쪽으로\s*가져와도\s*되는\s*것은\s*무엇인가\??|\(무엇을[^\)]*\))[:\?\)]*\s*/i;

function cleanRememberText(text: string, locale: Locale): string {
  const polished = polishProse(text, locale);
  return polished.replace(REMEMBER_PREFIX_PATTERN, "").trim();
}

function cleanClosingText(text: string, locale: Locale): string {
  const polished = polishProse(text, locale);
  if (locale !== "ko-KR") return polished;
  // Strip trailing self-help wishing sentences like "...만들어가지 바라요." / "...바랍니다."
  const cleaned = polished
    .replace(/\s*(?:[가-힣]+기|이러한\s*점들을\s*기억하며|앞으로의\s*관계를|과정에서|앞으로의\s*여정에서도)[^.\!\?]*\b(?:바라요|바랍니다|응원합니다)[\.\!]*/g, "")
    .trim();
  return cleaned.length > 0 ? cleaned : polished;
}

/**
 * Apply locale tone law to prose fields only. Always returns a schema-valid
 * report (the input must already be valid).
 */
export function polishDeepEssenceStructuredReport(
  report: DeepEssenceStructuredReport,
  locale: Locale | string | undefined,
): DeepEssenceStructuredReport {
  const loc = normalizeLocale(locale);
  const next: DeepEssenceStructuredReport = {
    ...report,
    // summary chips / titles stay as-is (2–4 word labels, not sentences)
    summary: { ...report.summary },
    radar_potential: { ...report.radar_potential },
    strengths: report.strengths.map((s) => ({
      title: s.title,
      body: polishProse(s.body, loc),
    })),
    watchouts: report.watchouts.map((w) => ({
      title: w.title,
      body: polishProse(w.body, loc),
    })),
    energy: {
      ...report.energy,
      headline: polishProse(report.energy.headline, loc),
      summary: polishProse(report.energy.summary, loc),
      bars: report.energy.bars.map((b) => ({
        ...b,
        // keep tone enum untouched; polish display label only
        label: polishProse(b.label, loc),
        tone: b.tone,
      })),
      fuels: mapStrList(report.energy.fuels, loc),
      drains: mapStrList(report.energy.drains, loc),
      optimal: mapStrList(report.energy.optimal, loc),
    },
    relationships: {
      pattern: polishProse(report.relationships.pattern, loc),
      fit: mapStrList(report.relationships.fit, loc),
      friction: mapStrList(report.relationships.friction, loc),
      compare: report.relationships.compare.map((row) => ({
        wound: polishProse(row.wound, loc),
        steady: polishProse(row.steady, loc),
      })),
    },
    playbook: {
      rule: polishProse(report.playbook.rule, loc),
      rows: report.playbook.rows.map((row) => ({
        situation: polishProse(row.situation, loc),
        old: polishProse(row.old, loc),
        better: polishProse(row.better, loc),
      })),
      heated: polishProse(report.playbook.heated, loc),
      reset: polishProse(report.playbook.reset, loc),
    },
    future: {
      remember: report.future.remember.map((r) => cleanRememberText(r, loc)),
      leap: polishProse(report.future.leap, loc),
    },
    closing: cleanClosingText(report.closing, loc),
    checklist: mapStrList(report.checklist, loc),
  };

  return isDeepEssenceStructuredReport(next) ? next : report;
}
