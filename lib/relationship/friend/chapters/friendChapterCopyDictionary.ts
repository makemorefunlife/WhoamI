/**
 * Shared human-copy dictionary for Friend Chapters 5-8.
 * Every enum from friendResponseIntelligenceTypes.ts must be translated here
 * before reaching the UI — no raw machine value may leak (spec §16/§25).
 */
import type { Locale } from "@/lib/i18n/locale";
import type {
  FriendSupportMode,
  FriendSupportAdaptation,
  FriendConflictResponse,
  FriendConflictInterpretation,
  FriendConflictLoopType,
  FriendHurtTrigger,
  FriendRepairNeed,
  FriendRepairStep,
  FriendRelationshipNeedKey,
  FriendBoundaryBehavior,
  FriendFreedomNeed,
  FriendBaselineDistance,
  FriendSilenceInterpretation,
  FriendMaintenanceSignal,
  FriendDisengagementSignal,
} from "@/lib/relationship/friend/response/friendResponseIntelligenceTypes";

function pick(locale: Locale, en: string, ko: string): string {
  return locale === "en-US" ? en : ko;
}

/**
 * Wraps a copy dictionary so an unrecognized/missing key (e.g. a report
 * persisted before a new enum value was added) falls back to a real entry
 * instead of returning `undefined` and crashing the renderer downstream —
 * defense in depth alongside the friend_engine_version staleness guard,
 * which forces regeneration but must never be the ONLY thing standing
 * between a schema change and a live crash.
 */
function withFallback<K extends string, V>(dict: Record<K, V>): Record<K, V> {
  const fallbackKey = Object.keys(dict)[0] as K;
  return new Proxy(dict, {
    get(target, prop: string) {
      if (Object.prototype.hasOwnProperty.call(target, prop)) return target[prop as K];
      return target[fallbackKey];
    },
  });
}

export const SUPPORT_MODE_COPY: Record<FriendSupportMode, { label: (l: Locale) => string; asGiven: (l: Locale, name: string) => string }> = withFallback({
  EMOTIONAL_HOLDING: {
    label: (l) => pick(l, "Holding the feeling first", "마음부터 받아주는 쪽"),
    asGiven: (l, n) => pick(l, `${n} listens and sits with the feeling before jumping to advice.`, `${n}은(는) 해결책보다 먼저 마음을 충분히 들어주는 편이에요.`),
  },
  STRATEGIC_GUIDANCE: {
    label: (l) => pick(l, "Sorting out what to do", "생각을 정리해주는 쪽"),
    asGiven: (l, n) => pick(l, `${n} helps untangle the situation and points to a clear next step.`, `${n}은(는) 복잡한 상황을 정리해서 다음에 뭘 할지 방향을 잡아줘요.`),
  },
  PRACTICAL_HELP: {
    label: (l) => pick(l, "Handling the real logistics", "실질적으로 해결해주는 쪽"),
    asGiven: (l, n) => pick(l, `${n} pitches in with the actual, concrete parts of the problem.`, `${n}은(는) 말보다 실제로 손을 보태서 문제를 함께 해결해요.`),
  },
  ACTION_ACTIVATION: {
    label: (l) => pick(l, "Getting you moving again", "다시 움직이게 만드는 쪽"),
    asGiven: (l, n) => pick(l, `${n} turns your stuck feeling into momentum to actually do something.`, `${n}은(는) 멈춰있던 마음을 다시 움직이게 밀어줘요.`),
  },
  STEADY_PRESENCE: {
    label: (l) => pick(l, "Just being steadily there", "묵묵히 곁을 지키는 쪽"),
    asGiven: (l, n) => pick(l, `${n} doesn't say much — just stays reliably close by.`, `${n}은(는) 화려한 말보다 흔들림 없이 곁에 있어주는 방식으로 힘이 돼요.`),
  },
});

