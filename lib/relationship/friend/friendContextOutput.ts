/**
 * Friend Context Output — 이미 계산된 RuleContext·friend section 결과의 표준 재포장.
 * 새 판정·점수·문구 없음. 순수 매핑만.
 */
import type { FriendScoringSignals } from "@/lib/saju/friendAnalysis";
import type { FriendMasterScores } from "@/lib/relationship/friendEventScores";
import type { FriendRuleContext } from "./buildFriendRuleContext";
import type { FriendSocialReport } from "./friendReportTemplate";

export const FRIEND_CONTEXT_OUTPUT_SCHEMA_VERSION = "context_output_v1" as const;

export type FriendContextOutputMeta = {
  reportIdA: string;
  reportIdB: string;
  inputFingerprintA: string;
  inputFingerprintB: string;
};

export type FriendContextDominantCategory = {
  category: string;
  scores?: Record<string, number>;
};

/** buildFriendReport가 조립한 friend 섹션 트리 */
export type FriendSocialReportSections = FriendSocialReport;

/**
 * 친구 도메인 Context Output.
 * `signals`는 기존 `FriendScoringSignals`를 그대로 노출.
 */
export type FriendContextOutput = {
  schema_version: typeof FRIEND_CONTEXT_OUTPUT_SCHEMA_VERSION;
  domain: "friendship";
  grade: FriendRuleContext["grade"];
  /** ctx.masterScores — { connection, banter, risk } */
  scores: FriendMasterScores;
  dominant_categories: Record<string, FriendContextDominantCategory>;
  signals: FriendScoringSignals;
  /**
   * 짧고 선택적인 축 보조문구만.
   * 출처: section_snapshot.vibe_axis_notes, play_money.psych_confirm_note,
   * compare communication_rhythm.psych_note.
   */
  axis_notes: {
    connection: string | null;
    banter: string | null;
    risk: string | null;
    treasurer_confirm: string | null;
    communication_rhythm: string | null;
  };
  /**
   * 이미 생성된 사용자용 완성 문장만.
   * treasurer_reason / travel role_prescription.
   */
  section_summaries: {
    treasurer_reason: string | null;
    travel_role: string | null;
  };
  meta?: FriendContextOutputMeta;
};

export type BuildFriendContextOutputOptions = {
  personCoreMeta?: {
    reportIdA: string;
    reportIdB: string;
    inputFingerprintA: string;
    inputFingerprintB: string;
  } | null;
};

/**
 * ctx + 최종 friend section 결과를 Context Output으로 모은다.
 * 판정 함수 재호출 없음.
 */
export function buildFriendContextOutput(
  ctx: FriendRuleContext,
  friend: FriendSocialReportSections,
  options?: BuildFriendContextOutputOptions,
): FriendContextOutput {
  const dominant_categories: Record<string, FriendContextDominantCategory> =
    {};

  // guardian — resolveGuardianCharacterForPerson 결과가 section에 이미 저장됨 (.key)
  const guardianA = friend.section_social_dna_a.guardian_character;
  const guardianB = friend.section_social_dna_b.guardian_character;
  if (guardianA?.key) {
    dominant_categories.guardian_a = { category: guardianA.key };
  }
  if (guardianB?.key) {
    dominant_categories.guardian_b = { category: guardianB.key };
  }

  // treasurer — pickFriendTreasurer 결과가 nickname으로 저장됨 → a/b 측만 기록
  const treasurerNick = friend.section_play_money.treasurer_nickname;
  if (treasurerNick === ctx.nicknameA) {
    dominant_categories.treasurer = { category: "a" };
  } else if (treasurerNick === ctx.nicknameB) {
    dominant_categories.treasurer = { category: "b" };
  }

  // tikitaka / battery — FriendDnaProfile raw mode (ctx에 이미 계산됨; section에는 label만)
  dominant_categories.tikitaka_a = {
    category: ctx.friendPairAnalysis.dnaA.tikitakaMode,
  };
  dominant_categories.tikitaka_b = {
    category: ctx.friendPairAnalysis.dnaB.tikitakaMode,
  };
  dominant_categories.battery_a = {
    category: ctx.friendPairAnalysis.dnaA.batteryMode,
  };
  dominant_categories.battery_b = {
    category: ctx.friendPairAnalysis.dnaB.batteryMode,
  };

  // counseling — section_hidden_flow에 type이 있을 때만
  const counselingA = friend.section_hidden_flow?.counseling_style_a?.type;
  const counselingB = friend.section_hidden_flow?.counseling_style_b?.type;
  if (counselingA) {
    dominant_categories.counseling_a = { category: counselingA };
  }
  if (counselingB) {
    dominant_categories.counseling_b = { category: counselingB };
  }

  const vibe = friend.section_snapshot.vibe_axis_notes ?? null;
  const rhythmRow = friend.section_compare_table?.find(
    (r) => r.id === "communication_rhythm",
  );
  const rhythmNote =
    rhythmRow && "psych_note" in rhythmRow
      ? ((rhythmRow as { psych_note?: string | null }).psych_note ?? null)
      : null;

  const personCoreMeta = options?.personCoreMeta ?? null;
  const meta: FriendContextOutputMeta | undefined = personCoreMeta
    ? {
        reportIdA: personCoreMeta.reportIdA,
        reportIdB: personCoreMeta.reportIdB,
        inputFingerprintA: personCoreMeta.inputFingerprintA,
        inputFingerprintB: personCoreMeta.inputFingerprintB,
      }
    : undefined;

  return {
    schema_version: FRIEND_CONTEXT_OUTPUT_SCHEMA_VERSION,
    domain: "friendship",
    grade: ctx.grade,
    scores: {
      connection: ctx.masterScores.connection,
      banter: ctx.masterScores.banter,
      risk: ctx.masterScores.risk,
    },
    dominant_categories,
    signals: { ...ctx.friendPairAnalysis.scoringSignals },
    axis_notes: {
      connection: vibe?.connection_note ?? null,
      banter: vibe?.banter_note ?? null,
      risk: vibe?.risk_note ?? null,
      treasurer_confirm: friend.section_play_money.psych_confirm_note ?? null,
      communication_rhythm: rhythmNote,
    },
    section_summaries: {
      treasurer_reason: friend.section_play_money.treasurer_reason ?? null,
      travel_role:
        friend.section_hidden_flow?.travel_style?.role_prescription ?? null,
    },
    ...(meta ? { meta } : {}),
  };
}
