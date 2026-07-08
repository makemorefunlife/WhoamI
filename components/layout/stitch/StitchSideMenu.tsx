"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/brand/Logo";
import { ROUTES } from "@/constants/routes";
import {
  Compass,
  GitBranch,
  Home,
  Scale,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  blueprintPath,
  DECISION_HUB_LABEL,
  DECISION_HUB_PATH,
  relationHubPath,
} from "@/lib/stitch/hubPaths";

const NAV_ITEMS = [
  {
    href: "/blueprint-preview",
    label: "나",
    sub: "Blueprint",
    desc: "6축 블루프린트 · 무료 리포트",
    icon: Compass,
  },
  {
    href: "/",
    label: "홈",
    desc: "탐사 시작 · 대시보드",
    icon: Home,
  },
  {
    href: "/relationships",
    label: "관계",
    sub: "Relation Hub",
    desc: "연인 · 동료 · 가족 · 친구",
    icon: GitBranch,
  },
  {
    href: "/decision",
    label: DECISION_HUB_LABEL,
    sub: "Decision",
    desc: "선택 · 의사결정 코치",
    icon: Scale,
    badge: "NEW",
  },
] as const;

function resolveNavHref(href: string): string {
  if (href === "/blueprint-preview") return blueprintPath();
  if (href === "/relationships") return relationHubPath();
  if (href === "/decision") return DECISION_HUB_PATH;
  return href;
}

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
    router.push(resolveNavHref(item.href));
    onNavigate();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group w-full rounded-2xl border border-outline-variant/45 bg-surface-container-low/80 p-4 text-left transition hover:border-primary/25 hover:bg-surface-container-low hover:shadow-sm"
    >
      {"badge" in item && item.badge ? (
        <span className="mb-2 inline-flex rounded-full bg-accent-emerald-soft px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary">
          {item.badge}
        </span>
      ) : null}
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-outline-variant/40 bg-surface text-primary">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold tracking-[-0.02em] text-primary">
            {item.label}
            {"sub" in item && item.sub ? (
              <span className="ml-1.5 text-xs font-medium text-on-surface-variant">
                ({item.sub})
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-on-surface-variant">
            {item.desc}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function StitchSideMenu({
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
          "fixed inset-0 z-[225] bg-primary/25 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        aria-hidden={!open}
        onClick={onClose}
      />
      <aside
        id="stitch-side-menu"
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        className={[
          "fixed left-0 top-0 z-[230] flex h-full w-[min(100%,22rem)] flex-col border-r border-outline-variant/40 bg-[#fffdf8]/98 shadow-[16px_0_48px_rgba(26,51,40,0.12)] backdrop-blur-xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-outline-variant/35 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Logo size={22} href={null} onLightBackground />
            <div>
              <p className="text-sm font-semibold tracking-[-0.02em] text-primary">
                Aha It&apos;s me!
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-on-surface-variant">
                나 · 관계 · 결정
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-lg leading-none text-on-surface-variant transition hover:bg-surface-container-low hover:text-primary"
            aria-label="메뉴 닫기"
          >
            ×
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-4 py-5">
          <p className="mb-3 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
            <Sparkles className="h-3 w-3" />
            Main hub
          </p>
          <div className="space-y-2.5">
            {NAV_ITEMS.map((item) => (
              <NavCard key={item.href} item={item} onNavigate={onClose} />
            ))}
          </div>

          <div className="mt-8 border-t border-outline-variant/35 pt-5">
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              Legal &amp; more
            </p>
            <div className="flex flex-wrap gap-1.5">
              {FOOTER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="rounded-lg border border-outline-variant/40 bg-surface-container-low/60 px-2.5 py-1.5 text-[11px] text-on-surface-variant transition hover:border-primary/25 hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="border-t border-outline-variant/35 px-5 py-3.5">
          <div className="flex items-center gap-2 text-[11px] text-on-surface-variant">
            <UserRound className="h-3.5 w-3.5" />
            <span>Human Framework</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export function stitchDockActivePath(pathname: string): "home" | "me" | "relations" | "decision" | null {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/blueprint-preview")) return "me";
  if (pathname.startsWith("/relationships") || pathname.startsWith("/relationship/")) {
    return "relations";
  }
  if (pathname.startsWith("/decision")) return "decision";
  return null;
}
