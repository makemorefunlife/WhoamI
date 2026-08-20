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

// Narrative Quality Final Stabilization — a phrase-ban / trailing-only
// regex net was tried and re-verified twice (Batch C, then a same-session
// fix pass) and got WORSE, not better, each round: the model kept escaping
// the exact banned phrases with new paraphrases of the same banned
// function, and roughly 3 of 4 live-QA violations were in the MIDDLE of the
// closing text, not the trailing sentence — invisible to a trailing-only
// regex no matter which words are listed. Root cause found in the prompt
// schema itself: closing's own schema field said "6-10 sentences" while the
// prose rule wanted a 2-sentence Recognition+Integration shape — every
// violation showed up in one of those extra, schema-invited sentences 3-10,
// never in sentence 1 or 2. The prompt fix is a hard "EXACTLY 2 sentences"
// cap; this is the matching structural defensive net: truncate to at most
// 2 sentences FIRST (removing the sentence slot violations were living in),
// THEN scan only the surviving 1-2 sentences for a banned function, instead
// of trying to out-word-list an evasive model.
const MAX_CLOSING_SENTENCES = 2;

// Non-anchored (no trailing $ requirement) — applied per-sentence against
// short, already-truncated sentences, so it doesn't need end-of-string
// anchoring to stay safe from eating unrelated prior content.
const CHEER_FUNCTION_PATTERN =
  /응원(?:합니다|해요|할게요|하겠습니다)|바라요|바랍니다|하면\s*좋겠어요|해나가면\s*좋겠어요/;
const PREDICTION_FUNCTION_PATTERN =
  /될\s*거예요|될\s*것입니다|하게\s*될\s*거예요|펼쳐질\s*거예요|이어질\s*것입니다|여정이\s*될/;
const EVALUATION_FUNCTION_PATTERN =
  /참\s*의미\s*있어요|소중한\s*발견이에요|멋진\s*변화예요|잘\s*알게\s*되었어요|중요한\s*깨달음이에요/;
const ADVICE_FUNCTION_PATTERN =
  /기억하세요|기억해요|잊지\s*마세요|해보세요|노력하세요|귀\s*기울이세요|선택하세요/;

const BANNED_CLOSING_SENTENCE_PATTERNS = [
  CHEER_FUNCTION_PATTERN,
  PREDICTION_FUNCTION_PATTERN,
  EVALUATION_FUNCTION_PATTERN,
  ADVICE_FUNCTION_PATTERN,
];

/** Splits on sentence-ending punctuation, keeping the punctuation attached to each sentence. */
function splitIntoSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+/g);
  if (matches) return matches.map((s) => s.trim()).filter((s) => s.length > 0);
  const trimmed = text.trim();
  return trimmed.length > 0 ? [trimmed] : [];
}

function cleanClosingText(text: string, locale: Locale): string {
  const polished = polishProse(text, locale);
  if (locale !== "ko-KR") return polished;
  // Strip trailing self-help wishing sentences like "...만들어가지 바라요." / "...바랍니다."
  // before sentence-splitting, since this pattern crosses the preceding
  // clause rather than being its own clean sentence.
  const prewashed = polished
    .replace(/\s*(?:[가-힣]+기|이러한\s*점들을\s*기억하며|앞으로의\s*관계를|과정에서|앞으로의\s*여정에서도)[^.\!\?]*\b(?:바라요|바랍니다|응원합니다)[\.\!]*/g, "")
    .trim();
  const sentences = splitIntoSentences(prewashed).slice(0, MAX_CLOSING_SENTENCES);
  const kept = sentences.filter(
    (s) => !BANNED_CLOSING_SENTENCE_PATTERNS.some((p) => p.test(s)),
  );
  const cleaned = kept.join(" ").trim();
  return cleaned.length > 0 ? cleaned : polished;
}

// Narrative Quality Final Stabilization — adaptation_story's ZERO-advice
// contract is prompt-primary; this is the last-line defensive net, matching
// cleanClosingText's own "prompt first, polish only for clear violations"
// philosophy. Only strips a sentence whose ENDING matches one of these
// explicit advice shapes — never a broad rewrite. [^.!?\n]* anchors each
// match to its own sentence (bounded by the prior sentence-end or paragraph
// break), so this can't eat a prior, legitimate sentence, and can't cross
// adaptation_story's \n\n paragraph joins. No \b — JS regex word-boundary is
// defined over [A-Za-z0-9_], so it never fires between two Hangul
// characters; using it would silently make this pattern match nothing.
const ADVICE_ENDING_PATTERN =
  /[^.!?\n]*(?:해야\s*해요|할\s*필요가\s*있어요|하는\s*것이\s*중요해요|연습해\s*보세요|활용해\s*보세요|시도해\s*보세요|기억하세요)[.!]*/g;

