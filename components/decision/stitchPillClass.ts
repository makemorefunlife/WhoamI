export function stitchPillClass(active: boolean) {
  return active
    ? "shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary shadow-sm transition"
    : "shrink-0 rounded-full bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-on-surface-variant/80 ring-1 ring-outline-variant/30 transition hover:bg-surface-container";
}
