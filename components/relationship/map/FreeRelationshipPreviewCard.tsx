"use client";

import { useEffect, useState } from "react";
import RolePlanetIcon from "@/components/relationship/map/RolePlanetIcon";
import { hubPanelClass } from "@/components/relationship/hub/relationHubStyles";
import { roleLabel } from "@/lib/relationship/map/roleLocale";
import type {
  FreeRelationshipPreviewResult,
  FreeRelationshipPreviewRole,
} from "@/lib/relationship/map/composeFreeRelationshipPreview";
import { blueprintRoute, ROUTES } from "@/constants/routes";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Locale } from "@/lib/i18n/locale";

type FreePreviewApiState =
  | { status: "loading" }
  | { status: "not_ready" }
  | { status: "error" }
  | {
      status: "ready";
      viewerSurveyCompleted: boolean;
      otherSurveyCompleted: boolean;
      viewerName: string;
      otherName: string;
      preview: FreeRelationshipPreviewResult;
    };

/**
 * Birth-data-only FREE relationship result -- a SEPARATE surface/component
 * from RelationshipBasicCards.tsx (which stays untouched and remains the
 * survey-calibrated 4-axis view). This renders the exact 6-item spec:
 * my role for them / their role for me / one-line summary / 2 fit points /
 * 1-2 friction points / 1 comfort tip -- all sourced from the existing
 * 10-role Relationship Map SSOT via composeFreeRelationshipPreview, never
 * from survey/psych data. The "birth-only preview" badge below is the
 * explicit visual distinction from a survey-calibrated result -- this
 * screen never presents the neutral-psych fallback as a real personality
 * read.
 */
