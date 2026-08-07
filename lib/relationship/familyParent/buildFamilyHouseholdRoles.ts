/**
 * Family Part2 — 가정 내 역할 요약.
 * 신규 수치·threshold 없음. Part2 A/B/C + pairFamily 기존 bucket만 카피로 조합.
 *
 * 나/상대 = 생성 시 선택 관점(viewerIsChild). 부모 관점 → 나=부모, 자녀 관점 → 나=자녀.
 * 카피 원칙: 두 사람을 각각 독립 문장은행으로 채우지 말고, 이름·버킷 차이를 대비로 짚는다.
 */
import type { Locale } from "@/lib/i18n/locale";
import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import type { GuidanceFit, GuidanceMode } from "@/lib/personCore/sajuSignals/guidanceProfile";
import { resolveGuidanceFit } from "@/lib/personCore/sajuSignals/guidanceProfile";
import type { ParentBondBand } from "@/lib/personCore/sajuSignals/types";
import type { PairFamilySignals, PairIntensityBand } from "@/lib/personCore/sajuSignals/pairTypes";
import type { FamilySajuSignals } from "@/lib/personCore/sajuSignals/types";
import { buildPairFamilySignals } from "@/lib/personCore/sajuSignals/pairFamilySignals";
import { synthesizeFamilySignalsFromCounts } from "@/lib/personCore/sajuSignals/extractFamilySignals";
import { pick, LEGACY_FALLBACK_LOCALE } from "./familyParentCopy";
import { sanitizeFamilyParentText } from "./familyParentLanguage";
import { topicParticle, withParticle } from "@/lib/relationship/koreanParticles";
import {
  resolveBondDistanceBucket,
  resolveCorrectionStyleBucket,
  resolveGuidanceBalanceBucket,
} from "./familySajuCompareTable";

export type FamilyHouseholdRolesSection = {
  self_name: string;
  partner_name: string;
  self_role_label: string;
  self_role_detail: string;
  partner_role_label: string;
  partner_role_detail: string;
  complement: string;
  tension: string;
};

type TenGodCategory = "wealth" | "officer" | "food" | "seal" | "self";

type PersonSlot = {
  name: string;
  guidance: GuidanceMode;
  correction: TenGodCategory;
  bond: ParentBondBand;
};

/** 부모·자녀 모두에게 자연스러운 중립 역할명 (guidance_mode → label). */
const ROLE_LABEL: Record<Locale, Record<GuidanceMode, string>> = {
  "ko-KR": {
    receptive: "정서 감수형",
    explanatory: "맥락 설명형",
    standards: "기준 설정형",
    mixed: "유연 조율형",
  },
  "en-US": {
    receptive: "Feeling-attuned",
    explanatory: "Context-explainer",
    standards: "Frame-setter",
    mixed: "Flexible balancer",
  },
};

const MODE_FIRST_MOVE: Record<Locale, Record<GuidanceMode, string>> = {
  "ko-KR": {
    receptive: "마음을 먼저 받으려 해요",
    explanatory: "맥락부터 풀려 해요",
    standards: "기준부터 잡으려 해요",
    mixed: "장면마다 방식을 바꿔 가요",
  },
  "en-US": {
    receptive: "reach for the feeling first",
    explanatory: "reach for context first",
    standards: "reach for a frame first",
    mixed: "switch modes by scene",
  },
};

const MODE_GIFT: Record<Locale, Record<GuidanceMode, string>> = {
  "ko-KR": {
    receptive: "마음을 받아 주는",
    explanatory: "이유를 풀어 주는",
    standards: "틀을 잡아 주는",
    mixed: "장면을 맞춰 조율하는",
  },
  "en-US": {
    receptive: "receives the feeling",
    explanatory: "unpacks the why",
    standards: "holds the frame",
    mixed: "flexes the mode to the scene",
  },
};

