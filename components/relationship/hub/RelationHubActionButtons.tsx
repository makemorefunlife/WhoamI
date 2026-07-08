"use client";

import { hubTouchBtn } from "@/components/relationship/hub/relationHubStyles";

type Props = {
  canAnalyze: boolean;
  analyzeLabel?: string;
  onAnalyze: () => void;
  onAddFriend: () => void;
};

export default function RelationHubActionButtons({
  canAnalyze,
  analyzeLabel = "관계 분석하기",
  onAnalyze,
  onAddFriend,
}: Props) {
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
        <p className="rounded-xl border border-secondary/25 bg-secondary/10 px-4 py-2.5 text-center text-sm font-medium text-secondary">
          친구를 선택하거나 추가한 뒤 분석을 시작할 수 있어요.
        </p>
      ) : null}
    </section>
  );
}
