/**
 * Relationship English-leakage regression guard (Phase 1, extended Phase 2).
 * NOT a broad repo-wide lint rule: scoped to the three Relationship source
 * roots only, and only flags one specific, mechanically-detectable bug
 * pattern that recurred across every vertical in the Phase D forensic audit
 * — a function whose parameter list declares a `locale` field (typed or
 * not) that is never referenced anywhere in the function body (dead locale
 * param == content that can't actually branch on locale despite looking
 * like it can).
 *
 * This does NOT catch every English-leakage bug in the codebase — e.g. a
 * function that DOES reference `locale` but only branches some of its
 * strings on it, or hardcoded-Korean chapter engines that never had a
 * locale param added at all, are outside what this specific heuristic can
 * safely detect without a real parser. Phase 2 gave Work and Family full
 * current-canonical English coverage (their chapter engines are no longer
 * in this debt list); still-deferred categories (Marriage Ch07/08 fully,
 * `buildCoupleV5DomainModels.ts`, `romanticV4GapBatchEngine.ts`, Friend
 * editorial debt, etc.) are tracked as prose debt in the Phase 1/2 reports,
 * not by this test.
 *
 * Ratchet design (mirrors tests/scripts/check-relationship-typecheck-
 * baseline.mjs's established convention in this repo): the scanner's
 * current violation count becomes MAX_KNOWN_VIOLATIONS below. The test
 * fails only when a NEW violation pushes the count above that baseline, or
 * when one of the six Phase-1 fixes gets silently reverted. Fixing one of
 * the listed violations and lowering MAX_KNOWN_VIOLATIONS to lock in the
 * improvement is always welcome.
 *
 * Run: npx tsx tests/unit/relationship-locale-leak-guard.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
// statSync is used by listSourceFiles below to distinguish dirs from files.
import path from "node:path";
import { fileURLToPath } from "node:url";

function ok(name) {
  console.log(`ok - ${name}`);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");

const SCAN_ROOTS = [
  "lib/relationship",
  "lib/prompts/relationshipPremium",
  "components/relationship",
];

/**
 * Baseline snapshot taken 2026-08-29 (Phase 1 English remediation), lowered
 * 2026-08-29 (Phase 2, after the Work + Family chapter-engine and
 * SectionRenderer.tsx fixes eliminated 2 of the original 34), lowered again
 * 2026-08-30 (Phase 3, after `buildMarriageChapter07Intelligence` was given
 * real `isEn` branching — see git history for the Phase 1/2 baselines this
 * replaced). Every function currently tripping the scanner is listed here
 * for visibility; the number itself, not this list, is what the assertion
 * checks — the list is documentation, so a reviewer can see at a glance
 * whether a diff added a new name to it. Regenerated via a disposable probe
 * script (never hand-edited) — see Phase 1/2/3 report discipline notes.
 */