const CORRECTION_MOVE: Record<Locale, Record<TenGodCategory, string>> = {
  "ko-KR": {
    self: "감정이 먼저 드러나요",
    seal: "속으로 차분히 정리해요",
    food: "그 자리에서 바로 반응해요",
    officer: "말하기 전에 이유를 정리해요",
    wealth: "실질적으로 정리되면 넘어가요",
  },
  "en-US": {
    self: "feelings show first",
    seal: "they sort things quietly inward",
    food: "they react on the spot",
    officer: "they sort the reason before speaking",
    wealth: "they move on once it’s practically settled",
  },
};

const BOND_MOVE: Record<Locale, Record<ParentBondBand, string>> = {
  "ko-KR": {
    distant: "숨 쉴 공간이 있을 때 편해요",
    balanced: "적당한 간격이 편해요",
    smothering: "가까이 붙어 있을 때 편해요",
  },
  "en-US": {
    distant: "feel easier with room to breathe",
    balanced: "feel easier with a moderate gap",
    smothering: "feel easier when staying close",
  },
};

const PLACE_LINE: Record<Locale, Record<GuidanceMode, string>> = {
  "ko-KR": {
    receptive: "상대의 기분을 먼저 읽고 받아 주는 자리",
    explanatory: "상황의 이유와 맥락을 풀어 주는 자리",
    standards: "무엇이 괜찮은지 기준을 분명히 하는 자리",
    mixed: "받아들이기·풀어 주기·기준 잡기를 번갈아 쓰는 자리",
  },
  "en-US": {
    receptive: "the place of reading and receiving feelings first",
    explanatory: "the place of unpacking why and how",
    standards: "the place of naming what is okay",
    mixed: "the place of switching receive / explain / frame by scene",
  },
};

type ModePairKey =
  | "receptive+explanatory"
  | "receptive+standards"
  | "explanatory+standards";

function modePairKey(a: GuidanceMode, b: GuidanceMode): ModePairKey | null {
  if (a === "mixed" || b === "mixed" || a === b) return null;
  const [x, y] = [a, b].sort() as [
    Exclude<GuidanceMode, "mixed">,
    Exclude<GuidanceMode, "mixed">,
  ];
  if (x === "explanatory" && y === "receptive") return "receptive+explanatory";
  if (x === "receptive" && y === "standards") return "receptive+standards";
  if (x === "explanatory" && y === "standards") return "explanatory+standards";
  return null;
}

