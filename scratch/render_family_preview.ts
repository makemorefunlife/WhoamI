import fs from "node:fs";
import path from "node:path";
import { calculateSajuBundle } from "../lib/v2/saju/calculateSajuBundle";
import { toV1SajuApiPayload } from "../lib/saju/toApiPayload";
import { buildFamilyRuleContext } from "../lib/relationship/familyParent/buildFamilyRuleContext";
import { buildFamilyOverviewCardNarratives } from "../lib/relationship/familyParent/familyOverviewNarrative";

function createMockSaju(dateStr: string, timeStr: string) {
  const bundle = calculateSajuBundle({
    birthDate: dateStr,
    birthTime: timeStr,
  });
  return toV1SajuApiPayload(bundle);
}

const sajuParent = createMockSaju("1980-04-12", "14:20");
const sajuChild = createMockSaju("2010-09-25", "09:10");

const ctx = buildFamilyRuleContext({
  nicknameA: "김민정",
  nicknameB: "이지은",
  roles: { roleA: "mother", roleB: "child" },
  sajuJsonA: sajuParent,
  sajuJsonB: sajuChild,
  locale: "ko-KR",
});

const cards = buildFamilyOverviewCardNarratives(ctx);

const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Family Premium Overview 3-Card Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
    body { font-family: 'Pretendard', sans-serif; background-color: #fcfbf8; color: #1c1917; }
  </style>
</head>
<body class="p-6 md:p-12 max-w-5xl mx-auto">
  <header class="mb-10 text-center">
    <span class="text-xs uppercase tracking-widest text-amber-700 font-semibold bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
      Child DNA Playbook · 패밀리 스냅샷
    </span>
    <h1 class="text-3xl font-bold mt-4 text-stone-900">부모-자녀 3대 핵심 관계 지표</h1>
    <p class="text-stone-500 mt-2 text-sm">엄마(김민정) ↔ 자녀(이지은) 실시간 분석 결과</p>
  </header>

  <div class="grid gap-6 md:grid-cols-3">
    <!-- Card 1: 정서적 유대 -->
    <div class="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-2 font-semibold text-sm text-stone-800">
            <span>🔥</span> ① 정서적 유대
          </span>
          <span class="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
            ${ctx.masterScores.bond}%
          </span>
        </div>

        <div class="my-6 text-center">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-amber-400 text-2xl font-bold text-stone-800 bg-amber-50/50">
            ${ctx.masterScores.bond}
          </div>
          <p class="mt-3 text-lg font-bold text-stone-900">${cards.bond.gradeLabel}</p>
          <p class="mt-1 text-xs text-stone-500 font-medium">${cards.bond.oneLiner}</p>
        </div>
      </div>

      <details class="mt-4 pt-4 border-t border-stone-100 group">
        <summary class="text-xs text-amber-800 font-semibold cursor-pointer hover:underline flex items-center justify-between">
          <span>자세히 보기 (이 점수는 왜 이렇게 나왔나요?)</span>
          <span class="group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div class="mt-3 space-y-3 text-xs leading-relaxed text-stone-600">
          <div>
            <p class="font-bold text-stone-800 uppercase tracking-wider text-[10px] text-amber-900">이 점수는 무엇인가요?</p>
            <p class="mt-1">${cards.bond.measures}</p>
          </div>
          <div>
            <p class="font-bold text-stone-800 uppercase tracking-wider text-[10px] text-amber-900">둘이 함께할 때는</p>
            <p class="mt-1 bg-stone-50 p-2.5 rounded-lg border border-stone-100 font-medium text-stone-700">${cards.bond.scene}</p>
          </div>
          <div>
            <p class="font-bold text-stone-800 uppercase tracking-wider text-[10px] text-amber-900">왜 이렇게 나왔나요?</p>
            <p class="mt-1 text-stone-700">${cards.bond.why}</p>
          </div>
        </div>
      </details>
    </div>

    <!-- Card 2: 성장 시너지 -->
    <div class="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-2 font-semibold text-sm text-stone-800">
            <span>🧩</span> ② 성장 시너지
          </span>
          <span class="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            ${ctx.masterScores.synergy}%
          </span>
        </div>

        <div class="my-6 text-center">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-emerald-400 text-2xl font-bold text-stone-800 bg-emerald-50/50">
            ${ctx.masterScores.synergy}
          </div>
          <p class="mt-3 text-lg font-bold text-stone-900">${cards.synergy.gradeLabel}</p>
          <p class="mt-1 text-xs text-stone-500 font-medium">${cards.synergy.oneLiner}</p>
        </div>
      </div>

      <details class="mt-4 pt-4 border-t border-stone-100 group">
        <summary class="text-xs text-emerald-800 font-semibold cursor-pointer hover:underline flex items-center justify-between">
          <span>자세히 보기 (이 점수는 왜 이렇게 나왔나요?)</span>
          <span class="group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div class="mt-3 space-y-3 text-xs leading-relaxed text-stone-600">
          <div>
            <p class="font-bold text-stone-800 uppercase tracking-wider text-[10px] text-emerald-900">이 점수는 무엇인가요?</p>
            <p class="mt-1">${cards.synergy.measures}</p>
          </div>
          <div>
            <p class="font-bold text-stone-800 uppercase tracking-wider text-[10px] text-emerald-900">둘이 함께할 때는</p>
            <p class="mt-1 bg-stone-50 p-2.5 rounded-lg border border-stone-100 font-medium text-stone-700">${cards.synergy.scene}</p>
          </div>
          <div>
            <p class="font-bold text-stone-800 uppercase tracking-wider text-[10px] text-emerald-900">왜 이렇게 나왔나요?</p>
            <p class="mt-1 text-stone-700">${cards.synergy.why}</p>
          </div>
        </div>
      </details>
    </div>

    <!-- Card 3: 훈육 마찰 -->
    <div class="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-2 font-semibold text-sm text-stone-800">
            <span>⚡</span> ③ 훈육 마찰
          </span>
          <span class="text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
            ${ctx.masterScores.risk}% (낮을수록 안전)
          </span>
        </div>

        <div class="my-6 text-center">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-rose-400 text-2xl font-bold text-stone-800 bg-rose-50/50">
            ${ctx.masterScores.risk}
          </div>
          <p class="mt-3 text-lg font-bold text-stone-900">${cards.risk.gradeLabel}</p>
          <p class="mt-1 text-xs text-stone-500 font-medium">${cards.risk.oneLiner}</p>
        </div>
      </div>

      <details class="mt-4 pt-4 border-t border-stone-100 group" open>
        <summary class="text-xs text-rose-800 font-semibold cursor-pointer hover:underline flex items-center justify-between">
          <span>자세히 보기 (이 점수는 왜 이렇게 나왔나요?)</span>
          <span class="group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div class="mt-3 space-y-3 text-xs leading-relaxed text-stone-600">
          <div>
            <p class="font-bold text-stone-800 uppercase tracking-wider text-[10px] text-rose-900">이 점수는 무엇인가요?</p>
            <p class="mt-1">${cards.risk.measures}</p>
          </div>
          <div>
            <p class="font-bold text-stone-800 uppercase tracking-wider text-[10px] text-rose-900">둘이 함께할 때는</p>
            <p class="mt-1 bg-stone-50 p-2.5 rounded-lg border border-stone-100 font-medium text-stone-700">${cards.risk.scene}</p>
          </div>
          <div>
            <p class="font-bold text-stone-800 uppercase tracking-wider text-[10px] text-rose-900">왜 이렇게 나왔나요?</p>
            <p class="mt-1 text-stone-700">${cards.risk.why}</p>
          </div>
        </div>
      </details>
    </div>
  </div>
</body>
</html>
`;

const outputPath = path.join(process.cwd(), "scratch", "family_3card_preview.html");
fs.writeFileSync(outputPath, htmlContent, "utf-8");
console.log(`Generated HTML Preview: ${outputPath}`);
