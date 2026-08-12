/**
 * Romantic V4 — Korean Particle (Josa) Helper
 * Ensures smooth Korean grammar for names ending in consonants (받침) vs vowels.
 */

export function josa(text: string, type: "은는" | "이가" | "을를" | "과와" | "에게" | "의"): string {
  if (!text) return "";
  const trimmed = text.trim();
  const lastChar = trimmed.charCodeAt(trimmed.length - 1);
  
  // Non-Korean (e.g. English "Sera") default fallback
  if (lastChar < 0xac00 || lastChar > 0xd7a3) {
    if (type === "은는") return `${trimmed}는`;
    if (type === "이가") return `${trimmed}가`;
    if (type === "을를") return `${trimmed}를`;
    if (type === "과와") return `${trimmed}와`;
    if (type === "에게") return `${trimmed}에게`;
    if (type === "의") return `${trimmed}의`;
    return trimmed;
  }

  const hasJongsung = (lastChar - 0xac00) % 28 !== 0;

  if (type === "은는") return hasJongsung ? `${trimmed}이는` : `${trimmed}는`;
  if (type === "이가") return hasJongsung ? `${trimmed}이가` : `${trimmed}가`;
  if (type === "을를") return hasJongsung ? `${trimmed}이를` : `${trimmed}를`;
  if (type === "과와") return hasJongsung ? `${trimmed}이와` : `${trimmed}와`;
  if (type === "에게") return hasJongsung ? `${trimmed}에게` : `${trimmed}에게`;
  if (type === "의") return `${trimmed}의`;

  return trimmed;
}

/** Quick aliases for names */
export const josaEunNeun = (name: string) => josa(name, "은는");
export const josaIGa = (name: string) => josa(name, "이가");
export const josaEulReul = (name: string) => josa(name, "을를");
export const josaGwaWa = (name: string) => josa(name, "과와");
export function josaEge(name: string): string {
  return `${name}에게`;
}

export function josaRo(word: string): string {
  if (!word) return word;
  const lastChar = word.trim().slice(-1);
  const code = lastChar.charCodeAt(0);

  if (code < 0xac00 || code > 0xd7a3) {
    return `${word}로`;
  }

  const jong = (code - 0xac00) % 28;
  // 종성이 없거나 ㄹ(8)이면 '로', 그 외 종성이 있으면 '으로'
  if (jong === 0 || jong === 8) {
    return `${word}로`;
  }
  return `${word}으로`;
}
