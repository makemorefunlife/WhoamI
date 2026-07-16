"use client";

import { hubPanelClass, hubTouchBtn } from "@/components/relationship/hub/relationHubStyles";
import { useMessages } from "@/lib/i18n/LocaleProvider";

type Props = {
  canAnalyze: boolean;
  analyzeLabel?: string;
  onAnalyze: () => void;
  onAddFriend: () => void;
  /** True when there are zero friends — show only the centered empty-state card */
  emptyHub?: boolean;
};

export default function RelationHubActionButtons({
  canAnalyze,
  analyzeLabel,
  onAnalyze,
  onAddFriend,
  emptyHub = false,
}: Props) {
  const messages = useMessages();
  const resolvedAnalyzeLabel = analyzeLabel ?? messages.hub.analyzeCta;

  if (emptyHub) {
    return (
      <section
        className={`${hubPanelClass()} flex flex-col items-center px-6 py-10 text-center sm:py-12`}
        aria-label={messages.hub.emptyHubAria}
      >
        <p className="mb-6 max-w-xs text-sm leading-relaxed text-on-surface-variant">
          {messages.hub.emptyHubBody}
        </p>
        <button
          type="button"
          onClick={onAddFriend}
          className={`${hubTouchBtn(true)} !min-w-[14rem]`}
        >
          {messages.hub.addFirstFriendCta}
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
        {resolvedAnalyzeLabel}
      </button>
      <button
        type="button"
        onClick={onAddFriend}
        className={hubTouchBtn(false)}
      >
        {messages.hub.addFriendCta}
      </button>
      {!canAnalyze ? (
        <p className="rounded-xl border border-outline-variant/35 bg-surface-container-low/60 px-4 py-2.5 text-center text-sm text-on-surface-variant">
          {messages.hub.selectOrAddFriendHint}
        </p>
      ) : null}
    </section>
  );
}
