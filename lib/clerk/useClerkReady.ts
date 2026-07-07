"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

/** Clerk JS 로드 실패 시 무한 「불러오는 중」 방지 */
const CLERK_LOAD_TIMEOUT_MS = 8_000;

export function useClerkReady() {
  const auth = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (auth.isLoaded) {
      setTimedOut(false);
      return;
    }

    const onScriptError = (event: Event) => {
      const target = event.target;
      if (
        target instanceof HTMLScriptElement &&
        target.src.includes("clerk")
      ) {
        setTimedOut(true);
      }
    };
    window.addEventListener("error", onScriptError, true);

    const timer = window.setTimeout(
      () => setTimedOut(true),
      CLERK_LOAD_TIMEOUT_MS,
    );
    return () => {
      window.removeEventListener("error", onScriptError, true);
      window.clearTimeout(timer);
    };
  }, [auth.isLoaded]);

  const clerkUnavailable = timedOut && !auth.isLoaded;
  const isLoaded = auth.isLoaded || timedOut;

  return {
    isLoaded,
    isSignedIn: clerkUnavailable ? false : auth.isSignedIn,
    userId: clerkUnavailable ? null : auth.userId,
    clerkUnavailable,
  };
}
