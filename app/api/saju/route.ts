// app/api/saju/route.ts
import { NextResponse } from "next/server";
import { calculateSaju } from "@fullstackfamily/manseryeok";
import { createClient } from "@supabase/supabase-js";
import { branchMap, getBranch, getStem, stemMap } from "@/lib/saju/mapping";
import {
  calculateTenGod,
  calculateTwelveStage,
  getEarthlyBranchData,
  getHeavenlyStemData,
  getHiddenStemsData,
  getTenGodData,
  getTwelveStageData,
} from "@/lib/saju/repository";

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

type SajuResult = {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
};

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

      const { data: combine } = await supabase
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

      const { data: clash } = await supabase
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

      const { data: punishment } = await supabase
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

      const { data: breach } = await supabase
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

      const { data: harm } = await supabase
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

    const saju = calculateSaju(year, month, day, hour, minute) as SajuResult;

    // 원본 값
    const rawDayStem = getStem(saju.dayPillar);
    const rawDayBranch = getBranch(saju.dayPillar);

    // DB 조회용 코드로 변환
    const dayStem = stemMap[rawDayStem] || rawDayStem;
    const dayBranch = branchMap[rawDayBranch] || rawDayBranch;

    const [dayStemData, dayBranchData, hiddenStemsData, twelveStageData] = await Promise.all([
      getHeavenlyStemData(supabase, dayStem),
      getEarthlyBranchData(supabase, dayBranch),
      getHiddenStemsData(supabase, dayBranch),
      calculateTwelveStage(supabase, dayStem, dayBranch).then((stageCode) =>
        getTwelveStageData(supabase, stageCode),
      ),
    ]);

    const pillars = [
      { name: "년주", stem: getStem(saju.yearPillar) },
      { name: "월주", stem: getStem(saju.monthPillar) },
      { name: "일주", stem: dayStem },
      { name: "시주", stem: getStem(saju.hourPillar) },
    ];

    const tenGods = await Promise.all(
      pillars.map(async (p) => {
        const godCode = await calculateTenGod(supabase, dayStem, p.stem);
        const godData = await getTenGodData(supabase, godCode);
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
