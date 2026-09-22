import {
  getRelationshipRoleByTenGod,
  type RelationshipRoleDefinition,
  type RelationshipRoleId,
  type TenGodCode,
} from "./relationshipRoleSsot";
import { resolveDayMasterRelationshipRole } from "./resolveDayMasterRelationshipRole";

/**
 * Free-tier, birth-data-only relationship preview -- the exact 6-item
 * result spec for the invite/manual "free relationship result" screen:
 *   1. viewer -> other role   2. other -> viewer role
 *   3. one-line summary       4. two "fit" points
 *   5. one-two friction points 6. one comfort tip
 *
 * Strictly a thin composition layer on top of the existing 10-role SSOT
 * (relationshipRoleSsot.ts / resolveDayMasterRelationshipRole.ts). It never
 * invents a role label, description or icon -- those are read verbatim from
 * the SSOT. The fit/friction/tip lines below are new, deterministic
 * connective copy (this 6-item screen did not exist before), but they are
 * always built FROM the two roles' existing labels/descriptions, never from
 * survey/psych data -- this function takes Day Master stems only, so it is
 * safe to call with nothing but two birth dates.
 */

/** The five stem-role categories, purely structural -- not a new label system, just how calculateTenGod's 10 codes group in pairs. */
type TenGodCategory = "inseong" | "gwanseong" | "siksang" | "jaeseong" | "bigyeop";

const TEN_GOD_CATEGORY: Record<TenGodCode, TenGodCategory> = {
  jeongin: "inseong",
  pyeonin: "inseong",
  jeonggwan: "gwanseong",
  pyeongwan: "gwanseong",
  siksin: "siksang",
  sanggwan: "siksang",
  jeongjae: "jaeseong",
  pyeonjae: "jaeseong",
  bigyeon: "bigyeop",
  geopjae: "bigyeop",
};

const TIP_BY_ROLE: Record<RelationshipRoleId, { ko: string; en: string }> = {
  my_person: {
    ko: "이미 편하게 기댈 수 있는 사이예요. 가끔은 먼저 안부를 물어보면 그 편안함이 더 오래가요.",
    en: "You already lean on each other easily. Checking in first, once in a while, keeps that ease alive.",
  },
  muse: {
    ko: "새로운 자극이 즐거운 사이예요. 가끔은 그냥 편하게 아무 말 없이 있는 시간도 챙겨보세요.",
    en: "New ideas flow easily between you. Leave room for quiet, unstructured time together too.",
  },
  compass: {
    ko: "방향을 잡아주는 사이라 든든하지만, 가끔은 답을 정해주기보다 그냥 들어주기만 해도 충분해요.",
    en: "This bond gives you direction -- sometimes just listening, without steering, is enough.",
  },
  growth_button: {
    ko: "서로를 자극하고 성장시키는 사이예요. 긴장이 올라올 땐 잠깐 텀을 두고 다시 이야기해보세요.",
    en: "You push each other to grow. When tension rises, a short pause before continuing helps.",
  },
  couch: {
    ko: "가장 힘을 뺄 수 있는 사이예요. 편한 만큼 서로에게 하는 말도 한 번 더 다정하게 골라보세요.",
    en: "You can fully relax around each other -- since it's this easy, choose your words a little gently too.",
  },
  mic: {
    ko: "속마음을 꺼내게 만드는 사이예요. 꺼낸 말을 상대가 어떻게 받아들이는지도 함께 살펴보세요.",
    en: "This bond draws your thoughts out into words -- check in on how those words land, too.",
  },
  keeper: {
    ko: "자연스럽게 챙기고 싶어지는 사이예요. 챙기는 마음이 부담으로 느껴지진 않는지 가끔 물어보세요.",
    en: "You naturally want to look after each other -- check in that the care feels welcome, not heavy.",
  },
  explorer: {
    ko: "익숙한 틀 밖으로 데리고 나가는 사이예요. 새로운 걸 시도할 땐 상대의 속도도 함께 맞춰보세요.",
    en: "This bond pulls you out of your comfort zone -- match pace with each other when trying something new.",
  },
  twin: {
    ko: "결이 비슷해서 편한 사이예요. 비슷한 만큼 서로 다른 부분도 있다는 걸 잊지 않으면 좋아요.",
    en: "You move at a similar wavelength -- just remember the parts where you're not the same, too.",
  },
  spark: {
    ko: "서로의 에너지를 끌어올리는 사이예요. 승부욕이 붙을 땐 한 박자 쉬고 대화하면 더 편해져요.",
    en: "You spark each other's energy -- when it turns competitive, a beat of pause makes the talk easier.",
  },
};

export type FreeRelationshipPreviewRole = {
  tenGod: TenGodCode;
  roleId: RelationshipRoleId;
  labelKo: string;
  labelEn: string;
  descriptionKo: string;
  descriptionEn: string;
  icon: RelationshipRoleDefinition["icon"];
};

