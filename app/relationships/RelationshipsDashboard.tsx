"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SpaceBackground from "@/components/space/SpaceBackground";
import GlassCard from "@/components/space/GlassCard";
import GlowButton from "@/components/space/GlowButton";
import RelationshipCard, {
  type RelationshipListItem,
} from "@/components/relationship/RelationshipCard";
import { useCanonicalReportId } from "@/lib/home/useCanonicalReportId";

export default function RelationshipsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlMyReportHint =
    searchParams.get("myReportId")?.trim() ||
    searchParams.get("reportId")?.trim() ||
    "";
  const { canonicalReportId: myReportId, resolving: canonicalResolving } =
    useCanonicalReportId({
      urlHint: urlMyReportHint,
      queryParam: "myReportId",
      logContext: "relationships-hub",
    });

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<RelationshipListItem[]>([]);
  const [meta, setMeta] = useState<{ manual_lists_note?: string } | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);

  const load = useCallback(async (mode: "full" | "silent" = "full") => {
    if (canonicalResolving) return;
    if (!myReportId) {
      setErr(null);
      setItems([]);
      setMeta(null);
      setLoading(false);
      return;
    }
    if (mode === "full") {
      setErr(null);
      setLoading(true);
    }
    try {
      const res = await fetch(
        `/api/relationship/list?reportId=${encodeURIComponent(myReportId)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        if (mode === "full") {
          setErr(data?.error ?? "불러오지 못했어요.");
          setItems([]);
          setMeta(null);
        }
        return;
      }
      setItems(data.relationships ?? []);
      setMeta(data.meta ?? null);
      if (mode === "silent") setErr(null);
    } finally {
      if (mode === "full") setLoading(false);
    }
  }, [myReportId, canonicalResolving]);

  useEffect(() => {
    void load("full");
  }, [load]);

  useEffect(() => {
    if (!myReportId) return;
    const id = window.setInterval(() => {
      void load("silent");
    }, 22000);
    const onVis = () => {
      if (document.visibilityState === "visible") void load("silent");
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [myReportId, load]);

  async function startNewInvite() {
    if (!myReportId || inviteBusy) return;
    setInviteBusy(true);
    try {
      const res = await fetch("/api/invite/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: myReportId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error ?? "초대 링크를 만들지 못했어요.");
        return;
      }
      const token = data?.invite?.invite_token as string | undefined;
      if (!token) {
        alert("초대 정보를 확인할 수 없어요.");
        return;
      }
      const url = `${window.location.origin}/invite?token=${encodeURIComponent(token)}`;
      try {
        if (navigator.share) {
          await navigator.share({
            title: "친구 초대",
            text: "함께 관계 분석을 받아보자.",
            url,
          });
        } else {
          await navigator.clipboard.writeText(url);
          alert("링크를 복사했어요.");
        }
      } catch {
        await navigator.clipboard.writeText(url);
        alert("링크를 복사했어요.");
      }
      await load();
    } finally {
      setInviteBusy(false);
    }
  }

  if (!canonicalResolving && !myReportId) {
    return (
      <SpaceBackground>
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5">
          <GlassCard className="w-full max-w-sm space-y-4 text-center">
            <p className="text-xs text-[var(--space-text-muted)]">
              리포트에서 들어와 주세요.
            </p>
            <GlowButton type="button" className="!min-h-[44px] text-sm" onClick={() => router.push("/")}>
              홈으로
            </GlowButton>
          </GlassCard>
        </div>
      </SpaceBackground>
    );
  }

  return (
    <SpaceBackground>
      <div className="relative z-10 min-h-screen px-4 py-10 pb-28 sm:px-6">
        <div className="mx-auto max-w-lg space-y-5">
          <div className="text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#FFD6A5]/85">
              Orbit
            </p>
            <h1 className="mt-1 text-lg font-semibold text-[var(--space-text)] sm:text-xl">
              관계 허브
            </h1>
          </div>

          {canonicalResolving || loading ? (
            <p className="text-center text-xs text-[var(--space-text-muted)]">
              불러오는 중…
            </p>
          ) : err ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center">
              <p className="text-xs text-[var(--space-text-muted)]">{err}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center">
              <p className="text-xs text-[var(--space-text-muted)]">
                아직 관계 목록이 비어 있어요. 아래에서 초대 링크를 만들어 보세요.
              </p>
            </div>
          ) : (
            <ul className="space-y-3" role="list">
              {items.map((item, idx) => (
                <li
                  key={
                    item.list_key ??
                    `${item.relationship_report_id ?? "inv"}-${item.invite_token ?? idx}`
                  }
                >
                  <RelationshipCard item={item} myReportId={myReportId} />
                </li>
              ))}
            </ul>
          )}

          {meta?.manual_lists_note ? (
            <p className="text-center text-[11px] leading-relaxed text-[var(--space-text-muted)]">
              {meta.manual_lists_note}
            </p>
          ) : null}

          <GlassCard className="!bg-[rgba(10,14,24,0.5)] space-y-4 !p-4">
            <div className="space-y-3 rounded-xl border border-[#67B7FF]/30 bg-gradient-to-br from-[#67B7FF]/10 to-transparent p-4">
              <div className="flex items-center gap-2">
                <span className="text-lg" aria-hidden>
                  ➕
                </span>
                <h2 className="text-sm font-semibold text-[var(--space-text)]">
                  새 초대
                </h2>
              </div>
              <GlowButton
                type="button"
                disabled={inviteBusy}
                className="!min-h-[44px] w-full py-2.5 text-sm"
                onClick={() => void startNewInvite()}
              >
                {inviteBusy ? "잠깐만…" : "초대 링크 만들기"}
              </GlowButton>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(`/report?id=${encodeURIComponent(myReportId)}`)
              }
              className="w-full rounded-xl border border-white/15 py-2.5 text-xs text-[var(--space-text-muted)] transition hover:border-white/25 hover:text-[var(--space-text)]"
            >
              ← 내 리포트
            </button>
          </GlassCard>
        </div>
      </div>
    </SpaceBackground>
  );
}