function roleDetailFor(
  locale: Locale,
  me: PersonSlot,
  other: PersonSlot,
  side: "self" | "partner",
): string {
  const myLabel = ROLE_LABEL[locale][me.guidance];
  const otherLabel = ROLE_LABEL[locale][other.guidance];
  const myPlace = PLACE_LINE[locale][me.guidance];
  const modeDiff = me.guidance !== other.guidance;
  const corrDiff = me.correction !== other.correction;
  const bondDiff = me.bond !== other.bond;

  if (locale === "en-US") {
    const lead =
      side === "self"
        ? `${me.name} tends to take ${myPlace} (${myLabel}).`
        : `${me.name} tends to take ${myPlace} (${myLabel}) — different from a copy of ${other.name}.`;

    if (modeDiff) {
      return sanitizeFamilyParentText(
        `${lead} Compared with ${other.name} (${otherLabel}): ${me.name} ${MODE_FIRST_MOVE[locale][me.guidance]}, while ${other.name} ${MODE_FIRST_MOVE[locale][other.guidance]}.`,
      );
    }
    if (corrDiff || bondDiff) {
      const bits: string[] = [];
      if (corrDiff) {
        bits.push(
          `under tension ${me.name} ${CORRECTION_MOVE[locale][me.correction]}, while ${other.name} ${CORRECTION_MOVE[locale][other.correction]}`,
        );
      }
      if (bondDiff) {
        bits.push(
          `on closeness ${me.name} ${BOND_MOVE[locale][me.bond]}, while ${other.name} ${BOND_MOVE[locale][other.bond]}`,
        );
      }
      return sanitizeFamilyParentText(
        `${lead} Same role name, but ${bits.join("; ")}.`,
      );
    }
    // 신호 전부 동일 — 문장을 복제하지 않고 관계 각도만 다르게
    if (side === "self") {
      return sanitizeFamilyParentText(
        `${lead} Under tension, ${CORRECTION_MOVE[locale][me.correction]}, and they ${BOND_MOVE[locale][me.bond]}.`,
      );
    }
    return sanitizeFamilyParentText(
      `${me.name} shares the same home-role label as ${other.name} (${myLabel}). The difference shows less in the label and more in how the pair repeats the same move — watch who ends up carrying the ‘same talk again’ load.`,
    );
  }

  // ko-KR — 이름은 `쪽은`으로 붙여 조사 오류·복붙 문장을 피함
  const lead = `${me.name} 쪽은 가정에서 ${myPlace}에 서기 쉬워요(${myLabel}).`;

  if (modeDiff) {
    return sanitizeFamilyParentText(
      `${lead} ${other.name}(${otherLabel})와 비교하면 — ${me.name} 쪽은 ${MODE_FIRST_MOVE[locale][me.guidance]}, ${other.name} 쪽은 ${MODE_FIRST_MOVE[locale][other.guidance]}.`,
    );
  }
  if (corrDiff || bondDiff) {
    const bits: string[] = [];
    if (corrDiff) {
      bits.push(
        `긴장 때 ${me.name} 쪽은 ${CORRECTION_MOVE[locale][me.correction]}, ${other.name} 쪽은 ${CORRECTION_MOVE[locale][other.correction]}`,
      );
    }
    if (bondDiff) {
      bits.push(
        `거리에서는 ${me.name} 쪽은 ${BOND_MOVE[locale][me.bond]}, ${other.name} 쪽은 ${BOND_MOVE[locale][other.bond]}`,
      );
    }
    return sanitizeFamilyParentText(
      `${lead} 역할명은 같아도, ${bits.join(". ")}.`,
    );
  }
  if (side === "self") {
    return sanitizeFamilyParentText(
      `${lead} 긴장이 생기면 ${CORRECTION_MOVE[locale][me.correction]}, ${BOND_MOVE[locale][me.bond]}.`,
    );
  }
  return sanitizeFamilyParentText(
    `${me.name} 쪽도 ${other.name}와 같은 역할명(${myLabel})이에요. 차이는 라벨보다, 같은 말이 반복될 때 누가 ‘또 그 이야기’ 부담을 지는지에서 더 잘 보여요.`,
  );
}

