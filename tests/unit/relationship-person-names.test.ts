/**
 * Relationship person naming -- one canonical rule for every surface.
 * Run: npx tsx tests/unit/relationship-person-names.test.ts
 *
 *   ME    = my current account nickname
 *   OTHER = my override (manual person) -> their own nickname -> "Partner" / "상대"
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  isStoredPlaceholderName,
  relationshipFallbackNames,
  resolveMeDisplayName,
  resolveOtherDisplayName,
  resolveOtherNameOrEmpty,
  slotDisplayNames,
} from "../../lib/relationship/relationshipPersonNames";
import { resolveRelationshipPairLabels } from "../../lib/relationship/resolveRelationshipPairLabels";
import {
  applyCurrentReportNames,
  isReportNameKey,
  storedReportSlotNames,
} from "../../lib/relationship/applyCurrentReportNames";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport";
import { buildFamilyReportViewModel } from "../../lib/relationship/familyParent/viewModel/buildFamilyReportViewModel";
import { buildFriendReport } from "../../lib/relationship/friend/buildFriendReport";
import { buildFriendReportViewModel } from "../../lib/relationship/friend/viewModel/buildFriendReportViewModel";
import { buildMarriageReport } from "../../lib/relationship/marriage/buildMarriageReport";
import { buildWorkColleagueReport } from "../../lib/relationship/workColleague/buildWorkColleagueReport";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload";

const HANGUL = /[가-힣]/;
let passed = 0;
const ok = (n: string) => {
  passed += 1;
  console.log(`ok - ${n}`);
};
const src = (p: string) => readFileSync(p, "utf8");

const EMOJI = "🐱✨";
const JA = "さくら";
const AR = "ليلى";
const KO = "지민";

const saju = (d: string) => {
  const p = toV1SajuApiPayload(calculateSajuBundle({ birthDate: d, birthTime: "12:00" }));
  return { saju: p.saju, dayStemData: p.dayStemData, dayBranchData: p.dayBranchData, hiddenStemsData: p.hiddenStemsData, tenGods: p.tenGods, twelveStageData: p.twelveStageData, relations: p.relations, shinsals: p.shinsals };
};
const sajuA = saju("1990-05-15");
const sajuB = saju("1992-08-20");

/** Every string under a name key, and every other string (prose), separately. */
function collect(v: unknown, names: string[] = [], prose: string[] = [], key = ""): { names: string[]; prose: string[] } {
  if (typeof v === "string") (isReportNameKey(key) ? names : prose).push(v);
  else if (Array.isArray(v)) v.forEach((x) => collect(x, names, prose, isReportNameKey(key) ? key : ""));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) collect(x, names, prose, k);
  return { names, prose };
}

