import type { Locale } from "@/lib/i18n/locale";
import type { FriendReportBody } from "@/lib/relationship/friend/buildFriendReport";
import type { WhyYouMeUsData } from "@/lib/relationship/shared/whyYouMeUs/whyYouMeUsTypes";
import type { ChartContext } from "@/lib/saju/chartContext";

export type DirectionalFriendAttraction = {
  subjectId: "a" | "b";
  targetId: "a" | "b";
  subjectName: string;
  targetName: string;
  headline: string;
  explanation: string;
  confidence: "HIGH" | "MEDIUM";
};

function deriveAttractionForDirection(params: {
  from: "a" | "b";
  to: "a" | "b";
  subjectName: string;
  targetName: string;
  targetChart?: ChartContext | null;
  targetDayMaster?: string;
  hasCombine?: boolean;
  hasHarmony?: boolean;
  hasJohu?: boolean;
  hasBijie?: boolean;
  locale: Locale;
}): DirectionalFriendAttraction {
  const isKo = params.locale !== "en-US";
  const { from, to, subjectName, targetName, targetDayMaster, hasCombine, hasHarmony, hasJohu } = params;

  let headline = isKo ? "부담 없는 편안함과 묘한 호감" : "Natural, Easygoing Appeal";
  let explanation = isKo
    ? `${subjectName}은(는) ${targetName}의 억지로 꾸미지 않는 태도와 사람을 편안하게 만드는 분위기에 자연스럽게 마음이 끌렸어요.`
    : `${subjectName} felt naturally drawn to ${targetName}'s unpretentious presence and comfortable rhythm.`;

  if (targetDayMaster === "byeong" || targetDayMaster === "jeong") {
    headline = isKo ? "솔직하고 시원시원한 온기에 이끌리는 마음" : "Drawn to Warm & Honest Energy";
    explanation = isKo
      ? `${subjectName}은(는) ${targetName}의 가식 없이 시원시원한 반응과 구김살 없는 온기에서 깊은 호감을 느꼈어요.`
      : `${subjectName} was attracted to ${targetName}'s transparent warmth and genuine enthusiasm.`;
  } else if (targetDayMaster === "gap" || targetDayMaster === "eul") {
    headline = isKo ? "부담 없이 마음을 녹여주는 부드러운 편안함" : "Drawn to Gentle & Adaptable Ease";
    explanation = isKo
      ? `${subjectName}은(는) ${targetName}의 강요하지 않는 유연함과 곁에만 있어도 안심이 되는 분위기에 끌렸어요.`
      : `${subjectName} felt comforted by ${targetName}'s flexible, non-judgmental presence.`;
  } else if (targetDayMaster === "mu" || targetDayMaster === "gi") {
    headline = isKo ? "쉽게 흔들리지 않는 묵직한 안정감" : "Drawn to Grounded & Reliable Stability";
    explanation = isKo
      ? `${subjectName}은(는) ${targetName}이(가) 보여주는 변함없는 태도와 든든한 신뢰감에 큰 호감을 가졌어요.`
      : `${subjectName} appreciated ${targetName}'s steady consistency and reassuring reliability.`;
  } else if (targetDayMaster === "gyeong" || targetDayMaster === "sin") {
    headline = isKo ? "명쾌하고 깔끔한 뒤끝 없는 솔직함" : "Drawn to Crisp & Objective Honesty";
    explanation = isKo
      ? `${subjectName}은(는) ${targetName}의 계산 없는 직진 성향과 명확한 뒤끝 없는 모습에 반했어요.`
      : `${subjectName} admired ${targetName}'s straightforward clarity and zero-drama attitude.`;
  } else if (targetDayMaster === "im" || targetDayMaster === "gye") {
    headline = isKo ? "넓은 시야와 수용적인 매력" : "Drawn to Open-Minded Horizon";
    explanation = isKo
      ? `${subjectName}은(는) ${targetName}의 다양한 이야기를 선입견 없이 들어주는 깊은 포용력에 끌렸어요.`
      : `${subjectName} felt inspired by ${targetName}'s macro perspective and receptive listening.`;
  }

  if (hasCombine) {
    explanation += isKo
      ? " 특히 처음 만났을 때부터 오래 알고 지낸 사이처럼 낯가림 없이 통했던 점이 확신이 되었어요."
      : " An instant sense of familiarity made bonding feel completely effortless from the very start.";
  } else if (hasHarmony) {
    explanation += isKo
      ? " 서로의 대화 유머 타임라인이 쿵 잘 맞아 이야기를 나누는 내내 시간 가는 줄 몰랐어요."
      : " Mutual communication chemistry made every conversation feel lively and engaging.";
  } else if (hasJohu) {
    explanation += isKo
      ? " 나와는 다른 온도와 분위기가 오히려 기분 좋은 보완이 되어 함께 있을 때 마음이 맞춰졌어요."
      : " Differing internal temperaments complemented each other in a deeply satisfying way.";
  }

  return {
    subjectId: from,
    targetId: to,
    subjectName,
    targetName,
    headline,
    explanation,
    confidence: "HIGH",
  };
}