function buildComplement(
  locale: Locale,
  fit: GuidanceFit,
  self: PersonSlot,
  partner: PersonSlot,
  _umbilical: PairIntensityBand,
  _nagging: PairIntensityBand,
): string {
  const selfLabel = ROLE_LABEL[locale][self.guidance];
  const partnerLabel = ROLE_LABEL[locale][partner.guidance];

  if (fit === "aligned") {
    // 같은 채널이라도 correction/bond 차이를 보완 포인트로 명시
    if (self.correction !== partner.correction || self.bond !== partner.bond) {
      return sanitizeFamilyParentText(
        pick(
          locale,
          `${self.name} and ${partner.name} share the same home-role channel (${selfLabel}). They complement each other when ${self.name} leads with “${CORRECTION_MOVE[locale][self.correction]} / ${BOND_MOVE[locale][self.bond]}” and ${partner.name} answers with “${CORRECTION_MOVE[locale][partner.correction]} / ${BOND_MOVE[locale][partner.bond]}” instead of copying the same move.`,
          `${withParticle(self.name)} ${topicParticle(partner.name)} 같은 자리 채널(${selfLabel})이에요. ${self.name} 쪽이 ‘${CORRECTION_MOVE[locale][self.correction]} · ${BOND_MOVE[locale][self.bond]}’로 갈 때, ${partner.name} 쪽이 ‘${CORRECTION_MOVE[locale][partner.correction]} · ${BOND_MOVE[locale][partner.bond]}’로 받아 주면 같은 말이 겹치지 않고 보완돼요.`,
        ),
      );
    }
    return sanitizeFamilyParentText(
      pick(
        locale,
        `${self.name} and ${partner.name} share the same home-role channel (${selfLabel} · ${partnerLabel}). Complement shows up when one names the feeling and the other names the ask — same language, two beats.`,
        `${withParticle(self.name)} ${topicParticle(partner.name)} 같은 자리 채널(${selfLabel} · ${partnerLabel})이에요. 한 사람은 감정 한 줄, 다른 사람은 요청 한 줄로 나누면 같은 언어가 보완으로 바뀌어요.`,
      ),
    );
  }

  if (fit === "partial") {
    const mixedName = self.guidance === "mixed" ? self.name : partner.name;
    const otherName = mixedName === self.name ? partner.name : self.name;
    const otherLabel = mixedName === self.name ? partnerLabel : selfLabel;
    return sanitizeFamilyParentText(
      pick(
        locale,
        `${mixedName} flexes across modes, while ${otherName} leans ${otherLabel}. They complement each other when ${mixedName} names which move the moment needs — receive, explain, or set a frame — before ${otherName} answers.`,
        `${mixedName} 쪽은 유연 조율형이고, ${otherName} 쪽은 ${otherLabel}이에요. ${mixedName} 쪽이 지금 장면이 받아들이기·풀어 주기·기준 중 무엇인지 한 줄로 먼저 말해 주면 ${otherName}와 보완되기 쉬워요.`,
      ),
    );
  }

  // mismatch — 마찰 밴드와 무관하게 A/B 역할 gift를 이름으로 명시 (긴장은 tension에서 담당)
  const pair = modePairKey(self.guidance, partner.guidance);
  if (pair) {
    return sanitizeFamilyParentText(
      pick(
        locale,
        `${self.name} is ${selfLabel}, ${partner.name} is ${partnerLabel}. They complement each other when ${self.name} ${MODE_GIFT[locale][self.guidance]} and ${partner.name} ${MODE_GIFT[locale][partner.guidance]} — take turns, don’t stack the same first move.`,
        `${self.name} 쪽은 ${selfLabel}, ${partner.name} 쪽은 ${partnerLabel}이에요. ${self.name} 쪽이 ${MODE_GIFT[locale][self.guidance]} 역할을, ${partner.name} 쪽이 ${MODE_GIFT[locale][partner.guidance]} 역할을 번갈아 가면 같은 장면이 보완돼요.`,
      ),
    );
  }

  return sanitizeFamilyParentText(
    pick(
      locale,
      `Even with ${self.name} (${selfLabel}) and ${partner.name} (${partnerLabel}) differing, a short handoff helps: one sentence for the feeling, one sentence for the ask.`,
      `${self.name}(${selfLabel})와 ${partner.name}(${partnerLabel})의 자리가 달라도, ‘감정 한 줄 + 요청 한 줄’로 넘기면 서로를 보완하는 리듬이 생기기 쉬워요.`,
    ),
  );
}

