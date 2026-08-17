/**
 * Partner research gap: invisible mental load / household cognition.
 * Folds into money_chores — does not add a new section.
 */
import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import { subjectParticle, topicParticle } from "@/lib/relationship/koreanParticles";

export function buildPartnerMentalLoadNote(params: {
  nicknameA: string;
  nicknameB: string;
  cfoNickname: string;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale?: Locale;
}): string | null {
  const locale = params.locale ?? "ko-KR";
  const en = locale === "en-US" || locale?.startsWith("en");
  const a = params.psychA?.secondary_axes;
  const b = params.psychB?.secondary_axes;
  if (!a && !b) return null;

  const structureA = a?.structure ?? 50;
  const structureB = b?.structure ?? 50;
  const practicalA = a?.practicality ?? 50;
  const practicalB = b?.practicality ?? 50;

  const loadA = structureA * 0.6 + practicalA * 0.4;
  const loadB = structureB * 0.6 + practicalB * 0.4;
  const gap = Math.abs(loadA - loadB);
  if (gap < 8) {
    return en
      ? "Invisible household planning load looks shared — name who owns calendar, chores list, and follow-ups so neither person silently carries both."
      : "보이지 않는 집안 운영 부담이 비슷해 보여요. 캘린더·할 일·후속 확인의 주인을 이름 붙여 두면, 한쪽이 조용히 둘 다 짊어지지 않게 됩니다.";
  }

  const heavier = loadA >= loadB ? params.nicknameA : params.nicknameB;
  const lighter = loadA >= loadB ? params.nicknameB : params.nicknameA;
  const cfo = params.cfoNickname;

  if (heavier === cfo) {
    return en
      ? `${heavier} already carries more structure/practicality energy and money ops. Protect them from also owning every reminder — ${lighter} can own follow-ups and weekly resets.`
      : `${topicParticle(heavier)} 구조·실무 에너지와 돈 운영을 이미 더 많이 짚고 있어요. 알림·리마인드까지 혼자 맡지 않도록, ${subjectParticle(lighter)} 후속 확인과 주간 리셋을 맡아 주세요.`;
  }

  return en
    ? `Money lead is ${cfo}, but invisible planning load leans toward ${heavier}. Split “decide/spend” from “track/remind” so cognitive load does not pile onto one person.`
    : `돈 리드는 ${cfo}인데, 보이지 않는 일정·챙김 부하는 ${heavier} 쪽으로 기울어요. ‘결정/지출’과 ‘추적/리마인드’를 나눠, 한 사람에게 인지 부하가 몰리지 않게 하세요.`;
}
