"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/brand/Logo";
import {
  Compass,
  GitBranch,
  Home,
  Scale,
  Sparkles,
  UserRound,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";

const NAV_ITEMS = [
  {
    href: "/blueprint-preview",
    label: "나",
    sub: "Blueprint",
    desc: "6축 블루프린트 · 무료 리포트",
    icon: Compass,
    accent: "from-[#8b9cff]/20 to-[#6366f1]/5",
    border: "border-[#8b9cff]/25",
    needsReportId: true,
    queryKey: "reportId",
  },
  {
    href: "/",
    label: "나의 탐사실",
    desc: "홈 · 새 탐사 시작",
    icon: Home,
    accent: "from-[#6bb5ff]/20 to-[#4a90e2]/5",
    border: "border-[#6bb5ff]/25",
  },
  {
    href: "/relationships",
    label: "관계 분석",
    sub: "5대 탭",
    desc: "연인 · 동료 · 가족 · 친구",
    icon: GitBranch,
    accent: "from-[#f472b6]/15 to-[#ec4899]/5",
    border: "border-[#f472b6]/25",
    needsReportId: true,
    queryKey: "myReportId",
  },
  {
    href: "/decision",
    label: "결정 도우미",
    sub: "Decision AI",
    desc: "선택장애 · 의사결정 코치",
    icon: Scale,
    accent: "from-[#34d399]/15 to-[#10b981]/5",
    border: "border-[#34d399]/25",
    badge: "NEW",
  },
] as const;

const FOOTER_LINKS = [
  { href: ROUTES.about, label: "서비스 소개" },
  { href: ROUTES.pricing, label: "요금 안내" },
  { href: ROUTES.faq, label: "FAQ" },
  { href: ROUTES.contact, label: "고객지원" },
  { href: ROUTES.terms, label: "이용약관" },
  { href: ROUTES.privacy, label: "개인정보" },
  { href: ROUTES.refund, label: "환불정책" },
  { href: ROUTES.accountProfile, label: "내 정보" },
  { href: ROUTES.accountBilling, label: "결제 내역" },
] as const;

function NavCard({
  item,
  onNavigate,
}: {
  item: (typeof NAV_ITEMS)[number];
  onNavigate: () => void;
}) {
  const router = useRouter();
  const Icon = item.icon;

  const handleClick = () => {
    if ("needsReportId" in item && item.needsReportId) {
      const id =
        typeof window !== "undefined"
          ? localStorage.getItem("reportId")?.trim() ?? ""
          : "";
      const qs = new URLSearchParams();
      if (id && item.queryKey) qs.set(item.queryKey, id);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      router.push(`${item.href}${suffix}`);
    } else {
      router.push(item.href);
    }
    onNavigate();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        "group relative w-full overflow-hidden rounded-2xl border bg-gradient-to-br p-4 text-left transition duration-200",
        "hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)]",
        item.border,
        item.accent,
      ].join(" ")}
    >
      {"badge" in item && item.badge ? (
        <span className="absolute right-3 top-3 rounded-full bg-[#34d399]/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#6ee7b7]">
          {item.badge}
        </span>
      ) : null}
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-white/90">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1 pr-6">
          <p className="text-[15px] font-semibold tracking-[-0.02em] text-white">
            {item.label}
            {"sub" in item && item.sub ? (
              <span className="ml-1.5 text-xs font-medium text-white/45">
                ({item.sub})
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-white/50">
            {item.desc}
          </p>
        </div>
      </div>
    </button>
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
          "fixed inset-0 z-[225] bg-black/55 backdrop-blur-[2px] transition-opacity duration-300",
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
          "fixed left-0 top-0 z-[230] flex h-full w-[min(100%,22rem)] flex-col border-r border-white/[0.08] bg-[#070b14]/95 shadow-[16px_0_64px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Logo size={22} href={null} />
            <div>
              <p className="text-sm font-semibold tracking-[-0.02em] text-white/95">
                Ahaitsme
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
                나 · 관계 · 결정
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-lg leading-none text-white/50 transition hover:bg-white/10 hover:text-white"
            aria-label="메뉴 닫기"
          >
            ×
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-4 py-5">
          <p className="mb-3 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
            <Sparkles className="h-3 w-3" />
            메인 허브
          </p>
          <div className="space-y-2.5">
            {NAV_ITEMS.map((item) => (
              <NavCard key={item.href} item={item} onNavigate={onClose} />
            ))}
          </div>

          <div className="mt-8 border-t border-white/[0.06] pt-5">
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
              더 알아보기
            </p>
            <div className="flex flex-wrap gap-1.5">
              {FOOTER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-white/65 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white/90"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="border-t border-white/[0.06] px-5 py-3.5">
          <div className="flex items-center gap-2 text-[11px] text-white/40">
            <UserRound className="h-3.5 w-3.5" />
            <span>v2 · Human Framework</span>
          </div>
        </div>
      </aside>
    </>
  );
}
