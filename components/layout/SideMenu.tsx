"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

function MenuRow({
  href,
  children,
  onNavigate,
  indent = 0,
}: {
  href: string;
  children: React.ReactNode;
  onNavigate: () => void;
  indent?: 0 | 1 | 2;
}) {
  const pad =
    indent === 2 ? "pl-8" : indent === 1 ? "pl-5" : "pl-3";
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`block rounded-lg ${pad} py-2.5 text-sm text-white/90 transition hover:bg-white/[0.06]`}
    >
      {children}
    </Link>
  );
}

function HubMenuRow({
  basePath,
  query = "",
  children,
  onNavigate,
  indent = 1,
}: {
  basePath: string;
  query?: string;
  children: React.ReactNode;
  onNavigate: () => void;
  indent?: 1 | 2;
}) {
  const router = useRouter();
  const pad = indent === 2 ? "pl-8" : "pl-5";

  return (
    <button
      type="button"
      onClick={() => {
        const id =
          typeof window !== "undefined"
            ? localStorage.getItem("reportId")?.trim() ?? ""
            : "";
        const qs = new URLSearchParams();
        if (id) qs.set("myReportId", id);
        if (query) {
          for (const [k, v] of new URLSearchParams(query)) {
            qs.set(k, v);
          }
        }
        const suffix = qs.toString() ? `?${qs.toString()}` : "";
        router.push(`${basePath}${suffix}`);
        onNavigate();
      }}
      className={`block w-full rounded-lg ${pad} py-2.5 text-left text-sm text-white/90 transition hover:bg-white/[0.06]`}
    >
      {children}
    </button>
  );
}

function SubBlock({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5 border-t border-white/[0.06] pt-3 first:border-t-0 first:pt-0">
      <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-5 pb-0.5 pt-2 text-[11px] font-medium text-white/50">
      {children}
    </p>
  );
}

export default function SideMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className={[
          "fixed inset-0 z-[225] bg-black/50 transition-opacity duration-300 md:bg-black/40",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        aria-hidden={!open}
        onClick={onClose}
      />
      <aside
        id="side-menu"
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        className={[
          "fixed left-0 top-0 z-[230] flex h-full w-[min(100%,20rem)] flex-col border-r border-white/10 bg-[#0a0f1a] shadow-[12px_0_48px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <span className="text-sm font-semibold text-white/95">☰ 나의 우주 탐사</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-lg leading-none text-white/55 transition hover:bg-white/10 hover:text-white"
            aria-label="메뉴 닫기"
          >
            ×
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-2 py-3">
          <MenuRow href="/" onNavigate={onClose}>
            🚀 나의 탐사실 (홈)
          </MenuRow>
          <MenuRow href="/dashboard" onNavigate={onClose}>
            📊 대시보드
          </MenuRow>

          <SubBlock title="🌌 탐험하기">
            <MenuRow href="/" onNavigate={onClose} indent={1}>
              ✨ 새로운 기본탐사
            </MenuRow>
            <MenuRow href="/report" onNavigate={onClose} indent={1}>
              📋 기본탐사
            </MenuRow>
            <GroupLabel>관계탐사</GroupLabel>
            <HubMenuRow
              basePath="/relationships"
              query="section=list"
              onNavigate={onClose}
              indent={2}
            >
              👥 친구 분석
            </HubMenuRow>
            <HubMenuRow
              basePath="/relationships"
              query="section=add"
              onNavigate={onClose}
              indent={2}
            >
              ➕ 친구 추가
            </HubMenuRow>
          </SubBlock>

          <SubBlock title="📚 탐사 안내">
            <MenuRow href="/about" onNavigate={onClose}>
              🌟 서비스 소개
            </MenuRow>
            <MenuRow href="/faq" onNavigate={onClose}>
              ❓ 자주 묻는 질문
            </MenuRow>
            <MenuRow href="/contact" onNavigate={onClose}>
              📞 문의하기
            </MenuRow>
            <MenuRow href="/terms" onNavigate={onClose}>
              📜 Terms of Service
            </MenuRow>
            <MenuRow href="/privacy" onNavigate={onClose}>
              🔒 Privacy Policy
            </MenuRow>
            <MenuRow href="/refund" onNavigate={onClose}>
              💳 Refund Policy
            </MenuRow>
          </SubBlock>

          <SubBlock title="⚙️ 설정">
            <MenuRow href="/account" onNavigate={onClose}>
              👤 프로필
            </MenuRow>
            <button
              type="button"
              onClick={() => {
                alert("알림 설정은 곧 제공될 예정이에요.");
              }}
              className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-white/90 transition hover:bg-white/[0.06]"
            >
              🔔 알림 설정
            </button>
            <button
              type="button"
              onClick={() => {
                alert("메일 수신 설정은 곧 제공될 예정이에요.");
              }}
              className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-white/90 transition hover:bg-white/[0.06]"
            >
              📧 홍보 메일 수신동의
            </button>
          </SubBlock>
        </nav>

        <div className="border-t border-white/10 px-4 py-3 text-[11px] text-white/40">
          ℹ️ 버전 1.0.0
        </div>
      </aside>
    </>
  );
}