const MAX_KNOWN_VIOLATIONS = 31;
const KNOWN_VIOLATIONS_AT_BASELINE = new Set([
  "lib/prompts/relationshipPremium/businessSajuDeep/index.ts::attachBusinessSajuDeepOverlay",
  "lib/prompts/relationshipPremium/familySajuDeep/index.ts::attachFamilySajuDeepOverlay",
  "lib/prompts/relationshipPremium/friendSajuDeep/index.ts::attachFriendSajuDeepOverlay",
  "lib/prompts/relationshipPremium/marriedSajuDeep/index.ts::attachMarriedSajuDeepOverlay",
  "lib/relationship/enrichment/marriagePsychGapInsights.ts::buildSpaceVsTogetherClauses",
  "lib/relationship/enrichment/workPsychRoleInsights.ts::buildDetailVsBigPictureClauses",
  "lib/relationship/enrichment/workPsychRoleInsights.ts::buildOwnershipDelegationLine",
  "lib/relationship/familyParent/familyCanonicalAdapters.ts::resolveFamilyCoreDynamicCanonical",
  "lib/relationship/familyParent/familyCanonicalAdapters.ts::resolveFamilyCrisisRecoveryCanonical",
  "lib/relationship/familyParent/familyCanonicalAdapters.ts::resolveFamilyDisciplineCanonical",
  "lib/relationship/familyParent/familyCanonicalAdapters.ts::resolveFamilyDistanceCanonical",
  "lib/relationship/familyParent/familyCanonicalAdapters.ts::resolveFamilyHiddenNeedsCanonical",
  "lib/relationship/familyParent/familyCanonicalAdapters.ts::resolveFamilyHouseholdRolesCanonical",
  "lib/relationship/familyParent/familyCanonicalAdapters.ts::resolveFamilyPraiseCanonical",
  "lib/relationship/familyParent/familyCanonicalAdapters.ts::resolveFamilySafeBoundaryCanonical",
  "lib/relationship/marriage/partnerCanonicalAdapters.ts::resolvePartnerBedroomCanonical",
  "lib/relationship/marriage/partnerCanonicalAdapters.ts::resolvePartnerConflictTriggerCanonical",
  "lib/relationship/marriage/partnerCanonicalAdapters.ts::resolvePartnerCoreBondCanonical",
  "lib/relationship/marriage/partnerCanonicalAdapters.ts::resolvePartnerCrisisProtectorCanonical",
  "lib/relationship/marriage/partnerCanonicalAdapters.ts::resolvePartnerHouseholdChoresCanonical",
  "lib/relationship/marriage/partnerCanonicalAdapters.ts::resolvePartnerLongtermVisionCanonical",
  "lib/relationship/marriage/partnerCanonicalAdapters.ts::resolvePartnerParentingCanonical",
  "lib/relationship/marriage/partnerCanonicalAdapters.ts::resolvePartnerPrivateSanctuaryCanonical",
  "lib/relationship/marriage/partnerCanonicalAdapters.ts::resolvePartnerTempoRhythmCanonical",
  "lib/relationship/relationshipReportQuery.ts::mergeRelationshipPremiumByKind",
  "lib/relationship/romantic/prototypeV4/composeCanonicalSectionNarratives.ts::titlesFor",
  "lib/relationship/romantic/prototypeV4/spousePalaceMatcher.ts::synthesizePartnerSpecificReason",
  "lib/relationship/romanticHeadline/index.ts::buildRomanticHeadlineContext",
  "lib/relationship/workColleague/workCanonicalAdapters.ts::resolveWorkBurnoutRecoveryCanonical",
  "lib/relationship/workColleague/workCanonicalAdapters.ts::resolveWorkDecisionStyleCanonical",
  "lib/relationship/workColleague/workCanonicalAdapters.ts::resolveWorkStressReactionCanonical",
]);

/**
 * Sanity tripwire for the six fixes made in this Phase 1 pass: confirms the
 * fix signature is still present so a later refactor can't silently
 * reintroduce the locale-blind behavior without this guard noticing. Not a
 * function-shape scan — just "does this marker string still exist".
 */
const FIXED_SIGNATURES = [
  {
    file: "lib/relationship/scoreBarAppearance.ts",
    mustContain: ["HINT_TEXT", 'locale: Locale'],
  },
  {
    file: "lib/relationship/romantic/prototypeV4/buildRomanticOverviewSnapshot.ts",
    mustContain: ["const isEn = params.locale"],
  },
  {
    file: "components/relationship/romantic/v4/ChaptersA.tsx",
    mustContain: ['isEn ? "Strength" : "강점"', 'isEn ? "Watch for" : "주의"'],
  },
  {
    file: "lib/prompts/relationshipPremium/friendSajuDeep/postValidateNarrative.ts",
    mustContain: ["GAP_AUDIBLE_EN", "isGapAudible"],
  },
  {
    file: "lib/relationship/romantic/prototypeV4/romanticNarrativeEditor.ts",
    mustContain: ["CAUSAL_CONNECTIVES_EN", "CONSEQUENCE_VERBS_EN"],
  },
  {
    file: "lib/prompts/relationshipPremium/marriedSajuDeep/postValidateNarrative.ts",
    mustContain: ["TENTATIVE_MARKER_EN", "aspectToKeyEn"],
  },
];

function listSourceFiles(root) {
  const abs = path.join(REPO_ROOT, root);
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (entry === "node_modules" || entry.startsWith(".")) continue;
        walk(full);
      } else if (/\.(ts|tsx)$/.test(entry) && !/\.(test|spec)\.(ts|tsx)$/.test(entry)) {
        out.push(full);
      }
    }
  };
  walk(abs);
  return out;
}

/**
 * Forward function-boundary scan: for each `function name(` / `const name =
 * (...) =>` declaration, balance-match the parameter list, then balance-
 * match the following `{...}` body. Heuristic, not a real parser — string/
 * regex-literal edge cases are possible; on any imbalance the file is
 * skipped rather than crashing (false negatives are acceptable for a
 * tripwire test, false positives are not).
 */
