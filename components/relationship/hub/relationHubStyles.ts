export function hubPanelClass() {
  return "stitch-hero-panel rounded-extra-large border border-outline-variant/30 shadow-[0_4px_20px_rgba(26,51,40,0.05)]";
}

export function hubSheetClass() {
  return "stitch-hero-panel w-full max-w-md rounded-extra-large border border-outline-variant/35 shadow-[0_24px_48px_rgba(26,51,40,0.18)]";
}

export function hubTouchBtn(primary = false) {
  return primary
    ? "stitch-cta-primary w-full !min-w-0 !px-6 !py-4 !text-base"
    : "w-full rounded-full border border-outline-variant/50 bg-surface-container-low/80 py-4 text-base font-semibold text-primary transition hover:bg-surface-container-high active:scale-[0.98]";
}
