export function normalizeYN(value: unknown): string {
  const v = String(value ?? "")
    .trim()
    .toUpperCase();
  if (v === "Y" || v === "YES") return "Y";
  if (v === "N" || v === "NO") return "N";
  return "";
}

export function getPattern(a: unknown, b: unknown, c: unknown): string {
  return normalizeYN(a) + normalizeYN(b) + normalizeYN(c);
}