async function main() {
  // ---------------------------------------------------------------- resolver
  // 1 ME = my current account nickname (beats the stale report name / Clerk name)
  assert.equal(
    resolveMeDisplayName({ accountDisplayName: "tester", reportName: "old", clerkFirstName: "Sera", locale: "en-US" }),
    "tester",
  );
  assert.equal(resolveMeDisplayName({ reportName: "old", clerkFirstName: "Sera", locale: "en-US" }), "old");
  ok("1: ME uses my current account nickname (then report name, Clerk name)");

  // 2 OTHER = my override for a manual person
  assert.equal(resolveOtherDisplayName({ isManualPartner: true, reportName: "Mom 💐", locale: "en-US" }), "Mom 💐");
  assert.equal(
    resolveOtherDisplayName({ isManualPartner: true, reportName: "Mom", accountDisplayName: "owner-leak", locale: "en-US" }),
    "Mom",
    "a manual row's clerk id is MY id -- never their name",
  );
  ok("2: OTHER uses my override when present (manual person)");

  // 3 otherwise their own account nickname
  assert.equal(resolveOtherDisplayName({ isManualPartner: false, reportName: null, accountDisplayName: "Jin", locale: "en-US" }), "Jin");
  assert.equal(resolveOtherDisplayName({ isManualPartner: false, reportName: "legacy", accountDisplayName: "Jin", locale: "en-US" }), "Jin");
  ok("3: otherwise OTHER uses their own registered nickname");

  // 4 / 5 fallbacks
  assert.equal(resolveOtherDisplayName({ isManualPartner: false, locale: "en-US" }), "Partner");
  assert.equal(resolveOtherDisplayName({ isManualPartner: true, reportName: "  ", locale: "en-US" }), "Partner");
  assert.equal(resolveMeDisplayName({ locale: "en-US" }), "Me");
  ok("4: no nickname -> en-US fallback 'Partner'");
  assert.equal(resolveOtherDisplayName({ isManualPartner: false, locale: "ko-KR" }), "상대");
  assert.equal(resolveMeDisplayName({ locale: "ko-KR" }), "나");
  ok("5: no nickname -> ko-KR fallback '상대'");

  // 6-9 Unicode preserved exactly, both sides, through the pair helper too
  for (const [n, name] of [[6, EMOJI], [7, JA], [8, AR], [9, KO]] as const) {
    assert.equal(resolveMeDisplayName({ accountDisplayName: name, locale: "en-US" }), name);
    assert.equal(resolveOtherDisplayName({ isManualPartner: false, accountDisplayName: name, locale: "en-US" }), name);
    assert.equal(resolveOtherDisplayName({ isManualPartner: true, reportName: name, locale: "ko-KR" }), name);
    const pair = await resolveRelationshipPairLabels({
      viewerReportId: "B", reportIdA: "A", reportIdB: "B",
      repA: { name, report_type: "partner_manual", clerk_user_id: "me" },
      repB: { name: "x" },
      viewerClerkUser: { publicMetadata: { displayName: name } },
      locale: "en-US",
    });
    assert.deepEqual([pair.labelA, pair.labelB], [name, name]);
    ok(`${n}: ${["emoji", "Japanese", "Arabic", "Korean"][n - 6]} nickname preserved exactly`);
  }
  const route = src("app/api/relationship/partner-name/route.ts");
  assert.match(route, /Array\.from\(body\.name\?\.trim\(\) \?\? ""\)\.slice\(0, 10\)/, "override cap never splits an emoji");
  assert.equal(Array.from("🐱🐱🐱🐱🐱🐱🐱🐱🐱🐱🐱").slice(0, 10).join(""), "🐱".repeat(10));

  // 10 / 11 locale isolation of fallbacks
  const en = relationshipFallbackNames("en-US");
  const ko = relationshipFallbackNames("ko-KR");
  assert.ok(!HANGUL.test(en.me + en.other));
  const enPair = await resolveRelationshipPairLabels({
    viewerReportId: "A", reportIdA: "A", reportIdB: "B", repA: {}, repB: { report_type: "partner_manual" }, viewerClerkUser: {}, locale: "en-US",
  });
  assert.ok(!HANGUL.test(enPair.labelA + enPair.labelB), `en pair leaked Korean: ${enPair.labelA} ${enPair.labelB}`);
  ok("10: en-US never produces a Korean fallback ('Me' / 'Partner')");
  assert.ok(!/Partner|Me\b/.test(ko.me + ko.other));
  const koPair = await resolveRelationshipPairLabels({
    viewerReportId: "A", reportIdA: "A", reportIdB: "B", repA: {}, repB: { report_type: "partner_manual" }, viewerClerkUser: {}, locale: "ko-KR",
  });
  assert.deepEqual([koPair.labelA, koPair.labelB], ["나", "상대"]);
  ok("11: ko-KR never produces the English fallback ('나' / '상대')");

  // ------------------------------------------------------------ Basic kind
  const detail = src("app/api/relationship/detail/route.ts");
  const hook = src("app/relationship/[id]/useRelationshipDetail.ts");
  const basicCards = src("components/relationship/RelationshipBasicCards.tsx");
  assert.match(detail, /resolveMeDisplayName\(\{\s*accountDisplayName: \(clerkUser\?\.publicMetadata/);
  assert.match(detail, /resolveOtherDisplayName\(\{/);
  assert.match(detail, /display_name_a: displayNames\.a/);
  assert.match(basicCards, /const myNick = myDisplay;\s*const partnerNick = partnerDisplay;/, "Basic cards show live names, not stored axis nicknames");
  ok("12: Basic header/cards use the canonical names from the detail API");

  const basicRoute = src("app/api/relationship/analyze/basic/route.ts");
  assert.match(basicRoute, /const \{ labelA, labelB \} = await resolveRelationshipPairLabels\(/);
  assert.match(basicRoute, /\.select\("id, name, report_type, clerk_user_id"\)/, "reads the fields the canonical rule needs");
  const connected = await resolveRelationshipPairLabels({
    viewerReportId: "A", reportIdA: "A", reportIdB: "B",
    repA: { name: null }, repB: { name: "Jin", report_type: "partner_manual" },
    viewerClerkUser: { publicMetadata: { displayName: "tester" } }, locale: "en-US",
  });
  assert.deepEqual([connected.labelA, connected.labelB], ["tester", "Jin"]);
  ok("13: Basic generation prompt receives the canonical labels (no more 'tester × Partner')");

  // ------------------------------------------------------------ Family
  const section = src("components/relationship/detail/RelationshipPremiumSection.tsx");
  const view = src("app/relationship/[id]/RelationshipView.tsx");
  assert.match(view, /displayNameA=\{displayNameA\}\s*displayNameB=\{displayNameB\}/);
  assert.match(section, /<FamilyParentReportView report=\{named\.family \?\? displayFamilyDeep\} \/>/);
  const fam = buildFamilyParentReport({ nicknameA: "Alex", nicknameB: "Partner", roles: { roleA: "child", roleB: "mother" }, parentType: "mother", sajuJsonA: sajuA, sajuJsonB: sajuB, locale: "en-US" } as never);
  const famNow = applyCurrentReportNames(fam, { a: EMOJI, b: JA });
  assert.deepEqual(storedReportSlotNames(famNow), { a: EMOJI, b: JA });
  ok("14: Family header uses the current canonical names (stored 'Partner' -> current nickname)");

  const before = collect(fam);
  const after = collect(famNow);
  assert.ok(before.names.includes("Alex") && before.names.includes("Partner"));
  assert.ok(!after.names.includes("Alex") && !after.names.includes("Partner"), "every stored name field remapped");
  assert.deepEqual(after.prose, before.prose, "prose untouched");
  const famVm = buildFamilyReportViewModel(famNow as never, { locale: "en-US" } as never);
  const vmNames = collect(famVm).names.concat(collect(famVm).prose);
  assert.ok(vmNames.some((s) => s.includes(EMOJI)) && vmNames.some((s) => s.includes(JA)), "Family sections render the current names");
  ok("15: Family report sections (compare rows, roles, mid-report name fields) use the current names");

  // --------------------------------------------- Romantic/Friend/Marriage/Work
  const premium = src("app/api/relationship/analyze/premium/route.ts");
  const branch = (kind: string) => {
    const i = premium.indexOf(`    if (kind === "${kind}") {`);
    assert.ok(i > 0, kind);
    return premium.slice(i, i + 4000);
  };
  assert.match(premium, /const \{ labelA, labelB \} = await resolveRelationshipPairLabels\(/);
  for (const kind of ["romantic", "friendship", "cohabitation", "work", "family"]) {
    assert.match(branch(kind), /nicknameA: labelA,\s*nicknameB: labelB,/, `${kind} prompt gets canonical labels`);
  }
  const liveProps = (tag: string) =>
    new RegExp(`<${tag}[\\s\\S]{0,160}myName=\\{viewerName\\}\\s*partnerName=\\{partnerName\\}`);

  assert.match(section, liveProps("RomanticV4ReportView"));
  assert.match(section, liveProps("RomanticExperienceView"));
  assert.match(section, liveProps("RomanticSajuDeepReportView"));
  ok("16: Romantic header + prose: canonical names in the prompt; views render live names (legacy map + V4 props)");

  const friend = buildFriendReport({ nicknameA: "Alex", nicknameB: "Partner", sajuJsonA: sajuA, sajuJsonB: sajuB, pairFriendship: { johu_gap: { heat_gap: 40, moisture_gap: 20, temperature_mismatch: true, band_a: "cold", band_b: "hot" }, energy_drain_index: 65, energy_drain_band: "medium" }, locale: "en-US" } as never);
  const friendNow = applyCurrentReportNames(friend, { a: "tester", b: "Jin" });
  assert.ok(!collect(friendNow).names.some((n) => n === "Alex" || n === "Partner"));
  assert.deepEqual(collect(friendNow).prose, collect(friend).prose);
  const fvm = buildFriendReportViewModel(friendNow as never, { viewerIsReportA: true, myName: "tester", partnerName: "Jin", locale: "en-US" } as never);
  const social = fvm.sections.find((s: { type: string }) => s.type === "social_dna") as unknown as { dna: { me: { nickname: string }; partner: { nickname: string } } };
  assert.deepEqual([social.dna.me.nickname, social.dna.partner.nickname], ["tester", "Jin"], "'X × Y' role heading");
  assert.match(section, liveProps("FriendReportView"));
  assert.match(section, /report=\{named\.friendship \?\? displayFriendshipDeep\}/);
  ok("17: Friend header + prose: canonical prompt names; 'X × Y' and role headings use current names");

  const marriage = buildMarriageReport({ nicknameA: "tester", nicknameB: "Partner", sajuJsonA: sajuA, sajuJsonB: sajuB, locale: "en-US" } as never);
  assert.deepEqual(storedReportSlotNames(marriage), { a: "tester", b: "Partner" });
  const marriageNow = applyCurrentReportNames(marriage, { a: "tester", b: "Jin" });
  assert.ok(!collect(marriageNow).names.includes("Partner"), "no stale 'Partner' left in any Marriage name field");
  assert.ok(collect(marriageNow).names.includes("Jin"));
  assert.deepEqual(collect(marriageNow).prose, collect(marriage).prose);
  assert.match(section, liveProps("MarriageReportView"));
  assert.match(section, /report=\{named\.cohabitation \?\? displayCohabitationDeep\}/);
  ok("18: Marriage header + prose: 'Why Partner is needed for tester'-style headings now read the current names");

  const work = buildWorkColleagueReport({ nicknameA: "Alex", nicknameB: "Jordan", sajuJsonA: sajuA, sajuJsonB: sajuB, locale: "en-US" } as never);
  assert.deepEqual(storedReportSlotNames(work), { a: "Alex", b: "Jordan" });
  const workNow = applyCurrentReportNames(work, { a: AR, b: KO });
  assert.ok(!collect(workNow).names.some((n) => n === "Alex" || n === "Jordan"));
  assert.deepEqual(collect(workNow).prose, collect(work).prose);
  assert.match(section, liveProps("WorkColleagueReportView"));
  assert.match(section, /report=\{named\.work \?\? displayWorkDeep\}/);
  ok("19: Colleague header + prose: canonical prompt names; role/compare name fields use current names");

  // ------------------------------------------------------------ history / shell
  const list = src("app/api/relationship/list/route.ts");
  const mapFetch = src("lib/relationship/map/fetchRelationshipMapConnections.ts");
  const mapRoute = src("app/api/relationship/map/route.ts");
  const preview = src("app/api/relationship/map/free-preview/route.ts");
  assert.match(list, /resolveOtherNameOrEmpty\(\{[\s\S]{0,300}\}\) \|\| relationshipFallbackNames\(locale\)\.other/);
  assert.match(mapFetch, /const partnerName = resolveOtherNameOrEmpty\(\{/);
  assert.match(mapRoute, /name: p\.name\?\.trim\(\) \? p\.name : relationshipFallbackNames\(locale\)\.other/);
  assert.match(preview, /resolveMeDisplayName\(\{\s*accountDisplayName: clerkUser\?\.publicMetadata\?\.displayName/);
  assert.equal(resolveOtherNameOrEmpty({ isManualPartner: false, accountDisplayName: "Jin", logName: "Old" }), "Jin", "live name beats log snapshot");
  assert.equal(resolveOtherNameOrEmpty({ isManualPartner: false, logName: "Old" }), "Old");
  assert.equal(resolveOtherNameOrEmpty({ isManualPartner: false, logName: "Partner" }), "", "stored placeholder never shown as a name");
  assert.ok(isStoredPlaceholderName("상대") && isStoredPlaceholderName("Partner") && !isStoredPlaceholderName(EMOJI));
  ok("20: analysis history / hub list / map use the canonical names (log name only as last resort)");

  assert.match(hook, /const serverPartnerName = \(data\.partner_name \?\? data\.display_partner_name \?\? ""\) as string;/);
  assert.match(hook, /setDisplayNameA\(typeof data\.display_name_a === "string"/);
  assert.doesNotMatch(hook, /useUser\(/, "no client-side re-resolution with a Korean default");
  assert.deepEqual(slotDisplayNames({ viewerIsReportA: false, meDisplayName: "me", otherDisplayName: "them" }), { a: "them", b: "me" });
  assert.match(section, /const named = useMemo\(/, "snapshot or live report -- both pass through the current-name remap");
  ok("21: saved report shell shows the current canonical names (server-resolved, per report slot)");

  // ------------------------------------------------------------ rename
  const hub = src("components/relationship/hub/RelationHubDashboard.tsx");
  assert.match(hub, /fetch\("\/api\/relationship\/partner-name"[\s\S]{0,700}await load\("silent"\);/);
  assert.match(route, /\.update\(\{ name \}\)/);
  assert.match(route, /invalidateRelationshipMapCache\(viewerReportId\);/);
  assert.doesNotMatch(route.replace(/\/\/.*$/gm, ""), /reserve|credit_lots|reserveRelationshipCredit|consume/i);
  ok("22: nickname edit updates reports.name only and refreshes the UI (list reload + map cache drop) -- no credit");
  const routeCode = route.replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(routeCode, /openai|analyze|regenerat|force_regenerate|result_premium|result_basic/i);
  const renamedOnce = applyCurrentReportNames(fam, { a: "A2", b: "B2" });
  assert.deepEqual(collect(fam).names, before.names, "stored report object itself is never mutated");
  assert.notEqual(renamedOnce, fam);
  ok("23: nickname edit never regenerates a paid report (display-time remap only; stored report untouched)");

  // 24 generic "partner" untouched
  const generic = {
    meta: { nickname_a: "tester", nickname_b: "Jin" },
    body: "Your partner needs space. Partner check-ins help.",
    partner_nickname: "Jin",
    advice: { text: "Talk to your partner", nickname: "tester" },
  };
  const g = applyCurrentReportNames(generic, { a: "tester", b: "민" });
  assert.equal(g.body, generic.body);
  assert.equal(g.advice.text, generic.advice.text);
  assert.equal(g.partner_nickname, "민");
  assert.equal(applyCurrentReportNames({ meta: { nickname_a: "X", nickname_b: "X" }, nickname: "X" }, { a: "a", b: "b" }).nickname, "X", "ambiguous -> as is");
  const kidsCopy = src("lib/i18n/messages/en-US.ts");
  assert.match(kidsCopy, /partner/i, "generic 'partner' copy still present");
  ok("24: generic uses of 'partner' in prose / copy stay unchanged");

  // 25 / 26 no hard-coded cross-locale fallbacks in the changed name paths
  const stripComments = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  const changed = [detail, hook, basicRoute, premium, list, mapFetch, mapRoute, preview, section, basicCards, src("lib/relationship/resolveRelationshipPairLabels.ts")].map(stripComments);
  for (const s of changed) {
    assert.doesNotMatch(s, /"(상대|탐사자|친구)"\s*[,)]/, "no hard-coded Korean name fallback");
    assert.doesNotMatch(s, /fallback:\s*"나"/);
  }
  assert.doesNotMatch(detail + hook + list + mapFetch, /locale === "ko-KR" \? "나" : "Me"/);
  ok("25: no hard-coded '상대' (or '친구'/'탐사자'/'나') fallback reaches en-US");
  for (const s of changed) assert.doesNotMatch(s, /\?\?\s*"Partner"|\|\|\s*"Partner"/, "no hard-coded English fallback");
  const famVmSrc = src("lib/relationship/familyParent/viewModel/buildFamilyReportViewModel.ts");
  assert.match(famVmSrc, /pick\(locale, "the parent", "부모"\)/);
  const famKo = buildFamilyParentReport({ nicknameA: "", nicknameB: "", roles: { roleA: "child", roleB: "mother" }, parentType: "mother", sajuJsonA: sajuA, sajuJsonB: sajuB, locale: "ko-KR" } as never);
  const famKoVm = buildFamilyReportViewModel(famKo as never, { locale: "ko-KR" } as never);
  assert.ok(!collect(famKoVm).prose.concat(collect(famKoVm).names).some((s) => /\bPartner\b|the parent|the child/.test(s)));
  ok("26: no hard-coded 'Partner' (or 'the parent/child') in ko-KR");

  console.log(`\nrelationship-person-names: ${passed} passed`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
