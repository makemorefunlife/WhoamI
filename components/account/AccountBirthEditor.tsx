"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BirthInputForm, {
  type BirthFormSubmitPayload,
} from "@/components/onboarding/BirthInputForm";
import GlassCard from "@/components/space/GlassCard";
import GlowButton from "@/components/space/GlowButton";
import {
  readBirthV2Session,
  writeBirthV2Session,
} from "@/lib/v2/onboarding/birthSession";
import { resolveCanonicalReportIdClient } from "@/lib/home/resolveCanonicalReportIdClient";
import { ensureBirthSession } from "@/lib/v2/onboarding/hydrateBirthSession";
import { clearLiteReports } from "@/lib/v2/lite/session";
import { clearSlimIntegratedCache } from "@/lib/v1/slim/slimIntegratedCache";
import { invalidateReportSession } from "@/lib/home/reportSession";
import { blueprintRoute } from "@/constants/routes";

export default function AccountBirthEditor() {
  const router = useRouter();
  const [reportId, setReportId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const resolved = await resolveCanonicalReportIdClient("", "account-birth");
      const id = resolved.canonicalReportId;
      setReportId(id);
      if (!id) {
        setLoading(false);
        return;
      }
      await ensureBirthSession(id);
      setLoading(false);
    })();
  }, []);

  const existing = reportId ? readBirthV2Session(reportId) : null;

  const handleSubmit = useCallback(
    async (payload: BirthFormSubmitPayload) => {
      if (!reportId || busy) return;
      setBusy(true);
      setNotice(null);
      writeBirthV2Session(reportId, {
        birthDate: existing?.birthDate ?? payload.birthDate,
        birthTime: payload.birthTime,
        birthTimeUnknown: payload.birthTimeUnknown,
        birthPlace: payload.birthPlace,
      });

      try {
        const res = await fetch("/api/report/birth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportId,
            birthDate: existing?.birthDate ?? payload.birthDate,
            birthTime: payload.birthTimeUnknown ? null : payload.birthTime,
            birthTimeUnknown: payload.birthTimeUnknown,
            birthPlace: payload.birthPlace,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setNotice(data.error ?? "저장에 실패했어요.");
          setBusy(false);
          return;
        }
        setNotice("출생 정보가 저장되었어요.");
        clearLiteReports(reportId);
        clearSlimIntegratedCache(reportId);
        invalidateReportSession(reportId);
      } catch {
        setNotice("네트워크 오류가 발생했어요. 다시 시도해 주세요.");
        setBusy(false);
        return;
      }
      setBusy(false);
    },
    [busy, existing?.birthDate, reportId],
  );

  if (loading) {
    return (
      <p className="text-sm text-white/50">출생 정보 불러오는 중…</p>
    );
  }

  if (!reportId) {
    return (
      <GlassCard className="!py-6">
        <p className="text-sm text-white/60">
          탐사를 시작한 뒤 출생 정보를 저장할 수 있어요.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white/95">출생 정보</h2>
        <p className="mt-1 text-sm text-white/50">
          생년월일은 최초 입력 후 잠금되며, 시간·장소는 여기서 수정할 수 있어요.
        </p>
      </div>
      {notice ? (
        <p className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100/95">
          {notice}
        </p>
      ) : null}
      <BirthInputForm
        busy={busy}
        initialBirthDate={existing?.birthDate}
        initialBirthTime={existing?.birthTime}
        initialBirthTimeUnknown={existing?.birthTimeUnknown}
        initialBirthPlace={existing?.birthPlace}
        lockBirthDate={Boolean(existing?.birthDate)}
        birthDateLockReason="생년월일 변경은 고객센터로 문의해 주세요."
        submitLabel="출생 정보 저장"
        onSubmit={handleSubmit}
      />
      <GlowButton
        type="button"
        variant="ghost"
        className="w-full text-sm"
        onClick={() => {
          router.push(blueprintRoute(reportId));
        }}
      >
        Blueprint 미리보기로 이동
      </GlowButton>
    </div>
  );
}
