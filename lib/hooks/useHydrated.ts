"use client";

import { useEffect, useState } from "react";

/** SSR/첫 클라이언트 렌더 이후 true — localStorage 등 브라우저 API 사용 전 확인 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
