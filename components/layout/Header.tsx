"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth, UserButton, SignInButton } from "@clerk/nextjs";
import SideMenu from "./SideMenu";

export default function Header() {
  const [sideOpen, setSideOpen] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();

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

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-[220] flex h-14 items-center justify-between border-b border-white/[0.08] bg-[#0a0f1a]/92 px-3 backdrop-blur-md sm:px-4">
        <button
          type="button"
          onClick={() => {
            setSideOpen((v) => !v);
          }}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-white/90 transition hover:bg-white/[0.08]"
          aria-label="메뉴 열기"
          aria-expanded={sideOpen}
          aria-controls="side-menu"
        >
          <span className="text-xl leading-none">☰</span>
        </button>

        <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-medium tracking-wide text-white/35 sm:text-sm">
          탐사
        </span>

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
