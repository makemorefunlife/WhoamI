"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AccountBirthEditForm, {
  type AccountBirthEditPayload,
} from "@/components/account/AccountBirthEditForm";
import {
  formatBirthDateKo,
  formatBirthPlaceKo,
  formatBirthTimeKo,
} from "@/lib/account/formatBirthDisplay";
import { useClientReportId } from "@/lib/hooks/useClientReportId";
import {
  writeBirthV2Session,
  type BirthV2Session,
} from "@/lib/v2/onboarding/birthSession";
import { fetchReportBirthFromApi } from "@/lib/v2/onboarding/fetchReportBirthClient";
import { syncBirthSessionFromDb } from "@/lib/v2/onboarding/hydrateBirthSession";
import { clearLiteReports } from "@/lib/v2/lite/session";
import { clearSlimIntegratedCache } from "@/lib/v1/slim/slimIntegratedCache";
import { invalidateReportSession } from "@/lib/home/reportSession";
import { blueprintRoute, ROUTES, withReportId } from "@/constants/routes";
import {
  readLocalBirthDateCorrectionUsed,
  writeLocalBirthDateCorrectionUsed,
} from "@/lib/account/birthDateCorrectionLocal";
import { isBirthDateCorrectionUsed } from "@/lib/report/birthDateCorrection";

function BirthSummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-outline-variant/20 py-3 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        {label}
      </dt>
      <dd className="text-sm font-medium text-on-surface">{value}</dd>
    </div>
  );
}

