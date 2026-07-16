import { needsDecisionReview } from "@/lib/decision/types";
import type { DecisionEntry } from "@/lib/decision/types";
import { useMessages } from "@/lib/i18n/LocaleProvider";

type Props = {
  entry: DecisionEntry;
  className?: string;
};

export default function DecisionStatusDot({ entry, className = "" }: Props) {
  const messages = useMessages();
  const pending = needsDecisionReview(entry);
  return (
    <span
      className={`h-3 w-3 shrink-0 rounded-full shadow-sm ${
        pending
          ? "bg-amber-400 shadow-amber-400/40"
          : "bg-secondary shadow-secondary/35"
      } ${className}`}
      title={pending ? messages.decision.statusPending : messages.decision.statusDotReviewed}
      aria-hidden
    />
  );
}
