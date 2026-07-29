/**
 * Curated structural base meanings for codes that have no clean meaning_* in REF,
 * or that must not import interpretive REF prose (relation types, layers, etc.).
 */

import type { LocalizedText } from "./types";

export const ELEMENT_BASE: Record<string, LocalizedText> = {
  wood: { ko: "목(木). 생장·확장이 본성인 오행.", en: "Wood. Growth and expansion." },
  fire: { ko: "화(火). 발산·조명이 본성인 오행.", en: "Fire. Radiance and expression." },
  earth: { ko: "토(土). 중정·매개가 본성인 오행.", en: "Earth. Centering and mediation." },
  metal: { ko: "금(金). 수렴·결단이 본성인 오행.", en: "Metal. Condensation and decisiveness." },
  water: { ko: "수(水). 저장·흐름이 본성인 오행.", en: "Water. Storage and flow." },
};

export const HIDDEN_LAYER_BASE: Record<string, LocalizedText> = {
  main: {
    ko: "지장간 정기(本氣). 지지의 주된 천간 기운.",
    en: "Main hidden stem (primary qi) of the branch.",
  },
  middle: {
    ko: "지장간 중기. 지지 안의 중간 층 천간 기운.",
    en: "Middle hidden stem layer of the branch.",
  },
  residual: {
    ko: "지장간 여기(餘氣). 지지 안의 잔여 천간 기운.",
    en: "Residual hidden stem layer of the branch.",
  },
};

export const RELATION_TYPE_BASE: Record<string, LocalizedText> = {
  stem_combine: {
    ko: "천간합. 두 천간이 합하여 한 기운으로 묶이는 관계.",
    en: "Stem combine. Two stems unite into one qi.",
  },
  stem_clash: {
    ko: "천간충. 두 천간이 서로 충돌하는 관계.",
    en: "Stem clash. Two stems oppose each other.",
  },
  branch_six_combine: {
    ko: "육합. 두 지지가 짝을 이루어 합하는 관계.",
    en: "Six combine. Pairwise branch union.",
  },
  branch_three_combine: {
    ko: "삼합. 세 지지가 한 오행 국으로 합하는 관계.",
    en: "Three combine. Triad forming one elemental frame.",
  },
  branch_direction_combine: {
    ko: "방합. 같은 방위의 지지들이 합하는 관계.",
    en: "Directional combine. Branches of one season/direction unite.",
  },
  branch_clash: {
    ko: "충. 두 지지가 정면으로 부딪히는 관계.",
    en: "Clash. Direct opposition between branches.",
  },
  branch_punishment: {
    ko: "형. 지지 사이의 형벌·압박 관계.",
    en: "Punishment. Punitive tension between branches.",
  },
  branch_break: {
    ko: "파. 지지 사이의 깨짐·이완 관계.",
    en: "Break. Fracturing relation between branches.",
  },
  branch_harm: {
    ko: "해. 지지 사이의 해침·어긋남 관계.",
    en: "Harm. Injurious misalignment between branches.",
  },
  wonjin: {
    ko: "원진. 원진살에 해당하는 지지 짝 관계.",
    en: "Wonjin. Classic wonjin branch pairing.",
  },
  guimun: {
    ko: "귀문. 귀문관살에 해당하는 지지 짝 관계.",
    en: "Guimun. Classic guimun branch pairing.",
  },
};

export const STRENGTH_BASE: Record<string, LocalizedText> = {
  shin_gang: {
    ko: "신강. 일간을 돕는 기운이 소모·압박보다 강한 분류.",
    en: "Strong day master classification (support exceeds drain).",
  },
  shin_yak: {
    ko: "신약. 일간을 돕는 기운이 소모·압박보다 약한 분류.",
    en: "Weak day master classification (drain exceeds support).",
  },
  jung_hwa: {
    ko: "중화. 일간 지지·소모 기운이 균형에 가까운 분류.",
    en: "Balanced day master classification.",
  },
};

export const JOHU_TEMP_BASE: Record<string, LocalizedText> = {
  cold: { ko: "조후 한(寒). 차가움 쪽에 기운 편중.", en: "Cold climate band." },
  neutral: { ko: "조후 중성. 한열 편중이 약함.", en: "Neutral temperature band." },
  hot: { ko: "조후 열(熱). 뜨거움 쪽에 기운 편중.", en: "Hot climate band." },
};

export const JOHU_MOIST_BASE: Record<string, LocalizedText> = {
  dry: { ko: "조후 조(燥). 마름 쪽에 기운 편중.", en: "Dry moisture band." },
  neutral: { ko: "조후 중성. 조습 편중이 약함.", en: "Neutral moisture band." },
  moist: { ko: "조후 습(濕). 습함 쪽에 기운 편중.", en: "Moist moisture band." },
};

export const PILLAR_SLOT_BASE: Record<string, LocalizedText> = {
  year: { ko: "년주. 사주 네 기둥 중 조상·큰 배경에 해당하는 궁위.", en: "Year pillar." },
  month: { ko: "월주. 사주 네 기둥 중 부모·계절 환경에 해당하는 궁위.", en: "Month pillar." },
  day: { ko: "일주. 사주 네 기둥 중 자기·일간에 해당하는 궁위.", en: "Day pillar." },
  hour: { ko: "시주. 사주 네 기둥 중 자녀·결과 방향에 해당하는 궁위.", en: "Hour pillar." },
};

export const SPECIAL_SIGNAL_BASE: Record<string, LocalizedText> = {
  dohwa: {
    ko: "도화. 홍염·함지 계열의 매력·이끌림 신호.",
    en: "Peach blossom class signal (attraction).",
  },
  yeokma: {
    ko: "역마. 이동·변동을 뜻하는 고전 신살 신호.",
    en: "Travelling horse class signal (movement).",
  },
  wonjin: {
    ko: "원진. 원진살 보유 여부를 나타내는 특수 신호.",
    en: "Wonjin special signal flag.",
  },
  guimun: {
    ko: "귀문. 귀문관살 보유 여부를 나타내는 특수 신호.",
    en: "Guimun special signal flag.",
  },
};

export const GONGMANG_BASE: LocalizedText = {
  ko: "공망. 일주를 기준으로 한 순공(旬空) — 해당 지지가 공허한 자리.",
  en: "Void/empty branches by day-pillar xunkong.",
};

/** Classical short fallback when REF ten-god meaning_* is null. */
export const TEN_GOD_FALLBACK_BASE: Record<string, LocalizedText> = {
  geopjae: {
    ko: "겁재. 일간과 같은 오행·다른 음양의 십성.",
    en: "Rob wealth. Same element, opposite polarity to day stem.",
  },
  pyeongwan: {
    ko: "편관. 일간을 극하는 오행·같은 음양의 십성.",
    en: "Seven killings. Controlling element, same polarity.",
  },
  pyeonin: {
    ko: "편인. 일간을 생하는 오행·같은 음양의 십성.",
    en: "Indirect resource. Generating element, same polarity.",
  },
  pyeonjae: {
    ko: "편재. 일간이 극하는 오행·같은 음양의 십성.",
    en: "Indirect wealth. Controlled element, same polarity.",
  },
  sanggwan: {
    ko: "상관. 일간이 생하는 오행·다른 음양의 십성.",
    en: "Hurting officer. Output element, opposite polarity.",
  },
  siksin: {
    ko: "식신. 일간이 생하는 오행·같은 음양의 십성.",
    en: "Eating god. Output element, same polarity.",
  },
};