function cleanAdaptationStoryText(text: string, locale: Locale): string {
  const polished = polishProse(text, locale);
  if (locale !== "ko-KR") return polished;
  const stripped = polished.replace(ADVICE_ENDING_PATTERN, "");
  // Paragraph-safe cleanup: normalize whitespace within each paragraph and
  // drop any paragraph that became empty (its one sentence was the removed
  // advice line), without disturbing the surviving \n\n paragraph joins.
  const cleaned = stripped
    .split(/\n\n+/)
    .map((p) => p.replace(/[ \t]+/g, " ").trim())
    .filter((p) => p.length > 0)
    .join("\n\n");
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
    ...(report.layered_identity
      ? {
          layered_identity: {
            ...(report.layered_identity.first_impression
              ? {
                  first_impression: {
                    ...report.layered_identity.first_impression,
                    ...(report.layered_identity.first_impression.title
                      ? { title: polishProse(report.layered_identity.first_impression.title, loc) }
                      : {}),
                    narrative: cleanAdaptationStoryText(report.layered_identity.first_impression.narrative, loc),
                  },
                }
              : {}),
            ...(report.layered_identity.known_self
              ? {
                  known_self: {
                    ...report.layered_identity.known_self,
                    ...(report.layered_identity.known_self.title
                      ? { title: polishProse(report.layered_identity.known_self.title, loc) }
                      : {}),
                    narrative: cleanAdaptationStoryText(report.layered_identity.known_self.narrative, loc),
                  },
                }
              : {}),
            ...(report.layered_identity.close_private_self
              ? {
                  close_private_self: {
                    ...report.layered_identity.close_private_self,
                    ...(report.layered_identity.close_private_self.title
                      ? { title: polishProse(report.layered_identity.close_private_self.title, loc) }
                      : {}),
                    narrative: cleanAdaptationStoryText(report.layered_identity.close_private_self.narrative, loc),
                  },
                }
              : {}),
            ...(report.layered_identity.natural_self_and_deep_needs
              ? {
                  natural_self_and_deep_needs: {
                    ...report.layered_identity.natural_self_and_deep_needs,
                    ...(report.layered_identity.natural_self_and_deep_needs.title
                      ? { title: polishProse(report.layered_identity.natural_self_and_deep_needs.title, loc) }
                      : {}),
                    narrative: cleanAdaptationStoryText(report.layered_identity.natural_self_and_deep_needs.narrative, loc),
                  },
                }
              : {}),
            ...(report.layered_identity.synthesis
              ? {
                  synthesis: {
                    ...report.layered_identity.synthesis,
                    narrative: cleanAdaptationStoryText(report.layered_identity.synthesis.narrative, loc),
                  },
                }
              : {}),
          },
        }
      : {}),
    ...(report.adaptation_story
      ? {
          adaptation_story: {
            ...report.adaptation_story,
            narrative: cleanAdaptationStoryText(report.adaptation_story.narrative, loc),
          },
        }
      : {}),
    ...(report.axis_interpretations
      ? {
          axis_interpretations: {
            ...(report.axis_interpretations.gap_deep_dive
              ? {
                  gap_deep_dive: Object.fromEntries(
                    Object.entries(report.axis_interpretations.gap_deep_dive).map(([k, v]) => [
                      k,
                      {
                        ...v,
                        natural_tendency: cleanAdaptationStoryText(v.natural_tendency, loc),
                        current_pattern: cleanAdaptationStoryText(v.current_pattern, loc),
                        gives_you: cleanAdaptationStoryText(v.gives_you, loc),
                        may_cost: cleanAdaptationStoryText(v.may_cost, loc),
                        ...(v.may_work_better
                          ? { may_work_better: cleanAdaptationStoryText(v.may_work_better, loc) }
                          : {}),
                      },
                    ]),
                  ),
                }
              : {}),
            ...(report.axis_interpretations.alignment_highlight
              ? {
                  alignment_highlight: Object.fromEntries(
                    Object.entries(report.axis_interpretations.alignment_highlight).map(([k, v]) => [
                      k,
                      {
                        ...v,
                        natural_tendency: cleanAdaptationStoryText(v.natural_tendency, loc),
                        current_pattern: cleanAdaptationStoryText(v.current_pattern, loc),
                        why_it_feels_easy: cleanAdaptationStoryText(v.why_it_feels_easy, loc),
                      },
                    ]),
                  ),
                }
              : {}),
          },
        }
      : {}),
  };

  return isDeepEssenceStructuredReport(next) ? next : report;
}
