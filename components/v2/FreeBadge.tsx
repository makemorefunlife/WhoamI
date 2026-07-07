/** 무료 Lite 분석 버튼용 뱃지 */
export default function FreeBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border border-[#67B7FF]/35 bg-[#67B7FF]/12 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#8ecfff] ${className}`}
    >
      무료
    </span>
  );
}