export function buildFriendWhyYouMeUs(
  report: FriendReportBody,
  viewerIsReportA: boolean,
  names: [string, string],
  locale: Locale,
): WhyYouMeUsData | null {
  const f = report.friend;
  if (!f?.section_social_dna_a || !f?.section_social_dna_b) return null;

  const [nameViewer, namePartner] = names;
  const canonicalA = report.meta?.canonical_bundle?.personalA;
  const canonicalB = report.meta?.canonical_bundle?.personalB;

  const dmA = canonicalA?.chart?.dayStemCode ?? "byeong";
  const dmB = canonicalB?.chart?.dayStemCode ?? "eul";

  const conn = report.meta?.connection_pct ?? 70;
  const bant = report.meta?.banter_pct ?? 70;

  const hasCombine = conn >= 70;
  const hasHarmony = bant >= 70;
  const hasJohu = conn >= 60 && bant >= 60;

  // Viewer -> Partner (whyYou: "왜 너일까")
  const attractionYou = deriveAttractionForDirection({
    from: viewerIsReportA ? "a" : "b",
    to: viewerIsReportA ? "b" : "a",
    subjectName: nameViewer,
    targetName: namePartner,
    targetDayMaster: viewerIsReportA ? dmB : dmA,
    hasCombine,
    hasHarmony,
    hasJohu,
    locale,
  });

  // Partner -> Viewer (whyMe: "왜 나일까")
  const attractionMe = deriveAttractionForDirection({
    from: viewerIsReportA ? "b" : "a",
    to: viewerIsReportA ? "a" : "b",
    subjectName: namePartner,
    targetName: nameViewer,
    targetDayMaster: viewerIsReportA ? dmA : dmB,
    hasCombine,
    hasHarmony,
    hasJohu,
    locale,
  });

  const isKo = locale !== "en-US";
  let whyUsTitle = isKo ? "우리가 빠르게 가까워진 이유" : "Why We Clicked So Quickly";
  let whyUsBody = isKo
    ? "서로의 분위기와 에너지 반응이 가식 없이 호응하여 계산이나 경계 없이 편안한 친밀감을 형성했습니다."
    : "Unpretentious mutual chemistry allowed both of you to drop your guard and build genuine trust effortlessly.";

  if (hasCombine) {
    whyUsTitle = isKo ? "말하지 않아도 본능적으로 통하는 우정 케미" : "Instinctive & Effortless Connection";
    whyUsBody = isKo
      ? "서로의 기운이 자연스럽게 맞아떨어져 오랜 친구처럼 빠르게 마음을 열고 깊은 우정을 쌓아갈 수 있었습니다."
      : "A natural alignment of relational rhythms made mutual trust feel instant and enduring.";
  } else if (hasJohu) {
    whyUsTitle = isKo ? "서로의 온도를 맞춰주는 완벽한 균형" : "Complementary Relational Balance";
    whyUsBody = isKo
      ? "한 쪽의 열정과 다른 한 쪽의 차분함이 어우러져 만나면 시간이 가는 줄 모를 만큼 편안한 조화를 만듭니다."
      : "One person's energy and the other's calm balance each other into a deeply satisfying friendship rhythm.";
  }

  return {
    whyYou: {
      from: viewerIsReportA ? "a" : "b",
      to: viewerIsReportA ? "b" : "a",
      title: isKo ? `${namePartner}에게 끌리는 이유` : `What draws you to ${namePartner}`,
      body: attractionYou.explanation,
      signals: [attractionYou.headline],
    },
    whyMe: {
      from: viewerIsReportA ? "b" : "a",
      to: viewerIsReportA ? "a" : "b",
      title: isKo ? `${nameViewer}에게 끌리는 이유` : `What draws ${namePartner} to you`,
      body: attractionMe.explanation,
      signals: [attractionMe.headline],
    },
    whyUs: {
      title: whyUsTitle,
      body: whyUsBody,
      mechanism: [],
    },
    moment: null,
    bridge: null,
  };
}
