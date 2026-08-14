/**
 * Checklist Dedup Batch 1 — deterministic surface-level duplicate safety net.
 * Fixtures are the actual pairs observed in live QA transcripts (and the
 * user's own worked BAD examples) during the Checklist Differentiation
 * Batch 1/2 + Dedup design work.
 * Run: npx tsx --test tests/unit/deep-essence-checklist-dedup.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeForComparison,
  dedupeAndBackfillChecklist,
  buildChecklistComparisonTexts,
  CHECKLIST_DUPLICATE_THRESHOLD,
} from "../../lib/report/deepEssenceChecklistDedup.ts";

describe("normalizeForComparison", () => {
  it("strips KO bounded time markers and imperative endings", () => {
    const norm = normalizeForComparison("이번 주 감정이 격해질 때 깊게 숨을 쉬어보세요.", "ko-KR");
    assert.ok(!norm.includes("이번"));
    assert.ok(!norm.includes("주"));
    assert.ok(!norm.includes("보세요"));
  });

  it("strips EN bounded time markers and lowercases", () => {
    const norm = normalizeForComparison("Schedule a quiet day for yourself THIS WEEK.", "en-US");
    assert.ok(!/this week/i.test(norm));
    assert.equal(norm, norm.toLowerCase());
  });

  it("strips the small shared-domain stopword list", () => {
    const koNorm = normalizeForComparison("친구에게 감정을 이야기해보세요.", "ko-KR");
    assert.ok(!koNorm.includes("친구"));
    assert.ok(!koNorm.includes("감정"));
    const enNorm = normalizeForComparison("Talk to a friend about your feelings.", "en-US");
    assert.ok(!/\bfriend\b/i.test(enNorm));
    assert.ok(!/\bfeelings\b/i.test(enNorm));
  });

  it("does not strip quantity/target markers like 한 사람 / 한 상황 (only pure time markers)", () => {
    const norm = normalizeForComparison("이번 주 한 상황을 골라 적어보세요.", "ko-KR");
    assert.ok(norm.includes("한 상황"));
  });
});

describe("dedupeAndBackfillChecklist — must flag (real QA + user worked examples)", () => {
  const cases = [
    {
      label: "KO heated bolt-on (user's own worked BAD example)",
      item: "이번 주 감정이 격해질 때 깊게 숨을 쉬어보세요.",
      comparison: "감정이 격해질 때 깊게 숨을 쉬고 감정을 정리하세요.",
      locale: "ko-KR",
    },
    {
      label: "KO reset bolt-on (user's own worked BAD example)",
      item: "이번 주 혼자 책 읽는 시간을 정해보세요.",
      comparison: "혼자 책을 읽으며 회복 시간을 가지세요.",
      locale: "ko-KR",
    },
    {
      label: "KO row.better near-copy (observed in live QA)",
      item: "이번 주에 자신이 좋아하는 책을 한 번 읽어보세요.",
      comparison: "조용한 환경에서 혼자 책을 읽어보세요.",
      locale: "ko-KR",
    },
    {
      label: "KO row.better near-copy #2 (observed in live QA)",
      item: "이번 주에 친구와의 대화에서 서로의 이야기를 들어보는 시간을 가져보세요.",
      comparison: "서로의 감정을 나누는 시간을 가져보세요.",
      locale: "ko-KR",
    },
    {
      label: "EN heated time-bounded near-copy",
      item: "This week, when emotions spike, take a moment to breathe.",
      comparison: "When emotions spike, take a moment to breathe and acknowledge your feelings.",
      locale: "en-US",
    },
  ];

  for (const c of cases) {
    it(`flags: ${c.label}`, () => {
      const result = dedupeAndBackfillChecklist({
        checklist: [c.item],
        comparisonTexts: [c.comparison],
        locale: c.locale,
        min: 0,
        max: 12,
      });
      assert.equal(result.flagged.length, 1, `expected "${c.item}" to be flagged against "${c.comparison}"`);
      assert.ok(result.flagged[0].score >= CHECKLIST_DUPLICATE_THRESHOLD);
      assert.equal(result.checklist.includes(c.item), false);
    });
  }
});

describe("dedupeAndBackfillChecklist — must preserve (real QA + constructed distinct-action pairs)", () => {
  const cases = [
    {
      label: "KO retrospective write-down vs row.better (real-time advice)",
      item: "이번 주에 갈등이 생겼던 상황을 떠올려 그때의 감정을 적어보세요.",
      comparison: "친구에게 솔직한 감정을 이야기해보세요.",
      locale: "ko-KR",
    },
    {
      label: "KO retrospective write-down vs heated (real-time advice)",
      item: "이번 주에 감정이 격해졌던 순간을 떠올려, 그때 어떻게 반응했는지 기록해보세요.",
      comparison: "감정이 격해질 때는 잠시 숨을 깊게 쉬고, 나의 감정을 정리하는 시간을 가지세요.",
      locale: "ko-KR",
    },
    {
      label: "EN retrospective/notice vs row.better",
      item: "Identify a recent situation where you withdrew; reflect on how you could handle it differently next time.",
      comparison: "send a message to check in and share your feelings",
      locale: "en-US",
    },
    {
      label: "EN notice-before-responding vs row.better",
      item: "Notice when you feel criticized; write down your feelings before responding.",
      comparison: "ask for clarification and express your feelings about the feedback",
      locale: "en-US",
    },
    {
      label: "KO same topic word (친구), different action",
      item: "이번 주 친구와 함께 새로운 취미를 하나 시작해보세요.",
      comparison: "친구에게 솔직한 감정을 이야기해보세요.",
      locale: "ko-KR",
    },
  ];

  for (const c of cases) {
    it(`preserves: ${c.label}`, () => {
      const result = dedupeAndBackfillChecklist({
        checklist: [c.item],
        comparisonTexts: [c.comparison],
        locale: c.locale,
        min: 0,
        max: 12,
      });
      assert.equal(result.flagged.length, 0, `expected "${c.item}" NOT to be flagged against "${c.comparison}"`);
      assert.ok(result.checklist.includes(c.item));
    });
  }
});

describe("dedupeAndBackfillChecklist — threshold boundary", () => {
  it("known miss: a softly-reworded duplicate below the deterministic threshold is intentionally preserved", () => {
    // Documents the known limitation: this genuinely IS the same action as
    // a reset-style sentence, reworded enough that surface n-gram overlap
    // stays low. Catching this would require semantic (embedding) dedup,
    // explicitly out of scope for this deterministic pass.
    const result = dedupeAndBackfillChecklist({
      checklist: ["Schedule a quiet day for yourself this week."],
      comparisonTexts: ["Every week, set aside a few hours for quiet reflection or personal projects."],
      locale: "en-US",
      min: 0,
      max: 12,
    });
    assert.equal(result.flagged.length, 0);
  });
});

describe("dedupeAndBackfillChecklist — backfill / count guarantees", () => {
  const playbook = {
    rows: [
      { better: "잠시 시간을 두고 나의 감정을 정리한 후 대화하기" },
      { better: "혼자만의 시간을 정해 감정적으로 회복하기" },
      { better: "솔직하게 내 감정을 직접적으로 이야기하기" },
    ],
    heated: "감정이 격해지는 순간에는 잠시 자리를 비우고, 깊게 숨을 쉬며 감정을 정리해보세요.",
    reset: "이번 주에는 혼자만의 시간을 가지는 것을 계획해 보세요.",
  };
  const future = {
    remember: [
      "자신의 결정을 독립적으로 내릴 수 있는 기회를 더욱 많이 선택하세요.",
      "가까운 사람들에게 감정을 솔직히 표현하는 것을 잊지 마세요.",
      "정서적으로 회복하는 시간을 소중히 여기세요.",
    ],
    leap: "앞으로 더 많은 독립적인 결정을 내리고, 감정 표현에서 솔직함을 선택하세요.",
  };

  it("backfills up to the 8-item floor when most items are flagged as duplicates", () => {
    const comparisonTexts = buildChecklistComparisonTexts(playbook, future);
    // 6 of these are near-verbatim of playbook/future content; 2 are distinct.
    const checklist = [
      "이번 주 감정이 격해질 때 잠시 자리를 비우고 깊게 숨을 쉬어보세요.",
      "이번 주 혼자만의 시간을 가지는 것을 계획해 보세요.",
      "이번 주 자신의 결정을 독립적으로 내릴 기회를 선택하세요.",
      "이번 주에 갈등이 생겼던 상황을 떠올려 말하지 못했던 내용을 적어보세요.", // distinct
      "이번 주 하루의 에너지 수준을 아침저녁으로 기록해보세요.", // distinct
    ];
    const result = dedupeAndBackfillChecklist({ checklist, comparisonTexts, locale: "ko-KR" });
    assert.ok(result.checklist.length >= 8, `expected >= 8 items, got ${result.checklist.length}`);
    assert.ok(result.checklist.length <= 12);
  });

  it("never exceeds max even after backfill would otherwise want more", () => {
    const result = dedupeAndBackfillChecklist({
      checklist: [],
      comparisonTexts: [],
      locale: "ko-KR",
      min: 8,
      max: 12,
    });
    assert.ok(result.checklist.length <= 12);
    assert.equal(result.checklist.length, 8);
  });

  it("fallback backfill items are never duplicated within the same list", () => {
    const result = dedupeAndBackfillChecklist({
      checklist: [],
      comparisonTexts: [],
      locale: "en-US",
      min: 8,
      max: 12,
    });
    const unique = new Set(result.checklist);
    assert.equal(unique.size, result.checklist.length);
  });

  it("does not backfill when the deduped list already meets the floor", () => {
    const checklist = Array.from({ length: 8 }, (_, i) => `Distinct action number ${i} for this week.`);
    const result = dedupeAndBackfillChecklist({
      checklist,
      comparisonTexts: ["Completely unrelated playbook sentence about something else entirely."],
      locale: "en-US",
    });
    assert.equal(result.backfilledCount, 0);
    assert.equal(result.checklist.length, 8);
  });
});

describe("buildChecklistComparisonTexts", () => {
  it("flattens rows[].better, heated, reset, remember[], and leap into one list", () => {
    const playbook = {
      rows: [{ better: "a" }, { better: "b" }],
      heated: "c",
      reset: "d",
    };
    const future = { remember: ["e", "f"], leap: "g" };
    const texts = buildChecklistComparisonTexts(playbook, future);
    assert.deepEqual(texts, ["a", "b", "c", "d", "e", "f", "g"]);
  });
});
