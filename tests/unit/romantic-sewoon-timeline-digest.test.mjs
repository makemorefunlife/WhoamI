/**
 * Romantic Phase 4-8 (Part5②, 신뢰 타임라인) 회귀 테스트.
 *
 * 핵심 불변식:
 *   1. buildSewoon의 대상 연도가 [currentYear+0, +1, +3, +5, +10] 5개로 확장됐다
 *      (기존엔 currentYear/+1/+2 3개뿐이라 타임라인이 필요로 하는 +3/+5/+10년
 *      데이터 자체가 없었음).
 *   2. buildRomanticSewoonTimelineDigest는 이미 계산된 branch_relation을
 *      section_6_timeline 키(current/in_1_year/in_3_years/in_5_years/in_10_years)에
 *      맞춰 텍스트로 옮기기만 한다 — 판정 로직 신규 없음.
 *   3. buildRomanticFortuneFlow가 null이면(출생연도 파싱 실패) digest도 크래시 없이
 *      fallback 문구만 반환한다.
 *
 * No DB, no LLM — 둘 다 순수 함수라 결정론적으로 assert 가능.
 * Run: npx tsx tests/unit/romantic-sewoon-timeline-digest.test.mjs
 */
import assert from "node:assert/strict";
import { buildRomanticFortuneFlow } from "../../lib/relationship/romanticRules/fortuneFlow.ts";
import { buildRomanticSewoonTimelineDigest } from "../../lib/relationship/romanticSajuPromptDigest.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const BRANCH_RELATION_HINT = {
  combine: "협력·이해가 깊어지기 좋은 해",
  clash: "자극과 변화가 큰 해, 마찰 가능성 언급",
  neutral: "무난한 흐름",
};

const SAJU_A = { yearPillar: "경오", monthPillar: "신사", dayPillar: "갑자", hourPillar: "신미" };
const SAJU_B = { yearPillar: "임신", monthPillar: "무신", dayPillar: "정묘", hourPillar: "임인" };

// ---------------------------------------------------------------------------
section("1) buildSewoon 연도 범위 확장 — [0,1,3,5,10]년 뒤 5개");

const flow = buildRomanticFortuneFlow({
  birthDateA: "1990-05-15",
  birthDateB: "1992-08-20",
  sajuA: SAJU_A,
  sajuB: SAJU_B,
  currentYear: 2026,
});

assert.ok(flow, "정상 출생연도면 null이 아니어야 함");
assert.deepEqual(
  flow.sewoon.years.map((y) => y.year),
  [2026, 2027, 2029, 2031, 2036],
  "세운 대상 연도가 현재+0/1/3/5/10년으로 정확히 5개여야 함",
);
ok("sewoon.years가 [2026,2027,2029,2031,2036] 5개 연도를 담고 있음(기존엔 3개뿐이었음)");

// ---------------------------------------------------------------------------
section("2) buildRomanticSewoonTimelineDigest — 5개 구간 키가 모두 포함되고 branch_relation이 정확히 매핑된다");

const digest = buildRomanticSewoonTimelineDigest(flow.sewoon);

for (const [key, year] of [
  ["current", 2026],
  ["in_1_year", 2027],
  ["in_3_years", 2029],
  ["in_5_years", 2031],
  ["in_10_years", 2036],
]) {
  assert.ok(
    digest.includes(`${key}(${year}년)`),
    `digest에 ${key}(${year}년) 구간이 포함돼야 함`,
  );
}
ok("5개 구간 키(current/in_1_year/in_3_years/in_5_years/in_10_years)가 모두 정확한 연도로 포함됨");

for (const row of flow.sewoon.years) {
  const hint = BRANCH_RELATION_HINT[row.branch_relation];
  assert.ok(
    digest.includes(`지지관계: ${row.branch_relation}(${hint})`),
    `${row.year}년 줄에 branch_relation=${row.branch_relation}에 맞는 한국어 힌트가 병기돼야 함`,
  );
}
ok("각 연도의 branch_relation이 정확한 한국어 힌트로 병기됨");

assert.ok(
  digest.includes("명리 용어는 절대 출력하지"),
  "digest 끝에 명리 용어 출력 금지 경고 문구가 있어야 함",
);
ok("명리 용어 노출 금지 경고 문구 포함 확인");

// ---------------------------------------------------------------------------
section("3) buildRomanticFortuneFlow가 null(출생연도 파싱 실패) — digest는 크래시 없이 fallback만 반환");

const nullFlow = buildRomanticFortuneFlow({
  birthDateA: "unknown",
  birthDateB: "1992-08-20",
  sajuA: SAJU_A,
  sajuB: SAJU_B,
  currentYear: 2026,
});
assert.equal(nullFlow, null, "출생연도를 못 뽑으면 buildRomanticFortuneFlow는 null이어야 함(기존 동작)");

const fallbackDigest = buildRomanticSewoonTimelineDigest(nullFlow?.sewoon ?? null);
assert.ok(
  fallbackDigest.includes("출생연도 파싱 실패"),
  "fallback digest에 출생연도 파싱 실패 안내가 있어야 함",
);
assert.ok(!fallbackDigest.includes("in_1_year"), "fallback일 땐 구간 키 자체가 없어야 함");
ok("fortuneFlow가 null이어도 크래시 없이 fallback 문구만 반환됨");

console.log("\nOK: romantic sewoon timeline digest tests passed");
