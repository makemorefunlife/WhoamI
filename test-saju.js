// test-saju.js (한글 매핑 버전)
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 한글 → 영문 코드 매핑 (수정됨!)
const stemMap = {
  갑: "gap",
  을: "eul",
  병: "byeong",
  정: "jeong",
  무: "mu",
  기: "gi",
  경: "gyeong",
  신: "sin",
  임: "im",
  계: "gye",
};

const branchMap = {
  자: "ja",
  축: "chuk",
  인: "in",
  묘: "myo",
  진: "jin",
  사: "sa",
  오: "o",
  미: "mi",
  신: "sin",
  유: "yu",
  술: "sul",
  해: "hae",
};

async function test() {
  console.log("🔍 sajuService 함수별 테스트 (한글 매핑)\n");

  // 테스트용 사주 (1988.02.02 11:10) - 한글 변환 필요
  const dayPillar = "정해";
  const yearPillar = "정묘";
  const monthPillar = "계축";
  const hourPillar = "을사";

  // 한자 → 한글 변환 (임시)
  const hanjaToHangul = {
    丁: "정",
    卯: "묘",
    癸: "계",
    丑: "축",
    乙: "을",
    巳: "사",
  };

  const dayStemHangul = hanjaToHangul[dayPillar[0]] || dayPillar[0];
  const dayBranchHangul = hanjaToHangul[dayPillar[1]] || dayPillar[1];
  const monthStemHangul = hanjaToHangul[monthPillar[0]] || monthPillar[0];
  const monthBranchHangul = hanjaToHangul[monthPillar[1]] || monthPillar[1];
  const hourBranchHangul = hanjaToHangul[hourPillar[1]] || hourPillar[1];

  const dayStemCode = stemMap[dayStemHangul];
  const dayBranchCode = branchMap[dayBranchHangul];
  const monthStemCode = stemMap[monthStemHangul];
  const monthBranchCode = branchMap[monthBranchHangul];
  const hourBranchCode = branchMap[hourBranchHangul];

  console.log("변환된 코드:", {
    dayStemCode,
    dayBranchCode,
    monthStemCode,
    monthBranchCode,
    hourBranchCode,
  });

  // 1. 천간 테스트
  console.log("\n1. getStemMeaning 테스트");
  const { data: stem } = await supabase
    .from("ref_heavenly_stems")
    .select("*")
    .eq("code", dayStemCode)
    .single();
  console.log("   일간(정):", stem?.metaphor_ko || "❌ 없음");

  // 2. 지지 테스트
  console.log("\n2. getBranchMeaning 테스트");
  const { data: branch } = await supabase
    .from("ref_earthly_branches")
    .select("*")
    .eq("code", dayBranchCode)
    .single();
  console.log("   일지(해):", branch?.metaphor_ko || "❌ 없음");

  // 3. 십성 규칙 테스트
  console.log("\n3. getTenGod 테스트 (일간 정 + 월간 계)");
  const { data: rule } = await supabase
    .from("ref_ten_god_rules")
    .select("*")
    .eq("day_master_stem", dayStemCode)
    .eq("target_stem", monthStemCode)
    .single();
  console.log("   규칙:", rule?.ten_god_code || "❌ 없음");

  if (rule) {
    const { data: god } = await supabase
      .from("ref_ten_gods")
      .select("*")
      .eq("code", rule.ten_god_code)
      .single();
    console.log("   십성 한글명:", god?.kor_name || "❌ 없음");
  }

  // 4. 12운성 규칙 테스트
  console.log("\n4. getTwelveStage 테스트 (일간 정 + 일지 해)");
  const { data: stageRule } = await supabase
    .from("ref_twelve_stage_rules")
    .select("*")
    .eq("day_master_stem", dayStemCode) // ← 수정!
    .eq("target_branch", dayBranchCode) // ← 수정!
    .single();
  console.log("   12운성 코드:", stageRule?.stage_code || "❌ 없음");

  if (stageRule) {
    const { data: stage } = await supabase
      .from("ref_twelve_stages")
      .select("*")
      .eq("code", stageRule.stage_code)
      .single();
    console.log("   12운성 한글명:", stage?.kor_name || "❌ 없음");
    console.log("   📖 해석:", stage?.meaning_ko || "❌ 없음");
  }
  // 5. 합충형해 테스트
  console.log("\n5. getRelation 테스트 (해 + 사)");
  const { data: relation } = await supabase
    .from("ref_relation_rules")
    .select("*")
    .or(
      `and(code_a.eq.${dayBranchCode},code_b.eq.${hourBranchCode}),and(code_a.eq.${hourBranchCode},code_b.eq.${dayBranchCode})`,
    )
    .maybeSingle();
  console.log("   관계:", relation?.relation_type || "❌ 없음");
  console.log("   의미:", relation?.meaning_ko || "");

  // 6. 신살 테스트
  console.log("\n6. findShinsal 테스트");
  const { data: shinsal } = await supabase
    .from("ref_shinsal")
    .select("*")
    .limit(3);
  console.log(
    "   신살 테이블 데이터:",
    shinsal?.length
      ? `${shinsal.length}개 있음 (예: ${shinsal[0]?.name_ko})`
      : "❌ 없음",
  );
}

test().catch(console.error);
