"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/brand/Logo";
import { ChevronRight } from "lucide-react";
import { ROUTES } from "@/constants/routes";

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
    needsReportId: true,
    queryKey: "reportId",
  },
  {
    href: "/relationships",
    title: "Relation Lab",
    subtitle: "Decode Your Chemistry",
    needsReportId: true,
    queryKey: "myReportId",
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

function NavRow({
  item,
  onNavigate,
}: {
  item: (typeof NAV_ITEMS)[number];
  onNavigate: () => void;
}) {
  const router = useRouter();

  const handleClick = () => {
    if ("needsReportId" in item && item.needsReportId) {
      const id =
        typeof window !== "undefined"
          ? (localStorage.getItem("reportId")?.trim() ?? "")
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
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-4 text-left transition hover:bg-white/[0.06] active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-xl font-bold tracking-[-0.03em] text-white/95 sm:text-[1.35rem]">
            {item.title}
          </p>
          {"badge" in item && item.badge ? (
            <span className="rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-emerald-300/90">
              {item.badge}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-[13px] font-normal leading-snug text-white/45">
          {item.subtitle}
        </p>
      </div>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-white/25 transition group-hover:text-white/50"
        strokeWidth={1.75}
        aria-hidden
      />
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
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
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
          "fixed left-0 top-0 z-[230] flex h-full w-[min(100%,21.5rem)] flex-col border-r border-white/[0.08] bg-[#070b14]/95 shadow-[16px_0_64px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <div className="flex items-center gap-2.5">
            <Logo size={22} href="/" />
            <div>
              <p className="text-sm font-semibold tracking-[-0.02em] text-white/95">
                Aha It&apos;s me!
              </p>
              <p className="text-[10px] font-medium tracking-[0.04em] text-white/40">
                Know yourself better
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-lg leading-none text-white/50 transition hover:bg-white/10 hover:text-white"
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 pb-8 pt-2">
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <NavRow key={item.href} item={item} onNavigate={onClose} />
            ))}
          </div>

          <div className="mt-10 space-y-3.5 border-t border-white/[0.08] px-1 pt-5">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.id}>
                <p className="mb-0.5 px-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30">
                  {group.label}
                </p>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className="block rounded-md px-2 py-1 text-[11px] font-light leading-snug text-white/50 transition hover:bg-white/[0.05] hover:text-white/80"
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
