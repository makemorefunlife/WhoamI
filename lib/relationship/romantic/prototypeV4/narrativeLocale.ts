/**
 * Locale-safe wrappers around the Korean grammatical-particle utilities
 * (lib/relationship/koreanParticles.ts) used throughout the Romantic V4
 * narrative layer.
 *
 * Those utilities always append a Korean particle character (은/는/이/가/을/를/
 * 과/와), even to non-Hangul input — hasBatchim() returns false for Latin
 * names, so e.g. topicParticle("Priya") produces "Priya는", literally
 * leaking a Hangul character into English output. Every call site that
 * needs to stay locale-aware should go through these wrappers instead of
 * calling the koreanParticles functions directly: for en-US they are a
 * no-op passthrough (English has no such particles), for ko-KR they behave
 * exactly as before.
 */
import {
  topicParticle,
  subjectParticle,
  objectParticle,
  withParticle,
  sanitizeKoreanParticles,
} from "../../koreanParticles";

export type NarrativeLocale = "ko-KR" | "en-US";

export function isEnLocale(locale: NarrativeLocale): boolean {
  return locale === "en-US";
}

export function topicP(name: string, locale: NarrativeLocale): string {
  return isEnLocale(locale) ? name : topicParticle(name);
}

export function subjectP(name: string, locale: NarrativeLocale): string {
  return isEnLocale(locale) ? name : subjectParticle(name);
}

export function objectP(name: string, locale: NarrativeLocale): string {
  return isEnLocale(locale) ? name : objectParticle(name);
}

export function withP(name: string, locale: NarrativeLocale): string {
  return isEnLocale(locale) ? name : withParticle(name);
}

export function sanitizeParticles(
  text: string,
  names: string[],
  locale: NarrativeLocale,
): string {
  return isEnLocale(locale) ? text : sanitizeKoreanParticles(text, names);
}

/** Picks the ko or en branch of a value based on locale — the single generic selector used everywhere in this module. */
export function pick<T>(locale: NarrativeLocale, ko: T, en: T): T {
  return isEnLocale(locale) ? en : ko;
}
