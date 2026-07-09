"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "@/components/brand/Logo";
import { ROUTES } from "@/constants/routes";
import { ChevronRight } from "lucide-react";
import {
  blueprintPath,
  DECISION_HUB_PATH,
  readStoredReportId,
  relationHubPath,
} from "@/lib/stitch/hubPaths";
const NAV_ITEMS = [
  {
    href: "/",
    title: "Dashboard",
    subtitle: "Your Journey Starts Here",
  },
  {
    href: "/blueprint-preview",
    title: "My Blueprint",
    subtitle: "Uncover Your True Design",
  },
  {
    href: "/relationships",
    title: "Relation Lab",
    subtitle: "Decode Your Chemistry",
    badge: "NEW" as const,
  },
  {
    href: "/decision",
    title: "Choice Engine",
    subtitle: "Navigate Your Next Move",
  },
] as const;

const FOOTER_GROUPS = [
  {
    id: "account",
    label: "Account",
    links: [
      { href: ROUTES.accountProfile, label: "My Profile" },
      { href: ROUTES.accountBilling, label: "Billing History" },
    ],
  },
  {
    id: "support",
    label: "Support",
    links: [
      { href: ROUTES.about, label: "About Service" },
      { href: ROUTES.pricing, label: "Pricing" },
      { href: ROUTES.faq, label: "FAQ" },
      { href: ROUTES.contact, label: "Contact Support" },
    ],
  },
  {
    id: "legal",
    label: "Legal",
    links: [
      { href: ROUTES.terms, label: "Terms of Service" },
      { href: ROUTES.privacy, label: "Privacy Policy" },
      { href: ROUTES.refund, label: "Refund Policy" },
    ],
  },
] as const;

function resolveNavHref(href: string, reportId: string): string {
  if (href === "/blueprint-preview") return blueprintPath(reportId);
  if (href === "/relationships") return relationHubPath(reportId);
  if (href === "/decision") return DECISION_HUB_PATH;
  return href;
}

function NavRow({
  item,
  href,
  onNavigate,
}: {
  item: (typeof NAV_ITEMS)[number];
  href: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-4 text-left transition hover:bg-surface-container-low/80 active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-xl font-bold tracking-[-0.03em] text-primary sm:text-[1.35rem]">
            {item.title}
          </p>
          {"badge" in item && item.badge ? (
            <span className="rounded-full bg-secondary/12 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-secondary">
              {item.badge}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-[13px] font-normal leading-snug text-on-surface-variant/75">
          {item.subtitle}
        </p>
      </div>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-on-surface-variant/35 transition group-hover:text-on-surface-variant/70"
        strokeWidth={1.75}
        aria-hidden
      />
    </Link>
  );
}

export default function StitchSideMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [reportId, setReportId] = useState("");

  useEffect(() => {
    setReportId(readStoredReportId());
  }, []);

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
            <Logo size={22} href="/" onLightBackground />
            <div>
              <p className="text-sm font-semibold tracking-[-0.02em] text-primary">
                Aha It&apos;s me!
              </p>
              <p className="text-[10px] font-medium tracking-[0.04em] text-on-surface-variant/70">
                Know yourself better
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-lg leading-none text-on-surface-variant/70 transition hover:bg-surface-container-low hover:text-primary"
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 pb-8 pt-2">
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <NavRow
                key={item.href}
                item={item}
                href={resolveNavHref(item.href, reportId)}
                onNavigate={onClose}
              />
            ))}
          </div>

          <div className="mt-10 space-y-3.5 border-t border-outline-variant/30 px-1 pt-5">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.id}>
                <p className="mb-0.5 px-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant/50">
                  {group.label}
                </p>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className="block rounded-md px-2 py-1 text-[11px] font-light leading-snug text-on-surface-variant/75 transition hover:bg-surface-container-low/70 hover:text-primary"
                      >
                        {link.label}
                      </Link>
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
  if (pathname === "/") return "home";
  if (pathname.startsWith("/blueprint-preview")) return "me";
  if (
    pathname.startsWith("/relationships") ||
    pathname.startsWith("/relationship/")
  ) {
    return "relations";
  }
  if (pathname.startsWith("/decision")) return "decision";
  return null;
}