function buildTension(
  locale: Locale,
  fit: GuidanceFit,
  self: PersonSlot,
  partner: PersonSlot,
  umbilical: PairIntensityBand,
  nagging: PairIntensityBand,
): string {
  const parts: string[] = [];
  const selfLabel = ROLE_LABEL[locale][self.guidance];
  const partnerLabel = ROLE_LABEL[locale][partner.guidance];

  if (fit === "mismatch") {
    parts.push(
      pick(
        locale,
        `In the same moment, ${self.name} (${selfLabel}) ${MODE_FIRST_MOVE[locale][self.guidance]}, while ${partner.name} (${partnerLabel}) ${MODE_FIRST_MOVE[locale][partner.guidance]} — that timing gap is where roles clash.`,
        `같은 장면에서 ${self.name}(${selfLabel}) 쪽은 ${MODE_FIRST_MOVE[locale][self.guidance]}, ${partner.name}(${partnerLabel}) 쪽은 ${MODE_FIRST_MOVE[locale][partner.guidance]} — 그 타이밍 차이가 충돌로 읽히기 쉬워요.`,
      ),
    );
  } else if (fit === "partial") {
    parts.push(
      pick(
        locale,
        `${self.name} and ${partner.name} don’t share one fixed first move — friction rises when the flexible side switches without saying so, and the other side keeps answering the previous mode.`,
        `${withParticle(self.name)} ${topicParticle(partner.name)} 첫 수가 한 가지로 고정되지 않아요. 조율하는 쪽이 말 없이 모드를 바꾸면, 상대는 이전 방식에 답을 하다가 마찰이 나요.`,
      ),
    );
  } else if (self.correction !== partner.correction) {
    parts.push(
      pick(
        locale,
        `Same role channel, different tension moves: ${self.name} ${CORRECTION_MOVE[locale][self.correction]}, ${partner.name} ${CORRECTION_MOVE[locale][partner.correction]} — each can misread the other as cold or overreactive.`,
        `같은 자리 채널인데 긴장 반응이 달라요. ${self.name} 쪽은 ${CORRECTION_MOVE[locale][self.correction]}, ${partner.name} 쪽은 ${CORRECTION_MOVE[locale][partner.correction]} — 서로 차갑다/과하다로 오해하기 쉬워요.`,
      ),
    );
  }

  if (
    umbilical === "high" ||
    (self.bond === "smothering" && partner.bond === "distant") ||
    (self.bond === "distant" && partner.bond === "smothering")
  ) {
    const closer = self.bond === "smothering" ? self.name : partner.bond === "smothering" ? partner.name : self.name;
    const farther = closer === self.name ? partner.name : self.name;
    parts.push(
      pick(
        locale,
        `Closeness pulls apart: ${closer} wants nearer, ${farther} wants space — care can read as interference, space as neglect, so burden piles onto the closer side.`,
        `거리 감각이 어긋나요. ${closer} 쪽은 더 가까이, ${farther} 쪽은 공간을 원해요 — 챙김이 간섭으로, 거리두기가 방임으로 읽히며 가까운 쪽에 부담이 몰릴 수 있어요.`,
      ),
    );
  } else if (self.bond !== partner.bond) {
    parts.push(
      pick(
        locale,
        `On closeness, ${self.name} ${BOND_MOVE[locale][self.bond]}, while ${partner.name} ${BOND_MOVE[locale][partner.bond]} — small mismatches stack if left unnamed.`,
        `거리에서는 ${self.name} 쪽은 ${BOND_MOVE[locale][self.bond]}, ${partner.name} 쪽은 ${BOND_MOVE[locale][partner.bond]} — 말로 안 맞추면 작은 어긋남이 쌓여요.`,
      ),
    );
  } else if (umbilical === "medium" && parts.length === 0) {
    parts.push(
      pick(
        locale,
        `Closeness–boundary tuning between ${self.name} and ${partner.name} is recurring homework — name the gap before it becomes a fight.`,
        `${withParticle(self.name)} ${partner.name} 사이 가까움·경계 조율이 반복 과제예요 — 싸움이 되기 전에 간격을 말로 맞춰 보세요.`,
      ),
    );
  }

  if (nagging === "high") {
    parts.push(
      pick(
        locale,
        `Correction friction runs high between ${self.name} and ${partner.name} — repeated remarks make one person carry the ‘same fight again’ load.`,
        `${withParticle(self.name)} ${partner.name} 사이 지적·교정 마찰이 커지기 쉬워요 — 반복되는 한마디가 한쪽에게 ‘또 그 싸움’ 부담으로 쌓일 수 있어요.`,
      ),
    );
  } else if (nagging === "medium" && parts.length === 0) {
    parts.push(
      pick(
        locale,
        `Moderate correction friction can show up between ${self.name} and ${partner.name} — keep asks short so one side doesn’t absorb all the tension.`,
        `${withParticle(self.name)} ${partner.name} 사이 교정 장면에서 중간 마찰이 생길 수 있어요 — 요청을 짧게 해 한쪽이 긴장을 다 받지 않게 하세요.`,
      ),
    );
  }

  if (parts.length === 0) {
    parts.push(
      pick(
        locale,
        `No strong role-clash signal stands out between ${self.name} and ${partner.name} right now — watch the moment care turns into repeated correction.`,
        `${withParticle(self.name)} ${partner.name} 사이 지금은 역할 충돌 신호가 크지 않아요 — 챙김이 반복 지적로 바뀌는 순간만 잘 살펴 보세요.`,
      ),
    );
  }

  return sanitizeFamilyParentText(parts.join(" "));
}

