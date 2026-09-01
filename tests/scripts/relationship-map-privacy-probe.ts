/**
 * Live probe against a running `npm run dev` (localhost:3000) for the
 * relationship-map spec's core privacy contract (section 2, 7, 22, 50):
 * the default map payload must carry zero people names, and names must
 * only appear once a specific roleId is explicitly requested.
 *
 * Requires: dev server running, and a real reportId with connections
 * (pass as argv[2]; NODE_ENV=development so ownership checks fail open).
 *
 * Usage:
 *   npx tsx tests/scripts/relationship-map-privacy-probe.ts <reportId>
 */

const BASE = process.env.PROBE_BASE_URL ?? "http://localhost:3000";

async function main() {
  const reportId = process.argv[2];
  if (!reportId) {
    console.error("usage: npx tsx tests/scripts/relationship-map-privacy-probe.ts <reportId>");
    process.exit(1);
  }

  const summaryRes = await fetch(`${BASE}/api/relationship/map?reportId=${encodeURIComponent(reportId)}`);
  const summaryText = await summaryRes.text();
  if (!summaryRes.ok) {
    console.error("FAIL: summary request did not return 200:", summaryRes.status, summaryText);
    process.exit(1);
  }
  const summary = JSON.parse(summaryText);
  if (!Array.isArray(summary.roles) || summary.roles.length !== 10) {
    console.error("FAIL: expected exactly 10 roles in summary, got", summary.roles);
    process.exit(1);
  }
  if ("rolePeople" in summary) {
    console.error("FAIL: default summary payload must not include rolePeople at all");
    process.exit(1);
  }
  for (const role of summary.roles) {
    const keys = Object.keys(role).sort();
    if (JSON.stringify(keys) !== JSON.stringify(["count", "roleId", "tenGod"])) {
      console.error("FAIL: role summary row has unexpected/extra keys (possible name leakage):", role);
      process.exit(1);
    }
  }
  console.log(`ok - default map summary for ${summary.totalPeople} people carries zero names (10 roles, no rolePeople key)`);

  const roleWithPeople = summary.roles.find((r: { count: number }) => r.count > 0);
  if (!roleWithPeople) {
    console.log("skip - this reportId has 0 people in every role; cannot verify the reveal-on-click path");
    return;
  }

  const detailRes = await fetch(
    `${BASE}/api/relationship/map?reportId=${encodeURIComponent(reportId)}&roleId=${roleWithPeople.roleId}&offset=0&limit=20`,
  );
  const detail = await detailRes.json();
  if (!detailRes.ok || !detail.rolePeople || !Array.isArray(detail.rolePeople.people)) {
    console.error("FAIL: role-detail request did not return a rolePeople.people array:", detail);
    process.exit(1);
  }
  if (detail.rolePeople.people.length === 0) {
    console.error("FAIL: expected at least one person for a role with count > 0");
    process.exit(1);
  }
  for (const person of detail.rolePeople.people) {
    if (typeof person.name !== "string" || !person.name) {
      console.error("FAIL: person row missing a name once the role is explicitly opened:", person);
      process.exit(1);
    }
  }
  console.log(
    `ok - explicit roleId=${roleWithPeople.roleId} request reveals ${detail.rolePeople.people.length} name(s) — names only appear after the click, not by default`,
  );

  console.log("\nAll relationship-map privacy probe checks passed.");
  console.log(
    "NOTE: cross-user ownership denial was not exercised — this dev server runs with NODE_ENV=development, which assertOwnedReportAccess intentionally fails open for (see lib/report/assertOwnedReportAccess.ts). That check is exercised in production/staging, not locally.",
  );
}

main().catch((e) => {
  console.error("probe crashed:", e);
  process.exit(1);
});
