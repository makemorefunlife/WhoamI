"use client";

import { useCallback, useEffect, useState } from "react";
import LocaleLink from "@/lib/i18n/LocaleLink";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { usePathname } from "next/navigation";
import { useClerk, UserButton } from "@clerk/nextjs";
import { Menu, Settings, User } from "lucide-react";
import Logo from "@/components/brand/Logo";
import { useClerkReady } from "@/lib/clerk/useClerkReady";
import StitchSideMenu from "@/components/layout/stitch/StitchSideMenu";
import { ROUTES } from "@/constants/routes";

export default function StitchFixedHeader({
  onOpenAuth,
}: {
  onOpenAuth?: () => void;
}) {
  const [sideOpen, setSideOpen] = useState(false);
  const [shadow, setShadow] = useState(false);
  const pathname = usePathname();
  const { messages, href } = useLocale();
  const { openSignIn } = useClerk();
  const { isSignedIn, isLoaded, clerkUnavailable } = useClerkReady();

  const handleOpenAuth = useCallback(() => {
    if (pathname === "/" && onOpenAuth) {
      onOpenAuth();
      return;
    }
    openSignIn?.({
      forceRedirectUrl: pathname || "/",
    });
  }, [onOpenAuth, openSignIn, pathname]);

  useEffect(() => {
    const onScroll = () => setShadow(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!sideOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSideOpen(false);
    };
    document.addEventListener("keydown", onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev;
    };
  }, [sideOpen]);

  const closeMenu = useCallback(() => setSideOpen(false), []);

  return (
    <>
      <header
        className={[
          "fixed left-0 right-0 top-0 z-[200] border-b border-outline-variant/35 bg-[#fffdf8]/92 backdrop-blur-xl transition-shadow duration-300",
          shadow ? "shadow-md shadow-primary/5" : "",
        ].join(" ")}
      >
        <div className="relative mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            className="relative z-30 flex h-10 w-10 items-center justify-center rounded-xl text-primary transition hover:bg-surface-container-low active:scale-95 cursor-pointer"
            aria-label={messages.header.openMenu}
            aria-expanded={sideOpen}
            aria-controls="stitch-side-menu"
            onClick={() => setSideOpen((v) => !v)}
          >
            <Menu className="h-6 w-6" strokeWidth={2} aria-hidden />
          </button>

          <div className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <LocaleLink
              href="/"
              className="flex items-center gap-2"
              aria-label={messages.header.homeAria}
            >
              <Logo size={32} href={null} priority onLightBackground />
              <span className="hidden text-lg font-medium tracking-tight text-primary sm:inline">
                Aha It&apos;s me!
              </span>
            </LocaleLink>
          </div>

          <div className="flex h-9 w-9 items-center justify-center">
            {!isLoaded ? (
              <span
                className="block h-8 w-8 rounded-full bg-surface-container"
                aria-hidden
              />
            ) : isSignedIn ? (
              <UserButton
                userProfileMode="navigation"
                userProfileUrl={href(ROUTES.accountProfile)}
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8 border-2 border-outline-variant/40",
                  },
                }}
              >
                <UserButton.MenuItems>
                  <UserButton.Link
                    label={messages.account.profileMenuLabel}
                    labelIcon={<Settings className="h-4 w-4" />}
                    href={href(ROUTES.accountProfile)}
                  />
                </UserButton.MenuItems>
              </UserButton>
            ) : clerkUnavailable ? (
              <button
                type="button"
                title={messages.header.signInFailedTitle}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-outline-variant/40 text-on-surface-variant"
                onClick={() => alert(messages.header.signInFailedAlert)}
              >
                <User className="h-4 w-4" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenAuth}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-outline-variant/40 bg-surface-container-low text-primary shadow-sm transition hover:bg-surface-container"
                aria-label={messages.nav.signIn}
              >
                <User className="h-4 w-4" strokeWidth={2} aria-hidden />
              </button>
            )}
          </div>
        </div>
      </header>

      <StitchSideMenu open={sideOpen} onClose={closeMenu} />
    </>
  );
}
