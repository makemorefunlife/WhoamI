"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "@/components/brand/Logo";
import {
  blueprintPath,
  DECISION_HUB_LABEL,
  DECISION_HUB_PATH,
  relationHubPath,
} from "@/lib/stitch/hubPaths";

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refund", label: "Refund" },
] as const;

export default function StitchAppFooter() {
  const pathname = usePathname();
  const [reportId, setReportId] = useState("");

  useEffect(() => {
    setReportId(
      typeof window !== "undefined"
        ? localStorage.getItem("reportId")?.trim() ?? ""
        : "",
    );
  }, [pathname]);

  if (pathname === "/") return null;

  return (
    <footer className="mt-auto border-t border-outline-variant/30 bg-surface-container-low/35 px-5 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center gap-2.5">
          <Logo size={24} href="/" onLightBackground />
          <p className="text-sm font-semibold text-primary">Aha It&apos;s me!</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
            Journey
          </p>
          <nav
            className="mt-3 flex flex-wrap gap-x-5 gap-y-2"
            aria-label="Hub navigation"
          >
            <Link
              href={blueprintPath(reportId)}
              className="text-sm text-on-surface-variant transition hover:text-primary"
            >
              Personal Analysis
            </Link>
            <Link
              href={relationHubPath(reportId)}
              className="text-sm font-medium text-primary transition hover:text-secondary"
            >
              Relation Hub
            </Link>
            <Link
              href={DECISION_HUB_PATH}
              className="text-sm text-on-surface-variant transition hover:text-primary"
            >
              {DECISION_HUB_LABEL}
            </Link>
          </nav>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/25 pt-5 text-[11px] text-on-surface-variant">
          <nav className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Legal">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p>© {new Date().getFullYear()} Aha It&apos;s me!</p>
        </div>
      </div>
    </footer>
  );
}
