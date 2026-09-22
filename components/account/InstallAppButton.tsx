"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  Smartphone,
  Share,
  PlusSquare,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  X,
  ExternalLink,
  Download,
  BookmarkPlus,
} from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "aha_pwa_banner_dismissed_until";

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const isDisplayModeStandalone = window.matchMedia?.("(display-mode: standalone)").matches;
  const isIosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return Boolean(isDisplayModeStandalone || isIosStandalone);
}

function getDeviceInfo() {
  if (typeof navigator === "undefined") {
    return { isIos: false, isAndroid: false, isInApp: false, isSafari: false, isChrome: false };
  }
  const ua = navigator.userAgent || "";
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);
  const isInApp = /kakaotalk|instagram|line|naver/i.test(ua);
  const isSafari = isIos && /safari/i.test(ua) && !/crios|fxios/i.test(ua);
  const isChrome = /chrome|crios/i.test(ua);

  return { isIos, isAndroid, isInApp, isSafari, isChrome };
}

/**
 * Shared PWA install prompt listener hook
 */
function usePwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(isStandaloneDisplay());

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const triggerNativePrompt = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  return { deferredPrompt, isStandalone, triggerNativePrompt };
}

export function InstallAppGuideModal({
  isOpen,
  onClose,
  deferredPrompt,
  onTriggerNativePrompt,
}: {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onTriggerNativePrompt: () => void;
}) {
  const { locale } = useLocale();
  const isKr = locale === "ko-KR";
  const { isIos, isAndroid, isInApp } = getDeviceInfo();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#D4CFC4]/80 bg-[#FFFDF8] p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#E3F2EC] text-[#1A3328] transition hover:bg-[#dceee6]"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Badge */}
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#3A8F6E]/30 bg-[#E3F2EC] px-3 py-1 text-xs font-bold text-[#1A3328]">
          <Smartphone className="h-3.5 w-3.5 text-[#3A8F6E]" />
          <span>{isKr ? "앱으로 사용하기 설치 가이드" : "App Installation Guide"}</span>
        </div>

        <h3 className="text-xl font-bold tracking-tight text-[#1A3328]">
          {isKr ? "홈 화면에 앱 아이콘 추가" : "Add to Home Screen"}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-[#4A5C52]">
          {isKr
            ? "설치 없이 휴대폰 바탕화면에 앱 아이콘을 만들어 원클릭으로 바로 접속할 수 있어요."
            : "Access Aha! it's me directly from your phone's home screen."}
        </p>

        {/* In-App Browser Warning (KakaoTalk, etc.) */}
        {isInApp && (
          <div className="mt-4 rounded-2xl border border-amber-300/80 bg-amber-50 p-4 text-xs text-amber-900">
            <div className="flex items-start gap-2 font-bold">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>{isKr ? "카카오톡 / 인앱 브라우저 안내" : "In-App Browser Detected"}</span>
            </div>
            <p className="mt-1 leading-relaxed text-amber-800">
              {isKr
                ? "카카오톡/인앱 브라우저에서는 바로 설치가 제한될 수 있습니다. 아래 버튼을 눌러 링크를 복사한 후 Safari 또는 Chrome 앱에서 열어주세요."
                : "In-app browsers may limit installation. Copy link below and open in Safari or Chrome."}
            </p>
            <button
              type="button"
              onClick={handleCopyLink}
              className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>{copied ? (isKr ? "링크가 복사되었습니다!" : "Link Copied!") : (isKr ? "현재 링크 복사하기" : "Copy Link")}</span>
            </button>
          </div>
        )}

        {/* Device-tailored Instructions */}
        <div className="mt-5 space-y-3">
          {/* Option A: Android with Native 1-Click Prompt */}
          {deferredPrompt && (
            <div className="rounded-2xl border border-[#3A8F6E]/40 bg-[#E3F2EC]/60 p-4">
              <p className="text-xs font-bold text-[#1A3328] mb-2">
                {isKr ? "갤럭시 / 안드로이드 원클릭 설치" : "1-Click Android Install"}
              </p>
              <button
                type="button"
                onClick={onTriggerNativePrompt}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#234A38] to-[#1A3328] py-3 text-sm font-bold text-[#FFFDF8] shadow-md transition hover:opacity-95"
              >
                <Sparkles className="h-4 w-4 text-[#3A8F6E]" />
                <span>{isKr ? "원클릭으로 바로 앱 설치하기" : "Install App Now"}</span>
              </button>
            </div>
          )}

          {/* Option B: Apple iOS (iPhone/iPad) Step-by-Step Guide */}
          {isIos && (
            <div className="rounded-2xl border border-[#D4CFC4] bg-white p-4 space-y-3">
              <p className="text-xs font-bold text-[#1A3328] flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1A3328] text-[10px] font-bold text-white">🍎</span>
                <span>{isKr ? "아이폰 (iOS Safari) 설치 방법" : "iPhone (iOS Safari) Guide"}</span>
              </p>
              <ol className="space-y-2.5 text-xs text-[#4A5C52]">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E3F2EC] font-bold text-[#1A3328]">1</span>
                  <span>
                    {isKr ? "Safari 하단 중앙의 " : "Tap the "}
                    <strong className="font-bold text-[#1A3328] inline-flex items-center gap-0.5 bg-[#F5F0E8] px-1.5 py-0.5 rounded border border-[#D4CFC4]">
                      <Share className="h-3 w-3 inline text-[#3A8F6E]" /> {isKr ? "공유 버튼" : "Share icon"}
                    </strong>
                    {isKr ? "을 누릅니다." : " at the bottom."}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E3F2EC] font-bold text-[#1A3328]">2</span>
                  <span>
                    {isKr ? "메뉴 항목을 아래로 스크롤하여 " : "Scroll down and tap "}
                    <strong className="font-bold text-[#1A3328] inline-flex items-center gap-0.5 bg-[#F5F0E8] px-1.5 py-0.5 rounded border border-[#D4CFC4]">
                      <PlusSquare className="h-3 w-3 inline text-[#3A8F6E]" /> {isKr ? "홈 화면에 추가" : "Add to Home Screen"}
                    </strong>
                    {isKr ? "를 선택합니다." : "."}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E3F2EC] font-bold text-[#1A3328]">3</span>
                  <span>
                    {isKr ? "우측 상단의 " : "Tap "}
                    <strong className="font-bold text-[#1A3328]">{isKr ? "[추가]" : "[Add]"}</strong>
                    {isKr ? " 버튼을 누르면 바탕화면에 앱 아이콘이 생성됩니다." : " in the top right."}
                  </span>
                </li>
              </ol>
            </div>
          )}

          {/* Option C: Android / Galaxy Manual Step Guide */}
          {isAndroid && !deferredPrompt && (
            <div className="rounded-2xl border border-[#D4CFC4] bg-white p-4 space-y-3">
              <p className="text-xs font-bold text-[#1A3328] flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1A3328] text-[10px] font-bold text-white">📱</span>
                <span>{isKr ? "갤럭시 / 안드로이드 수동 추가 방법" : "Galaxy / Android Guide"}</span>
              </p>
              <ol className="space-y-2.5 text-xs text-[#4A5C52]">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E3F2EC] font-bold text-[#1A3328]">1</span>
                  <span>
                    {isKr ? "브라우저 상단/하단의 " : "Tap browser menu "}
                    <strong className="font-bold text-[#1A3328] bg-[#F5F0E8] px-1.5 py-0.5 rounded border border-[#D4CFC4]">[⋮] 또는 [≡] 메뉴</strong>
                    {isKr ? "를 클릭합니다." : "."}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E3F2EC] font-bold text-[#1A3328]">2</span>
                  <span>
                    <strong className="font-bold text-[#1A3328]">{isKr ? "[앱 설치]" : "[Install App]"}</strong>
                    {isKr ? " 또는 " : " or "}
                    <strong className="font-bold text-[#1A3328]">{isKr ? "[현재 페이지 추가 ➔ 홈 화면]" : "[Add to Home Screen]"}</strong>
                    {isKr ? "을 선택합니다." : "."}
                  </span>
                </li>
              </ol>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full cursor-pointer rounded-full bg-[#F5F0E8] py-3 text-xs font-bold text-[#1A3328] transition hover:bg-[#ebe4d8]"
        >
          {isKr ? "확인" : "Close"}
        </button>
      </div>
    </div>
  );
}

/**
 * ① Mobile Floating Smart Banner
 * Fixed at the bottom of the mobile viewport, hidden in standalone mode or when dismissed within 24 hours.
 */
export function PwaFloatingBanner() {
  const { locale } = useLocale();
  const isKr = locale === "ko-KR";
  const { deferredPrompt, isStandalone, triggerNativePrompt } = usePwaPrompt();
  const [visible, setVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplay()) {
      setVisible(false);
      return;
    }
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      setVisible(false);
      return;
    }
    setVisible(true);
  }, []);

  if (!visible || isStandalone) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
    setVisible(false);
  };

  const handleAction = () => {
    if (deferredPrompt) {
      void triggerNativePrompt();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-3 right-3 z-[180] sm:left-auto sm:right-6 sm:w-[23rem] transition-all duration-300">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#3A8F6E]/40 bg-[#1A3328] p-3.5 shadow-2xl backdrop-blur-lg text-[#FFFDF8]">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold leading-tight text-[#FFFDF8]">
              {isKr ? "홈 화면에 추가하고 앱처럼 더 빠르게 이용해 보세요" : "Add to home screen and use faster like an app"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAction}
              className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-full bg-[#3A8F6E] hover:bg-[#2e7459] px-3.5 py-1.5 text-xs font-bold text-white shadow transition active:scale-[0.98]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isKr ? "앱 설치하기" : "Install App"}</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <InstallAppGuideModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        deferredPrompt={deferredPrompt}
        onTriggerNativePrompt={() => {
          setShowModal(false);
          void triggerNativePrompt();
        }}
      />
    </>
  );
}

/**
 * ② Mobile Menu (GNB Drawer) Highlight Button
 * Renders inside StitchSideMenu right under navigation or profile.
 */
export function PwaMenuButton({ onCloseMenu }: { onCloseMenu?: () => void }) {
  const { locale } = useLocale();
  const isKr = locale === "ko-KR";
  const { deferredPrompt, isStandalone, triggerNativePrompt } = usePwaPrompt();
  const [showModal, setShowModal] = useState(false);

  if (isStandalone) return null;

  const handleClick = () => {
    onCloseMenu?.();
    if (deferredPrompt) {
      void triggerNativePrompt();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="group flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-2xl border border-[#3A8F6E]/40 bg-[#E3F2EC] px-3.5 py-3 text-left transition hover:bg-[#dceee6] active:scale-[0.99]"
      >
        <div className="flex items-center gap-2.5">
          <Smartphone className="h-4 w-4 text-[#3A8F6E]" />
          <span className="text-xs font-bold text-[#1A3328]">
            {isKr ? "📲 앱으로 보기 / 홈 화면 추가" : "📲 Open as App / Add to Home"}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-[#3A8F6E] transition group-hover:translate-x-0.5" />
      </button>

      <InstallAppGuideModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        deferredPrompt={deferredPrompt}
        onTriggerNativePrompt={() => {
          setShowModal(false);
          void triggerNativePrompt();
        }}
      />
    </>
  );
}

/**
 * ③ Analysis / Content Result Screen Bottom Action Card
 * Placed at the bottom of report view components.
 */
export function PwaReportActionCard() {
  const { locale } = useLocale();
  const isKr = locale === "ko-KR";
  const { deferredPrompt, isStandalone, triggerNativePrompt } = usePwaPrompt();
  const [showModal, setShowModal] = useState(false);

  if (isStandalone) return null;

  const handleClick = () => {
    if (deferredPrompt) {
      void triggerNativePrompt();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <div className="mx-auto my-8 max-w-xl rounded-3xl border border-[#D4CFC4]/80 bg-[#FFFDF8] p-6 text-center shadow-[0_12px_32px_rgba(26,51,40,0.06)] sm:p-8">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#3A8F6E]/30 bg-[#E3F2EC] text-[#3A8F6E]">
          <BookmarkPlus className="h-6 w-6" />
        </div>
        <h4 className="text-base font-bold tracking-tight text-[#1A3328] sm:text-lg">
          {isKr
            ? "내 분석 결과를 언제든 다시 볼 수 있도록 홈 화면에 앱으로 보관해 두세요"
            : "Keep your analysis results on your home screen to view anytime"}
        </h4>
        <p className="mt-1 text-xs text-[#4A5C52]">
          {isKr
            ? "별도의 다운로드 없이 바로 바탕화면 아이콘으로 접속할 수 있습니다."
            : "Access your report directly from your phone icon with 1-click."}
        </p>
        <button
          type="button"
          onClick={handleClick}
          className="mt-5 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#234A38] to-[#1A3328] px-6 py-3.5 text-xs font-bold text-[#FFFDF8] shadow-md transition hover:opacity-95 active:scale-[0.98]"
        >
          <Sparkles className="h-4 w-4 text-[#3A8F6E]" />
          <span>{isKr ? "홈 화면에 앱으로 추가" : "Add to Home Screen as App"}</span>
        </button>
      </div>

      <InstallAppGuideModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        deferredPrompt={deferredPrompt}
        onTriggerNativePrompt={() => {
          setShowModal(false);
          void triggerNativePrompt();
        }}
      />
    </>
  );
}

/**
 * Account Profile Embedded Section Button (Existing)
 */
export default function InstallAppButton() {
  const { locale } = useLocale();
  const isKr = locale === "ko-KR";

  const { deferredPrompt, isStandalone, triggerNativePrompt } = usePwaPrompt();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <section className="rounded-3xl border border-[#D4CFC4]/70 bg-[#FFFDF8] p-6 shadow-[0_12px_32px_rgba(26,51,40,0.06)] sm:p-8">
        <div className="flex items-center gap-2 mb-1 text-xs font-bold uppercase tracking-wider text-[#3A8F6E]">
          <Smartphone className="h-4 w-4" />
          <span>{isKr ? "앱처럼 사용하기" : "Mobile App Mode"}</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-[#1A3328]">
          {isKr ? "바탕화면에 앱 아이콘 추가" : "Add to Home Screen"}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-[#4A5C52]">
          {isKr
            ? "설치 없이 바탕화면에 앱 아이콘을 만들어 앱처럼 편하게 접속해 보세요."
            : "Add an icon to your phone's home screen for instant access."}
        </p>

        <div className="mt-5">
          {isStandalone ? (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-[#3A8F6E]/30 bg-[#E3F2EC] px-4 py-2.5 text-xs font-bold text-[#1A3328]">
              <CheckCircle2 className="h-4 w-4 text-[#3A8F6E]" />
              <span>{isKr ? "이미 홈 화면에 앱으로 추가되어 있습니다" : "App is installed on your home screen"}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#234A38] to-[#1A3328] px-6 py-3.5 text-xs font-bold text-[#FFFDF8] shadow-md transition hover:opacity-95 active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4 text-[#3A8F6E]" />
              <span>{isKr ? "기기별 맞춤 설치 방법 확인하기" : "Check Installation Guide"}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </section>

      <InstallAppGuideModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        deferredPrompt={deferredPrompt}
        onTriggerNativePrompt={() => {
          setShowModal(false);
          void triggerNativePrompt();
        }}
      />
    </>
  );
}
