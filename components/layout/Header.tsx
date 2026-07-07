"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { UserButton, SignInButton } from "@clerk/nextjs";
import { useClerkReady } from "@/lib/clerk/useClerkReady";
import Logo from "@/components/brand/Logo";
import SideMenu from "./SideMenu";

export default function Header() {
  const [sideOpen, setSideOpen] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);
  const { isSignedIn, isLoaded, clerkUnavailable } = useClerkReady();
  const hideTimerRef = useRef<number | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(
    (delay = 1800) => {
      clearHideTimer();
      if (sideOpen) return;
      hideTimerRef.current = window.setTimeout(() => {
        setChromeVisible(false);
      }, delay);
    },
    [clearHideTimer, sideOpen],
  );

  const revealChrome = useCallback(
    (delay = 2200) => {
      setChromeVisible(true);
      scheduleHide(delay);
    },
    [scheduleHide],
  );

  const closeAll = useCallback(() => {
    setSideOpen(false);
  }, []);

  useEffect(() => {
    if (!sideOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [sideOpen, closeAll]);

  useEffect(() => {
    if (sideOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [sideOpen]);

  useEffect(() => {
    if (sideOpen) {
      clearHideTimer();
      setChromeVisible(true);
      return;
    }
    scheduleHide(1800);
    return clearHideTimer;
  }, [clearHideTimer, scheduleHide, sideOpen]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--app-header-offset",
      chromeVisible ? "4.25rem" : "0.75rem",
    );
    return () => {
      document.documentElement.style.removeProperty("--app-header-offset");
    };
  }, [chromeVisible]);

  return (
    <>
      <div
        className="fixed left-0 right-0 top-0 z-[210] h-16 bg-transparent"
        onMouseEnter={() => revealChrome(2200)}
        onMouseMove={() => revealChrome(1800)}
        onTouchStart={() => revealChrome(2600)}
        aria-hidden
      />
      <header
        className={[
          "fixed left-0 right-0 top-0 z-[220] flex h-14 items-center justify-between border-b border-white/[0.08] bg-[#0a0f1a]/92 px-3 backdrop-blur-md transition-all duration-300 sm:px-4",
          chromeVisible || sideOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-[calc(100%+0.5rem)] opacity-0",
        ].join(" ")}
        onMouseEnter={() => revealChrome(2400)}
        onMouseMove={() => revealChrome(2000)}
        onTouchStart={() => revealChrome(2600)}
        onFocusCapture={() => revealChrome(3000)}
      >
        <button
          type="button"
          onClick={() => {
            revealChrome(3200);
            setSideOpen((v) => !v);
          }}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-white/90 transition hover:bg-white/[0.08]"
          aria-label="메뉴 열기"
          aria-expanded={sideOpen}
          aria-controls="side-menu"
        >
          <span className="text-xl leading-none">☰</span>
        </button>

        <div className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Logo size={28} priority />
        </div>

        <div className="flex min-h-[44px] min-w-[44px] items-center justify-center">
          {!isLoaded ? (
            <span
              className="block h-8 w-8 shrink-0 rounded-full bg-white/10"
              aria-hidden
            />
          ) : isSignedIn ? (
            <UserButton
              appearance={{
                elements: {
                  userButtonTrigger:
                    "rounded-full focus:shadow-none ring-2 ring-white/15",
                },
              }}
            />
          ) : clerkUnavailable ? (
            <button
              type="button"
              title="Clerk JS를 불러오지 못했습니다"
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/55 ring-2 ring-white/10"
              onClick={() =>
                alert(
                  "로그인 서비스에 연결하지 못했어요. 광고 차단을 끄거나 페이지를 새로고침해 주세요.",
                )
              }
            >
              로그인
            </button>
          ) : (
            <SignInButton mode="modal" forceRedirectUrl="/">
              <button
                type="button"
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/90 ring-2 ring-white/15 transition hover:bg-white/[0.08]"
              >
                로그인
              </button>
            </SignInButton>
          )}
        </div>
      </header>

      <SideMenu open={sideOpen} onClose={closeAll} />
    </>
  );
}
