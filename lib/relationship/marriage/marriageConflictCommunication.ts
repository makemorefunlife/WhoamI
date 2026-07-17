import { sanitizeHomeLifeText } from "./homeLifeLanguage";
import { LEGACY_FALLBACK_LOCALE, pick } from "./marriageCopy";
import type { Locale } from "@/lib/i18n/locale";
import {
  profileTenGods,
  type TenGodCounts,
} from "./marriageTenGodAnalysis";

export type ConflictCommunicationSection = {
  title: string;
  pattern_label: string;
  narrative: string;
  emotional_neglect_risk: string;
  explosive_nickname: string;
  stonewall_nickname: string;
};

function communicationArchetype(counts: TenGodCounts): {
  explosive: number;
  stonewall: number;
} {
  const p = profileTenGods(counts);
  return {
    explosive: p.food * 2 + (p.food >= 2 ? 2 : 0),
    stonewall: p.seal + p.officer + (p.seal + p.officer >= 3 ? 2 : 0),
  };
}

export function buildConflictCommunicationSection(params: {
  nicknameA: string;
  nicknameB: string;
  countsA: TenGodCounts;
  countsB: TenGodCounts;
  locale?: Locale;
}): ConflictCommunicationSection {
  const { nicknameA, nicknameB, countsA, countsB } = params;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const archA = communicationArchetype(countsA);
  const archB = communicationArchetype(countsB);

  const explosiveIsA = archA.explosive > archB.explosive;
  const stonewallIsA = archA.stonewall > archB.stonewall;

  const explosiveNick = explosiveIsA ? nicknameA : nicknameB;
  const stonewallNick = stonewallIsA ? nicknameA : nicknameB;

  const samePersonExplodesAndWalls =
    explosiveNick === stonewallNick &&
    Math.abs(archA.explosive - archB.explosive) < 2 &&
    Math.abs(archA.stonewall - archB.stonewall) < 2;

  let pattern_label: string;
  let narrative: string;
  let emotional_neglect_risk: string;

  if (samePersonExplodesAndWalls) {
    pattern_label = pick(locale, "Burst-then-Shutdown", "폭발 후 냉각형 (Burst-then-Shutdown)");
    narrative = sanitizeHomeLifeText(
      pick(
        locale,
        `${explosiveNick} has a strong pattern of venting in words the moment emotion rises, then shutting the door on themselves. ` +
          `The partner is left tracking "wait, what just happened?" until they're worn out.`,
        `${explosiveNick}는 감정이 올라오면 말로 쏟아낸 뒤, 스스로 문을 닫아 버리는 패턴이 강합니다. ` +
          `상대는 '방금 전까지 뭐였지?' 하며 추적하다 지칩니다.`,
      ),
    );
    emotional_neglect_risk = sanitizeHomeLifeText(
      pick(
        locale,
        "It can look resolved right after the outburst, but from the partner's side, the emotional neglect continues. A reconnection promise like 'let's rest now and pick this up in 30 minutes' is essential.",
        "폭발 직후엔 해결이 된 것 같지만, 상대 입장에선 정서적 방임이 이어집니다. '지금은 쉬고 30분 뒤 이어가자'는 재접속 약속이 필수예요.",
      ),
    );
  } else if (explosiveNick !== stonewallNick) {
    pattern_label = pick(locale, "Pursue–Withdraw", "폭발형 × 벽창호 (Pursue–Withdraw)");
    narrative = sanitizeHomeLifeText(
      pick(
        locale,
        `${explosiveNick} is the burst type who wants to resolve hurt feelings immediately by venting in words, while ` +
          `${stonewallNick} is the stonewalling type who shuts their mouth once emotion grows. ` +
          `The more one chases, the harder the other shuts the door — a vicious cycle.`,
        `${explosiveNick}는 서운함을 즉시 풀고 싶어 말을 쏟아내는 폭발형이고, ` +
          `${stonewallNick}는 감정이 커지면 입을 닫는 벽창호(Stonewalling)형입니다. ` +
          `한 명이 쫓을수록 다른 한 명은 문을 더 단단히 닫는 악순환 구조예요.`,
      ),
    );
    emotional_neglect_risk = sanitizeHomeLifeText(
      pick(
        locale,
        "The pursuer feels 'I'm being ignored,' and the withdrawer feels 'there's no room to breathe.' The longer the fight drags on, the more emotionally neglected you both feel. Only a 20-minute timeout plus a promised 'time to come back' can break this loop.",
        "추격하는 쪽은 '나를 무시한다'고 느끼고, 물러서는 쪽은 '숨 쉴 틈이 없다'고 느낍니다. 싸움이 길어질수록 둘 다 정서적으로 방치된 기분이 듭니다. 타임아웃 20분 + '돌아올 시간' 약속만이 이 루프를 끊습니다.",
      ),
    );
  } else {
    pattern_label = pick(locale, "Slow Harmonizers", "완만한 조율형 (Slow Harmonizers)");
    narrative = sanitizeHomeLifeText(
      pick(
        locale,
        "Neither of you leans toward extreme outbursts or silence, so there's a good chance conflict gets resolved through conversation rather than dragging on. But brushing things off with 'it's fine' can let unresolved emotion build up.",
        "둘 다 극단적 폭발·침묵 쪽으로 치우치지 않아, 갈등이 길게 끌기보다는 대화로 풀릴 여지가 큽니다. 다만 '괜찮아'로 넘기면 미해결 감정이 쌓일 수 있어요.",
      ),
    );
    emotional_neglect_risk = sanitizeHomeLifeText(
      pick(
        locale,
        "Watch for a pattern where the surface looks peaceful but things build up underneath. A weekly routine of bringing up 'just one uncomfortable thing' prevents emotional neglect.",
        "표면은 평화인데 속은 쌓이는 패턴을 조심하세요. 주 1회 '불편한 것 하나만' 꺼내는 루틴이 정서적 방임을 막습니다.",
      ),
    );
  }

  return {
    title: pick(locale, "🗣️ Conflict Communication Dynamic", "🗣️ 갈등 소통 스타일 (Conflict Communication Dynamic)"),
    pattern_label,
    narrative,
    emotional_neglect_risk,
    explosive_nickname: explosiveNick,
    stonewall_nickname: stonewallNick,
  };
}