export const CONFLICT_RESPONSE_COPY: Record<FriendConflictResponse, { label: (l: Locale) => string; description: (l: Locale, name: string) => string }> = withFallback({
  DIRECT_CONFRONT: {
    label: (l) => pick(l, "I say it right away", "그 자리에서 바로 말하는 편"),
    description: (l, n) => pick(l, `${n} tends to bring it up directly, on the spot.`, `${n}은(는) 서운한 게 있으면 그 자리에서 바로 얘기를 꺼내는 편이에요.`),
  },
  WITHDRAW_AND_PROCESS: {
    label: (l) => pick(l, "I need to step back first", "혼자 정리할 시간이 먼저 필요함"),
    description: (l, n) => pick(l, `${n} tends to go quiet first and process it alone before talking.`, `${n}은(는) 바로 말하기보다 혼자 생각을 정리할 시간이 먼저 필요해요.`),
  },
  SEEK_CLARIFICATION: {
    label: (l) => pick(l, "I want to understand why first", "왜 그랬는지부터 확인하는 편"),
    description: (l, n) => pick(l, `${n} wants to understand what actually happened before reacting.`, `${n}은(는) 감정보다 먼저 무슨 상황이었는지 확인하고 싶어해요.`),
  },
  SOLVE_QUICKLY: {
    label: (l) => pick(l, "I want to fix it and move on", "빨리 풀고 넘어가고 싶어함"),
    description: (l, n) => pick(l, `${n} would rather sort it out fast and not let it linger.`, `${n}은(는) 오래 끌기보다 빠르게 해결하고 넘어가고 싶어해요.`),
  },
  SOFTEN_FIRST: {
    label: (l) => pick(l, "I soften the mood before talking", "분위기부터 풀고 얘기함"),
    description: (l, n) => pick(l, `${n} tends to ease the tension a bit before actually addressing it.`, `${n}은(는) 바로 지적하기보다 분위기를 부드럽게 만들고 나서 얘기를 꺼내요.`),
  },
});

export const HURT_TRIGGER_COPY: Record<FriendHurtTrigger, (l: Locale) => string> = withFallback({
  FEELING_IGNORED: (l) => pick(l, "Feeling overlooked or unnoticed", "내가 신경 안 쓰이는 것 같을 때"),
  BROKEN_EXPECTATION: (l) => pick(l, "A plan or promise falling through", "약속했던 게 지켜지지 않을 때"),
  DISRESPECT: (l) => pick(l, "Feeling talked down to", "무시당하는 느낌이 들 때"),
  EMOTIONAL_DISMISSAL: (l) => pick(l, "Having my feelings brushed off", "내 감정이 가볍게 넘겨질 때"),
  LOSS_OF_AUTONOMY: (l) => pick(l, "Feeling controlled or boxed in", "내 방식을 존중받지 못한다고 느낄 때"),
  UNRELIABILITY: (l) => pick(l, "Not being able to count on them", "믿고 의지할 수 없다고 느낄 때"),
});

export const REPAIR_NEED_COPY: Record<FriendRepairNeed, (l: Locale) => string> = withFallback({
  SPACE_FIRST: (l) => pick(l, "A little time alone first", "생각을 정리할 짧은 시간"),
  REASSURANCE_FIRST: (l) => pick(l, "Knowing we're still okay", "관계가 괜찮다는 확인"),
  CLEAR_EXPLANATION: (l) => pick(l, "A clear explanation of what happened", "무슨 일이었는지 분명한 설명"),
  ACCOUNTABILITY: (l) => pick(l, "An honest acknowledgment", "솔직한 인정"),
  NORMALIZATION: (l) => pick(l, "Treating it as no big deal", "너무 무겁게 만들지 않기"),
});

/** Why this repair need matters — a distinct sentence from REPAIR_NEED_COPY's
 * label, so headline and body never say the same thing verbatim (spec: CH6-D
 * headline/body duplication fix). */
