"use client";

import { createContext, useContext, type ReactNode } from "react";

export type ReportSurface = "dark" | "stitch";

const ReportSurfaceContext = createContext<ReportSurface>("dark");

export function ReportSurfaceProvider({
  surface,
  children,
}: {
  surface: ReportSurface;
  children: ReactNode;
}) {
  return (
    <ReportSurfaceContext.Provider value={surface}>
      {children}
    </ReportSurfaceContext.Provider>
  );
}

export function useReportSurface(): ReportSurface {
  return useContext(ReportSurfaceContext);
}

/** 리포트 본문 공통 텍스트·카드 톤 (dark / stitch) */
export function useReportTone() {
  const surface = useReportSurface();
  const stitch = surface === "stitch";

  return {
    surface,
    body: stitch ? "text-on-surface" : "text-white/78",
    bodyStrong: stitch
      ? "font-semibold text-primary"
      : "font-semibold text-white/92",
    bodyMedium: stitch ? "font-medium text-primary" : "font-medium text-white/88",
    muted: stitch ? "text-on-surface-variant" : "text-white/55",
    faint: stitch ? "text-on-surface-variant/70" : "text-white/40",
    heading: stitch
      ? "font-bold text-primary"
      : "font-bold text-white/95",
    label: stitch
      ? "text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant"
      : "text-xs font-semibold uppercase tracking-[0.12em] text-white/55",
    tableBorder: stitch ? "border-outline-variant/30" : "border-white/10",
    tableHead: stitch ? "text-on-surface-variant" : "text-white/55",
    quoteBox: stitch
      ? "rounded-xl border border-secondary/25 bg-secondary/8 p-4 text-[15px] italic leading-relaxed text-on-surface"
      : "rounded-xl border border-[#67b7ff]/20 bg-[#67b7ff]/8 p-4 text-[15px] italic leading-relaxed text-white/88",
    inset: stitch
      ? "rounded-xl border border-outline-variant/25 bg-surface-container-low/80 p-4"
      : "rounded-xl border border-white/10 bg-black/15 p-4",
    cardDefault: stitch
      ? "border-outline-variant/30 bg-surface-container-low/70"
      : "border-white/10 bg-white/[0.04]",
    cardAccent: stitch
      ? "border-outline-variant/35 bg-surface-container-high/60"
      : "border-white/12 bg-white/[0.05]",
    cardMuted: stitch
      ? "border-outline-variant/20 bg-surface-container-low/50"
      : "border-white/8 bg-black/20",
    cardTitle: stitch
      ? "mb-4 text-base font-semibold leading-snug text-primary sm:text-[17px]"
      : "mb-4 text-base font-semibold leading-snug text-white/95 sm:text-[17px]",
    scoreCell: stitch
      ? "flex flex-col items-center rounded-2xl border border-outline-variant/30 bg-surface-container-low/80 px-4 py-5"
      : "flex flex-col items-center rounded-2xl border border-white/10 bg-black/25 px-4 py-5 backdrop-blur-sm",
    scoreValue: stitch ? "text-2xl font-bold tabular-nums text-primary" : "text-2xl font-bold tabular-nums text-white",
    scoreSub: stitch ? "text-[10px] font-medium text-on-surface-variant" : "text-[10px] font-medium text-white/45",
    scoreLabel: stitch
      ? "mt-3 text-center text-sm font-semibold text-primary"
      : "mt-3 text-center text-sm font-semibold text-white/90",
    scoreTrack: stitch ? "mt-4 h-1.5 w-full overflow-hidden rounded-full bg-outline-variant/25" : "mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/8",
    sectionTitle: stitch
      ? "mt-1 text-lg font-semibold text-primary"
      : "mt-1 text-lg font-semibold text-white/95",
    sectionEyebrow: (color: string) =>
      stitch
        ? "text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary"
        : undefined,
    headlineNames: stitch
      ? "mb-4 text-sm font-medium text-on-surface-variant"
      : "mb-4 text-sm font-medium text-white/55",
    headlineNameStrong: stitch ? "text-primary" : "text-white/85",
    headlineTitle: stitch
      ? "text-balance text-2xl font-bold leading-[1.25] tracking-tight text-primary sm:text-3xl sm:leading-[1.2]"
      : "text-balance text-2xl font-bold leading-[1.25] tracking-tight text-white sm:text-3xl sm:leading-[1.2]",
    headlineSubtitle: stitch
      ? "mt-4 max-w-2xl text-base leading-relaxed text-on-surface-variant sm:text-[17px] sm:leading-[1.65]"
      : "mt-4 max-w-2xl text-base leading-relaxed text-white/72 sm:text-[17px] sm:leading-[1.65]",
    headlineMeta: stitch ? "text-xs leading-relaxed text-on-surface-variant/80" : "text-xs leading-relaxed text-white/50",
    scoreFooterBorder: stitch ? "border-outline-variant/25" : "border-white/8",
  } as const;
}
