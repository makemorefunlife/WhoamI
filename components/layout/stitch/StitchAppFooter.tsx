"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export default function StitchAppFooter() {
  const pathname = usePathname();

  if (pathname === ROUTES.home) return null;

  return (
    <footer className="mt-auto border-t border-outline-variant/30 bg-surface-container-low/35 px-5 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <p className="text-sm font-semibold text-primary">
          <Link href="/" className="transition hover:opacity-80">
            Aha It&apos;s me!
          </Link>
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {FOOTER_GROUPS.map((group) => (
            <div key={group.id}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant/60">
                {group.label}
              </p>
              <ul className="space-y-1.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[12px] font-normal text-on-surface-variant transition hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="border-t border-outline-variant/25 pt-5 text-[11px] text-on-surface-variant">
          © {new Date().getFullYear()} Aha It&apos;s me!
        </p>
      </div>
    </footer>
  );
}
