"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { ROUTES } from "@/constants/routes";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { pathnameWithoutLocalePrefix } from "@/lib/i18n/locale";
import {
  LEGAL_CONSENT_META_KEY,
  MARKETING_CONSENT_META_KEY,
  buildLegalConsentRecord,
  clearSignupConsentDraft,
  isLegalConsentComplete,
  readSignupConsentDraft,
} from "@/lib/legal/consent";

const SKIP_PREFIXES = [
  ROUTES.signIn,
  ROUTES.signUp,
  ROUTES.legalConsent,
  ROUTES.terms,
  ROUTES.privacy,
  ROUTES.refund,
  ROUTES.doNotSell,
];

/**
 * 가입 직후 Clerk unsafeMetadata 동기화.
 * - 한국(ko-KR): 필수 동의(legalConsent) 없으면 동의 페이지로 보냄
 * - 미국(en-US): 리다이렉트 없음 (가입 화면 Terms 안내로 충분)
 * - 공통: marketingConsent boolean 저장
 */
export default function LegalConsentGuard() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const { locale, href } = useLocale();
  const saving = useRef(false);

  useEffect(() => {
    if (!isLoaded || !userLoaded || !isSignedIn || !user) return;
    if (saving.current) return;

    const path = pathnameWithoutLocalePrefix(pathname ?? "/");
    if (SKIP_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
      return;
    }

    const draft = readSignupConsentDraft();
    const meta = user.unsafeMetadata as Record<string, unknown>;
    const needsKrLegal =
      locale === "ko-KR" && !isLegalConsentComplete(meta);
    const marketingUnset = typeof meta[MARKETING_CONSENT_META_KEY] !== "boolean";

    // 동기화할 내용이 없으면: KR만 동의 페이지로
    if (!draft && !needsKrLegal && !marketingUnset) return;

    if (needsKrLegal && !(draft?.age && draft?.terms)) {
      router.replace(href(ROUTES.legalConsent));
      return;
    }

    if (!draft && !needsKrLegal && marketingUnset) {
      // 마케팅 미기록 기존 계정 → false로 초기화하지 않고 패스 (강제 리다이렉트 없음)
      return;
    }

    saving.current = true;
    const nextMeta: Record<string, unknown> = { ...meta };

    if (needsKrLegal && draft?.age && draft?.terms) {
      nextMeta[LEGAL_CONSENT_META_KEY] = buildLegalConsentRecord("ko-KR");
    }

    if (draft) {
      nextMeta[MARKETING_CONSENT_META_KEY] = draft.marketing === true;
    }

    void user
      .update({ unsafeMetadata: nextMeta })
      .then(() => {
        clearSignupConsentDraft();
        saving.current = false;
      })
      .catch(() => {
        saving.current = false;
        if (needsKrLegal) {
          router.replace(href(ROUTES.legalConsent));
        }
      });
  }, [
    isLoaded,
    userLoaded,
    isSignedIn,
    user,
    pathname,
    router,
    locale,
    href,
  ]);

  return null;
}
