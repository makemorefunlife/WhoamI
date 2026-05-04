import type { SupabaseClient } from "@supabase/supabase-js";

// 천간(일간) 해석
export async function getHeavenlyStemData(
  supabase: SupabaseClient,
  stemCode: string,
) {
  const { data } = await supabase
    .from("ref_heavenly_stems")
    .select("kor_name, metaphor_ko, strength_ko, weakness_ko, advice_ko")
    .eq("code", stemCode)
    .single();
  return data;
}

// 지지(일지) 해석
export async function getEarthlyBranchData(
  supabase: SupabaseClient,
  branchCode: string,
) {
  const { data } = await supabase
    .from("ref_earthly_branches")
    .select("kor_name, meaning_ko, strength_ko, weakness_ko, advice_ko")
    .eq("code", branchCode)
    .single();
  return data;
}

// 지장간 해석
export async function getHiddenStemsData(
  supabase: SupabaseClient,
  branchCode: string,
) {
  const { data } = await supabase
    .from("ref_hidden_stems")
    .select("stem_code, layer_type, meaning_ko, strength_ko, weakness_ko, advice_ko")
    .eq("branch_code", branchCode)
    .order("display_order", { ascending: true });
  return data || [];
}

// 십성 해석
export async function getTenGodData(
  supabase: SupabaseClient,
  godCode: string,
) {
  const { data } = await supabase
    .from("ref_ten_gods")
    .select("kor_name, meaning_ko, strength_ko, weakness_ko, advice_ko, relationship_ko")
    .eq("code", godCode)
    .single();
  return data;
}

// 12운성 해석
export async function getTwelveStageData(
  supabase: SupabaseClient,
  stageCode: string,
) {
  const { data } = await supabase
    .from("ref_twelve_stages")
    .select("kor_name, meaning_ko, strength_ko, weakness_ko, advice_ko, energy_level")
    .eq("code", stageCode)
    .single();
  return data;
}

export async function calculateTenGod(
  supabase: SupabaseClient,
  dayStem: string,
  targetStem: string,
): Promise<string> {
  const { data } = await supabase
    .from("ref_ten_god_rules")
    .select("ten_god_code")
    .eq("day_master_stem", dayStem)
    .eq("target_stem", targetStem)
    .single();
  return data?.ten_god_code || "bigyeon";
}

export async function calculateTwelveStage(
  supabase: SupabaseClient,
  dayStem: string,
  targetBranch: string,
): Promise<string> {
  const { data } = await supabase
    .from("ref_twelve_stage_rules")
    .select("stage_code")
    .eq("day_master_stem", dayStem)
    .eq("target_branch", targetBranch)
    .single();
  return data?.stage_code || "byeong";
}
