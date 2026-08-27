/**
 * Friend Chapter 8 — "오래가는 우정의 거리"
 * Projects FriendResponseIntelligence.personA/B.distance + pair.distance.
 * Never invents a durability percentage (spec §12 CH8-E). Never lets low
 * contact frequency alone imply relationship decline (spec §12 CH8-D).
 */
import type { Locale } from "@/lib/i18n/locale";
import type { FriendResponseIntelligence, FriendMaintenanceSignal } from "@/lib/relationship/friend/response/friendResponseIntelligenceTypes";
import {
  BASELINE_DISTANCE_COPY,
  SILENCE_INTERPRETATION_COPY,
  MAINTENANCE_SIGNAL_COPY,
  DISENGAGEMENT_SIGNAL_COPY,
} from "./friendChapterCopyDictionary";

function pick(locale: Locale, en: string, ko: string): string {
  return locale === "en-US" ? en : ko;
}

export type FriendChapter08Distance = {
  /** ◤ 우리 우정의 기본 거리 */
  baseline: {
    headline: string;
    description: string;
    compatibility: FriendResponseIntelligence["pair"]["distance"]["compatibility"];
  };
  /** ◤ 연락이 뜸해지면 나는 (per person, with a person-specific reason) */
  silenceReading: { name: string; label: string; reason: string }[];
  /** ◤ 자주 안 봐도 이것은 필요해 — per-person when they diverge, plus shared */
  maintenanceMinimum: { headline: string; perPerson: { name: string; item: string }[]; shared: string[] };
  /** ◤ 이러면 진짜 멀어지고 있다는 신호 */
  disengagementSignals: { headline: string; items: string[] };
  /** ◤ 이 우정이 오래가는 방식 — pair synthesis, no invented percentage */
  howItLasts: { headline: string; description: string };
};

const COMPAT_HEADLINE: Record<FriendResponseIntelligence["pair"]["distance"]["compatibility"], (l: Locale) => string> = {
  MATCHED_DISTANCE: (l) => pick(l, "You want the same kind of distance", "둘 다 원하는 거리감이 비슷함"),
  NEGOTIABLE_GAP: (l) => pick(l, "Slightly different, but easy to bridge", "조금 다르지만 맞추기 어렵지 않음"),
  HIGH_DISTANCE_MISMATCH: (l) => pick(l, "You want noticeably different amounts of contact", "원하는 연락 빈도 차이가 꽤 큼"),
  // Not enough signal on either side to say what "matched" would even mean here —
  // never rendered as a confident "similar" claim (spec: LOW_EVIDENCE ≠ FLEXIBLE/MATCHED).
  LOW_EVIDENCE: (l) => pick(l, "Not enough signal yet to read your contact rhythm", "연락 리듬을 판단하기엔 아직 근거가 부족해요"),
};

