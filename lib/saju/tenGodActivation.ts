import type { SajuDataForIntegrated } from "@/lib/report/formatInnateAnalysisForIntegrated";
import { palaceWeightForName } from "@/lib/saju/palaceWeight";

export type TenGodActivationState = "active" | "dormant" | "background";

export type TenGodActivationRow = {
  name: string;
  count: number;
  state: TenGodActivationState;
  pillars: string[];
  note: string;
};

/**
 * 십신 작동성 간이 판단 — 있다/없다가 아니라 궁위·노출 빈도로 active/dormant 구분.
 * (통근·투출 전면 구현 전 휴리스틱)
 */
export function analyzeTenGodActivation(
  sajuJson: SajuDataForIntegrated,
): TenGodActivationRow[] {
  const byName = new Map<string, string[]>();

  for (const t of sajuJson.tenGods ?? []) {
    const name = t.godData?.kor_name ?? t.godCode ?? "";
    const pillar = t.pillar ?? "";
    if (!name) continue;
    const list = byName.get(name) ?? [];
    list.push(pillar);
    byName.set(name, list);
  }

  const rows: TenGodActivationRow[] = [];

  for (const [name, pillars] of byName.entries()) {
    const count = pillars.length;
    const maxPalaceWeight = Math.max(
      ...pillars.map((p) => palaceWeightForName(p)),
      0,
    );
    const onDayOrMonth = pillars.some((p) => p.startsWith("일") || p.startsWith("월"));

    let state: TenGodActivationState;
    let note: string;

    if (onDayOrMonth || count >= 2) {
      state = "active";
      note = onDayOrMonth
        ? "일·월 궁에 드러나 실제 성향·관계 패턴에 잘 나타나요."
        : "여러 기둥에 반복되어 생활 전반에 작동해요.";
    } else if (count === 1 && maxPalaceWeight <= 0.45) {
      state = "dormant";
      note = "배경에만 있어 특정 상황에서야 드러날 수 있어요.";
    } else {
      state = "background";
      note = "보조 신호로, 핵심 성향보다 맥락에 따라 달라져요.";
    }

    rows.push({ name, count, state, pillars, note });
  }

  return rows.sort((a, b) => {
    const order = { active: 0, background: 1, dormant: 2 };
    const d = order[a.state] - order[b.state];
    return d !== 0 ? d : b.count - a.count;
  });
}

export function formatTenGodActivationBlock(
  rows: TenGodActivationRow[],
): string {
  if (!rows.length) return "(십성 데이터 없음)";
  return rows
    .map(
      (r) =>
        `- ${r.name}(${r.count}) [${r.state}]: ${r.pillars.join(", ")} — ${r.note}`,
    )
    .join("\n");
}