export const REPAIR_NEED_WHY_COPY: Record<FriendRepairNeed, (l: Locale, name: string) => string> = withFallback({
  SPACE_FIRST: (l, name) => pick(l, `${name} needs feelings to settle first — talking right away tends to make things sharper, not calmer.`, `${name}은(는) 감정이 좀 가라앉은 다음에 얘기해야 오히려 상황이 커지지 않아요.`),
  REASSURANCE_FIRST: (l, name) => pick(l, `For ${name}, the explanation matters less than knowing the relationship itself is still solid.`, `${name}에게는 이유를 듣는 것보다 "우리 사이는 괜찮다"는 확인이 먼저 있어야 마음이 놓여요.`),
  CLEAR_EXPLANATION: (l, name) => pick(l, `${name} needs to know exactly what happened before the worry about the relationship can settle.`, `${name}은(는) 정확히 무슨 일이었는지 알아야 관계에 대한 불안이 가라앉는 편이에요.`),
  ACCOUNTABILITY: (l, name) => pick(l, `For ${name}, glossing over who did what tends to leave more residue than the original friction.`, `${name}에게는 누구 탓인지 흐지부지 넘어가는 게 오히려 더 오래 남는 편이에요.`),
  NORMALIZATION: (l, name) => pick(l, `${name} recovers faster when it's treated as a small thing — over-processing it can make it feel bigger than it was.`, `${name}은(는) 너무 무겁게 다루면 오히려 별일 아닌 것도 크게 느껴질 수 있어요.`),
});

export const REPAIR_STEP_COPY: Record<FriendRepairStep, (l: Locale) => string> = withFallback({
  PAUSE: (l) => pick(l, "Give it a beat", "잠깐 멈추기"),
  REASSURE: (l) => pick(l, "Reassure the relationship is fine", "관계는 괜찮다고 말해주기"),
  CLARIFY: (l) => pick(l, "Clarify what actually happened", "실제 상황 확인하기"),
  LISTEN: (l) => pick(l, "Just listen first", "먼저 들어주기"),
  ACKNOWLEDGE: (l) => pick(l, "Acknowledge how it landed", "어떻게 느껴졌는지 인정하기"),
  EXPLAIN: (l) => pick(l, "Explain your side simply", "내 입장 짧게 설명하기"),
  SOLVE: (l) => pick(l, "Agree on what to do differently", "다음엔 어떻게 할지 정하기"),
  RESET: (l) => pick(l, "Reset the tone", "분위기 다시 풀기"),
  RECONNECT: (l) => pick(l, "Do something normal together", "평소처럼 시간 보내기"),
});

export const RELATIONSHIP_NEED_COPY: Record<FriendRelationshipNeedKey, (l: Locale) => string> = withFallback({
  RELIABILITY: (l) => pick(l, "Being someone I can count on", "믿고 의지할 수 있는 것"),
  EMOTIONAL_RESPECT: (l) => pick(l, "Having my feelings taken seriously", "내 감정을 존중받는 것"),
  HONESTY: (l) => pick(l, "Straightforwardness, even when it's awkward", "불편해도 솔직한 것"),
  RECOGNITION: (l) => pick(l, "Feeling genuinely seen", "있는 그대로 인정받는 것"),
  AUTONOMY: (l) => pick(l, "Having my own space respected", "내 영역을 존중받는 것"),
  CONSISTENCY: (l) => pick(l, "Being treated the same way over time", "한결같은 태도"),
});

export const BOUNDARY_BEHAVIOR_COPY: Record<FriendBoundaryBehavior, (l: Locale) => string> = withFallback({
  REPEATED_BROKEN_PLANS: (l) => pick(l, "Repeatedly canceling or no-showing", "약속을 반복해서 어기는 것"),
  EMOTIONAL_DISMISSAL: (l) => pick(l, "Brushing off how I feel", "내 감정을 가볍게 넘기는 것"),
  DISHONESTY: (l) => pick(l, "Being dishonest with me", "솔직하지 않은 것"),
  PUBLIC_UNDERMINING: (l) => pick(l, "Putting me down in front of others", "다른 사람들 앞에서 깎아내리는 것"),
  OVER_CONTROL: (l) => pick(l, "Pushing me to do things their way", "내 방식을 억지로 바꾸려는 것"),
  INCONSISTENT_TREATMENT: (l) => pick(l, "Treating me differently depending on mood", "그때그때 태도가 달라지는 것"),
});

