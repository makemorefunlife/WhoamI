"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Check, Sparkles } from "lucide-react";

export type FeedbackRating = "great" | "good" | "needs_improvement";

type ReportFeedbackSectionProps = {
  dayMasterStem?: string;
  displayName?: string;
};

function getSecretInnerTendency(dayMasterStem?: string): { title: string; desc: string } {
  const stem = (dayMasterStem || "").toUpperCase();
  if (stem.includes("甲") || stem.includes("갑")) {
    return {
      title: "우직한 거목(巨木)의 기운",
      desc: "자신의 확고한 소신과 기둥을 지키며 몰입할 때 주변을 성장시키는 가장 강한 리더십 에너지가 발휘됩니다.",
    };
  }
  if (stem.includes("乙") || stem.includes("을")) {
    return {
      title: "유연한 넝쿨의 생명력",
      desc: "어떠한 환경 변화에도 빠르게 직관적으로 적응하며 주위 사람들을 포근하게 감싸는 유연함이 강점입니다.",
    };
  }
  if (stem.includes("丙") || stem.includes("병")) {
    return {
      title: "태양(太陽)의 열정과 직관",
      desc: "명확하고 따뜻한 빛을 내뿜어 주변의 어둠과 모호함을 걷어내고 조직과 관계의 방향을 제시하는 본성이 있습니다.",
    };
  }
  if (stem.includes("丁") || stem.includes("정")) {
    return {
      title: "은은한 촛불의 통찰",
      desc: "섬세한 감수성과 정교한 통찰력으로 타인의 숨겨진 마음과 미세한 흐름을 세심하게 읽어내는 직관을 가졌습니다.",
    };
  }
  if (stem.includes("戊") || stem.includes("무")) {
    return {
      title: "웅장한 산맥(山脈)의 중용",
      desc: "깊고 묵직한 포용력과 신뢰로 어떤 흔들림에도 중심을 굳건히 잡아주는 든든한 조력자 기운이 감춰져 있습니다.",
    };
  }
  if (stem.includes("己") || stem.includes("기")) {
    return {
      title: "비옥한 전답(田沓)의 정성",
      desc: "조용히 내면의 깊은 결실을 가꾸어 내고 주위 사람들의 작은 필요까지 정성스럽게 살피고 기르는 성품입니다.",
    };
  }
  if (stem.includes("庚") || stem.includes("경")) {
    return {
      title: "강인한 원석(原石)의 결단",
      desc: "타협하지 않는 직관과 명확한 원칙으로 복잡한 문제의 핵심을 단번에 꿰뚫고 군더더기 없이 결단합니다.",
    };
  }
  if (stem.includes("辛") || stem.includes("신")) {
    return {
      title: "정교한 보석(寶石)의 섬세함",
      desc: "밀도 높고 샤프한 집중력으로 남들이 쉽게 지나치는 미세한 본질과 아름다움을 완벽히 짚어내는 감각이 뛰어납니다.",
    };
  }
  if (stem.includes("壬") || stem.includes("임")) {
    return {
      title: "깊은 바다(大海)의 무한함",
      desc: "끊임없이 생각과 유연함을 확장하며 무궁무진한 잠재력과 자유로운 지혜를 지향하는 내면을 보유하고 있습니다.",
    };
  }
  if (stem.includes("癸") || stem.includes("계")) {
    return {
      title: "단비(甘雨)의 맑은 감수성",
      desc: "스펀지처럼 타인의 생각과 깊게 공감하고 지친 마음에 가만히 스며들어 생기를 찾아주는 맑은 영감의 소유자입니다.",
    };
  }
  return {
    title: "깊은 내면의 숨은 성장 기운",
    desc: "스스로의 기준에 따라 타인의 가치를 올바르게 발견하고, 조용히 세상을 긍정적으로 변화시키는 잠재력이 깃들어 있습니다.",
  };
}

