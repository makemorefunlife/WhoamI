export function hubPanelClass() {
  return "stitch-hero-panel rounded-extra-large border border-outline-variant/30 shadow-[0_4px_20px_rgba(26,51,40,0.05)]";
}

export function hubSheetClass() {
  return "stitch-hero-panel w-full max-w-md rounded-extra-large border border-outline-variant/35 shadow-[0_24px_48px_rgba(26,51,40,0.18)]";
}

export function hubTouchBtn(primary = false) {
  return primary
    ? "stitch-cta-primary w-full !min-w-0 !rounded-xl !px-6 !py-4 !text-base"
    : "stitch-cta-secondary w-full !min-w-0 !rounded-xl !px-6 !py-3.5 !text-base";
}
