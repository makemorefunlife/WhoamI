import type { Locale } from "@/lib/i18n/locale";
import { profileTenGods, type TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import type { MarriageScoringSignals } from "@/lib/saju/marriageAnalysis";
import { pick, LEGACY_FALLBACK_LOCALE } from "@/lib/relationship/marriage/marriageCopy";
import { topicParticle } from "@/lib/relationship/koreanParticles";

/**
 * 부부·동거(Marriage/Cohabitation) "8개 항목" 배치 — 사주 Pair CE 전용 3개(1,2,3).
 * 11축 psychMaster는 이 파일에서 절대 읽지 않는다(엄격한 분리 원칙, Work/Family와
 * 동일). 새 카드 없이 기존 필드에 append:
 *   1 → household.section_money_chores.chores_guideline
 *   2 → household.section_upset.person_a.upset_signals
 *   3 → household.section_warning.conflict_trigger
 * 화면 문장에는 십성 이름 등 내부 로직 용어를 노출하지 않는다.
 */

/**
 * 항목 1 — 큰 결정을 함께 만들어가는 방식(주도권).
 * 식상(정보수집·실행력) vs 재성+관성(결단력·마무리)만 비교 — 다른 십성은 안 씀.
 */
export function buildDecisionMakingLine(params: {
  countsA: TenGodCounts;
  countsB: TenGodCounts;
  nicknameA: string;
  nicknameB: string;
  locale?: Locale;
}): string | null {
  const { countsA, countsB, nicknameA, nicknameB } = params;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const pA = profileTenGods(countsA);
  const pB = profileTenGods(countsB);

  const scoutGap = Math.abs(pA.food - pB.food);
  const closerGap = Math.abs(pA.wealthOfficer - pB.wealthOfficer);
  if (scoutGap < 1 || closerGap < 1) return null;

  const scoutIsA = pA.food > pB.food;
  const closerIsA = pA.wealthOfficer > pB.wealthOfficer;
  // 한 사람이 정찰·마무리를 둘 다 쥐면 "역할 분리" 서사가 억지로 나온다 — 생략.
  if (scoutIsA === closerIsA) return null;

  const scoutName = scoutIsA ? nicknameA : nicknameB;
  const closerName = closerIsA ? nicknameA : nicknameB;

  return pick(
    locale,
    ` When a big decision comes up — a place to live, a major purchase — ${scoutName} is the one who digs up options and lines up the choices, while ${closerName} is the one who actually puts the pen down and signs. Neither move works without the other, so try naming it out loud instead of assuming it just happens.`,
    ` 집을 구하거나 목돈이 들어가는 큰 결정 앞에서는 ${topicParticle(scoutName)} 정보를 모으고 선택지를 늘어놓는 역할을 자연스럽게 맡고, ${topicParticle(closerName)} 마지막에 도장을 찍는 역할을 맡는 편이에요. 둘 다 있어야 완성되는 조합이니, 당연하게 여기지 말고 가끔은 서로에게 고맙다고 말해 주세요.`,
  );
}

/**
 * 항목 2 — 위기에서 현실 처리 vs 정서 지탱.
 * 관성(어려움을 견디는 이성) vs 인성(감정 수용)만 비교.
 */
export function buildCrisisRoleLine(params: {
  countsA: TenGodCounts;
  countsB: TenGodCounts;
  nicknameA: string;
  nicknameB: string;
  locale?: Locale;
}): string | null {
  const { countsA, countsB, nicknameA, nicknameB } = params;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const pA = profileTenGods(countsA);
  const pB = profileTenGods(countsB);

  const officerGap = Math.abs(pA.officer - pB.officer);
  const sealGap = Math.abs(pA.seal - pB.seal);
  if (officerGap < 1 || sealGap < 1) return null;

  const realistIsA = pA.officer > pB.officer;
  const anchorIsA = pA.seal > pB.seal;
  if (realistIsA === anchorIsA) return null;

  const realistName = realistIsA ? nicknameA : nicknameB;
  const anchorName = anchorIsA ? nicknameA : nicknameB;

  return pick(
    locale,
    ` When a real crisis hits, ${realistName} tends to switch straight into problem-solving mode — calling around, sorting out next steps — while ${anchorName} is the one holding the household's emotional footing steady. Both jobs matter equally; the risk is only in expecting the same person to do both.`,
    ` 진짜 위기가 닥치면 ${topicParticle(realistName)} 바로 해결책을 찾아 움직이는 현실 처리반이 되고, ${topicParticle(anchorName)} 흔들리는 마음을 붙잡아 주는 정서 지탱반이 되는 편이에요. 둘 다 똑같이 중요한 역할이니, 한 사람에게 두 역할을 다 기대하지만 않으면 돼요.`,
  );
}

/**
 * 항목 3 — 서로를 소진시키는 생활 패턴(주의점).
 * Pair CE의 friction 패킷(원진/귀문, 일지 충형) 중 실제로 걸리는 게 있을
 * 때만 경고 — 새 판정 없이 이미 계산된 scoringSignals만 읽는다.
 */
export function buildDrainPatternLine(params: {
  sig: MarriageScoringSignals;
  locale?: Locale;
}): string | null {
  const { sig } = params;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  if (!sig.hasWonjinOrGuimun && !sig.hasDayBranchChungHyung) return null;

  return pick(
    locale,
    ` There's a quiet friction current between you that flares up for reasons that are hard to name — it's not any one fight, it's the slow drip of small frictions. A weekly "no-rules zone," even just one day, where neither of you has to meet the other's standards, works as real recovery time.`,
    ` 둘 사이엔 이유를 콕 집기 힘든데도 자꾸 스멀스멀 올라오는 마찰 기류가 있어요 — 큰 싸움 하나가 아니라 잔마찰이 쌓이는 쪽에 가까워요. 일주일에 하루는 서로의 기준을 잠깐 내려놓는 '무법 지대'를 만들어 두면 실질적인 회복 시간이 됩니다.`,
  );
}
