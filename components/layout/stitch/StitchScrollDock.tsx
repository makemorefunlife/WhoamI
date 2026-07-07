"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Compass, Home, Scale, Users } from "lucide-react";
import { useClerkReady } from "@/lib/clerk/useClerkReady";
import { stitchDockActivePath } from "@/components/layout/stitch/StitchSideMenu";

function DockItem({
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
      className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1 transition-colors ${
        active
          ? "text-accent-emerald"
          : "text-on-surface-variant hover:text-accent-emerald"
      }`}
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
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn } = useClerkReady();
  const [visible, setVisible] = useState(false);
  const [reportId, setReportId] = useState("");

  const active = stitchDockActivePath(pathname);

  useEffect(() => {
    setReportId(localStorage.getItem("reportId")?.trim() ?? "");
  }, [pathname]);

  const evaluateVisibility = useCallback(() => {
    const y = window.scrollY;
    const docH = document.documentElement.scrollHeight;
    const viewH = window.innerHeight;
    const scrollable = docH > viewH + 48;
    const nearBottom = y + viewH >= docH - 96;
    setVisible(!scrollable || y > 72 || nearBottom);
  }, []);

  useEffect(() => {
    evaluateVisibility();
    const onScroll = () => evaluateVisibility();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [evaluateVisibility, pathname]);

  const reveal = () => setVisible(true);

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-[190] h-14"
        aria-hidden
        onMouseEnter={reveal}
        onTouchStart={reveal}
      />
      <div
        className={[
          "fixed bottom-4 left-1/2 z-[195] w-[min(100%,28rem)] -translate-x-1/2 px-4 pb-[env(safe-area-inset-bottom)] transition-all duration-300 sm:bottom-6",
          visible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-6 opacity-0",
        ].join(" ")}
        onMouseEnter={reveal}
      >
        <nav
          className="flex h-[4.25rem] w-full items-stretch justify-between gap-1 rounded-full border border-outline-variant/30 bg-[#fffdf8]/95 px-2 shadow-[0_12px_40px_rgba(26,51,40,0.14)] backdrop-blur-xl"
          aria-label="주요 메뉴"
        >
          <DockItem
            label="홈"
            active={active === "home"}
            onClick={() => router.push("/")}
          >
            <Home className="h-5 w-5" strokeWidth={2} aria-hidden />
          </DockItem>
          <DockItem
            label="나"
            active={active === "me"}
            onClick={() => {
              if (reportId) {
                router.push(
                  `/blueprint-preview?reportId=${encodeURIComponent(reportId)}`,
                );
              } else if (isSignedIn) {
                router.push("/blueprint-preview");
              } else {
                onOpenAuth?.();
              }
            }}
          >
            <Compass className="h-5 w-5" strokeWidth={2} aria-hidden />
          </DockItem>
          <DockItem
            label="관계"
            active={active === "relations"}
            onClick={() =>
              router.push(
                reportId
                  ? `/relationships?myReportId=${encodeURIComponent(reportId)}`
                  : "/relationships",
              )
            }
          >
            <Users className="h-5 w-5" strokeWidth={2} aria-hidden />
          </DockItem>
          <DockItem
            label="결정"
            active={active === "decision"}
            onClick={() => router.push("/decision")}
          >
            <Scale className="h-5 w-5" strokeWidth={2} aria-hidden />
          </DockItem>
        </nav>
      </div>
    </>
  );
}
