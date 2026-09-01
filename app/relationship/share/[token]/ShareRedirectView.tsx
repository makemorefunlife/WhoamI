"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { buildRelationshipAnalyzeUrl } from "@/lib/relationship/hubNavigation";
import { isAnalysisSurface } from "@/lib/relationship/analysisSurface";

type ViewState = "loading" | "auth_required" | "denied" | "error";

/** Resolves a share token to the recipient's own view of the shared report — spec section 35. */
export default function ShareRedirectView({ token }: { token: string }) {
  const router = useRouter();
  const { messages, href: localize } = useLocale();
  const { openSignIn } = useClerk();
  const [state, setState] = useState<ViewState>(token ? "loading" : "error");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/relationship/share/view?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (res.status === 401) {
          setState("auth_required");
          return;
        }
        if (!res.ok || !data?.relationshipReportId || !data?.viewerReportId) {
          setState("denied");
          return;
        }
        const kind = isAnalysisSurface(data.kind) ? data.kind : "basic";
        router.replace(
          localize(
            buildRelationshipAnalyzeUrl(data.relationshipReportId, data.viewerReportId, kind),
          ),
        );
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, router, localize]);

  if (state === "loading") {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center px-6">
        <p className="text-sm text-on-surface-variant">{messages.report.chrome.loading}</p>
      </div>
    );
  }

  if (state === "auth_required") {
    return (
      <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-on-surface-variant">
          {messages.relationshipMap.reportShare.authRequiredBody}
        </p>
        <button
          type="button"
          onClick={() =>
            openSignIn?.({ forceRedirectUrl: localize(`/relationship/share/${token}`) })
          }
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-on-primary"
        >
          {messages.nav.signIn}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-base font-semibold text-primary">
        {messages.relationshipMap.reportShare.accessDeniedTitle}
      </p>
      <p className="text-sm text-on-surface-variant">
        {messages.relationshipMap.reportShare.accessDeniedBody}
      </p>
    </div>
  );
}
