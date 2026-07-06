"use client";

import { useCallback, useEffect, useState } from "react";
import BirthInputForm, {
  type BirthFormSubmitPayload,
} from "@/components/onboarding/BirthInputForm";
import GlassCard from "@/components/space/GlassCard";
import GlowButton from "@/components/space/GlowButton";
import {
  readBirthV2Session,
  writeBirthV2Session,
} from "@/lib/v2/onboarding/birthSession";
import { fetchReportBirthFromApi } from "@/lib/v2/onboarding/fetchReportBirthClient";
import { resolveReportBirth } from "@/lib/v2/onboarding/resolveReportBirth";

export default function AccountBirthEditor() {
  const [reportId, setReportId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("reportId")?.trim() ?? "";
    setReportId(id);
    if (!id) {
      setLoading(false);
      return;
    }
    void (async () => {
      const dbRow = await fetchReportBirthFromApi(id);
      const sessionBirth = readBirthV2Session(id);
      const resolved = resolveReportBirth({ db: dbRow, session: sessionBirth });
      if (resolved) {
        const { source: _s, ...birth } = resolved;
        writeBirthV2Session(id, birth);
      }
      setLoading(false);
    })();
  }, []);

  const handleSubmit = useCallback(
    async (payload: BirthFormSubmitPayload) => {
      if (!reportId || busy) return;
      setBusy(true);
      setNotice(null);
      writeBirthV2Session(reportId, {
        birthDate: payload.birthDate,
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
            birthDate: payload.birthDate,
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
      } catch {
        setNotice("네트워크 오류가 발생했어요. 다시 시도해 주세요.");
        setBusy(false);
        return;
      }
      setBusy(false);
    },
    [busy, reportId],
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

  const existing = readBirthV2Session(reportId);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white/95">출생 정보</h2>
        <p className="mt-1 text-sm text-white/50">
          생년월일·시간·장소는 자동 저장되며, 여기서 수정할 수 있어요.
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
        submitLabel="출생 정보 저장"
        onSubmit={handleSubmit}
      />
      <GlowButton
        type="button"
        variant="ghost"
        className="w-full text-sm"
        onClick={() => {
          window.location.href = `/blueprint-preview?reportId=${encodeURIComponent(reportId)}`;
        }}
      >
        Blueprint 미리보기로 이동
      </GlowButton>
    </div>
  );
}