export default function FreeRelationshipPreviewCard({
  relationshipReportId,
  viewerReportId,
}: {
  relationshipReportId: string;
  viewerReportId: string;
}) {
  const { locale, messages, href: localize } = useLocale();
  const [state, setState] = useState<FreePreviewApiState>({ status: "loading" });
  // The survey choice below is dismissible once shown -- picking "free
  // result is enough" just hides the prompt locally, no navigation, no
  // server write (nothing to persist: this is a same-session UI choice,
  // not a completion state).
  const [surveyChoiceDismissed, setSurveyChoiceDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/relationship/map/free-preview?relationshipReportId=${encodeURIComponent(relationshipReportId)}&viewerReportId=${encodeURIComponent(viewerReportId)}`,
        );
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok || !data) {
          setState({ status: "error" });
          return;
        }
        if (data.ready === false) {
          setState({ status: "not_ready" });
          return;
        }
        setState({
          status: "ready",
          viewerSurveyCompleted: Boolean(data.viewerSurveyCompleted),
          otherSurveyCompleted: Boolean(data.otherSurveyCompleted),
          viewerName: typeof data.viewerName === "string" ? data.viewerName : "",
          otherName: typeof data.otherName === "string" ? data.otherName : "",
          preview: data.preview as FreeRelationshipPreviewResult,
        });
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [relationshipReportId, viewerReportId]);

  if (state.status === "loading") {
    return (
      <div className={`${hubPanelClass()} px-4 py-6 text-center text-sm text-on-surface-variant`}>
        {messages.report.chrome.loading}
      </div>
    );
  }

  if (state.status === "not_ready") {
    return (
      <div className={`${hubPanelClass()} px-4 py-6 text-center text-sm text-on-surface-variant`}>
        {locale === "ko-KR"
          ? "상대방이 생년월일을 입력하면 무료 관계 결과가 열려요."
          : "This free result unlocks once the other person adds their birth date."}
      </div>
    );
  }

  if (state.status === "error") {
    return null;
  }

  const { preview, viewerSurveyCompleted, otherSurveyCompleted, viewerName, otherName } = state;
  const oNim = otherName.endsWith("님") ? otherName : `${otherName || (locale === "ko-KR" ? "상대" : "Partner")}님`;

  return (
    <div className="space-y-4">
      <div className={`${hubPanelClass()} space-y-5 p-4 sm:p-5`}>
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full border border-secondary/40 bg-secondary/10 px-2.5 py-1 text-[11px] font-semibold text-secondary">
            {locale === "ko-KR" ? "사주 기반 무료 미리보기" : "Free birth-chart preview"}
          </span>
          {!viewerSurveyCompleted ? (
            <span className="text-[11px] text-on-surface-variant">
              {locale === "ko-KR" ? "설문 전" : "Before survey"}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <RolePreviewTile
            heading={
              locale === "ko-KR"
                ? `나에게 ${oNim}은`
                : `${otherName || "They"} to me`
            }
            role={preview.otherRoleForViewer}
            locale={locale}
          />
          <RolePreviewTile
            heading={
              locale === "ko-KR"
                ? `${oNim}에게 나는`
                : `Me to ${otherName || "them"}`
            }
            role={preview.viewerRoleForOther}
            locale={locale}
          />
        </div>

        <p className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 px-3.5 py-3 text-[15px] font-medium leading-relaxed text-on-surface">
          {locale === "ko-KR" ? preview.summaryKo : preview.summaryEn}
        </p>

        <div className="space-y-2 rounded-xl border border-secondary/30 bg-secondary/10 px-3.5 py-3">
          <p className="text-[13px] font-semibold text-secondary">
            {locale === "ko-KR" ? "자연스럽게 맞는 점" : "Where you naturally fit"}
          </p>
          <ul className="list-inside list-disc space-y-1.5 text-[14px] leading-relaxed text-on-surface-variant">
            {(locale === "ko-KR" ? preview.fitPointsKo : preview.fitPointsEn).map((line, i) => (
              <li key={i} className="[text-wrap:pretty]">
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2 rounded-xl border border-accent-rose/30 bg-accent-rose-soft/55 px-3.5 py-3">
          <p className="text-[13px] font-semibold text-primary">
            {locale === "ko-KR" ? "엇갈릴 수 있는 점" : "Where you might cross wires"}
          </p>
          <ul className="list-inside list-disc space-y-1.5 text-[14px] leading-relaxed text-on-surface-variant">
            {(locale === "ko-KR" ? preview.frictionPointsKo : preview.frictionPointsEn).map(
              (line, i) => (
                <li key={i} className="[text-wrap:pretty]">
                  {line}
                </li>
              ),
            )}
          </ul>
        </div>

        <div className="space-y-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-3">
          <p className="text-[13px] font-semibold text-primary">
            {locale === "ko-KR" ? "편하게 만드는 팁" : "A tip to make it easier"}
          </p>
          <p className="text-[14px] leading-relaxed text-on-surface-variant">
            {locale === "ko-KR" ? preview.tipKo : preview.tipEn}
          </p>
        </div>
      </div>

      {/*
        Featured, not a plain link -- the ask was to visibly show "this much
        free stuff exists" rather than bury the personal analysis as a
        secondary button next to the relationship result. Still just an
        existing-report link (blueprintRoute), no new birth entry, no new
        analysis logic.
      */}
      <div className={`${hubPanelClass()} space-y-3 p-4 sm:p-5`}>
        <div className="flex items-start gap-3">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-secondary/15 text-xs font-bold text-secondary select-none" aria-hidden>
            ▪
          </span>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-primary">
              {locale === "ko-KR"
                ? "나에 대한 무료 개인분석도 볼 수 있어요"
                : "Your free personal analysis is ready too"}
            </p>
            <p className="text-xs leading-relaxed text-on-surface-variant">
              {locale === "ko-KR"
                ? "생년월일만으로 보는 타고난 성향과 에너지 패턴이에요."
                : "Your innate tendencies and energy pattern, from your birth chart alone."}
            </p>
          </div>
        </div>
        <a
          href={localize(blueprintRoute(viewerReportId))}
          className="stitch-cta-primary w-full !min-w-0 text-center"
        >
          {locale === "ko-KR" ? "무료 개인분석 보러가기" : "See my free personal analysis"}
        </a>
      </div>

      {!viewerSurveyCompleted && !surveyChoiceDismissed ? (
        <div className={`${hubPanelClass()} space-y-3 p-4 sm:p-5`}>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-primary">
              {otherSurveyCompleted && otherName
                ? locale === "ko-KR"
                  ? `${otherName}님은 이미 설문까지 마쳤어요`
                  : `${otherName} already added their survey`
                : locale === "ko-KR"
                  ? "설문까지 하면 더 깊이 볼 수 있어요"
                  : "Add the survey to go deeper"}
            </p>
            <p className="text-xs leading-relaxed text-on-surface-variant">
              {otherSurveyCompleted && otherName
                ? locale === "ko-KR"
                  ? "당신도 설문하면, 성향까지 반영한 더 깊은 관계 분석을 무료로 볼 수 있어요."
                  : "Add yours too, and see a deeper relationship analysis -- personality included, still free."
                : locale === "ko-KR"
                  ? "지금 결과는 생년월일만으로 본 거예요. 설문을 더하면 성향까지 반영해 더 정교하게 볼 수 있어요."
                  : "This result is from birth data alone. Add the survey and it factors in your personality too, for a sharper read."}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href={localize(`${ROUTES.surveyV2}?reportId=${encodeURIComponent(viewerReportId)}`)}
              className="stitch-cta-primary w-full !min-w-0 text-center"
            >
              {locale === "ko-KR" ? "설문하고 심화 분석 보기" : "Take the survey for a deeper read"}
            </a>
            <button
              type="button"
              onClick={() => setSurveyChoiceDismissed(true)}
              className="stitch-cta-secondary w-full !min-w-0 text-center"
            >
              {locale === "ko-KR" ? "무료 결과로 볼게요" : "This free result is enough"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RolePreviewTile({
  heading,
  role,
  locale,
}: {
  heading: string;
  role: FreeRelationshipPreviewRole;
  locale: Locale;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-low/60 px-3 py-4 text-center">
      <p className="text-[11px] font-medium text-on-surface-variant">{heading}</p>
      <RolePlanetIcon icon={role.icon} className="h-7 w-7 text-secondary" />
      <p className="text-base font-semibold text-primary">{roleLabel(role, locale)}</p>
    </div>
  );
}
