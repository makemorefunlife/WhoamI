"use client";

import { Suspense } from "react";
import ConnectContent from "./ConnectContent";
import { useMessages } from "@/lib/i18n/LocaleProvider";

export default function ConnectPage() {
  const messages = useMessages();
  return (
    <Suspense fallback={<div className="p-8">{messages.invite.loadingFallback}</div>}>
      <ConnectContent />
    </Suspense>
  );
}
