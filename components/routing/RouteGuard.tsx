"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

export default function RouteGuard({
  isLoading,
  destination,
  replace = true,
  loadingFallback,
  children,
}: {
  isLoading: boolean;
  destination: string | null;
  replace?: boolean;
  loadingFallback?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !destination) return;
    if (replace) router.replace(destination);
    else router.push(destination);
  }, [destination, isLoading, replace, router]);

  if (isLoading) return <>{loadingFallback ?? null}</>;
  if (destination) return <>{loadingFallback ?? null}</>;
  return <>{children}</>;
}

