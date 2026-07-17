import type { WorkColleagueContext } from "./buildWorkColleagueContext";
import { buildOfficeMeetingSummary } from "./officeLanguage";
import { pick, LEGACY_FALLBACK_LOCALE } from "./workColleagueCopy";
import { getTriScoreKindConfig } from "@/lib/relationship/triScoreSnapshot/kinds";
import type { Locale } from "@/lib/i18n/locale";
import type { RelationshipTopicGauge } from "@/lib/relationship/triScoreSnapshot/types";
import type {
  SnapshotNarrative,
  SnapshotTopicNarrative,
} from "@/lib/relationship/romanticSnapshot/buildSnapshotNarrative";

type WorkPositiveContext = {
  bondPhrase: string | null;
  hasMonthStemSupport: boolean;
  hasMonthYukhap: boolean;
  monthSynergyStrong: boolean;
};

function buildWorkPositiveContext(ctx: WorkColleagueContext): WorkPositiveContext {
  const month = ctx.workPairAnalysis.monthBranch;
  const hasMonthStemSupport = month.monthElementInteraction.includes("상생");
  const hasMonthYukhap =
    month.directMonthCross?.type === "육합" ||
    month.monthCrossHits.some((h) => h.type === "육합");
  const monthSynergyStrong = month.synergyWeight >= 2;
  const locale = ctx.locale ?? LEGACY_FALLBACK_LOCALE;

  let bondPhrase: string | null = null;
  if (hasMonthStemSupport && hasMonthYukhap) {
    bondPhrase = pick(
      locale,
      "Your work rhythms naturally mesh. It's easy to find your groove from the very first project.",
      "일터 리듬이 자연스럽게 맞물리는 조합이에요. 첫 프로젝트부터 호흡이 나오기 쉽습니다.",
    );
  } else if (hasMonthStemSupport) {
    bondPhrase = pick(
      locale,
      "Each other's work energy tends to come alive, so the longer a project runs, the bigger the synergy grows.",
      "서로의 업무 에너지가 살아나는 편이라, 프로젝트가 길어질수록 시너지가 커져요.",
    );
  } else if (hasMonthYukhap || monthSynergyStrong) {
    bondPhrase = pick(
      locale,
      "There are signs of collaborative synergy, so you mesh comfortably even on work you're touching for the first time.",
      "협업 시너지 신호가 있어, 처음 맞닿는 업무에서도 편하게 맞물립니다.",
    );
  } else if (ctx.masterScores.benefit >= 60) {
    bondPhrase = pick(locale, "Synergy comes alive when you work together.", "함께 일할 때 시너지가 살아나는 조합이에요.");
  }

  return {
    bondPhrase,
    hasMonthStemSupport,
    hasMonthYukhap,
    monthSynergyStrong,
  };
}

function appendBondNote(base: string, positive: WorkPositiveContext): string {
  if (!positive.bondPhrase) return base;
  return `${base} ${positive.bondPhrase}`;
}