export const FREEDOM_NEED_COPY: Record<FriendFreedomNeed, (l: Locale) => string> = withFallback({
  SPACE_BETWEEN_CONTACT: (l) => pick(l, "Going a while without checking in", "연락 없이 지내는 기간을 이해해주는 것"),
  INDEPENDENT_SOCIAL_CIRCLES: (l) => pick(l, "Having separate friend groups", "각자의 다른 인간관계를 존중하는 것"),
  PRIVATE_PROCESSING: (l) => pick(l, "Working through things alone first", "혼자 정리할 시간을 존중하는 것"),
  NOT_SHARING_EVERYTHING: (l) => pick(l, "Not having to share every detail", "모든 걸 다 얘기하지 않아도 되는 것"),
  FLEXIBLE_MEETING_FREQUENCY: (l) => pick(l, "Flexibility in how often you meet", "만나는 빈도에 유연한 것"),
});

export const BASELINE_DISTANCE_COPY: Record<FriendBaselineDistance, { label: (l: Locale) => string; description: (l: Locale) => string }> = withFallback({
  FREQUENT_LIGHT_CONTACT: {
    label: (l) => pick(l, "Frequent, easygoing contact", "자주, 가볍게 연락하는 사이"),
    description: (l) => pick(l, "You check in often, and it stays light and low-effort.", "부담 없이 자주 안부를 주고받는 편이에요."),
  },
  FREQUENT_DEEP_CONTACT: {
    label: (l) => pick(l, "Frequent and deep contact", "자주, 깊게 연락하는 사이"),
    description: (l) => pick(l, "You're in touch often, and it usually goes beneath the surface.", "자주 연락하면서도 대화가 가벼운 데서 끝나지 않는 편이에요."),
  },
  LOW_FREQUENCY_HIGH_TRUST: {
    label: (l) => pick(l, "Rare contact, high trust", "가끔 연락해도 깊게 믿는 사이"),
    description: (l) => pick(l, "You don't talk often, but the trust doesn't fade in between.", "자주 연락하지 않아도 만나면 어제 본 것처럼 편안한 사이예요."),
  },
  EVENT_DRIVEN_CONNECTION: {
    label: (l) => pick(l, "Connected around occasions", "특별한 계기가 있을 때 이어지는 사이"),
    description: (l) => pick(l, "Contact tends to happen around specific events rather than a steady rhythm.", "정해진 리듬보다는 특별한 일이 있을 때 자연스럽게 이어지는 사이예요."),
  },
  FLEXIBLE_DISTANCE: {
    label: (l) => pick(l, "Comfortably flexible", "정해진 패턴 없이 편안한 사이"),
    description: (l) => pick(l, "There's no fixed pattern — you adjust naturally to whatever the moment calls for.", "정해진 패턴 없이, 그때그때 자연스럽게 거리를 맞추는 사이예요."),
  },
  // Distinct from FLEXIBLE_DISTANCE: reached when contact-frequency evidence
  // (energy_style/stimulation) is simply absent, not when flexibility itself
  // is positively evidenced. Copy stays neutral rather than claiming a style.
  LOW_EVIDENCE_DISTANCE: {
    label: (l) => pick(l, "Still reading this one", "아직 파악 중인 거리감"),
    description: (l) => pick(l, "There isn't enough signal yet to say what your natural contact rhythm looks like.", "지금 데이터로는 자연스러운 연락 리듬을 판단하기엔 근거가 부족해요."),
  },
});

export const SILENCE_INTERPRETATION_COPY: Record<FriendSilenceInterpretation, (l: Locale) => string> = withFallback({
  NEUTRAL: (l) => pick(l, "I don't read much into it — it's just how we are.", "특별한 의미로 안 받아들여요 — 원래 그런 사이니까요."),
  MILD_CHECK_IN: (l) => pick(l, "I notice, and might casually check in.", "신경은 쓰이지만 가볍게 안부를 물어보는 정도예요."),
  RELATIONSHIP_CONCERN: (l) => pick(l, "It can genuinely worry me.", "정말로 마음이 쓰이고 걱정이 될 수 있어요."),
});

