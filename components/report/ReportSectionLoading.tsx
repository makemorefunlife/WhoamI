/** 리포트 섹션 단위 로딩 (전체 화면 블로킹 없음) */
export default function ReportSectionLoading({
  label = "불러오는 중…",
}: {
  label?: string;
}) {
  return (
    <div
      className="flex min-h-[160px] flex-col items-center justify-center gap-3 py-10"
      aria-live="polite"
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-[#6bb5ff]/30 border-t-[#6bb5ff]"
        aria-hidden
      />
      <p className="text-center text-sm text-[var(--space-text-muted)]">{label}</p>
    </div>
  );
}
