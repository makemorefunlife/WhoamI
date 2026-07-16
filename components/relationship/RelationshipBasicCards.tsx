"use client";

import { MessageCircle, Sparkles, Zap, Battery } from "lucide-react";
import type { RelationshipAxisKey } from "@/lib/relationship/normalizeRelationshipPerspectives";
import {
  resolveAxisPartnerNickname,
  resolveAxisViewerNickname,
} from "@/lib/relationship/viewerFirstDisplay";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/** 신형 API 축 블록 */
export type AxisBlockV2 = {
  my_nickname?: string;
  partner_nickname?: string;
  my_line: string;
  partner_line: string;
  insights: string[];
  actions: string[];
};

/** 구형 (하위 호환) */
export type AxisBlockLegacy = {
  me: string;
  partner: string;
  insight: string;
};

export type AxisBlock = AxisBlockV2 | AxisBlockLegacy;

export type RelationshipPerspective = Partial<{
  emotional_sensitivity: AxisBlock;
  communication_style: AxisBlock;
  conflict_response: AxisBlock;
  energy_pattern: AxisBlock;
}>;

const AXES: {
  key: keyof Required<RelationshipPerspective>;
  Icon: typeof MessageCircle;
}[] = [
  { key: "emotional_sensitivity", Icon: MessageCircle },
  { key: "communication_style", Icon: Sparkles },
  { key: "conflict_response", Icon: Zap },
  { key: "energy_pattern", Icon: Battery },
];

function isAxisV2(block: AxisBlock | undefined): block is AxisBlockV2 {
  if (!block || typeof block !== "object") return false;
  return (
    "my_line" in block &&
    typeof (block as AxisBlockV2).my_line === "string" &&
    "partner_line" in block &&
    Array.isArray((block as AxisBlockV2).insights) &&
    Array.isArray((block as AxisBlockV2).actions)
  );
}

const LEGACY_INSIGHT_SECOND: Record<RelationshipAxisKey, string> = {
  emotional_sensitivity:
    "감정이 겉으로 드러나는 속도가 다르면 ‘무심하다’로 읽히기 쉬워.",
  communication_style:
    "말의 길이·속도 기대가 다르면 한쪽만 말이 많다고 느껴질 수 있어.",
  conflict_response:
    "갈등 직후에 붙잡고 싶은 쪽과 잠깐 떨어지고 싶은 쪽이 갈리면 더 팽팽해질 수 있어.",
  energy_pattern:
    "충전이 혼자서 되는지 같이 있을 때 되는지 다르면 약속 길이부터 어긋나기 쉬워.",
};

const LEGACY_ACTIONS: Record<RelationshipAxisKey, [string, string]> = {
  emotional_sensitivity: [
    "오늘은 ‘지금 기분 한 단어로만’ 말해 달라고 부탁해 봐.",
    "카톡은 짧게 두 번 나눠 보내 봐.",
  ],
  communication_style: [
    "상대가 말할 때 3초만 비우고 답해 봐.",
    "긴 얘기 전에 ‘핵심만 말할게’ 한마디만 걸어 봐.",
  ],
  conflict_response: [
    "말이 세지면 ‘10분만 혼자 정리할게’라고 말해 봐.",
    "진정되면 ‘이거 한 줄로만 정리해볼까?’라고 먼저 꺼내 봐.",
  ],
  energy_pattern: [
    "오늘 만남은 시간만 정하고 헤어질 때 각자 쉬기로 해 봐.",
    "다음 주 약속은 ‘가볍게’인지 ‘길게’인지 미리 한마디만 맞춰 봐.",
  ],
};

function linesFromLegacy(
  block: AxisBlockLegacy,
  myNick: string,
  partnerNick: string,
  axisKey: RelationshipAxisKey,
) {
  const insight = block.insight.replace(/^💡\s*/, "").trim();
  const [a1, a2] = LEGACY_ACTIONS[axisKey];
  return {
    my_nickname: myNick,
    partner_nickname: partnerNick,
    my_line: block.me.trim(),
    partner_line: block.partner.trim(),
    insights: insight
      ? [insight, LEGACY_INSIGHT_SECOND[axisKey]]
      : [
          "패턴이 다르면 오해가 생기기 쉬워.",
          "한 박자 쉬었다가 짧게만 말해 봐.",
        ],
    actions: [a1, a2],
  };
}

