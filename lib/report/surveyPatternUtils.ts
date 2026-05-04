export function normalizeYN(value: any): string {
  const v = String(value ?? "")
    .trim()
    .toUpperCase();
  if (v === "Y" || v === "YES") return "Y";
  if (v === "N" || v === "NO") return "N";
  return "";
}

export function getPattern(a: any, b: any, c: any): string {
  return normalizeYN(a) + normalizeYN(b) + normalizeYN(c);
}