export const MAINTENANCE_SIGNAL_COPY: Record<FriendMaintenanceSignal, (l: Locale) => string> = withFallback({
  IMPORTANT_MOMENT_CONTACT: (l) => pick(l, "Showing up for the big moments", "중요한 순간엔 꼭 연락하는 것"),
  OCCASIONAL_INITIATION: (l) => pick(l, "Someone occasionally reaching out first", "가끔이라도 먼저 연락해보는 것"),
  DEEP_RECONNECTION: (l) => pick(l, "Picking up right where you left off", "오랜만이어도 깊은 대화로 바로 이어지는 것"),
  RELIABLE_RESPONSE_WHEN_NEEDED: (l) => pick(l, "Actually being there when it matters", "정작 필요할 때는 확실히 반응해주는 것"),
  SHARED_EXPERIENCE: (l) => pick(l, "Making time for shared experiences", "가끔이라도 같이 뭔가를 경험하는 것"),
});

export const DISENGAGEMENT_SIGNAL_COPY: Record<FriendDisengagementSignal, (l: Locale) => string> = withFallback({
  STOPS_SHARING_IMPORTANT_EVENTS: (l) => pick(l, "You stop hearing about big things in their life", "중요한 일들을 더 이상 공유하지 않는 것"),
  STOPS_INITIATING_COMPLETELY: (l) => pick(l, "They stop reaching out at all, even occasionally", "한쪽이 아예 먼저 연락을 안 하게 되는 것"),
  AVOIDS_MEETING_WHEN_AVAILABLE: (l) => pick(l, "They avoid meeting even when they're free", "시간이 있어도 만남을 피하는 것"),
  ONLY_CONTACTS_FOR_NEEDS: (l) => pick(l, "Contact only happens when something's needed", "필요할 때만 연락하게 되는 것"),
  EMOTIONAL_DEPTH_DISAPPEARS: (l) => pick(l, "Conversations stay surface-level", "대화가 계속 겉도는 것"),
});

/**
 * CH6-A layer 2 — deliberately DIFFERENT framing from RELATIONSHIP_NEED_COPY
 * (which is CH7's own-words "what I value" phrasing). This is the same
 * underlying need key, expressed as "what the reaction is protecting" —
 * cross-chapter coherence without literal repetition (spec §7/§9).
 */
export const CONFLICT_UNDERLYING_NEED_COPY: Record<FriendRelationshipNeedKey, (l: Locale) => string> = withFallback({
  RELIABILITY: (l) => pick(l, "a quiet check that the promise between you still holds", "약속이나 믿음이 여전히 지켜지고 있다는 확인"),
  EMOTIONAL_RESPECT: (l) => pick(l, "a check that the feeling wasn't brushed off", "내 감정이 가볍게 여겨지지 않았다는 확인"),
  HONESTY: (l) => pick(l, "a check that you're still being straight with each other", "서로 솔직하게 터놓고 있다는 확인"),
  RECOGNITION: (l) => pick(l, "a check that you still matter to them", "내가 여전히 중요한 사람이라는 확인"),
  AUTONOMY: (l) => pick(l, "a check that your own way of doing things is still respected", "내 방식이 여전히 존중받고 있다는 확인"),
  CONSISTENCY: (l) => pick(l, "a check that things haven't quietly changed between you", "관계가 여전히 한결같다는 확인"),
});

export const CONFLICT_INTERPRETATION_COPY: Record<FriendConflictInterpretation, (l: Locale) => string> = withFallback({
  PRESSURE: (l) => pick(l, "pressure", "압박"),
  AVOIDANCE: (l) => pick(l, "avoidance", "회피"),
  NOT_LISTENING: (l) => pick(l, "not really listening", "안 들어주는 태도"),
  DISMISSIVENESS: (l) => pick(l, "brushing it off", "대충 넘기려는 태도"),
  COLDNESS: (l) => pick(l, "coldness", "쌀쌀맞음"),
  OVERANALYSIS: (l) => pick(l, "over-analyzing instead of just responding", "너무 따지고 드는 태도"),
});