/** 닉네임 라벨 뒤에 오는 본문에서 ‘나는/상대는’ 중복 제거 */
function stripRolePreface(line: string): string {
  return line
    .replace(/^(나는|나도|내가|저는)\s+/i, "")
    .replace(/^(상대방은|상대는|상대가|그쪽은)\s+/i, "")
    .trim();
}

export default function RelationshipBasicCards({
  perspective,
  partnerName,
  viewerName,
  emptyMessage,
}: {
  perspective: RelationshipPerspective | null;
  /** 상대 닉네임 (detail API, 구형 데이터 폴백용) */
  partnerName: string;
  /** 보는 사람(나) 닉네임 — 구형 데이터 폴백용 */
  viewerName?: string;
  /** false면 빈 상태 문구를 숨김 */
  emptyMessage?: string | false;
}) {
  const { messages } = useLocale();
  const resolvedEmptyMessage = emptyMessage ?? messages.report.basicAnalysisEmpty;
  const myDisplay = (viewerName ?? "").trim() || messages.report.meFallbackLabel;
  const partnerDisplay = partnerName.trim() || messages.report.partnerFallbackLabel;

  if (!perspective || Object.keys(perspective).length === 0) {
    if (emptyMessage === false) return null;
    return (
      <p className="text-center text-sm text-on-surface-variant">
        {resolvedEmptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {AXES.map(({ key, Icon }) => {
        const label = messages.report.axisLabels[key];
        const raw = perspective[key];
        if (!raw) return null;

        const v2 = isAxisV2(raw)
          ? raw
          : linesFromLegacy(
              raw as AxisBlockLegacy,
              myDisplay,
              partnerDisplay,
              key,
            );

        const myNick = resolveAxisViewerNickname(v2.my_nickname, myDisplay);
        const partnerNick = resolveAxisPartnerNickname(
          v2.partner_nickname,
          partnerDisplay,
        );
        const insights = (v2.insights ?? []).filter(Boolean).slice(0, 2);
        const actions = (v2.actions ?? []).filter(Boolean).slice(0, 2);
        const myLineDisplay = stripRolePreface(v2.my_line?.trim() ?? "");
        const partnerLineDisplay = stripRolePreface(
          v2.partner_line?.trim() ?? "",
        );

        return (
          <article
            key={key}
            className="overflow-hidden rounded-[20px] border border-outline-variant/35 bg-surface-container-low/80 p-4 shadow-[0_12px_32px_rgba(26,51,40,0.08)] sm:p-5"
          >
            <div className="mb-3 flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Icon
                  className="h-[18px] w-[18px] text-secondary"
                  strokeWidth={1.75}
                />
                {label}
              </div>
            </div>

            <div className="space-y-3.5 text-[15px] leading-relaxed text-on-surface">
              <p>
                <span className="font-semibold text-secondary">
                  {myNick}:
                </span>{" "}
                {myLineDisplay}
              </p>
              <p>
                <span className="font-semibold text-accent-rose">
                  {partnerNick}:
                </span>{" "}
                {partnerLineDisplay}
              </p>

              <div className="space-y-2 rounded-xl border border-secondary/30 bg-secondary/10 px-3.5 py-3">
                <p className="text-[13px] font-semibold text-secondary">
                  {messages.report.axisDifferenceHeading}
                </p>
                <ul className="list-inside list-disc space-y-1.5 text-[14px] leading-relaxed text-on-surface-variant">
                  {insights.map((line, i) => (
                    <li key={i} className="[text-wrap:pretty]">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2 rounded-xl border border-accent-rose/30 bg-accent-rose-soft/55 px-3.5 py-3">
                <p className="text-[13px] font-semibold text-primary">
                  {messages.report.axisActionHeading}
                </p>
                <ul className="list-inside list-disc space-y-1.5 text-[14px] leading-relaxed text-on-surface-variant">
                  {actions.map((line, i) => (
                    <li key={i} className="[text-wrap:pretty]">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
