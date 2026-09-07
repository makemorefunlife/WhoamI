/**
 * Post-connection confirmation UX — previously there was zero acknowledgment
 * on either side that a friend connection had actually formed: the joiner
 * was silently funneled straight into their own survey (see
 * app/homecontent.tsx's proceedToReportCreation / resume branches), and the
 * sharer only ever saw the new friend blend quietly into their existing
 * list/map with no announcement (ConnectionRequestsPanel is deliberately
 * quiet by its own doc comment). This adds one shared modal
 * (components/relationship/ConnectionSuccessModal.tsx) used on both sides
 * with different copy/actions:
 *   - joiner: "OO님과 친구가 되었어요! 분석 시작하기" -> proceeds to survey/hub
 *   - sharer: "OO님과 연결에 성공했어요! 맵에서 보기" -> scrolls to the map section
 *     (the map lives inline on the same hub page, not a separate route)
 *
 * Run: npx tsx tests/unit/connection-success-modal-wiring.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`ok - ${name}`);
}
function section(title) {
  console.log(`\n=== ${title} ===`);
}
function readSrc(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

section("A. Both completion routes resolve and return the other participant's name");
{
  const inviteRoute = readSrc("app/api/invite/complete/route.ts");
  assert.ok(inviteRoute.includes("resolveClerkDisplayNamesByUserId"));
  assert.ok(inviteRoute.includes("sharer_name"));
  assert.ok(/NextResponse\.json\(\{ ok: true, relationship_report_id, sharer_name \}\)/.test(inviteRoute));

  const connectRoute = readSrc("app/api/connect/complete/route.ts");
  assert.ok(connectRoute.includes("resolveClerkDisplayNamesByUserId"));
  assert.ok(connectRoute.includes("sharer_name"));
  assert.ok(/NextResponse\.json\(\{ ok: true, relationshipReportId, sharer_name \}\)/.test(connectRoute));
  ok("invite/complete and connect/complete both resolve + return sharer_name (best-effort, never fails completion)");
}

section("B. Joiner side — the modal gates navigation, it doesn't just decorate it");
{
  const src = readSrc("app/homecontent.tsx");
  assert.ok(src.includes("ConnectionSuccessModal"), "homecontent.tsx must render the modal");
  assert.ok(
    src.includes("if (sharerName) {") && src.includes("setConnectedModal({ sharerName, onConfirm: () => goToSurvey(data.id) })"),
    "proceedToReportCreation must show the modal instead of auto-calling goToSurvey when a connection was made",
  );
  // The two "resume" effects (existing-user-clicks-a-link paths) must also
  // route through the modal, not just the first-time-signup path — a
  // returning user connecting to a new friend is at least as common.
  const resumeModalUses = (src.match(/setConnectedModal\(\{ sharerName, onConfirm:/g) ?? []).length;
  assert.ok(resumeModalUses >= 4, `expected the modal to gate all 4 completion call sites (proceedToReportCreation + 2x invite-resume + ... ), found ${resumeModalUses}`);
  ok("every completion path (first-time signup + both resume branches) shows the modal before navigating on, when a connection was actually made");
}

section("C. Sharer side — onAccepted fires only for 'accept', never 'decline'");
{
  const src = readSrc("components/relationship/hub/ConnectionRequestsPanel.tsx");
  assert.ok(src.includes('if (action === "accept") onAccepted?.(req.name);'));
  ok("ConnectionRequestsPanel only calls onAccepted on a successful accept, not decline");
}

section("D. RelationHubDashboard wires the sharer modal to scroll to the inline map section");
{
  const src = readSrc("components/relationship/hub/RelationHubDashboard.tsx");
  assert.ok(src.includes("onAccepted={(name) => setConnectedFriendName(name)}"));
  assert.ok(src.includes("mapSectionRef"));
  assert.ok(src.includes("mapSectionRef.current?.scrollIntoView"));
  assert.ok(
    src.includes('ref={mapSectionRef}'),
    "the map section's own wrapper must carry the ref being scrolled to",
  );
  ok("RelationHubDashboard shows the sharer confirmation and scrolls to the inline map section on confirm");
}

section("E. i18n — both locales carry the exact copy keys, joiner and sharer variants distinct");
{
  for (const [label, file] of [
    ["ko-KR", "lib/i18n/messages/ko-KR.ts"],
    ["en-US", "lib/i18n/messages/en-US.ts"],
  ]) {
    const src = readSrc(file);
    for (const key of [
      "connectedJoinerTitle",
      "connectedJoinerBody",
      "connectedJoinerCta",
      "connectedSharerTitle",
      "connectedSharerBody",
      "connectedSharerPrimaryCta",
      "connectedSharerSecondaryCta",
    ]) {
      assert.ok(src.includes(`${key}:`), `${label}: missing connect.${key}`);
    }
  }
  ok("both locales define distinct joiner/sharer confirmation copy");
}

console.log(`\n${passed} passed`);
