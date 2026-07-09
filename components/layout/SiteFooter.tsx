import Link from "next/link";
import { ROUTES } from "@/constants/routes";

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

export default function SiteFooter() {
  return (
    <footer className="relative z-10 mt-auto border-t border-white/[0.08] bg-[#0a0f1a]/80 px-4 py-6 backdrop-blur-sm sm:px-6">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-5 text-center">
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3 sm:text-left">
          {FOOTER_GROUPS.map((group) => (
            <div key={group.id}>
              <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/35">
                {group.label}
              </p>
              <nav className="flex flex-col gap-1" aria-label={group.label}>
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-[11px] font-light text-[var(--space-text-muted)] underline-offset-2 transition hover:text-[var(--space-text)] hover:underline"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-white/35">
          © {new Date().getFullYear()} Aha It&apos;s me! All rights reserved.
        </p>
      </div>
    </footer>
  );
}
