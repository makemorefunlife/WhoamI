import FreeAnalysisCardDeck from "@/components/report/FreeAnalysisCardDeck";

export default function FreeResultAccordions({
  bodies,
  displayName,
}: {
  bodies: readonly [string, string, string, string];
  displayName: string;
}) {
  return (
    <div className="space-y-4">
      <p className="text-center text-sm leading-relaxed text-[var(--space-text)] sm:text-[0.9375rem]">
        설문으로 알아본 현재 {displayName}님의 모습이에요
      </p>
      <FreeAnalysisCardDeck paragraphs={Array.from(bodies)} />
    </div>
  );
}
