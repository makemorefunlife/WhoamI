/**
 * 수동 검증: astrology 캐시 fingerprint 결정 로직
 * 실행: node scripts/validate-astrology-cache.mjs
 */

function decidePersistedAstrologyReuse(storedFingerprint, currentFingerprint) {
  const stored =
    typeof storedFingerprint === "string" ? storedFingerprint.trim() : "";
  const current = currentFingerprint.trim();
  if (!stored) return { action: "invalidate", reason: "missing_fingerprint" };
  if (stored !== current) {
    return { action: "invalidate", reason: "fingerprint_mismatch" };
  }
  return { action: "reuse", storedFingerprint: stored };
}

const current = "35.1796|129.0756|9.0|부산|place_lookup";
const cases = [
  {
    name: "no metadata fingerprint (legacy Seoul cache)",
    stored: null,
    expect: "invalidate",
  },
  {
    name: "fingerprint mismatch (birth place changed)",
    stored: "37.5665|126.9780|9.0|서울|default_seoul",
    expect: "invalidate",
  },
  {
    name: "fingerprint match",
    stored: current,
    expect: "reuse",
  },
];

let failed = 0;
for (const c of cases) {
  const r = decidePersistedAstrologyReuse(c.stored, current);
  const ok = r.action === c.expect;
  console.log(`${ok ? "OK" : "FAIL"} ${c.name} → ${r.action}`);
  if (!ok) failed++;
}

process.exit(failed > 0 ? 1 : 0);