function findDeadLocaleParams(src, filePath) {
  const violations = [];
  const fnRe =
    /\b(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(|\b(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*(?::[^=(]+)?=\s*(?:async\s*)?\(/g;
  let m;
  while ((m = fnRe.exec(src))) {
    const name = m[1] || m[2];
    const parenOpen = src.indexOf("(", m.index + m[0].length - 1);
    if (parenOpen === -1) continue;

    let depth = 0;
    let parenClose = -1;
    for (let i = parenOpen; i < src.length; i++) {
      if (src[i] === "(") depth++;
      else if (src[i] === ")") {
        depth--;
        if (depth === 0) {
          parenClose = i;
          break;
        }
      }
    }
    if (parenClose === -1) continue;

    const paramsText = src.slice(parenOpen, parenClose + 1);
    if (!/\blocale\s*\??:/.test(paramsText)) continue;

    // Find the real body brace, skipping past any inline object-literal
    // return type (e.g. `): { nickname: string; reason: string } {`) — such
    // a type block is itself balanced and is always immediately followed by
    // another `{` (the real body); anything else that isn't followed by a
    // further `{` is the body itself.
    let braceOpen = -1;
    let braceClose = -1;
    let searchFrom = parenClose + 1;
    let firstCandidate = true;
    for (;;) {
      const candidateOpen = src.indexOf("{", searchFrom);
      if (candidateOpen === -1) break;
      if (firstCandidate && candidateOpen - parenClose > 400) break; // not a block body (e.g. arrow expression)
      firstCandidate = false;

      let bdepth = 0;
      let candidateClose = -1;
      for (let i = candidateOpen; i < src.length; i++) {
        if (src[i] === "{") bdepth++;
        else if (src[i] === "}") {
          bdepth--;
          if (bdepth === 0) {
            candidateClose = i;
            break;
          }
        }
      }
      if (candidateClose === -1) break;

      let peek = candidateClose + 1;
      while (peek < src.length && /\s/.test(src[peek])) peek++;
      if (src[peek] === "{") {
        searchFrom = candidateClose + 1;
        continue; // that block was a return-type annotation, not the body
      }
      braceOpen = candidateOpen;
      braceClose = candidateClose;
      break;
    }
    if (braceOpen === -1 || braceClose === -1) continue;

    const bodyText = src.slice(braceOpen + 1, braceClose);
    if (!/\blocale\b/.test(bodyText)) {
      violations.push({ file: filePath, name });
    }
  }
  return violations;
}

// 1. Fix signatures must still be present (tripwire against silent revert).
{
  for (const { file, mustContain } of FIXED_SIGNATURES) {
    const abs = path.join(REPO_ROOT, file);
    const src = readFileSync(abs, "utf8");
    for (const needle of mustContain) {
      assert.ok(
        src.includes(needle),
        `${file} no longer contains expected Phase 1 fix marker: ${needle}`,
      );
    }
  }
  ok("all six Phase 1 fix signatures still present");
}

// 2. Dead-locale-param count must not exceed the documented baseline —
//    ratchet, not a hard zero (mirrors typecheck:relationship's pattern).
{
  const violations = [];
  for (const root of SCAN_ROOTS) {
    for (const absFile of listSourceFiles(root)) {
      const relFile = path.relative(REPO_ROOT, absFile).split(path.sep).join("/");
      let src;
      try {
        src = readFileSync(absFile, "utf8");
      } catch {
        continue;
      }
      let found;
      try {
        found = findDeadLocaleParams(src, relFile);
      } catch {
        continue; // heuristic parse failure — skip rather than false-positive
      }
      for (const v of found) violations.push(`${v.file}::${v.name}`);
    }
  }

  const newlyAppeared = violations.filter((v) => !KNOWN_VIOLATIONS_AT_BASELINE.has(v));
  console.log(
    `[relationship-locale-leak] current: ${violations.length}, baseline: ${MAX_KNOWN_VIOLATIONS}`,
  );

  assert.ok(
    violations.length <= MAX_KNOWN_VIOLATIONS,
    `dead-locale-param count (${violations.length}) exceeds the baseline (${MAX_KNOWN_VIOLATIONS}).\n` +
      `Newly-appeared violation(s) not in KNOWN_VIOLATIONS_AT_BASELINE:\n${newlyAppeared
        .map((v) => `  ${v}`)
        .join("\n")}\n` +
      `Either add locale branching to that function, or if this is pre-existing debt worth tracking, add it to KNOWN_VIOLATIONS_AT_BASELINE and bump MAX_KNOWN_VIOLATIONS.`,
  );

  if (violations.length < MAX_KNOWN_VIOLATIONS) {
    console.log(
      `[relationship-locale-leak] ${MAX_KNOWN_VIOLATIONS - violations.length} violation(s) fixed since baseline — consider lowering MAX_KNOWN_VIOLATIONS to lock in the improvement.`,
    );
  }
  ok(`dead-locale-param count within baseline (${violations.length}/${MAX_KNOWN_VIOLATIONS})`);
}

console.log("All relationship locale-leak guard tests passed.");
