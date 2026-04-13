// services/sajuService.js
import { createClient } from "@supabase/supabase-js";
import { calculateSaju } from "@fullstackfamily/manseryeok";

// Supabase 클라이언트 설정 (환경변수 사용)
const supabaseUrl = "https://afhfvyuozmgctbcmiyop.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmaGZ2eXVvem1nY3RiY21peW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NDQwNTIsImV4cCI6MjA4OTIyMDA1Mn0.ya-BQTb69cVqzdCS7A6nCrvLBBsdOxkX0-QHyo5W6zk";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 천간/지지 한글 → 영문 코드 매핑
const stemMap = {
  甲: "gap",
  乙: "eul",
  丙: "byeong",
  丁: "jeong",
  戊: "mu",
  己: "gi",
  庚: "gyeong",
  辛: "sin",
  壬: "im",
  癸: "gye",
};

const branchMap = {
  子: "ja",
  丑: "chuk",
  寅: "in",
  卯: "myo",
  辰: "jin",
  巳: "sa",
  午: "o",
  未: "mi",
  申: "sin",
  酉: "yu",
  戌: "sul",
  亥: "hae",
};

// 1. 만세력으로 사주 계산
export function calculateSajuFromBirthday(year, month, day, hour, minute) {
  const saju = calculateSaju(year, month, day, hour, minute);
  return {
    yearPillar: saju.yearPillar,
    monthPillar: saju.monthPillar,
    dayPillar: saju.dayPillar,
    hourPillar: saju.hourPillar,
    dayStem: saju.dayPillar[0],
    dayBranch: saju.dayPillar[1],
    isTimeCorrected: saju.isTimeCorrected,
    correctedTime: saju.correctedTime,
  };
}

// 2. 천간 해석 조회
async function getStemMeaning(stemCode) {
  const { data } = await supabase
    .from("ref_heavenly_stems")
    .select("*")
    .eq("code", stemCode)
    .single();
  return data;
}

// 3. 지지 해석 조회
async function getBranchMeaning(branchCode) {
  const { data } = await supabase
    .from("ref_earthly_branches")
    .select("*")
    .eq("code", branchCode)
    .single();
  return data;
}

// 4. 십성 조회
async function getTenGod(dayStemCode, targetStemCode) {
  const { data: rule } = await supabase
    .from("ref_ten_god_rules")
    .select("ten_god_code")
    .eq("day_master_stem", dayStemCode)
    .eq("target_stem", targetStemCode)
    .single();

  if (!rule) return null;

  const { data: god } = await supabase
    .from("ref_ten_gods")
    .select("*")
    .eq("code", rule.ten_god_code)
    .single();

  return god;
}

// 5. 지장간 조회
async function getHiddenStems(branchCode) {
  const { data } = await supabase
    .from("ref_hidden_stems")
    .select("stem_code, layer_type")
    .eq("branch_code", branchCode)
    .order("display_order");
  return data;
}

// 6. 12운성 조회
async function getTwelveStage(dayStemCode, dayBranchCode) {
  const { data: rule } = await supabase
    .from("ref_twelve_stage_rules")
    .select("stage_code")
    .eq("stem_code", dayStemCode)
    .eq("branch_code", dayBranchCode)
    .single();

  if (!rule) return null;

  const { data: stage } = await supabase
    .from("ref_twelve_stages")
    .select("*")
    .eq("code", rule.stage_code)
    .single();

  return stage;
}

// 7. 합충형해파 조회
async function getRelation(codeA, codeB) {
  const { data } = await supabase
    .from("ref_relation_rules")
    .select("*")
    .or(
      `and(code_a.eq.${codeA},code_b.eq.${codeB}),and(code_a.eq.${codeB},code_b.eq.${codeA})`,
    )
    .maybeSingle();
  return data;
}

