// app/api/saju/route.ts
import { NextResponse } from "next/server";
import { calculateSaju } from "@fullstackfamily/manseryeok";
import { createClient } from "@supabase/supabase-js";

console.log("🔥 route.ts 파일이 로드됨!");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// ============================================================
// 타입 정의
// ============================================================
type TenGodItem = {
  pillar: string;
  godData?: {
    kor_name: string;
  };
};

type HiddenStemItem = {
  stem_code: string;
};

type TwelveStageData = {
  kor_name: string;
  meaning_ko: string;
};

// ============================================================
// DB 조회 함수들
// ============================================================

// 천간(일간) 해석
async function getHeavenlyStemData(stemCode: string) {
  const { data } = await supabase
    .from("ref_heavenly_stems")
    .select("kor_name, metaphor_ko, strength_ko, weakness_ko, advice_ko")
    .eq("code", stemCode)
    .single();
  return data;
}

// 지지(일지) 해석
async function getEarthlyBranchData(branchCode: string) {
  const { data } = await supabase
    .from("ref_earthly_branches")
    .select("kor_name, meaning_ko, strength_ko, weakness_ko, advice_ko")
    .eq("code", branchCode)
    .single();
  return data;
}

// 지장간 해석
async function getHiddenStemsData(branchCode: string) {
  const { data } = await supabase
    .from("ref_hidden_stems")
    .select("stem_code, layer_type, meaning_ko, strength_ko, weakness_ko, advice_ko")
    .eq("branch_code", branchCode)
    .order("display_order", { ascending: true });
  return data || [];
}

// 십성 해석
async function getTenGodData(godCode: string) {
  const { data } = await supabase
    .from("ref_ten_gods")
    .select("kor_name, meaning_ko, strength_ko, weakness_ko, advice_ko, relationship_ko")
    .eq("code", godCode)
    .single();
  return data;
}

// 12운성 해석
async function getTwelveStageData(stageCode: string) {
  const { data } = await supabase
    .from("ref_twelve_stages")
    .select("kor_name, meaning_ko, strength_ko, weakness_ko, advice_ko, energy_level")
    .eq("code", stageCode)
    .single();
  return data;
}

// ============================================================
// 계산 함수들
// ============================================================

async function calculateTenGod(dayStem: string, targetStem: string): Promise<string> {
  const { data } = await supabase
    .from("ref_ten_god_rules")
    .select("ten_god_code")
    .eq("day_master_stem", dayStem)
    .eq("target_stem", targetStem)
    .single();
  return data?.ten_god_code || "bigyeon";
}

async function calculateTwelveStage(dayStem: string, targetBranch: string): Promise<string> {
  const { data } = await supabase
    .from("ref_twelve_stage_rules")
    .select("stage_code")
    .eq("day_master_stem", dayStem)
    .eq("target_branch", targetBranch)
    .single();
  return data?.stage_code || "byeong";
}

async function analyzeRelations(
  pillars: { name: string; branch: string }[],
): Promise<{ type: string; name: string; interpretation: string; priority: number }[]> {
  const results: { type: string; name: string; interpretation: string; priority: number }[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < pillars.length; i++) {
    for (let j = i + 1; j < pillars.length; j++) {
      const a = pillars[i].branch;
      const b = pillars[j].branch;
      const pairKey = [a, b].sort().join("-");
      if (processed.has(pairKey)) continue;
      processed.add(pairKey);

      let { data: combine } = await supabase
        .from("ref_relation_rules")
        .select("meaning_ko, priority_score")
        .eq("relation_type", "branch_six_combine")
        .eq("code_a", a)
        .eq("code_b", b)
        .single();

      if (combine) {
        results.push({ type: "육합", name: `${a}${b}합`, interpretation: combine.meaning_ko, priority: combine.priority_score });
        continue;
      }

      let { data: clash } = await supabase
        .from("ref_relation_rules")
        .select("meaning_ko, priority_score")
        .eq("relation_type", "branch_clash")
        .eq("code_a", a)
        .eq("code_b", b)
        .single();

      if (clash) {
        results.push({ type: "충", name: `${a}${b}충`, interpretation: clash.meaning_ko, priority: clash.priority_score });
        continue;
      }

      let { data: punishment } = await supabase
        .from("ref_relation_rules")
        .select("meaning_ko, priority_score")
        .eq("relation_type", "branch_punishment")
        .eq("code_a", a)
        .eq("code_b", b)
        .single();

      if (punishment) {
        results.push({ type: "형", name: `${a}${b}형`, interpretation: punishment.meaning_ko, priority: punishment.priority_score });
        continue;
      }

      let { data: breach } = await supabase
        .from("ref_relation_rules")
        .select("meaning_ko, priority_score")
        .eq("relation_type", "branch_break")
        .eq("code_a", a)
        .eq("code_b", b)
        .single();

      if (breach) {
        results.push({ type: "파", name: `${a}${b}파`, interpretation: breach.meaning_ko, priority: breach.priority_score });
        continue;
      }

      let { data: harm } = await supabase
        .from("ref_relation_rules")
        .select("meaning_ko, priority_score")
        .eq("relation_type", "branch_harm")
        .eq("code_a", a)
        .eq("code_b", b)
        .single();

      if (harm) {
        results.push({ type: "해", name: `${a}${b}해`, interpretation: harm.meaning_ko, priority: harm.priority_score });
      }
    }
  }

  return results.sort((a, b) => b.priority - a.priority);
}

