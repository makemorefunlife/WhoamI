import Link from "next/link";
import { ROUTES } from "@/constants/routes";

const footerLinks = [
  { href: ROUTES.faq, label: "FAQ" },
  { href: ROUTES.contact, label: "Contact" },
  { href: ROUTES.privacy, label: "Privacy Policy" },
  { href: ROUTES.terms, label: "Terms of Service" },
  { href: ROUTES.refund, label: "Refund Policy" },
] as const;

export default function SiteFooter() {
  return (
    <footer className="relative z-10 mt-auto border-t border-white/[0.08] bg-[#0a0f1a]/80 px-4 py-6 backdrop-blur-sm sm:px-6">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 text-center">
        <nav
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
          aria-label="Legal and contact links"
        >
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-[var(--space-text-muted)] underline-offset-2 transition hover:text-[var(--space-text)] hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-[11px] text-white/35">
          © {new Date().getFullYear()} Ahaitsme. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
