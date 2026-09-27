/** Stitch dashboard — prominent FREE sticker */
export default function StitchFreeSticker({
  className = "",
  active = false,
}: {
  className?: string;
  active?: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] shadow-sm transition-colors duration-200",
        active
          ? "border-primary bg-primary text-on-primary"
          : "border-primary/35 bg-accent-emerald-soft text-primary group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary",
        className,
      ].join(" ")}
    >
      Free
    </span>
  );
}

