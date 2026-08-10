/**
 * Shared "Why You / Why Me / Why Us" contract — golden reference: Romantic
 * V4's c2_attraction ("서로를 선택한 이유"), whose live production text is a
 * deterministic template (not the unwired LLM expert-synthesis contract).
 * Generalizes `AttractionData`
 * (components/relationship/romantic/v4/adaptCanonicalSection.ts) so Friend
 * and Marriage can feed the same shared UI from their own deterministic,
 * domain-specific evidence — never copying Romantic's saju/CE content.
 */
export type WhyDirectionCard = {
  from: "a" | "b";
  to: "a" | "b";
  title: string;
  body: string;
  signals?: string[];
  scene?: string | null;
};

export type WhyYouMeUsData = {
  /** "왜 너일까" — the viewer (a) drawn to the partner (b). */
  whyYou: WhyDirectionCard;
  /** "왜 나일까" — the partner (b) drawn to the viewer (a). */
  whyMe: WhyDirectionCard;
  /** "왜 우리일까" — synergy that only exists between the two of them. */
  whyUs: { title: string; body: string; mechanism?: string[] };
  moment?: { line: string; scene: string } | null;
  bridge?: string | null;
};
