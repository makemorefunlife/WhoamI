"use client";

import { Suspense } from "react";
import InviteContent from "./InviteContent";

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="p-8">로딩중...</div>}>
      <InviteContent />
    </Suspense>
  );
}
