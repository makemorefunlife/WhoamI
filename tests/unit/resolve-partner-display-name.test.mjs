/**
 * Regression: a relationship report's `headline` field is always a
 * narrative/synthesis sentence ("Speed-First Risk Manager and The
 * Data-Driven Realist — a complementary combo..."), never a person's
 * name — for every relationship kind. partnerNameFromLogSnapshot used to
 * fall back to `report.headline` when no better name was found, so any
 * partner whose own report had no display name set got that entire
 * sentence rendered as their "name" (confirmed live: 90 of 137 sampled
 * relationship_analysis_logs rows carry a headline over 30 chars, so this
 * fired often whenever the partner's own reports.name was blank/generic).
 *
 * Run: npx tsx tests/unit/resolve-partner-display-name.test.mjs
 */
import assert from "node:assert/strict";
import {
  isGenericPartnerName,
  partnerNameFromLogSnapshot,
  resolvePartnerDisplayName,
} from "../../lib/relationship/resolvePartnerDisplayName.ts";

const REAL_WORK_HEADLINE =
  "스피드 중심의 리스크 관리자와 문제 해결사 — 서로 다른 무기로 팀을 채우는 보완 조합. 기운이 서로를 자연스럽게 살려줘요.";

assert.equal(
  partnerNameFromLogSnapshot({ report: { headline: REAL_WORK_HEADLINE } }),
  null,
  "a report headline sentence must never be returned as a partner name",
);

assert.equal(
  isGenericPartnerName(REAL_WORK_HEADLINE),
  true,
  "a long narrative sentence must be rejected as a plausible name regardless of source",
);

assert.equal(
  resolvePartnerDisplayName(null, REAL_WORK_HEADLINE, "친구"),
  "친구",
  "resolvePartnerDisplayName must fall back to the generic label instead of a headline sentence",
);

// A real, legitimate short nickname from a snapshot must still work.
assert.equal(
  partnerNameFromLogSnapshot({ report: { section_1_summary: { relationship_name: "동글" } } }),
  "동글",
  "a real short relationship_name must still be returned",
);
assert.equal(
  resolvePartnerDisplayName(null, "동글", "친구"),
  "동글",
  "a real short log-derived name must still be used ahead of the fallback",
);

// A real, legitimate reports.name always wins over anything in the log.
assert.equal(
  resolvePartnerDisplayName("Sera", REAL_WORK_HEADLINE, "친구"),
  "Sera",
  "a real reports.name must take priority over any log-derived value",
);

console.log("ok - partner display name never resolves to a report headline sentence");
