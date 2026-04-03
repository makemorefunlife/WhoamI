"use client";

import { Suspense } from "react";
import HomeContent from "./homecontent";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8">로딩중...</div>}>
      <HomeContent />
    </Suspense>
  );
}