// 8. 신살 판별 (간단 버전)
async function findShinsal(
  yearBranch,
  monthBranch,
  dayBranch,
  dayStem,
  monthStem,
) {
  const { data: allShinsal } = await supabase
    .from("ref_shinsal")
    .select("*")
    .order("display_order");

  const active = [];

  for (const s of allShinsal || []) {
    let isActive = false;
    const calcType = s.calculation_type;

    if (calcType === "three_combination_end") {
      const tripleEnds = {
        寅午戌: "戌",
        申子辰: "辰",
        亥卯未: "未",
        巳酉丑: "丑",
      };
      for (const [triple, target] of Object.entries(tripleEnds)) {
        if (triple.includes(yearBranch) && dayBranch === target)
          isActive = true;
        if (triple.includes(yearBranch) && monthBranch === target)
          isActive = true;
      }
    }

    if (isActive) active.push(s);
  }

  return active;
}

// 9. 메인 함수
export async function getFullSajuAnalysis(year, month, day, hour, minute) {
  const saju = calculateSajuFromBirthday(year, month, day, hour, minute);

  const yearPillar = saju.yearPillar;
  const monthPillar = saju.monthPillar;
  const dayPillar = saju.dayPillar;
  const hourPillar = saju.hourPillar;

  if (!yearPillar || yearPillar.length < 2) throw new Error("년주 계산 오류");
  if (!monthPillar || monthPillar.length < 2) throw new Error("월주 계산 오류");
  if (!dayPillar || dayPillar.length < 2) throw new Error("일주 계산 오류");
  if (!hourPillar || hourPillar.length < 2) throw new Error("시주 계산 오류");

  const dayStemCode = stemMap[dayPillar[0]];
  const dayBranchCode = branchMap[dayPillar[1]];
  const yearStemCode = stemMap[yearPillar[0]];
  const yearBranchCode = branchMap[yearPillar[1]];
  const monthStemCode = stemMap[monthPillar[0]];
  const monthBranchCode = branchMap[monthPillar[1]];
  const hourStemCode = stemMap[hourPillar[0]];
  const hourBranchCode = branchMap[hourPillar[1]];

  const [
    dayStemMeaning,
    dayBranchMeaning,
    yearTenGod,
    monthTenGod,
    hourTenGod,
    hiddenStemsYear,
    hiddenStemsMonth,
    hiddenStemsDay,
    hiddenStemsHour,
    twelveStage,
    relationYearMonth,
    relationYearDay,
    relationMonthDay,
    relationDayHour,
    shinsal,
  ] = await Promise.all([
    getStemMeaning(dayStemCode),
    getBranchMeaning(dayBranchCode),
    getTenGod(dayStemCode, yearStemCode),
    getTenGod(dayStemCode, monthStemCode),
    getTenGod(dayStemCode, hourStemCode),
    getHiddenStems(yearBranchCode),
    getHiddenStems(monthBranchCode),
    getHiddenStems(dayBranchCode),
    getHiddenStems(hourBranchCode),
    getTwelveStage(dayStemCode, dayBranchCode),
    getRelation(yearBranchCode, monthBranchCode),
    getRelation(yearBranchCode, dayBranchCode),
    getRelation(monthBranchCode, dayBranchCode),
    getRelation(dayBranchCode, hourBranchCode),
    findShinsal(
      yearBranchCode,
      monthBranchCode,
      dayBranchCode,
      dayStemCode,
      monthStemCode,
    ),
  ]);

  return {
    basic: {
      birthday: `${year}.${month}.${day} ${hour}:${minute}`,
      saju: `${saju.yearPillar} ${saju.monthPillar} ${saju.dayPillar} ${saju.hourPillar}`,
      dayStem: dayStemMeaning,
      dayBranch: dayBranchMeaning,
      isTimeCorrected: saju.isTimeCorrected,
      correctedTime: saju.correctedTime,
    },
    tenGods: { year: yearTenGod, month: monthTenGod, hour: hourTenGod },
    hiddenStems: {
      year: hiddenStemsYear,
      month: hiddenStemsMonth,
      day: hiddenStemsDay,
      hour: hiddenStemsHour,
    },
    twelveStage,
    relations: {
      yearMonth: relationYearMonth,
      yearDay: relationYearDay,
      monthDay: relationMonthDay,
      dayHour: relationDayHour,
    },
    shinsal,
  };
}
