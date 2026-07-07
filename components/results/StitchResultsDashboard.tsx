"use client";

import { useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GuestDashboardAuthNotice from "@/components/results/GuestDashboardAuthNotice";
import DualAxisRadarChart, {
  STITCH_RADAR_THEME,
} from "@/components/v2/DualAxisRadarChart";
import StitchFreeSticker from "@/components/results/StitchFreeSticker";
import StitchLiteResultPanel from "@/components/results/StitchLiteResultPanel";
import StitchPremiumCard from "@/components/results/StitchPremiumCard";
import {
  STITCH_DASHBOARD_AXIS_LABELS,
  STITCH_DASHBOARD_AXIS_ORDER,
} from "@/lib/v2/framework/axisLabels";
import { resolveClerkDisplayName } from "@/lib/clerk/displayName";
import type { BirthV2Session } from "@/lib/v2/onboarding/birthSession";
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import type { InnateSelfLiteProfile } from "@/lib/v2/saju/innateLite";

type LiteTab = "current" | "innate";

function FreeAnalysisButton({
  active,
  onClick,
  title,
  subtitle,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  accent: "current" | "innate";
}) {
  const border =
    accent === "current"
      ? active
        ? "border-primary bg-primary/8 shadow-sm"
        : "border-outline-variant/55 bg-surface hover:border-primary/35"
      : active
        ? "border-[#c49a6c] bg-[#c49a6c]/10 shadow-sm"
        : "border-outline-variant/55 bg-surface hover:border-[#c49a6c]/45";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 px-3 py-4 text-center transition ${border}`}
    >
      <span className="inline-flex flex-wrap items-center justify-center gap-2">
        <StitchFreeSticker />
        <span className="text-sm font-semibold leading-tight text-primary">
          {title}
        </span>
      </span>
      <span className="text-[11px] leading-snug text-on-surface-variant">
        {subtitle}
      </span>
    </button>
  );
}

export default function StitchResultsDashboard({
  reportId,
  current,
  innate,
  birth,
  birthTimeUnknown,
}: {
  reportId: string;
  current: CurrentSelfProfile;
  innate: InnateSelfLiteProfile;
  birth: BirthV2Session;
  birthTimeUnknown: boolean;
}) {
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const [activeTab, setActiveTab] = useState<LiteTab | null>(null);

  const isGuest = isLoaded && !user;
  const displayName =
    isLoaded && user ? resolveClerkDisplayName(user) : null;
  const showGreeting = Boolean(displayName && displayName !== "나");

  const requireAuthForFeature = () => {
    const redirect =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/blueprint-preview";
    openSignIn?.({ forceRedirectUrl: redirect });
  };

  const toggleTab = (tab: LiteTab) => {
    if (isGuest) {
      requireAuthForFeature();
      return;
    }
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 pb-16 pt-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
            Your dashboard
          </p>
          <h1 className="stitch-headline mt-2 text-3xl leading-tight sm:text-4xl">
            {showGreeting ? (
              <>
                Hello,{" "}
                <span className="text-primary">{displayName}.</span>
              </>
            ) : (
              "Your blueprint"
            )}
          </h1>
        </div>
        <span className="shrink-0 rounded-full bg-accent-emerald-soft px-3.5 py-1.5 text-xs font-semibold text-primary">
          Survey complete
        </span>
      </header>

      {isGuest ? <GuestDashboardAuthNotice /> : null}

      <section className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent-rose">
              Behavioral blueprint
            </p>
            <h2 className="stitch-headline mt-1.5 text-xl leading-snug sm:text-2xl">
              Current state vs. innate potential
            </h2>
          </div>
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-outline-variant/50 text-on-surface-variant"
            aria-label="About this chart"
            title="Survey patterns (current) overlaid with birth-chart traits (innate)"
          >
            <Info className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {birthTimeUnknown ? (
          <p className="mb-4 rounded-xl border border-secondary/25 bg-secondary/10 px-3 py-2.5 text-xs leading-relaxed text-on-surface-variant">
            Birth time unknown — innate chart uses a noon reference. Add your
            time later for finer accuracy.
          </p>
        ) : null}

        <DualAxisRadarChart
          current={current.primary_axes}
          innate={innate.primary_axes}
          theme={STITCH_RADAR_THEME}
          axisOrder={STITCH_DASHBOARD_AXIS_ORDER}
          axisLabels={STITCH_DASHBOARD_AXIS_LABELS}
          currentLabel="Current state"
          innateLabel="Innate potential"
        />
      </section>

      <section className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FreeAnalysisButton
            active={activeTab === "current"}
            onClick={() => toggleTab("current")}
            title="Current state"
            subtitle="Survey-based"
            accent="current"
          />
          <FreeAnalysisButton
            active={activeTab === "innate"}
            onClick={() => toggleTab("innate")}
            title="Innate blueprint"
            subtitle="Birth-chart based"
            accent="innate"
          />
        </div>

        <AnimatePresence mode="wait">
          {activeTab ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
            >
              <StitchLiteResultPanel
                reportId={reportId}
                profile={current}
                birth={birth}
                active={activeTab}
              />
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-xs text-on-surface-variant"
            >
              {isGuest
                ? "로그인 후 무료 세부 분석을 열 수 있어요."
                : "Tap a free analysis above to open your report below."}
            </motion.p>
          )}
        </AnimatePresence>
      </section>

      <StitchPremiumCard
        reportId={reportId}
        onGuestClick={isGuest ? requireAuthForFeature : undefined}
      />

      <section className="rounded-extra-large border border-dashed border-outline-variant/50 bg-surface-container-low/40 px-6 py-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
          Coming soon
        </p>
        <h3 className="mt-2 text-lg font-semibold text-primary">
          추가 분석하기
        </h3>
        <p className="mt-2 text-sm text-on-surface-variant">
          관계·결정 등 추가 분석은 이후에 연결될 예정이에요.
        </p>
      </section>
    </div>
  );
}