export function buildFriendChapter08Distance(params: {
  intel: FriendResponseIntelligence;
  nameA: string;
  nameB: string;
  locale?: Locale;
}): FriendChapter08Distance {
  const locale = params.locale ?? "ko-KR";
  const { intel, nameA, nameB } = params;
  const pairDistance = intel.pair.distance;

  const aCopy = BASELINE_DISTANCE_COPY[pairDistance.aPreference];
  const bCopy = BASELINE_DISTANCE_COPY[pairDistance.bPreference];
  const baselineDescription =
    pairDistance.aPreference === pairDistance.bPreference
      ? aCopy.description(locale)
      : pick(
          locale,
          `${nameA} tends toward "${aCopy.label(locale).toLowerCase()}," while ${nameB} tends toward "${bCopy.label(locale).toLowerCase()}."`,
          `${nameA}은(는) "${aCopy.label(locale)}"에 가깝고, ${nameB}은(는) "${bCopy.label(locale)}"에 가까운 편이에요.`,
        );

  const baseline = {
    headline: COMPAT_HEADLINE[pairDistance.compatibility](locale),
    description: baselineDescription,
    compatibility: pairDistance.compatibility,
  };

  // ◤ 연락이 뜸해지면 나는 — the reason must cite the ACTUAL evidence that
  // produced silenceInterpretation, never silenceInterpretation's own sibling
  // field (baselineDistance) as if it were independent support — that would
  // be circular ("neutral because their distance style is neutral-ish").
  // NEUTRAL has two genuinely distinct causes (see buildDistanceProfile):
  // baselineDistance===LOW_FREQUENCY_HIGH_TRUST (a real, separately-evidenced
  // state — citing it is legitimate) vs. a resilience-driven read under any
  // other baseline (must cite resilience itself, not the unrelated baseline label).
  const silenceReading = [
    { name: nameA, sil: intel.personA.distance.silenceInterpretation, base: intel.personA.distance.baselineDistance, evidence: intel.personA.distance.evidence },
    { name: nameB, sil: intel.personB.distance.silenceInterpretation, base: intel.personB.distance.baselineDistance, evidence: intel.personB.distance.evidence },
  ].map(({ name, sil, base, evidence }) => {
    const baseCopy = BASELINE_DISTANCE_COPY[base];
    const resilienceEv = evidence.find((e) => e.key === "resilience");
    let reason: string;
    if (sil === "NEUTRAL" && base === "LOW_FREQUENCY_HIGH_TRUST") {
      reason = pick(locale, `That fits how ${name} treats distance overall — ${baseCopy.label(locale).toLowerCase()}.`, `평소 ${name}의 거리감("${baseCopy.label(locale)}") 자체가 원래 그런 편이라 자연스러운 반응이에요.`);
    } else if (sil === "NEUTRAL" && resilienceEv) {
      reason = pick(locale, `${name} tends to stay steady through gaps like this — it's less about this specific friendship and more how ${name} generally handles space.`, `${name}은(는) 이런 공백에도 잘 흔들리지 않는 편이라, 이 우정만의 문제라기보다는 ${name}이(가) 원래 공백을 잘 견디는 성향에 가까워요.`);
    } else if (sil === "RELATIONSHIP_CONCERN") {
      reason = pick(locale, `For ${name}, a long silence isn't neutral — it starts to feel like something's actually off.`, `${name}에게는 연락 없는 기간이 길어지면 단순한 침묵이 아니라 관계에 무슨 일이 생긴 건 아닌지 신경 쓰이기 시작해요.`);
    } else {
      reason = pick(locale, `${name} notices the gap without overreacting to it — enough to nudge a casual check-in.`, `${name}은(는) 연락 간격을 아예 신경 안 쓰진 않지만, 그렇다고 크게 걱정하기보다는 가볍게 안부를 묻는 정도로 넘어가요.`);
    }
    return { name, label: SILENCE_INTERPRETATION_COPY[sil](locale), reason };
  });

  // ◤ 자주 안 봐도 이것은 필요해 — show per-person top pick when they diverge,
  // instead of dumping the same 3-item list regardless of the pair.
  const topA = intel.personA.distance.maintenanceMinimum[0];
  const topB = intel.personB.distance.maintenanceMinimum[0];
  const perPerson: { name: string; item: string }[] =
    topA === topB
      ? []
      : [
          { name: nameA, item: MAINTENANCE_SIGNAL_COPY[topA](locale) },
          { name: nameB, item: MAINTENANCE_SIGNAL_COPY[topB](locale) },
        ];
  const sharedList = pairDistance.sharedMaintenanceMinimum.slice(0, topA === topB ? 2 : 1) as FriendMaintenanceSignal[];
  const maintenanceMinimum = {
    headline: pick(locale, "What you both still need, even at a distance", "자주 안 봐도 꼭 있어야 하는 것"),
    perPerson,
    shared: sharedList.map((m) => MAINTENANCE_SIGNAL_COPY[m](locale)),
  };

  // Merge both people's contextual disengagement signals, deduplicated —
  // explicitly framed as "worth watching for," never a live detected status.
  const mergedDisengagement = Array.from(
    new Set([...intel.personA.distance.disengagementSignals, ...intel.personB.distance.disengagementSignals]),
  ).slice(0, 2);
  const disengagementSignals = {
    headline: pick(locale, "Low contact isn't the warning sign — this is", "연락 빈도가 아니라 이런 게 진짜 신호예요"),
    items: mergedDisengagement.map((s) => DISENGAGEMENT_SIGNAL_COPY[s](locale)),
  };

  // ◤ 이 우정이 오래가는 방식 — a genuinely pair-specific conclusion, built
  // from baseline + maintenance + disengagement, never a generic "no effort
  // needed" or "just do the above" line (spec §12, banned phrases).
  let howItLastsHeadline: string;
  let howItLastsDescription: string;
  if (pairDistance.compatibility === "LOW_EVIDENCE") {
    // Not enough signal to claim the rhythm "matches" — say so instead of
    // rendering a confident synthesis over a gap that's really missing data
    // (spec §7/§15: LOW_EVIDENCE must never be presented as FLEXIBLE/MATCHED).
    howItLastsHeadline = pick(locale, "Still getting a read on your rhythm", "아직 연락 리듬을 판단하긴 일러요");
    howItLastsDescription = pick(
      locale,
      `There isn't enough signal yet to say what keeps this friendship's rhythm comfortable — that's something you two would know better than any profile could guess.`,
      `이 우정의 연락 리듬에서 뭐가 편안함을 유지해주는지는 아직 판단할 근거가 부족해요 — 이건 프로필보다 두 사람이 더 잘 알 거예요.`,
    );
  } else if (pairDistance.compatibility === "HIGH_DISTANCE_MISMATCH") {
    howItLastsHeadline = pick(locale, "Say the quiet part about contact out loud", "연락에 대한 서운함은 말로 꺼내야 오래가요");
    howItLastsDescription = pick(
      locale,
      `The real risk here isn't distance — it's one of you quietly resenting a pace the other never agreed to. Naming the gap directly, once, does more for this friendship than matching each other's rhythm ever could.`,
      `이 조합의 진짜 위험은 거리 자체가 아니라, 한쪽이 동의한 적 없는 속도를 혼자 서운해하며 참는 거예요. 그 차이를 한 번 직접 말로 꺼내는 게, 서로 속도를 억지로 맞추는 것보다 이 우정을 더 오래 지켜줘요.`,
    );
  } else {
    const sharedText = maintenanceMinimum.shared[0] ?? maintenanceMinimum.perPerson[0]?.item;
    howItLastsHeadline = pick(locale, "The rhythm already works — protect the substance", "리듬은 이미 맞음 — 알맹이만 지키면 됨");
    howItLastsDescription = pick(
      locale,
      `Your contact rhythm isn't the thing to watch — ${sharedText?.toLowerCase() ?? "the moments that actually matter"} is. As long as that keeps showing up, the gaps in between don't cost you anything.`,
      `연락 빈도 자체는 신경 쓸 필요가 없는 조합이에요 — 정작 지켜야 할 건 "${sharedText ?? "정말 중요한 순간의 연결"}"이에요. 이것만 유지되면 그 사이의 공백은 이 우정에 아무 영향도 주지 않아요.`,
    );
  }

  return {
    baseline,
    silenceReading,
    maintenanceMinimum,
    disengagementSignals,
    howItLasts: { headline: howItLastsHeadline, description: howItLastsDescription },
  };
}