export type FreeRelationshipPreviewResult = {
  /** 1. viewer -> other role */
  otherRoleForViewer: FreeRelationshipPreviewRole;
  /** 2. other -> viewer role */
  viewerRoleForOther: FreeRelationshipPreviewRole;
  /** 3. one-line summary */
  summaryKo: string;
  summaryEn: string;
  /** 4. two fit points */
  fitPointsKo: [string, string];
  fitPointsEn: [string, string];
  /** 5. one-two friction points */
  frictionPointsKo: string[];
  frictionPointsEn: string[];
  /** 6. one comfort tip */
  tipKo: string;
  tipEn: string;
};

function toPreviewRole(def: RelationshipRoleDefinition): FreeRelationshipPreviewRole {
  return {
    tenGod: def.tenGod,
    roleId: def.roleId,
    labelKo: def.labelKo,
    labelEn: def.labelEn,
    descriptionKo: def.descriptionKo,
    descriptionEn: def.descriptionEn,
    icon: def.icon,
  };
}

/**
 * viewerDayMaster / otherDayMaster: each person's Day Master stem code --
 * the same input `resolveDayMasterRelationshipRole` already takes. This
 * function does not read survey/psych data at all.
 */
function formatNim(name: string, fallback: string): string {
  const clean = name?.trim() || fallback;
  return clean.endsWith("님") ? clean : `${clean}님`;
}

export function composeFreeRelationshipPreview(params: {
  viewerDayMaster: string;
  otherDayMaster: string;
  viewerName: string;
  otherName: string;
}): FreeRelationshipPreviewResult {
  const { viewerDayMaster, otherDayMaster, viewerName, otherName } = params;

  const otherToViewer = resolveDayMasterRelationshipRole({
    viewerDayMaster,
    otherDayMaster,
  });
  const viewerToOther = resolveDayMasterRelationshipRole({
    viewerDayMaster: otherDayMaster,
    otherDayMaster: viewerDayMaster,
  });

  const otherRoleForViewer = toPreviewRole(getRelationshipRoleByTenGod(otherToViewer.tenGod));
  const viewerRoleForOther = toPreviewRole(getRelationshipRoleByTenGod(viewerToOther.tenGod));

  const sameRole = otherRoleForViewer.roleId === viewerRoleForOther.roleId;

  const vNim = formatNim(viewerName, "나");
  const oNim = formatNim(otherName, "상대");

  const summaryKo = sameRole
    ? `${vNim}과 ${oNim}은 서로에게 '${otherRoleForViewer.labelKo}' 같은 사이예요.`
    : `${vNim}에게 ${oNim}은 '${otherRoleForViewer.labelKo}', ${oNim}에게 ${vNim}은 '${viewerRoleForOther.labelKo}'에 가까운 사이예요.`;
  const summaryEn = sameRole
    ? `${viewerName} and ${otherName} are each other's "${otherRoleForViewer.labelEn}."`
    : `${otherName} tends to feel like ${viewerName}'s "${otherRoleForViewer.labelEn}," while ${viewerName} tends to feel like ${otherName}'s "${viewerRoleForOther.labelEn}."`;

  const fitPoint1Ko = `${oNim}은 ${otherRoleForViewer.descriptionKo}`;
  const fitPoint1En = otherRoleForViewer.descriptionEn;
  const fitPoint2Ko = `${vNim}은 ${oNim}에게 ${viewerRoleForOther.descriptionKo}`;
  const fitPoint2En = viewerRoleForOther.descriptionEn;

  const frictionKo = sameRole
    ? `둘 다 서로를 '${otherRoleForViewer.labelKo}'로 느끼는 비슷한 결의 사이예요. 편한 만큼, 기대고 싶은 마음이 양쪽 다 커질 수 있으니 균형을 챙겨보세요.`
    : `${vNim}에게 ${oNim}은 '${otherRoleForViewer.labelKo}'로 느껴지지만, ${oNim}에게 ${vNim}은 '${viewerRoleForOther.labelKo}'로 느껴질 수 있어요. 서로 기대하는 지점이 다를 수 있다는 걸 알아두면 덜 엇갈려요.`;
  const frictionEn = sameRole
    ? `You're both leaning on a similar role for each other ("${otherRoleForViewer.labelEn}") -- since it's comfortable on both sides, keep an eye on balance so neither of you over-relies on it.`
    : `${otherName} may feel like your "${otherRoleForViewer.labelEn}," while you may feel like ${otherName}'s "${viewerRoleForOther.labelEn}." Knowing you're each expecting something a little different helps avoid crossed wires.`;

  const tipSource = TIP_BY_ROLE[otherRoleForViewer.roleId];

  return {
    otherRoleForViewer,
    viewerRoleForOther,
    summaryKo,
    summaryEn,
    fitPointsKo: [fitPoint1Ko, fitPoint2Ko],
    fitPointsEn: [fitPoint1En, fitPoint2En],
    frictionPointsKo: [frictionKo],
    frictionPointsEn: [frictionEn],
    tipKo: tipSource.ko,
    tipEn: tipSource.en,
  };
}

/** Exported for tests / callers that already resolved category (not currently branched on, kept for future paid-layer reuse per relationshipRoleSsot conventions). */
export function tenGodCategoryOf(tenGod: TenGodCode): TenGodCategory {
  return TEN_GOD_CATEGORY[tenGod];
}
