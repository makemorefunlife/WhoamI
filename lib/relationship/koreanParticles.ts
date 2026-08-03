/**
 * Bulletproof Korean Particle (조사) Utility.
 * Accurately determines batchim (종성) and attaches the correct grammatical particle.
 */

const HANGUL_BASE = 0xac00;
const HANGUL_LAST = 0xd7a3;

/**
 * Returns true if the last Hangul character of the string has a final consonant (받침).
 */
export function hasBatchim(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  // Strip trailing punctuation if any
  const clean = trimmed.replace(/[.,!?'"~`\s)]+$/g, "");
  if (!clean) return false;
  const ch = clean.charCodeAt(clean.length - 1);
  if (ch < HANGUL_BASE || ch > HANGUL_LAST) {
    // Non-Hangul character fallback: check common alphanumeric endings if needed
    return false;
  }
  return (ch - HANGUL_BASE) % 28 !== 0;
}

/**
 * Topic particle (은/는): 지민은 / 정우는
 */
export function topicParticle(name: string): string {
  if (!name) return "";
  return `${name}${hasBatchim(name) ? "은" : "는"}`;
}

/**
 * Subject particle (이/가): 지민이 / 정우가
 */
export function subjectParticle(name: string): string {
  if (!name) return "";
  return `${name}${hasBatchim(name) ? "이" : "가"}`;
}

/**
 * Object particle (을/를): 지민을 / 정우를
 */
export function objectParticle(name: string): string {
  if (!name) return "";
  return `${name}${hasBatchim(name) ? "을" : "를"}`;
}

/**
 * Conjunction particle (과/와): 지민과 / 정우와
 */
export function withParticle(name: string): string {
  if (!name) return "";
  return `${name}${hasBatchim(name) ? "과" : "와"}`;
}

/**
 * Direction / Locative particle (으로/로): 서울로 / 부산으로
 * Note: 'ㄹ' 받침 (종성 번호 8) uses '로' instead of '으로'.
 */
export function roParticle(name: string): string {
  if (!name) return "";
  const clean = name.trim().replace(/[.,!?'"~`\s)]+$/g, "");
  if (!clean) return `${name}로`;
  const ch = clean.charCodeAt(clean.length - 1);
  if (ch < HANGUL_BASE || ch > HANGUL_LAST) return `${name}로`;
  const jong = (ch - HANGUL_BASE) % 28;
  if (jong === 0 || jong === 8) {
    // no batchim or 'ㄹ'
    return `${name}로`;
  }
  return `${name}으로`;
}

/**
 * Clean up common particle errors in existing text
 * e.g. "지민가" -> "지민이", "정우이" -> "정우가", "지민를" -> "지민을", "정우을" -> "정우를"
 */
export function sanitizeKoreanParticles(text: string, knownNames: string[] = []): string {
  if (!text) return "";
  let result = text;

  // First handle known names if provided
  for (const name of knownNames) {
    if (!name) continue;
    const batchim = hasBatchim(name);
    if (batchim) {
      // Has batchim (e.g. 지민)
      result = result.replace(new RegExp(`${name}가(?=[\\s.,!?]|$)`, "g"), `${name}이`);
      result = result.replace(new RegExp(`${name}는(?=[\\s.,!?]|$)`, "g"), `${name}은`);
      result = result.replace(new RegExp(`${name}를(?=[\\s.,!?]|$)`, "g"), `${name}을`);
      result = result.replace(new RegExp(`${name}와(?=[\\s.,!?]|$)`, "g"), `${name}과`);
      result = result.replace(new RegExp(`${name}이/가(?=[\\s.,!?]|$)`, "g"), `${name}이`);
      result = result.replace(new RegExp(`${name}은/는(?=[\\s.,!?]|$)`, "g"), `${name}은`);
      result = result.replace(new RegExp(`${name}을/를(?=[\\s.,!?]|$)`, "g"), `${name}을`);
    } else {
      // No batchim (e.g. 정우)
      result = result.replace(new RegExp(`${name}이(?=[\\s.,!?]|$)`, "g"), `${name}가`);
      result = result.replace(new RegExp(`${name}은(?=[\\s.,!?]|$)`, "g"), `${name}는`);
      result = result.replace(new RegExp(`${name}을(?=[\\s.,!?]|$)`, "g"), `${name}를`);
      result = result.replace(new RegExp(`${name}과(?=[\\s.,!?]|$)`, "g"), `${name}와`);
      result = result.replace(new RegExp(`${name}이/가(?=[\\s.,!?]|$)`, "g"), `${name}가`);
      result = result.replace(new RegExp(`${name}은/는(?=[\\s.,!?]|$)`, "g"), `${name}는`);
      result = result.replace(new RegExp(`${name}을/를(?=[\\s.,!?]|$)`, "g"), `${name}를`);
    }
  }

  // General regex replacements for dual particle forms like (이)가, 을(를), 이/가, 은/는, 을/를, 과/와, 와/과
  result = result.replace(/([가-힣])\(이\)가/g, (_, ch) => hasBatchim(ch) ? `${ch}이` : `${ch}가`);
  result = result.replace(/([가-힣])\(을\)를/g, (_, ch) => hasBatchim(ch) ? `${ch}을` : `${ch}를`);
  result = result.replace(/([가-힣])\(은\)는/g, (_, ch) => hasBatchim(ch) ? `${ch}은` : `${ch}는`);
  result = result.replace(/([가-힣])\(와\)과/g, (_, ch) => hasBatchim(ch) ? `${ch}과` : `${ch}와`);
  result = result.replace(/([가-힣])\(과\)와/g, (_, ch) => hasBatchim(ch) ? `${ch}과` : `${ch}와`);

  result = result.replace(/([가-힣])이\/가/g, (_, ch) => hasBatchim(ch) ? `${ch}이` : `${ch}가`);
  result = result.replace(/([가-힣])은\/는/g, (_, ch) => hasBatchim(ch) ? `${ch}은` : `${ch}는`);
  result = result.replace(/([가-힣])을\/를/g, (_, ch) => hasBatchim(ch) ? `${ch}을` : `${ch}를`);
  result = result.replace(/([가-힣])과\/와/g, (_, ch) => hasBatchim(ch) ? `${ch}과` : `${ch}와`);
  result = result.replace(/([가-힣])와\/과/g, (_, ch) => hasBatchim(ch) ? `${ch}과` : `${ch}와`);

  // Handle misplaced particles on generic words (e.g. 배려을 -> 배려를, 존중를 -> 존중을)
  result = result.replace(/([가-힣])을(?=[\s.,!?]|$)/g, (_, ch) => hasBatchim(ch) ? `${ch}을` : `${ch}를`);
  result = result.replace(/([가-힣])를(?=[\s.,!?]|$)/g, (_, ch) => hasBatchim(ch) ? `${ch}을` : `${ch}를`);

  // Clean up punctuation anomalies: '.,', ',.', multiple periods '..', double commas ',,'
  result = result.replace(/\.,+/g, ".");
  result = result.replace(/,\.+/g, ".");
  result = result.replace(/\.{2,}/g, ".");
  result = result.replace(/,{2,}/g, ",");
  result = result.replace(/\s+,/g, ",");
  result = result.replace(/([가-힣])\s+\./g, "$1.");

  return result.trim();
}