export default function AccountBirthEditor() {
  const router = useRouter();
  const { reportId, ready, recovering } = useClientReportId({
    logContext: "account-profile",
  });
  const [birth, setBirth] = useState<BirthV2Session | null>(null);
  const [correctionUsed, setCorrectionUsed] = useState(false);
  const [dateEditMode, setDateEditMode] = useState(false);
  const [loadingBirth, setLoadingBirth] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadBirth = useCallback(async (id: string) => {
    const [synced, dbRow] = await Promise.all([
      syncBirthSessionFromDb(id),
      fetchReportBirthFromApi(id),
    ]);
    setBirth(synced.birth);
    setCorrectionUsed(
      isBirthDateCorrectionUsed(dbRow?.birth_date_correction_used_at) ||
        readLocalBirthDateCorrectionUsed(id),
    );
    if (synced.sessionCorrected) {
      setNotice(
        "브라우저에 남아 있던 출생 정보와 서버(DB) 값이 달라서, 서버 기준으로 맞춰 두었어요.",
      );
    }
    setLoadingBirth(false);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!reportId) {
      setBirth(null);
      setCorrectionUsed(false);
      setLoadingBirth(false);
      return;
    }

    setLoadingBirth(true);
    void loadBirth(reportId);
  }, [ready, reportId, loadBirth]);

  const handleSubmit = useCallback(
    async (payload: AccountBirthEditPayload) => {
      if (!reportId || !birth?.birthDate || busy) return;
      setBusy(true);
      setNotice(null);

      const nextBirthDate = payload.birthDate?.trim() || birth.birthDate;
      const dateChanging = nextBirthDate !== birth.birthDate.trim();

      if (dateChanging && correctionUsed) {
        setNotice(
          "생년월일은 이미 1회 수정했어요. 추가 변경은 고객센터로 문의해 주세요.",
        );
        setBusy(false);
        return;
      }

      try {
        const res = await fetch("/api/report/birth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportId,
            birthDate: nextBirthDate,
            birthTime: payload.birthTimeUnknown ? null : payload.birthTime,
            birthTimeUnknown: payload.birthTimeUnknown,
            birthPlace: payload.birthPlace,
          }),
        });
        const data = (await res.json()) as {
          error?: string;
          birth_date_correction_used?: boolean;
        };
        if (!res.ok) {
          setNotice(data.error ?? "저장에 실패했어요. 다시 시도해 주세요.");
          setBusy(false);
          return;
        }

        const nextBirth: BirthV2Session = {
          birthDate: nextBirthDate,
          birthTime: payload.birthTime,
          birthTimeUnknown: payload.birthTimeUnknown,
          birthPlace: payload.birthPlace,
          birthPlaceUnknown: false,
          savedAt: new Date().toISOString(),
        };
        writeBirthV2Session(reportId, nextBirth);
        setBirth(nextBirth);
        if (dateChanging || data.birth_date_correction_used) {
          setCorrectionUsed(true);
          writeLocalBirthDateCorrectionUsed(reportId);
          setDateEditMode(false);
        }
        setNotice(
          dateChanging
            ? "생년월일을 포함해 출생 정보가 저장되었어요. 생년월일은 다시 바꿀 수 없어요."
            : "출생 시간·지역이 저장되었어요.",
        );
        clearLiteReports(reportId);
        clearSlimIntegratedCache(reportId);
        invalidateReportSession(reportId);
        void loadBirth(reportId);
      } catch {
        setNotice("저장에 실패했어요. 다시 시도해 주세요.");
      }
      setBusy(false);
    },
    [birth?.birthDate, busy, correctionUsed, loadBirth, reportId],
  );

  if (!ready || recovering || loadingBirth) {
    return (
      <section className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
        <p className="text-sm text-on-surface-variant">
          {recovering ? "계정 기록을 불러오는 중…" : "출생 정보를 불러오는 중…"}
        </p>
      </section>
    );
  }

  if (!reportId) {
    return (
      <section className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
        <h2 className="stitch-headline text-xl text-primary">출생 정보</h2>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          블루프린트를 시작한 뒤 출생 정보를 확인·수정할 수 있어요.
        </p>
        <Link href={ROUTES.home} className="stitch-cta-primary mt-5 inline-flex">
          홈으로 이동
        </Link>
      </section>
    );
  }

  if (!birth?.birthDate) {
    return (
      <section className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
        <h2 className="stitch-headline text-xl text-primary">출생 정보</h2>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          아직 등록된 생년월일이 없어요. 설문 후 출생 정보를 입력해 주세요.
        </p>
        <Link
          href={withReportId(ROUTES.onboardingBirth, reportId)}
          className="stitch-cta-primary mt-5 inline-flex"
        >
          출생 정보 입력하기
        </Link>
      </section>
    );
  }

  return (
    <section id="birth" className="scroll-mt-24 space-y-5">
      <div>
        <h2 className="stitch-headline text-xl text-primary">출생 정보</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          출생 시간·지역은 자유롭게 수정할 수 있어요. 생년월일은 잘못 입력한
          경우 <strong>1회</strong> 수정할 수 있습니다.
        </p>
      </div>

      <div className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
        <h3 className="text-sm font-semibold text-primary">등록된 정보</h3>
        <dl className="mt-3">
          <BirthSummaryRow
            label="생년월일"
            value={formatBirthDateKo(birth.birthDate)}
          />
          <BirthSummaryRow
            label="출생 시간"
            value={formatBirthTimeKo(birth)}
          />
          <BirthSummaryRow
            label="태어난 곳"
            value={formatBirthPlaceKo(
              birth.birthPlace,
              birth.birthPlaceUnknown,
            )}
          />
        </dl>
        {correctionUsed ? (
          <p className="mt-4 text-[11px] leading-relaxed text-on-surface-variant/80">
            생년월일 1회 수정을 이미 사용했어요. 추가 변경은 고객센터로
            문의해 주세요.
          </p>
        ) : dateEditMode ? (
          <p className="mt-4 text-[11px] leading-relaxed text-on-surface-variant/80">
            아래 폼에서 생년월일을 고친 뒤 저장하면 1회 수정이 완료됩니다.
          </p>
        ) : (
          <button
            type="button"
            className="stitch-cta-secondary mt-4 w-full sm:w-auto"
            onClick={() => {
              setDateEditMode(true);
              setNotice(null);
            }}
          >
            생년월일 수정 (1회 가능)
          </button>
        )}
      </div>

      {notice ? (
        <p
          className={`rounded-2xl border px-4 py-3 text-sm ${
            notice.includes("실패") || notice.includes("이미")
              ? "border-accent-rose/40 bg-accent-rose-soft text-primary"
              : "border-secondary/30 bg-secondary/8 text-primary"
          }`}
        >
          {notice}
        </p>
      ) : null}

      <div className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-primary">
              {dateEditMode ? "생년월일·시간·지역 수정" : "시간·지역 수정"}
            </h3>
            <p className="mt-1 text-xs text-on-surface-variant">
              저장하면 Blueprint·관계 리포트 계산이 새 정보로 갱신돼요.
            </p>
          </div>
          {dateEditMode ? (
            <button
              type="button"
              className="shrink-0 text-xs text-on-surface-variant underline"
              onClick={() => setDateEditMode(false)}
            >
              취소
            </button>
          ) : null}
        </div>
        <div className="mt-5">
          <AccountBirthEditForm
            initialBirthDate={birth.birthDate}
            initialBirthTime={birth.birthTime}
            initialBirthTimeUnknown={birth.birthTimeUnknown}
            initialBirthPlace={birth.birthPlace}
            allowBirthDateEdit={dateEditMode}
            busy={busy}
            onSubmit={handleSubmit}
          />
        </div>
      </div>

      <button
        type="button"
        className="stitch-cta-secondary w-full"
        onClick={() => router.push(blueprintRoute(reportId))}
      >
        Blueprint 미리보기로 이동
      </button>
    </section>
  );
}
