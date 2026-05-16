export function formatTimeInput(t?: string | null) {
  if (!t) return "";
  return t.length >= 5 ? t.slice(0, 5) : t;
}

export function parseBirthDateParts(iso: string | null | undefined): {
  y: string;
  mo: string;
  d: string;
} {
  const s = String(iso ?? "").trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return { y: "", mo: "", d: "" };
  return { y: m[1], mo: m[2], d: m[3] };
}

export function buildISODateFromParts(y: string, mo: string, d: string): string {
  const ys = y.replace(/\D/g, "").slice(0, 4);
  if (ys.length !== 4) return "";
  const md = mo.replace(/\D/g, "").slice(0, 2);
  const dd = d.replace(/\D/g, "").slice(0, 2);
  if (!md || !dd) return "";
  const mp = md.padStart(2, "0");
  const dp = dd.padStart(2, "0");
  const mi = Number(mp);
  const di = Number(dp);
  if (mi < 1 || mi > 12 || di < 1 || di > 31) return "";
  return `${ys}-${mp}-${dp}`;
}

export function hasCompleteBirthInfo(
  row: {
    birth_date?: string | null;
    birth_time?: string | null;
    birth_place?: string | null;
  } | null,
): boolean {
  if (!row) return false;
  const d = String(row.birth_date ?? "").trim();
  const t = String(row.birth_time ?? "").trim();
  const p = String(row.birth_place ?? "").trim();
  return Boolean(d && t && p);
}
