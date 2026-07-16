"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/brand/Logo";
import LocaleLink from "@/lib/i18n/LocaleLink";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { pathnameWithoutLocalePrefix } from "@/lib/i18n/locale";
import { ROUTES } from "@/constants/routes";
import { ChevronRight } from "lucide-react";
import {
  blueprintPath,
  DECISION_HUB_PATH,
  readStoredReportId,
  relationHubPath,
} from "@/lib/stitch/hubPaths";
import { useAppSession } from "@/lib/routing/useAppSession";
import { useHydrated } from "@/lib/hooks/useHydrated";

function resolveNavHref(href: string, reportId: string): string {
  if (href === "/blueprint-preview") return blueprintPath(reportId);
  if (href === "/relationships") return relationHubPath(reportId);
  if (href === "/decision") return DECISION_HUB_PATH;
  return href;
}

function NavRow({
  title,
  subtitle,
  badge,
  href,
  onNavigate,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  href: string;
  onNavigate: () => void;
}) {
  return (
    <LocaleLink
      href={href}
      onClick={onNavigate}
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-4 text-left transition hover:bg-surface-container-low/80 active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-xl font-bold tracking-[-0.03em] text-primary sm:text-[1.35rem]">
            {title}
          </p>
          {badge ? (
            <span className="rounded-full bg-secondary/12 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-secondary">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-[13px] font-normal leading-snug text-on-surface-variant/75">
          {subtitle}
        </p>
      </div>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-on-surface-variant/35 transition group-hover:text-on-surface-variant/70"
        strokeWidth={1.75}
        aria-hidden
      />
    </LocaleLink>
  );
}

export default function StitchSideMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { messages, locale, href: localize } = useLocale();
  const [storedReportId, setStoredReportId] = useState("");
  const hydrated = useHydrated();
  const { reportId: sessionReportId } = useAppSession({ hydrate: false });

  useEffect(() => {
    setStoredReportId(readStoredReportId());
  }, []);

  const reportId = hydrated
    ? sessionReportId?.trim() || storedReportId
    : "";

  const navItems = [
    {
      href: "/",
      title: messages.nav.dashboard,
      subtitle:
        locale === "ko-KR" ? "당신의 여정이 여기서 시작됩니다" : "Your Journey Starts Here",
    },
    {
      href: "/blueprint-preview",
      title: messages.nav.blueprint,
      subtitle:
        locale === "ko-KR" ? "진짜 설계를 발견하세요" : "Uncover Your True Design",
    },
    {
      href: "/relationships",
      title: messages.nav.relationLab,
      subtitle:
        locale === "ko-KR" ? "관계의 케미스트리를 해독하세요" : "Decode Your Chemistry",
      badge: "NEW",
    },
    {
      href: "/decision",
      title: messages.nav.decision,
      subtitle:
        locale === "ko-KR" ? "다음 선택을 안내합니다" : "Navigate Your Next Move",
    },
  ];

  const footerGroups = [
    {
      id: "account",
      label: messages.account.title,
      links: [
        { href: ROUTES.accountProfile, label: messages.account.profile },
        { href: ROUTES.accountBilling, label: messages.account.billing },
      ],
    },
    {
      id: "support",
      label: messages.footer.support,
      links: [
        { href: ROUTES.about, label: messages.nav.about },
        { href: ROUTES.pricing, label: messages.nav.pricing },
        { href: ROUTES.faq, label: messages.nav.faq },
        { href: ROUTES.contact, label: messages.nav.contact },
      ],
    },
    {
      id: "legal",
      label: messages.footer.legal,
      links: [
        { href: ROUTES.terms, label: messages.footer.terms },
        { href: ROUTES.privacy, label: messages.footer.privacy },
        { href: ROUTES.refund, label: messages.footer.refund },
      ],
    },
  ];

  return (
    <>
      <div
        className={[
          "fixed inset-0 z-[225] bg-primary/20 backdrop-blur-[2px] transition-opacity duration-300",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
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
          "fixed left-0 top-0 z-[230] flex h-full w-[min(100%,21.5rem)] flex-col border-r border-outline-variant/35 bg-[#fffdf8]/98 shadow-[16px_0_48px_rgba(26,51,40,0.1)] backdrop-blur-xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <div className="flex items-center gap-2.5">
            <Logo size={22} href={localize("/")} onLightBackground />
            <div>
              <p className="text-sm font-semibold tracking-[-0.02em] text-primary">
                Aha It&apos;s me!
              </p>
              <p className="text-[10px] font-medium tracking-[0.04em] text-on-surface-variant/70">
                {locale === "ko-KR" ? "나 자신을 더 잘 알기" : "Know yourself better"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-lg leading-none text-on-surface-variant/70 transition hover:bg-surface-container-low hover:text-primary"
            aria-label={messages.common.close}
          >
            ×
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 pb-8 pt-2">
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <NavRow
                key={item.href}
                title={item.title}
                subtitle={item.subtitle}
                badge={item.badge}
                href={resolveNavHref(item.href, reportId)}
                onNavigate={onClose}
              />
            ))}
          </div>

          <div className="mt-10 space-y-3.5 border-t border-outline-variant/30 px-1 pt-5">
            {footerGroups.map((group) => (
              <div key={group.id}>
                <p className="mb-0.5 px-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant/50">
                  {group.label}
                </p>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <LocaleLink
                        href={link.href}
                        onClick={onClose}
                        className="block rounded-md px-2 py-1 text-[11px] font-light leading-snug text-on-surface-variant/75 transition hover:bg-surface-container-low/70 hover:text-primary"
                      >
                        {link.label}
                      </LocaleLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}

export function stitchDockActivePath(
  pathname: string,
): "home" | "me" | "relations" | "decision" | null {
  const path = pathnameWithoutLocalePrefix(pathname);
  if (path === "/") return "home";
  if (path.startsWith("/blueprint-preview")) return "me";
  if (
    path.startsWith("/relationships") ||
    path.startsWith("/relationship/")
  ) {
    return "relations";
  }
  if (path.startsWith("/decision")) return "decision";
  return null;
}
