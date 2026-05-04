export default function ReportViewTabSwitcher({
  resultViewTab,
  onSelectBasic,
  onSelectPremium,
}: {
  resultViewTab: "basic" | "premium";
  onSelectBasic: () => void;
  onSelectPremium: () => void;
}) {
  return (
    <div
      className="mx-auto inline-flex w-full max-w-md rounded-full border border-white/15 bg-[#0d121f] p-0.5"
      role="tablist"
      aria-label="분석 보기"
    >
      <button
        type="button"
        role="tab"
        aria-selected={resultViewTab === "basic"}
        onClick={onSelectBasic}
        className={[
          "min-h-[40px] flex-1 rounded-full px-4 py-2 text-xs font-semibold transition",
          resultViewTab === "basic"
            ? "bg-gradient-to-r from-[#F0D797] via-[#E3C47B] to-[#D6B46A] text-[#1b2230] ring-1 ring-[#F0D797]/35 shadow-[0_10px_24px_rgba(214,180,106,0.34)]"
            : "text-[var(--space-text-muted)] hover:text-[var(--space-text)]",
        ].join(" ")}
      >
        기본 분석
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={resultViewTab === "premium"}
        onClick={onSelectPremium}
        className={[
          "min-h-[40px] flex-1 rounded-full px-4 py-2 text-xs font-semibold transition",
          resultViewTab === "premium"
            ? "bg-gradient-to-r from-[#F3DB9E] via-[#E7C984] to-[#D6B46A] text-[#1b2230] ring-1 ring-[#F3DB9E]/35 shadow-[0_10px_24px_rgba(214,180,106,0.38)]"
            : "text-[var(--space-text-muted)] hover:text-[var(--space-text)]",
        ].join(" ")}
      >
        심화 분석
      </button>
    </div>
  );
}