export default function ReportFeedbackSection({
  dayMasterStem,
  displayName,
}: ReportFeedbackSectionProps) {
  const { user } = useUser();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [founderApplied, setFounderApplied] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto populate email when Clerk user is loaded
  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      setEmail(user.primaryEmailAddress.emailAddress);
    }
  }, [user]);

  const userName = displayName || (user?.publicMetadata?.displayName as string) || "사용자";
  const secretInsight = getSecretInnerTendency(dayMasterStem);

  function handleSelectRating(selectedRating: FeedbackRating) {
    setRating(selectedRating);
    setStep(2);
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          rating,
          feedback: feedback.trim(),
          founder_applied: founderApplied,
          marketing_agreed: marketingAgreed,
          created_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error("서버 응답 오류가 발생했습니다.");
      }

      setStep(3);
    } catch {
      setErrorMsg("피드백 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-12 overflow-hidden rounded-extra-large border border-outline-variant/30 bg-surface-container-lowest/90 p-6 sm:p-8 shadow-xs">
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-bold tracking-tight text-primary sm:text-xl">
              오늘 {userName}님의 분석 리포트는 어떠셨나요?
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-on-surface-variant">
              솔직한 평가를 남겨주시면 더 정교하고 의미 있는 리포트를 만드는 데 큰 도움이 됩니다.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => handleSelectRating("great")}
              className="flex w-full items-center gap-3.5 rounded-2xl border border-outline-variant/40 bg-surface p-4 text-left font-medium text-on-surface transition hover:border-primary/60 hover:bg-surface-container-low active:scale-[0.99]"
            >
              <span className="text-2xl">😊</span>
              <span className="text-sm sm:text-base font-semibold text-on-surface">소름돋게 잘 맞아요</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRating("good")}
              className="flex w-full items-center gap-3.5 rounded-2xl border border-outline-variant/40 bg-surface p-4 text-left font-medium text-on-surface transition hover:border-primary/60 hover:bg-surface-container-low active:scale-[0.99]"
            >
              <span className="text-2xl">🙂</span>
              <span className="text-sm sm:text-base font-semibold text-on-surface">꽤 흥미롭고 공감돼요</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRating("needs_improvement")}
              className="flex w-full items-center gap-3.5 rounded-2xl border border-outline-variant/40 bg-surface p-4 text-left font-medium text-on-surface transition hover:border-primary/60 hover:bg-surface-container-low active:scale-[0.99]"
            >
              <span className="text-2xl">😅</span>
              <span className="text-sm sm:text-base font-semibold text-on-surface">아쉬운 점이나 오류가 있어요</span>
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {rating === "great" && "😊"}
                {rating === "good" && "🙂"}
                {rating === "needs_improvement" && "😅"}
              </span>
              <span className="text-sm font-semibold text-primary">
                {rating === "great" && "소름돋게 잘 맞아요"}
                {rating === "good" && "꽤 흥미롭고 공감돼요"}
                {rating === "needs_improvement" && "아쉬운 점이나 오류가 있어요"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-on-surface-variant/70 underline hover:text-primary"
            >
              평가 변경
            </button>
          </div>

          <div>
            <label className="block text-sm font-bold text-primary">
              {rating === "needs_improvement"
                ? "어떤 부분이 아쉬우셨나요? 남겨주시면 개발팀에서 적극 검토하겠습니다."
                : "어떤 문장이 가장 와닿았나요? 저희 팀이 직접 읽고 서비스에 즉시 반영할 예정입니다."}
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={
                rating === "needs_improvement"
                  ? "어색한 표현이나 잘못 분석된 내용, 추가되었으면 하는 기능 등을 알려주세요..."
                  : "예: '내면의 갈등 패턴' 분석 부분이 제 상황과 너무 똑같아서 놀랐어요..."
              }
              className="mt-2 w-full rounded-xl border border-outline-variant/45 bg-surface p-3.5 text-sm text-on-surface outline-none focus:border-primary/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant">
              답변 및 파운더스 안내를 받아볼 이메일 (선택)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="mt-1.5 w-full rounded-xl border border-outline-variant/45 bg-surface px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary/60"
            />
          </div>

          {/* Founders Club Invitation Card */}
          <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎖️</span>
              <h4 className="text-base font-bold text-amber-900 dark:text-amber-200">
                Aha! It&apos;s me Founders Club 1기 특별 초대
              </h4>
            </div>

            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              초기 멤버로 함께해주시는 분들께 평생 제공될 프리미엄 혜택과 신기능 우선 경험의 기회를 드립니다.
            </p>

            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs sm:text-sm text-on-surface select-none">
                <input
                  type="checkbox"
                  checked={founderApplied}
                  onChange={(e) => setFounderApplied(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-amber-500/50 text-amber-600 focus:ring-amber-500"
                />
                <span className="font-semibold text-amber-950 dark:text-amber-100">
                  네, 파운더스 멤버로 참여해 신기능 무료 체험과 서비스 개선에 함께할게요!
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-on-surface-variant/85 select-none">
                <input
                  type="checkbox"
                  checked={marketingAgreed}
                  onChange={(e) => setMarketingAgreed(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <span>남겨주신 후기는 익명화되어 서비스 소개에 활용될 수 있습니다 (선택)</span>
              </label>
            </div>
          </div>

          {errorMsg ? (
            <p className="text-xs font-semibold text-rose-700">{errorMsg}</p>
          ) : null}

          <div className="pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleSubmit()}
              className="stitch-cta-primary min-h-[48px] w-full text-base font-bold disabled:opacity-50"
            >
              {submitting ? "의견 전달 중..." : "소중한 의견 전달하기"}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              <Check className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary">소중한 피드백이 전달되었습니다!</h3>
              <p className="text-xs text-on-surface-variant">
                전해주신 소중한 의견은 팀에서 정성껏 읽고 서비스 개선에 반영하겠습니다.
              </p>
            </div>
          </div>

          {founderApplied ? (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 sm:p-5 flex items-start gap-3">
              <span className="text-2xl">🏅</span>
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    파운더스 클럽 1기 등록 완료
                  </span>
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                    [🏅 Founders]
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  환영합니다! 파운더스 클럽 1기 멤버로 등록되었습니다. 계정에 골드 배지가 활성화되었습니다.
                </p>
              </div>
            </div>
          ) : null}

          {/* Saju 1-line Secret Inner Tendency Card */}
          <div className="rounded-2xl border border-primary/25 bg-surface-container-low p-5 space-y-2 text-left">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                🔓 히든 일지: 내면의 보물 상자가 열렸습니다
              </h4>
            </div>

            <p className="text-sm font-bold text-on-surface">{secretInsight.title}</p>
            <p className="text-xs text-on-surface-variant leading-relaxed">{secretInsight.desc}</p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface px-4 py-2.5 text-xs font-bold text-primary transition hover:bg-surface-container-low"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
