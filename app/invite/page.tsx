"use client";

import { Suspense } from "react";
import InviteContent from "./InviteContent";
import { useMessages } from "@/lib/i18n/LocaleProvider";

export default function InvitePage() {
  const messages = useMessages();
  return (
    <Suspense fallback={<div className="p-8">{messages.invite.loadingFallback}</div>}>
      <InviteContent />
    </Suspense>
  );
}
