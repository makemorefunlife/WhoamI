/**
 * Part5 "미래 & 실전 행동 지침" — 비상시 SOS 룰. `buildFamilyPrescriptions.ts`가
 * 이미 스펙의 "실천 루틴"(냉장고 규칙/11시 금지/월1회 커피) 대부분을 커버하고
 * 있어 이번 배치에서는 안 건드림 — 진짜 빈 곳인 "SOS 룰"(위기 시 한마디
 * 스크립트) 하나만 추가한다. `childSealStrong`/`childWealthStrong`(이미
 * 계산되지만 지금까지 숫자 가중치로만 쓰이던 신호)를 처음으로 텍스트에
 * 연결 — 새 스코어링 없음, `>= 2` 임계값도 기존 컨벤션 재사용.
 */
import { profileTenGods, type TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import type { FamilyScoringSignals } from "@/lib/saju/familyAnalysis";
import { LEGACY_FALLBACK_LOCALE, pick } from "./familyParentCopy";
import { sanitizeFamilyParentText, josaIGa, josaEunNeun } from "./familyParentLanguage";
import type { Locale } from "@/lib/i18n/locale";

export type FamilySosSection = {
  headline: string;
  trigger_label: string;
  sos_line: string;
};

export function buildFamilySosSection(params: {
  scoringSignals: FamilyScoringSignals;
  countsParent: TenGodCounts;
  childNickname: string;
  parentNickname: string;
  childIsViewer: boolean;
  locale?: Locale;
}): FamilySosSection {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const { childIsViewer, childNickname: child, parentNickname: parent } = params;

  if (!childIsViewer) {
    const headline = sanitizeFamilyParentText(
      pick(locale, "Parent's Crisis SOS Rule", "위기의 순간, 부모의 SOS 룰"),
    );
    const trigger_label = sanitizeFamilyParentText(
      pick(locale, "Job / financial crisis", "취업·재정 위기"),
    );

    let sos_line: string;
    if (params.scoringSignals.childWealthStrong) {
      sos_line = pick(
        locale,
        `${child} was born with real financial instinct. Even through a rough patch, they have the strength to get back up — a simple "I believe in you" beats any lecture.`,
        `${josaEunNeun(child)} 재물운을 타고났어요. 힘든 시기가 와도 스스로 다시 일어설 힘이 있으니, 잔소리 대신 "난 너를 믿어" 한마디면 충분해요.`,
      );
    } else if (params.scoringSignals.childSealStrong) {
      sos_line = pick(
        locale,
        `${child} has good resilience. Not rushing them — just waiting — is already a big help: "Take your time, I believe in you."`,
        `${josaEunNeun(child)} 관계 회복력이 좋은 편이에요. 재촉하지 말고 기다려 주는 것만으로도 큰 힘이 됩니다 — "천천히 해도 괜찮아, 난 너를 믿어."`,
      );
    } else {
      sos_line = pick(
        locale,
        `When ${child} is going through a hard time, skip the lecture and offer just one line — "I believe in you." That lands harder than a hundred pieces of advice.`,
        `${josaIGa(child)} 힘든 시기를 지날 때는 잔소리 대신 딱 한마디만 건네 주세요 — "난 너를 믿어." 그 말이 백 마디 조언보다 힘이 셉니다.`,
      );
    }

    return { headline, trigger_label, sos_line: sanitizeFamilyParentText(sos_line) };
  }

  const headline = sanitizeFamilyParentText(
    pick(locale, "When Your Parent Struggles, Your SOS Rule", "부모님이 힘드실 때, 나의 SOS 룰"),
  );
  const trigger_label = sanitizeFamilyParentText(
    pick(locale, "Illness / loneliness", "건강·외로움 케어"),
  );

  const parentProfile = profileTenGods(params.countsParent);
  let sos_line: string;
  if (parentProfile.seal >= 2) {
    sos_line = pick(
      locale,
      `${parent} tends to keep things to themselves. Quietly staying close, or a simple check-in call now and then, comforts them more than a lot of words.`,
      `${parent}는 혼자 삭이는 편일 수 있어요. 많은 말보다 조용히 곁에 있어 주는 것, 가끔 안부 전화 한 통이 큰 위로가 됩니다.`,
    );
  } else if (parentProfile.wealth >= 2) {
    sos_line = pick(
      locale,
      `${parent} finds it easier to accept practical help. A concrete action — going with them to the doctor, taking a chore off their hands — lands better than comforting words.`,
      `${parent}는 실질적인 도움을 더 편하게 받아들이는 편이에요. 위로의 말보다 병원 동행이나 집안일 거들기 같은 구체적인 행동이 더 잘 전달돼요.`,
    );
  } else {
    sos_line = pick(
      locale,
      `When ${parent} seems to be struggling, don't rush to fix it — just being there is enough. Being an emotional safety net matters more than having the right answer.`,
      `${parent}가 힘들어 보이실 때는 해결책을 주려 하지 말고, 그냥 곁에 있어 주세요. 정답을 주는 것보다 정서적 울타리가 되어주는 것만으로 충분해요.`,
    );
  }

  return { headline, trigger_label, sos_line: sanitizeFamilyParentText(sos_line) };
}
