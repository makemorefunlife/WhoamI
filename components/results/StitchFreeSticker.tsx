/** Stitch dashboard — prominent FREE sticker */
export default function StitchFreeSticker({
  className = "",
}: {
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md border border-secondary/40 bg-secondary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-primary shadow-sm ${className}`}
    >
      Free
    </span>
  );
}
