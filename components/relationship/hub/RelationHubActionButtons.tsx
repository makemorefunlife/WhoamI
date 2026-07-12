"use client";

import { hubPanelClass, hubTouchBtn } from "@/components/relationship/hub/relationHubStyles";

type Props = {
  canAnalyze: boolean;
  analyzeLabel?: string;
  onAnalyze: () => void;
  onAddFriend: () => void;
  /** 친구 0명 — 중앙 Empty State 카드만 노출 */
  emptyHub?: boolean;
};

export default function RelationHubActionButtons({
  canAnalyze,
  analyzeLabel = "관계 분석하기",
  onAnalyze,
  onAddFriend,
  emptyHub = false,
}: Props) {
  if (emptyHub) {
    return (
      <section
        className={`${hubPanelClass()} flex flex-col items-center px-6 py-10 text-center sm:py-12`}
        aria-label="첫 친구 추가"
      >
        <p className="mb-6 max-w-xs text-sm leading-relaxed text-on-surface-variant">
          관계 분석을 시작하려면 먼저 한 명의 친구를 등록해 주세요.
        </p>
        <button
          type="button"
          onClick={onAddFriend}
          className={`${hubTouchBtn(true)} !min-w-[14rem]`}
        >
          + 첫 친구 추가하기
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-3 py-2">
      <button
        type="button"
        disabled={!canAnalyze}
        onClick={onAnalyze}
        className={`${hubTouchBtn(true)} disabled:cursor-not-allowed disabled:opacity-45`}
      >
        {analyzeLabel}
      </button>
      <button
        type="button"
        onClick={onAddFriend}
        className={hubTouchBtn(false)}
      >
        친구 추가하기
      </button>
      {!canAnalyze ? (
        <p className="rounded-xl border border-outline-variant/35 bg-surface-container-low/60 px-4 py-2.5 text-center text-sm text-on-surface-variant">
          친구를 선택하거나 추가한 뒤 분석을 시작할 수 있어요.
        </p>
      ) : null}
    </section>
  );
}
