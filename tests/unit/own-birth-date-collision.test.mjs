/**
 * detectsOwnBirthDateCollision() — 2026-07-21 동글 birth_date 오염 사고
 * 재발 방지용 안전망 함수 회귀 테스트.
 * No DB — 순수 함수만 검증. API route 통합 동작은 이 함수가 올바르게
 * 호출되고 있는지를 app/api/report/birth/route.ts,
 * app/api/relationship/manual/route.ts 코드 리뷰로 별도 확인함.
 * Run: npx tsx tests/unit/own-birth-date-collision.test.mjs
 */
import assert from "node:assert/strict";
import { detectsOwnBirthDateCollision } from "../../lib/report/detectOwnBirthDateCollision.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

section("1) 본인 self report와 birth_date+birth_time이 완전히 같으면 collision=true");
assert.equal(
  detectsOwnBirthDateCollision({
    targetReportId: "partner-report-id",
    ownSelfReport: { id: "self-report-id", birth_date: "1988-02-02", birth_time: "11:10" },
    newBirthDate: "1988-02-02",
    newBirthTime: "11:10",
  }),
  true,
  "동글 사고와 동일한 시나리오 — 파트너에 저장하려는 값이 본인 self report와 완전히 같음",
);
ok("본인과 생년월일시가 완전히 같은 파트너 저장 시도를 감지한다");

section("2) 생년월일만 같고 시간이 다르면 collision=false (오탐 방지)");
assert.equal(
  detectsOwnBirthDateCollision({
    targetReportId: "partner-report-id",
    ownSelfReport: { id: "self-report-id", birth_date: "1988-02-02", birth_time: "11:10" },
    newBirthDate: "1988-02-02",
    newBirthTime: "09:00",
  }),
  false,
  "같은 날 태어난 우연은 실제로 있을 수 있음 — 시간까지 같아야 경고",
);
ok("생년월일만 우연히 같고 시간이 다르면 경고하지 않는다(오탐 방지)");

section("3) 본인이 본인 report(self)를 수정하는 경우는 collision 아님");
assert.equal(
  detectsOwnBirthDateCollision({
    targetReportId: "self-report-id",
    ownSelfReport: { id: "self-report-id", birth_date: "1988-02-02", birth_time: "11:10" },
    newBirthDate: "1988-02-02",
    newBirthTime: "11:10",
  }),
  false,
  "본인이 본인 정보를 그대로 저장/재확인하는 건 당연히 같아야 하므로 경고 대상 아님",
);
ok("targetReportId === ownSelfReport.id면 항상 collision=false (본인 자기 수정 오탐 방지)");

section("4) ownSelfReport가 없으면(게스트 등) collision=false");
assert.equal(
  detectsOwnBirthDateCollision({
    targetReportId: "partner-report-id",
    ownSelfReport: null,
    newBirthDate: "1988-02-02",
    newBirthTime: "11:10",
  }),
  false,
  "self report를 못 찾은 게스트/미로그인 상황에서는 비교 대상이 없으므로 조용히 통과",
);
ok("본인 self report 조회가 실패해도 크래시 없이 collision=false로 안전하게 폴백한다");

section("5) 서로 다른 생년월일시면 collision=false (정상 케이스)");
assert.equal(
  detectsOwnBirthDateCollision({
    targetReportId: "partner-report-id",
    ownSelfReport: { id: "self-report-id", birth_date: "1988-02-02", birth_time: "11:10" },
    newBirthDate: "1987-10-26",
    newBirthTime: "20:10",
  }),
  false,
  "실제로 다른 사람의 생년월일시를 저장하는 정상 케이스",
);
ok("정상적으로 서로 다른 사람 데이터를 저장할 때는 경고하지 않는다");

section("6) birthTime이 둘 다 null(시간 모름)이고 날짜만 같아도 collision=true");
assert.equal(
  detectsOwnBirthDateCollision({
    targetReportId: "partner-report-id",
    ownSelfReport: { id: "self-report-id", birth_date: "1988-02-02", birth_time: null },
    newBirthDate: "1988-02-02",
    newBirthTime: null,
  }),
  true,
  "시간을 둘 다 모르는 경우 날짜만으로도 비교 — null과 null은 같은 값으로 취급",
);
ok("birth_time이 둘 다 미상(null)이고 날짜가 같으면 collision=true");

console.log("\nAll own-birth-date-collision tests passed.");
