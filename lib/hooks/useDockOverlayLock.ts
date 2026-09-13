"use client";

import { useEffect } from "react";
import { pushDockOverlayLock, popDockOverlayLock } from "@/lib/stitch/dockOverlayLock";

/** Hides the floating bottom dock for as long as `isOpen` is true. See dockOverlayLock.ts. */
export function useDockOverlayLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;
    pushDockOverlayLock();
    return () => popDockOverlayLock();
  }, [isOpen]);
}