export function buildFamilyHouseholdRoles(params: {
  parentNickname: string;
  childNickname: string;
  countsParent: TenGodCounts;
  countsChild: TenGodCounts;
  familySignalsParent?: FamilySajuSignals;
  familySignalsChild?: FamilySajuSignals;
  pairFamily?: PairFamilySignals | null;
  /** true면 시청자=자녀 → 나=자녀, 상대=부모 */
  viewerIsChild?: boolean;
  locale?: Locale;
}): FamilyHouseholdRolesSection {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const viewerIsChild = params.viewerIsChild === true;

  const guideP = resolveGuidanceBalanceBucket(params.countsParent);
  const guideC = resolveGuidanceBalanceBucket(params.countsChild);
  const styleP = resolveCorrectionStyleBucket(params.countsParent);
  const styleC = resolveCorrectionStyleBucket(params.countsChild);
  const bondP = resolveBondDistanceBucket(
    params.countsParent,
    params.familySignalsParent,
  );
  const bondC = resolveBondDistanceBucket(
    params.countsChild,
    params.familySignalsChild,
  );

  const pair: PairFamilySignals =
    params.pairFamily ??
    buildPairFamilySignals(
      params.familySignalsParent ??
        synthesizeFamilySignalsFromCounts(params.countsParent),
      params.familySignalsChild ??
        synthesizeFamilySignalsFromCounts(params.countsChild),
      {
        modeA: guideP.bucket,
        modeB: guideC.bucket,
      },
    );

  const fit: GuidanceFit =
    pair.guidance_fit ?? resolveGuidanceFit(guideP.bucket, guideC.bucket);
  const umbilical = pair.umbilical_band;
  const nagging = pair.nagging_band;

  const parentPerson: PersonSlot = {
    name: params.parentNickname,
    guidance: guideP.bucket,
    correction: styleP.bucket,
    bond: bondP.bucket,
  };
  const childPerson: PersonSlot = {
    name: params.childNickname,
    guidance: guideC.bucket,
    correction: styleC.bucket,
    bond: bondC.bucket,
  };
  const self = viewerIsChild ? childPerson : parentPerson;
  const partner = viewerIsChild ? parentPerson : childPerson;

  return {
    self_name: self.name,
    partner_name: partner.name,
    self_role_label: ROLE_LABEL[locale][self.guidance],
    self_role_detail: roleDetailFor(locale, self, partner, "self"),
    partner_role_label: ROLE_LABEL[locale][partner.guidance],
    partner_role_detail: roleDetailFor(locale, partner, self, "partner"),
    complement: buildComplement(locale, fit, self, partner, umbilical, nagging),
    tension: buildTension(locale, fit, self, partner, umbilical, nagging),
  };
}
