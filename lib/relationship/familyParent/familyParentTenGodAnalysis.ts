import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import { profileTenGods } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import type { FamilyPairSajuAnalysis } from "@/lib/saju/familyAnalysis";
import { sanitizeFamilyParentText } from "./familyParentLanguage";
import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "./familyParentCopy";
import type { FamilyParentRole } from "./types";
import type { ParentBondBand } from "@/lib/personCore/sajuSignals/types";

/**
 * PersonCore SSOT 印(印星/보호본능) 부모-자녀 유대 신호(`FamilySajuSignals.seal_parent.parent_bond_band`)
 * 보강 문장 — 계산은 되지만 리포트 어디에도 안 쓰이던 신호를 부모 렌즈 요약(lens_summary)에 반영한다.
 * balanced는 특별히 튀는 신호가 아니라서 보강 문장을 붙이지 않는다(work/friend와 동일한 원칙).
 */
const PARENT_BOND_BONUS: Record<Locale, Record<"distant" | "smothering", string>> = {
  "en-US": {
    distant: " On top of that, this parent tends to give space rather than hover — showing love by trusting rather than checking in constantly.",
    smothering: " On top of that, this parent tends to lean in close — love shows up as constant checking-in, which can feel protective or a little overwhelming depending on the day.",
  },
  "ko-KR": {
    distant: " 게다가 이 부모는 곁을 지키되 거리를 존중하는 편이라, 잔소리보다 믿음으로 사랑을 표현하는 타입이에요.",
    smothering: " 게다가 이 부모는 가까이 밀착하는 편이라, 끊임없는 확인으로 사랑을 표현하기 쉬워요 — 든든하게 느껴질 수도, 가끔 답답하게 느껴질 수도 있어요.",
  },
};

export type TenGodCounts = Record<string, number>;