function interpretWorkTopic(
  gauge: RelationshipTopicGauge,
  positive: WorkPositiveContext,
  ctx: WorkColleagueContext,
): SnapshotTopicNarrative {
  const locale = ctx.locale ?? LEGACY_FALLBACK_LOCALE;
  const config = getTriScoreKindConfig("work", locale);
  const topicMeta = config.topics.find((t) => t.topic === gauge.topic);
  const activation = Math.round(gauge.activation);
  const benefit = Math.round(gauge.benefit);
  const risk = Math.round(gauge.risk);
  const comm = ctx.workPairAnalysis.stemCommunication;

  if (gauge.topic === "intimacy") {
    const core = pick(
      locale,
      activation >= 70
        ? `Communication in meetings and reports clicks well (work fit ${activation}%). A good combination for handing off roles.`
        : activation >= 60
          ? "Just align your communication styles and work fit rises."
          : "Meeting styles may differ at first, but trust builds once you set a process.",
      activation >= 70
        ? `회의·보고에서 말이 잘 통해요(업무적 핏 ${activation}%). 역할을 맡기기 좋은 조합입니다.`
        : activation >= 60
          ? "소통 방식만 맞추면 업무적 핏이 올라가요."
          : "처음엔 회의 스타일 차이가 있어도, 프로세스를 정하면 신뢰가 쌓여요.",
    );
    const extra =
      risk < 55
        ? pick(
            locale,
            " Friction over work rhythm is on the low side, so splitting the agenda alone lets you mesh comfortably.",
            " 업무 리듬 마찰은 낮은 편이라, 안건만 나누면 편하게 맞물립니다.",
          )
        : "";
    return {
      topic: gauge.topic,
      title: topicMeta?.cardTitle ?? pick(locale, "① Work Fit & Trust", "① 업무 핏·신뢰"),
      subtitle: topicMeta?.cardSubtitle ?? "",
      activation,
      benefit,
      risk,
      interpretation: appendBondNote(`${core}${extra}`, positive),
      isWarning: false,
    };
  }

  if (gauge.topic === "stability") {
    const core = pick(
      locale,
      benefit >= 68
        ? `Collaboration synergy ${benefit}% — favorable for long-term projects and keeping schedules aligned.`
        : `Collaboration synergy ${benefit}% — plenty of room to raise it further through role division.`,
      benefit >= 68
        ? `협업 시너지 ${benefit}% — 장기 프로젝트·일정 맞추기에 유리합니다.`
        : `협업 시너지 ${benefit}% — 역할 분담으로 끌어올릴 여지가 충분해요.`,
    );
    const balance = pick(
      locale,
      risk >= 58
        ? ` Even with work friction (${risk}%), recovery is quick once you acknowledge each other's areas of expertise.`
        : " Just keep your work rhythm aligned and this becomes a long-lasting partnership.",
      risk >= 58
        ? ` 업무 마찰(${risk}%)이 있어도, 서로의 전문 영역을 인정하면 회복이 빠릅니다.`
        : " 업무 리듬만 맞추면 오래 가는 파트너십이 됩니다.",
    );
    return {
      topic: gauge.topic,
      title: topicMeta?.cardTitle ?? pick(locale, "② Project Synergy", "② 프로젝트 시너지"),
      subtitle: topicMeta?.cardSubtitle ?? "",
      activation,
      benefit,
      risk,
      interpretation: appendBondNote(`${core}${balance}`, positive),
      isWarning: false,
    };
  }

  const isWarning = risk >= 88 && benefit < 30;
  const core = pick(
    locale,
    risk >= 60
      ? `Office risk ${risk}% — you can get sensitive easily when schedule, role, and evaluation topics overlap.`
      : `Office risk ${risk}% — even when conflict comes up, the working relationship tends not to break easily.`,
    risk >= 60
      ? `오피스 리스크 ${risk}% — 일정·역할·평가 주제가 겹치면 예민해지기 쉬워요.`
      : `오피스 리스크 ${risk}% — 갈등이 와도 협업 관계가 쉽게 끊기지는 않는 편이에요.`,
  );
  const caution = pick(
    locale,
    benefit <= 45
      ? ` Collaboration synergy (${benefit}) dips a bit at times like this, so put the agenda and decision rights in writing before meetings.`
      : ` Collaboration synergy ${benefit} · work friction ${risk} — respecting project rhythm and roles keeps things stable.`,
    benefit <= 45
      ? ` 이때는 협업 시너지(${benefit})가 잠깐 낮아지니, 회의 전에 안건·결정권을 문서로 정리하세요.`
      : ` 협업 시너지 ${benefit} · 업무 마찰 ${risk} — 프로젝트 리듬과 역할을 존중하면 안정됩니다.`,
  );
  const commNote = comm.stemPairs?.length
    ? ` ${buildOfficeMeetingSummary(comm, locale)}`
    : "";

  return {
    topic: gauge.topic,
    title: topicMeta?.cardTitle ?? pick(locale, "③ Work Friction & Conflict", "③ 업무 마찰·갈등"),
    subtitle: topicMeta?.cardSubtitle ?? "",
    activation,
    benefit,
    risk,
    interpretation: `${core}${caution}${commNote}`,
    isWarning,
  };
}

export function buildWorkSnapshotNarrative(params: {
  ctx: WorkColleagueContext;
  relationshipGauges: RelationshipTopicGauge[];
}): SnapshotNarrative {
  const positive = buildWorkPositiveContext(params.ctx);
  return {
    topics: params.relationshipGauges.map((g) =>
      interpretWorkTopic(g, positive, params.ctx),
    ),
  };
}

export function buildWorkSnapshotNarrativeFromGauges(
  gauges: RelationshipTopicGauge[],
): SnapshotNarrative {
  const emptyPositive: WorkPositiveContext = {
    bondPhrase: null,
    hasMonthStemSupport: false,
    hasMonthYukhap: false,
    monthSynergyStrong: false,
  };
  const stubCtx = {
    workPairAnalysis: {
      stemCommunication: {
        communicationFitScore: 50,
        meetingStyleSummary: "",
        communicationSummary: "",
        stemPairs: [],
      },
    },
  } as unknown as WorkColleagueContext;

  return {
    topics: gauges.map((g) =>
      interpretWorkTopic(g, emptyPositive, stubCtx),
    ),
  };
}
