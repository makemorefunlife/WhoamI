"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMessages } from "@/lib/i18n/LocaleProvider";

export default function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messages = useMessages();

  const token =
    searchParams.get("token") || searchParams.get("invite") || "";

  const message = useMemo(() => {
    if (!token) return messages.invite.invalidToken;
    return messages.invite.inviteMessage;
  }, [token, messages]);

  const handleStart = () => {
    if (!token) {
      alert(messages.invite.missingTokenAlert);
      return;
    }

    localStorage.setItem("inviteToken", token);
    // Report is created on the home page when a nickname is entered — going straight to the survey has no reportId yet.
    router.push(`/?token=${encodeURIComponent(token)}`);
  };

  return (
    <main className="min-h-screen p-8 max-w-xl mx-auto space-y-6">
      {" "}
      <h1 className="text-2xl font-bold">{messages.invite.title}</h1>
      <div className="bg-yellow-50 p-4 rounded">
        <p className="mb-2">{message}</p>
        <p className="text-sm text-gray-600 break-all">token: {token}</p>
      </div>
      <div className="bg-gray-100 p-4 rounded space-y-3">
        <p>
          {messages.invite.startBody}
        </p>

        <button
          onClick={handleStart}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {messages.invite.startCta}
        </button>
      </div>
    </main>
  );
}