// ============================================================
// 메인 POST 함수 (수정 완료 버전)
// ============================================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { birthDate, birthTime, birthPlace, gender, reportId } = body;

    if (!birthDate || !birthTime) {
      return NextResponse.json(
        { error: "birthDate 또는 birthTime이 없습니다." },
        { status: 400 },
      );
    }

    const [year, month, day] = birthDate.split("-").map(Number);
    const [hour, minute] = birthTime.split(":").map(Number);

    const saju: any = calculateSaju(year, month, day, hour, minute);

    // 헬퍼 함수
    const getStem = (pillar: any) => pillar?.charAt(0) || "";
    const getBranch = (pillar: any) => pillar?.charAt(1) || "";

    // 🔥 한글 → 영문 코드 매핑 (이게 핵심!)
    const stemMap: Record<string, string> = {
      '갑': 'gap', '을': 'eul', '병': 'byeong', '정': 'jeong', '무': 'mu',
      '기': 'gi', '경': 'gyeong', '신': 'sin', '임': 'im', '계': 'gye'
    };

    const branchMap: Record<string, string> = {
      '자': 'ja', '축': 'chuk', '인': 'in', '묘': 'myo', '진': 'jin', '사': 'sa',
      '오': 'o', '미': 'mi', '신': 'sin', '유': 'yu', '술': 'sul', '해': 'hae'
    };

    // 원본 값
    const rawDayStem = getStem(saju.dayPillar);
    const rawDayBranch = getBranch(saju.dayPillar);

    // DB 조회용 코드로 변환
    const dayStem = stemMap[rawDayStem] || rawDayStem;
    const dayBranch = branchMap[rawDayBranch] || rawDayBranch;

    const [dayStemData, dayBranchData, hiddenStemsData, twelveStageData] = await Promise.all([
      getHeavenlyStemData(dayStem),
      getEarthlyBranchData(dayBranch),
      getHiddenStemsData(dayBranch),
      calculateTwelveStage(dayStem, dayBranch).then(getTwelveStageData),
    ]);

    const pillars = [
      { name: "년주", stem: getStem(saju.yearPillar) },
      { name: "월주", stem: getStem(saju.monthPillar) },
      { name: "일주", stem: dayStem },
      { name: "시주", stem: getStem(saju.hourPillar) },
    ];

    const tenGods = await Promise.all(
      pillars.map(async (p) => {
        const godCode = await calculateTenGod(dayStem, p.stem);
        const godData = await getTenGodData(godCode);
        return { pillar: p.name, godCode, godData };
      }),
    );

    const branches = [
      { name: "년지", branch: getBranch(saju.yearPillar) },
      { name: "월지", branch: getBranch(saju.monthPillar) },
      { name: "일지", branch: dayBranch },
      { name: "시지", branch: getBranch(saju.hourPillar) },
    ];

    const relations = await analyzeRelations(branches);

    if (reportId) {
      await supabase.from("saju_charts").insert({
        report_id: reportId,
        year_pillar: saju.yearPillar,
        month_pillar: saju.monthPillar,
        day_pillar: saju.dayPillar,
        hour_pillar: saju.hourPillar,
      });
    }

    return NextResponse.json({
      success: true,
      saju: {
        yearPillar: saju.yearPillar,
        monthPillar: saju.monthPillar,
        dayPillar: saju.dayPillar,
        hourPillar: saju.hourPillar,
      },
      dayStemData,
      dayBranchData,
      hiddenStemsData,
      tenGods,
      twelveStageData,
      relations: relations.map((r) => ({
        type: r.type,
        interpretation: r.interpretation,
      })),
    });
  } catch (error) {
    console.error("API 에러:", error);
    return NextResponse.json(
      { error: "사주 계산 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