export const CONFLICT_LOOP_TYPE_COPY: Record<FriendConflictLoopType, (l: Locale) => string> = withFallback({
  OPPOSITE_STYLE_LOOP: (l) => pick(l, "Your two reaction styles pull in different directions", "서로 다른 반응 방식이 부딪히는 흐름"),
  SAME_STYLE_COLLISION: (l) => pick(l, "The same instinct in both of you collides head-on", "같은 방식끼리 부딪혀서 더 커지는 흐름"),
  LOW_ESCALATION_MATCH: (l) => pick(l, "Your styles rarely escalate each other", "쉽게 커지지 않는 궁합"),
  PRESSURE_WITHDRAW_LOOP: (l) => pick(l, "The more one pushes, the more the other pulls back", "다가갈수록 오히려 멀어지는 흐름"),
  EXPLANATION_COMPETITION: (l) => pick(l, "You both explain your side before either really listens", "서로 설명하려다 정작 못 듣는 흐름"),
  EMOTIONAL_MISS: (l) => pick(l, "What one of you needs isn't what the other offers first", "원하는 반응이 서로 살짝 어긋나는 흐름"),
});

export const SUPPORT_ADAPTATION_COPY: Partial<Record<FriendSupportAdaptation, (l: Locale, giver: string, receiver: string) => string>> = {
  SOFTENED: (l, giver, receiver) => pick(l, `With ${receiver}, ${giver} dials it down and leads with warmth instead.`, `${receiver}에게는 평소보다 한 톤 부드럽게 다가가게 돼요.`),
  MORE_DIRECT: (l, giver, receiver) => pick(l, `With ${receiver}, ${giver} gets more direct about what the next step should be.`, `${receiver}에게는 평소보다 더 명확하게 방향을 짚어주게 돼요.`),
  MORE_PRACTICAL: (l, giver, receiver) => pick(l, `With ${receiver}, ${giver} skips the talk and just helps with the concrete part.`, `${receiver}에게는 말보다 실질적인 도움을 먼저 챙기게 돼요.`),
  MORE_EMOTIONAL: (l, giver, receiver) => pick(l, `With ${receiver}, ${giver} pays closer attention to how it's landing emotionally.`, `${receiver}에게는 평소보다 마음을 더 세심하게 살피게 돼요.`),
  MORE_STABILIZING: (l, giver, receiver) => pick(l, `With ${receiver}, ${giver} focuses on staying calm and steady rather than fixing things fast.`, `${receiver}에게는 해결보다 차분하고 안정적인 태도를 더 신경 쓰게 돼요.`),
};

/** CH7-B — why each boundary actually matters, keyed by the need it inverts. */
export const BOUNDARY_WHY_COPY: Record<FriendRelationshipNeedKey, (l: Locale) => string> = withFallback({
  RELIABILITY: (l) => pick(l, "It's not really about the schedule — it reads as \"do I actually matter to you.\"", "단순한 일정 문제가 아니라 \"내가 중요하지 않은가?\"라는 느낌으로 이어질 수 있어요."),
  EMOTIONAL_RESPECT: (l) => pick(l, "It looks minor in the moment, but it quietly adds up into distance.", "별일 아닌 척해도 마음이 쌓이면 거리감으로 번질 수 있어요."),
  HONESTY: (l) => pick(l, "Even a small one, repeated, wears down the trust itself.", "작은 거짓말이라도 반복되면 신뢰 자체가 흔들릴 수 있어요."),
  RECOGNITION: (l) => pick(l, "Being cut down in front of others tends to stick longer than anything said in private.", "다른 사람 앞에서 깎이는 순간은 유독 오래 마음에 남아요."),
  AUTONOMY: (l) => pick(l, "Feeling constantly steered can push someone to want more distance, not less.", "억지로 맞춰지는 느낌이 쌓이면 오히려 거리를 두고 싶어질 수 있어요."),
  CONSISTENCY: (l) => pick(l, "When the tone keeps shifting, it's hard to ever fully relax.", "예측할 수 없는 태도가 반복되면 마음을 놓기 어려워져요."),
});
