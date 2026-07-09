"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useClerk } from "@clerk/nextjs";
import { Compass, Home, Scale, Users } from "lucide-react";
import { useClerkReady } from "@/lib/clerk/useClerkReady";
import { stitchDockActivePath } from "@/components/layout/stitch/StitchSideMenu";
import {
  blueprintPath,
  DECISION_HUB_PATH,
  relationHubPath,
} from "@/lib/stitch/hubPaths";

const SCROLL_DOWN_THRESHOLD = 10;
const TOP_HIDE_Y = 24;

const dockItemClass = (active: boolean) =>
  `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1 transition-colors ${
    active
      ? "text-accent-emerald"
      : "text-on-surface-variant hover:text-accent-emerald"
  }`;

function DockLink({
  label,
  active,
  href,
  children,
}: {
  label: string;
  active?: boolean;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} prefetch className={dockItemClass(Boolean(active))}>
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full ${
          active ? "bg-accent-emerald-soft" : ""
        }`}
      >
        {children}
      </span>
      <span className="text-[10px] font-medium leading-none sm:text-xs">
        {label}
      </span>
    </Link>
  );
}

function DockButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={dockItemClass(Boolean(active))}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full ${
          active ? "bg-accent-emerald-soft" : ""
        }`}
      >
        {children}
      </span>
      <span className="text-[10px] font-medium leading-none sm:text-xs">
        {label}
      </span>
    </button>
  );
}

export default function StitchScrollDock({
  onOpenAuth,
}: {
  onOpenAuth?: () => void;
}) {
  const pathname = usePathname();
  const { openSignIn } = useClerk();
  const { isSignedIn } = useClerkReady();
  const [visible, setVisible] = useState(false);
  const [reportId, setReportId] = useState("");
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const active = stitchDockActivePath(pathname);

  useEffect(() => {
    setReportId(localStorage.getItem("reportId")?.trim() ?? "");
  }, [pathname]);

  const evaluateVisibility = useCallback(() => {
    const y = window.scrollY;
    const delta = y - lastScrollY.current;

    if (y <= TOP_HIDE_Y) {
      setVisible(false);
    } else if (delta > SCROLL_DOWN_THRESHOLD) {
      setVisible(true);
    } else if (delta < -SCROLL_DOWN_THRESHOLD) {
      setVisible(false);
    }

    lastScrollY.current = y;
    ticking.current = false;
  }, []);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    setVisible(false);

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      window.requestAnimationFrame(evaluateVisibility);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [evaluateVisibility, pathname]);

  return (
    <div
      className={[
        "fixed bottom-4 left-1/2 z-[195] w-[min(100%,28rem)] -translate-x-1/2 px-4 pb-[env(safe-area-inset-bottom)] transition-all duration-300 ease-out sm:bottom-6",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-[calc(100%+1.5rem)] opacity-0",
      ].join(" ")}
    >
      <nav
        className="flex h-[4.25rem] w-full items-stretch justify-between gap-1 rounded-full border border-outline-variant/30 bg-[#fffdf8]/95 px-2 shadow-[0_12px_40px_rgba(26,51,40,0.14)] backdrop-blur-xl"
        aria-label="Main navigation"
        aria-hidden={!visible}
      >
        <DockLink label="Home" active={active === "home"} href="/">
          <Home className="h-5 w-5" strokeWidth={2} aria-hidden />
        </DockLink>
        {reportId || isSignedIn ? (
          <DockLink
            label="Me"
            active={active === "me"}
            href={blueprintPath(reportId)}
          >
            <Compass className="h-5 w-5" strokeWidth={2} aria-hidden />
          </DockLink>
        ) : (
          <DockButton
            label="Me"
            active={active === "me"}
            onClick={() => {
              if (pathname === "/" && onOpenAuth) {
                onOpenAuth();
                return;
              }
              openSignIn?.({
                forceRedirectUrl: pathname || "/",
              });
            }}
          >
            <Compass className="h-5 w-5" strokeWidth={2} aria-hidden />
          </DockButton>
        )}
        <DockLink
          label="Lab"
          active={active === "relations"}
          href={relationHubPath(reportId)}
        >
          <Users className="h-5 w-5" strokeWidth={2} aria-hidden />
        </DockLink>
        <DockLink
          label="Choice"
          active={active === "decision"}
          href={DECISION_HUB_PATH}
        >
          <Scale className="h-5 w-5" strokeWidth={2} aria-hidden />
        </DockLink>
      </nav>
    </div>
  );
}