export function countTenGodsForFamilyParent(
  sajuJson: SajuDataForIntegrated,
): TenGodCounts {
  const counts: TenGodCounts = {};
  for (const t of sajuJson.tenGods ?? []) {
    // 일주(day pillar)는 일간 자기비교라 정의상 항상 비견(self)이 됨 — 제외.
    if (t.pillar === "일주") continue;
    const name = t.godData?.kor_name ?? t.godCode ?? "";
    if (!name) continue;
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

export type ParentCareProfile = {
  role: FamilyParentRole;
  label: string;
  care_style: string;
  authority_style: string;
  support_strength: "strong" | "moderate" | "developing";
  lens_summary: string;
};

export type ChildInnerProfile = {
  label: string;
  attachment_need: string;
  autonomy_need: string;
  energy_style: string;
};

export type FamilyParentTenGodAnalysis = {
  countsParent: TenGodCounts;
  countsChild: TenGodCounts;
  parentProfile: ParentCareProfile;
  childProfile: ChildInnerProfile;
};

function buildMotherProfile(
  parent: ReturnType<typeof profileTenGods>,
  child: ReturnType<typeof profileTenGods>,
  family: FamilyPairSajuAnalysis | undefined,
  childNickname: string,
  locale: Locale,
  parentBondBand?: ParentBondBand,
): ParentCareProfile {
  const sig = family?.scoringSignals;
  const sealFocus = child.seal >= 2;
  const supportStrength: ParentCareProfile["support_strength"] =
    sig?.parentSupportsChildSeal || parent.seal >= 2
      ? "strong"
      : parent.seal >= 1
        ? "moderate"
        : "developing";
  const bondBonus =
    parentBondBand && parentBondBand !== "balanced"
      ? PARENT_BOND_BONUS[locale][parentBondBand]
      : "";

  return {
    role: "mother",
    label: "Gentle Parenting · Mom",
    care_style: sanitizeFamilyParentText(
      sealFocus
        ? `${childNickname}의 정서적 안식처 역할을 자연스럽게 하려는 엄마예요. 걱정·챙김·기억으로 사랑을 표현하기 쉽습니다.`
        : `엄마의 돌봄은 '분위기·공감·세심한 관찰'로 전달돼요. 말보다 눈빛과 톤에 아이가 크게 반응합니다.`,
    ),
    authority_style: sanitizeFamilyParentText(
      parent.seal >= 2
        ? "규칙보다 '느낌'으로 훈육이 전달되는 편 — 아이에게는 따뜻하지만, 경계가 흐려질 수 있어요."
        : "감정을 먼저 맞춘 뒤 규칙을 이야기하는 스타일 — 아이의 마음이 열린 다음에 대화가 통합니다.",
    ),
    support_strength: supportStrength,
    lens_summary: sanitizeFamilyParentText(
      pick(
        locale,
        `As Mom with ${childNickname}, this reading starts from hidden sensitivity and the need for stability.`,
        `엄마로서 ${childNickname}와의 관계에서는, 숨겨진 감수성·안정 욕구를 먼저 읽습니다.`,
      ) + bondBonus,
    ),
  };
}

function buildFatherProfile(
  parent: ReturnType<typeof profileTenGods>,
  child: ReturnType<typeof profileTenGods>,
  family: FamilyPairSajuAnalysis | undefined,
  childNickname: string,
  locale: Locale,
  parentBondBand?: ParentBondBand,
): ParentCareProfile {
  const sig = family?.scoringSignals;
  const wealthFocus = child.wealth >= 2;
  const supportStrength: ParentCareProfile["support_strength"] =
    sig?.parentSupportsChildWealth || parent.wealth >= 2
      ? "strong"
      : parent.wealth >= 1
        ? "moderate"
        : "developing";
  const bondBonus =
    parentBondBand && parentBondBand !== "balanced"
      ? PARENT_BOND_BONUS[locale][parentBondBand]
      : "";

  return {
    role: "father",
    label: "Gentle Parenting · Dad",
    care_style: sanitizeFamilyParentText(
      wealthFocus
        ? `${childNickname}에게 현실적인 도구·기회·방향을 주려는 아빠예요. '어떻게 해낼지'를 함께 고민해 주는 타입입니다.`
        : `아빠의 사랑은 '책임·기준·든든한 존재감'으로 드러나기 쉬워요. 한마디 인정이 오래 남습니다.`,
    ),
    authority_style: sanitizeFamilyParentText(
      parent.officer >= 2
        ? "원칙과 결과로 신뢰를 쌓는 권위형 — 아이에게는 안정감이 되기도, 답답함이 되기도 합니다."
        : "딱딱한 통제보다 '함께 해보자'는 코칭형 — 아이의 자율을 존중할수록 관계가 좋아집니다.",
    ),
    support_strength: supportStrength,
    lens_summary: sanitizeFamilyParentText(
      pick(
        locale,
        `As Dad with ${childNickname}, this reading starts from practical sense, independence, and future planning.`,
        `아빠로서 ${childNickname}와의 관계에서는, 현실 감각·자립·미래 설계 욕구를 먼저 읽습니다.`,
      ) + bondBonus,
    ),
  };
}

function buildChildProfile(
  child: ReturnType<typeof profileTenGods>,
  childNickname: string,
  family: FamilyPairSajuAnalysis | undefined,
): ChildInnerProfile {
  const sig = family?.childSignals;
  return {
    label: sanitizeFamilyParentText(
      sig?.dominantArchetype === "fire"
        ? "에너지 넘치는 크리에이터"
        : sig?.dominantArchetype === "water"
          ? "깊은 공감형 드리머"
          : sig?.dominantArchetype === "metal"
            ? "기준이 분명한 리더"
            : sig?.dominantArchetype === "wood"
              ? "자유로운 탐험가"
              : "든든한 온기형",
    ),
    attachment_need: sanitizeFamilyParentText(
      child.self >= 2
        ? `${childNickname}는 "나를 봐줘"는 존재 인정이 최우선이에요.`
        : child.seal >= 2
          ? `${childNickname}는 안전하고 예측 가능한 관계를 갈망해요.`
          : `${childNickname}는 관심·칭찬·함께하는 시간으로 사랑을 확인해요.`,
    ),
    autonomy_need: sanitizeFamilyParentText(
      child.food >= 2
        ? `${childNickname}는 '내 방식대로' 해보고 싶은 자율 욕구가 강해요.`
        : child.officer >= 2
          ? `${childNickname}는 규칙이 명확할 때 오히려 편안해요.`
          : `${childNickname}는 통제보다 '선택권'을 줄 때 협력합니다.`,
    ),
    energy_style: sanitizeFamilyParentText(
      sig?.hasExcessFoodOrOfficer
        ? "에너지 몰입형 — 짧은 구간·움직임·놀이로 집중력을 살려주세요."
        : sig?.hasStrongFocusStyle
          ? "고집중형 — 방해 없는 환경과 칭찬 한 줄이 핵심입니다."
          : "밸런스형 — 리듬과 루틴이 안정감을 줍니다.",
    ),
  };
}

export function analyzeFamilyParentTenGod(params: {
  parentRole: FamilyParentRole;
  sajuJsonParent: SajuDataForIntegrated;
  sajuJsonChild: SajuDataForIntegrated;
  familyPairAnalysis?: FamilyPairSajuAnalysis;
  childNickname?: string;
  locale?: Locale;
  /** PersonCore SSOT 印 부모-자녀 유대 신호 — 계산되지만 orphaned였던 신호를 부모 렌즈에 반영 */
  parentBondBand?: ParentBondBand;
}): FamilyParentTenGodAnalysis {
  const countsParent = countTenGodsForFamilyParent(params.sajuJsonParent);
  const countsChild = countTenGodsForFamilyParent(params.sajuJsonChild);
  const parent = profileTenGods(countsParent);
  const child = profileTenGods(countsChild);
  const childNickname = params.childNickname ?? "아이";
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  return {
    countsParent,
    countsChild,
    parentProfile:
      params.parentRole === "mother"
        ? buildMotherProfile(parent, child, params.familyPairAnalysis, childNickname, locale, params.parentBondBand)
        : buildFatherProfile(parent, child, params.familyPairAnalysis, childNickname, locale, params.parentBondBand),
    childProfile: buildChildProfile(child, childNickname, params.familyPairAnalysis),
  };
}
