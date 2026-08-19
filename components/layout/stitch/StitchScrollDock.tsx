"use client";

import LocaleLink from "@/lib/i18n/LocaleLink";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useClerk } from "@clerk/nextjs";
import { Compass, Home, Scale, Users } from "lucide-react";
import { useClerkReady } from "@/lib/clerk/useClerkReady";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useAppSession } from "@/lib/routing/useAppSession";
import { stitchDockActivePath } from "@/components/layout/stitch/StitchSideMenu";
import {
  blueprintPath,
  DECISION_HUB_PATH,
  relationHubPath,
} from "@/lib/stitch/hubPaths";
import {
  RELATION_HUB_DOCK_LOCK_MESSAGE,
  subscribeRelationHubDockLock,
} from "@/lib/stitch/relationHubDockLock";

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
    <LocaleLink href={href} prefetch className={dockItemClass(Boolean(active))}>
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
    </LocaleLink>
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
  const { messages } = useLocale();
  const { openSignIn } = useClerk();
  const { isSignedIn } = useClerkReady();
  const hydrated = useHydrated();
  const { reportId: sessionReportId } = useAppSession({ hydrate: false });
  const [visible, setVisible] = useState(false);
  const [storedReportId, setStoredReportId] = useState("");
  const [hubDockLocked, setHubDockLocked] = useState(false);
  const [lockToastVisible, setLockToastVisible] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const lockToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = stitchDockActivePath(pathname);
  const onRelationHub =
    pathname === "/relationships" || pathname?.startsWith("/relationships/");
  const dockShown = visible || (hubDockLocked && onRelationHub);
  const dockLockedOnPage = hubDockLocked && onRelationHub;

  useEffect(() => {
    return subscribeRelationHubDockLock(setHubDockLocked);
  }, []);

  useEffect(() => {
    setStoredReportId(localStorage.getItem("reportId")?.trim() ?? "");
  }, [pathname]);

  const reportId = hydrated
    ? sessionReportId?.trim() || storedReportId
    : "";
  const showMeLink = hydrated && Boolean(reportId || isSignedIn);

  const showLockToast = useCallback(() => {
    setLockToastVisible(true);
    if (lockToastTimer.current) clearTimeout(lockToastTimer.current);
    lockToastTimer.current = setTimeout(() => {
      setLockToastVisible(false);
    }, 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (lockToastTimer.current) clearTimeout(lockToastTimer.current);
    };
  }, []);

  const evaluateVisibility = useCallback(() => {
    const y = window.scrollY;
    if (y > 80) {
      setVisible(true);
    } else {
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
    <>
      {lockToastVisible ? (
        <div
          className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-[196] w-[min(100%,20rem)] -translate-x-1/2 rounded-xl border border-outline-variant/40 bg-primary px-4 py-3 text-center text-xs font-medium text-on-primary shadow-lg"
          role="status"
        >
          {RELATION_HUB_DOCK_LOCK_MESSAGE}
        </div>
      ) : null}
      <div
        className={[
          "fixed bottom-4 left-1/2 z-[195] w-[min(100%,28rem)] -translate-x-1/2 px-4 pb-[env(safe-area-inset-bottom)] transition-all duration-300 ease-out sm:bottom-6",
          dockShown
            ? `translate-y-0 ${dockLockedOnPage ? "opacity-30" : "opacity-100"}`
            : "pointer-events-none translate-y-[calc(100%+1.5rem)] opacity-0",
        ].join(" ")}
      >
        <div className="relative">
          {dockLockedOnPage && dockShown ? (
            <button
              type="button"
              className="absolute inset-0 z-10 rounded-full"
              aria-label={RELATION_HUB_DOCK_LOCK_MESSAGE}
              onClick={showLockToast}
            />
          ) : null}
          <nav
            className={[
              "flex h-[4.25rem] w-full items-stretch justify-between gap-1 rounded-full border border-outline-variant/30 bg-surface-container-lowest/95 px-2 shadow-[0_12px_40px_rgba(26,51,40,0.14)] backdrop-blur-xl",
              dockLockedOnPage ? "pointer-events-none" : "",
            ].join(" ")}
            aria-label="Main navigation"
            aria-hidden={!dockShown}
          >
        <DockLink label={messages.dock.home} active={active === "home"} href="/">
          <Home className="h-5 w-5" strokeWidth={2} aria-hidden />
        </DockLink>
        {showMeLink ? (
          <DockLink
            label={messages.dock.me}
            active={active === "me"}
            href={blueprintPath(reportId)}
          >
            <Compass className="h-5 w-5" strokeWidth={2} aria-hidden />
          </DockLink>
        ) : (
          <DockButton
            label={messages.dock.me}
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
          label={messages.dock.lab}
          active={active === "relations"}
          href={relationHubPath(reportId)}
        >
          <Users className="h-5 w-5" strokeWidth={2} aria-hidden />
        </DockLink>
        <DockLink
          label={messages.dock.choice}
          active={active === "decision"}
          href={DECISION_HUB_PATH}
        >
          <Scale className="h-5 w-5" strokeWidth={2} aria-hidden />
        </DockLink>
        </nav>
        </div>
      </div>
    </>
  );
}
