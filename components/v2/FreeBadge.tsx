/** 무료 Lite 분석 버튼용 뱃지 */
export default function FreeBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border border-accent-emerald/30 bg-accent-emerald-soft px-1.5 py-0.5 text-[10px] font-semibold leading-none text-accent-emerald ${className}`}
    >
      무료
    </span>
  );
}
