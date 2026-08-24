import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { buildFamilyRuleContext } from "../lib/relationship/familyParent/buildFamilyRuleContext";
import { buildFamilyHouseholdRoles } from "../lib/relationship/familyParent/buildFamilyHouseholdRoles";
import { buildFamilySajuCompareTable } from "../lib/relationship/familyParent/familySajuCompareTable";
import { calculateSajuBundle } from "../lib/v2/saju/calculateSajuBundle";
import { toV1SajuApiPayload } from "../lib/saju/toApiPayload";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

function createSaju(birthDate: string, birthTime: string) {
  const bundle = calculateSajuBundle({ birthDate, birthTime });
  return toV1SajuApiPayload(bundle);
}

async function updateDbCache() {
  try {
    const { data, error } = await supabase
      .from("relationship_reports")
      .select("*")
      .eq("id", "2e96c631-791b-4f89-bfd6-5a44f7b344cb")
      .single();

    if (error || !data) {
      console.error("Error fetching report:", error);
      return;
    }

    const seraChart = createSaju("1993-05-15", "14:00");
    const donggleChart = createSaju("2020-08-20", "10:00");

    const ctx = buildFamilyRuleContext({
      nicknameA: "동글",
      nicknameB: "Sera",
      roles: { roleA: "child", roleB: "mother" },
      sajuJsonA: donggleChart,
      sajuJsonB: seraChart,
      locale: "ko-KR",
    });

    const newRoles = buildFamilyHouseholdRoles({
      parentNickname: ctx.parentNickname,
      childNickname: ctx.childNickname,
      countsParent: ctx.tenGod.countsParent,
      countsChild: ctx.tenGod.countsChild,
      familySignalsParent: ctx.familySignalsParent,
      familySignalsChild: ctx.familySignalsChild,
      pairFamily: null,
      viewerIsChild: false,
      locale: "ko-KR",
      ctx,
    });

    const newCompareTable = buildFamilySajuCompareTable({
      parentNickname: ctx.parentNickname,
      childNickname: ctx.childNickname,
      countsParent: ctx.tenGod.countsParent,
      countsChild: ctx.tenGod.countsChild,
      chartParent: ctx.chartParent,
      chartChild: ctx.chartChild,
      friendshipSignalsParent: ctx.friendshipSignalsParent,
      friendshipSignalsChild: ctx.friendshipSignalsChild,
      familySignalsParent: ctx.familySignalsParent,
      familySignalsChild: ctx.familySignalsChild,
      pairFamily: null,
      parentRole: ctx.parentRole,
      locale: "ko-KR",
    });

    const byKind = data.result_premium_by_kind || {};

    const updatePayloadFamily = (familyObj: any) => {
      if (!familyObj) return;
      familyObj.section_household_roles = newRoles;
      familyObj.section_compare_table = newCompareTable;
      if (familyObj.section_psych_match) {
        familyObj.section_psych_match.chart_note = "두 분의 현재 모습을 11축으로 비교했어요.";
      }
    };

    if (byKind.byLocale?.["ko-KR"]?.report?.family) {
      updatePayloadFamily(byKind.byLocale["ko-KR"].report.family);
    }
    if (byKind.family?.byLocale?.["ko-KR"]?.report?.family) {
      updatePayloadFamily(byKind.family.byLocale["ko-KR"].report.family);
    }

    const { error: updateError } = await supabase
      .from("relationship_reports")
      .update({ result_premium_by_kind: byKind })
      .eq("id", "2e96c631-791b-4f89-bfd6-5a44f7b344cb");

    if (updateError) {
      console.error("Error updating DB report:", updateError);
    } else {
      console.log("Successfully updated DB payload for 2e96c631-791b-4f89-bfd6-5a44f7b344cb!");
    }
  } catch (e) {
    console.error("Caught exception:", e);
  }
}

updateDbCache().then(() => console.log("Done."));
