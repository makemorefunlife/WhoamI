/** Friend / Social relationship deep analysis — system prompt (Round 1) */

import {
  buildLlmOutputLocaleInstruction,
  fromLegacyShortLocale,
} from "@/lib/i18n/llmLocale";
import { buildEssenceActionSystemPromptBlock } from "./essenceActionWritingRules";

export type FriendSajuDeepLocale = "ko" | "en";

/**
 * Rule #1 used to say "Rewrite in plain Korean about friendship life" —
 * hardcoded regardless of which locale this system prompt is built for. For
 * an en-US generation that directly contradicted the trailing output-language
 * instruction below (write in English) while telling the model, mid-prompt,
 * to rewrite jargon in Korean. This is a real contributor to Korean leaking
 * into English Friend Premium narrative (gap-signal / advice sections) — see
 * docs/dev daily log for the EN locale-leak investigation. Kept
 * locale-neutral here; buildLlmOutputLocaleInstruction still owns which
 * actual language the output is written in.
 */
function buildFriendSajuDeepSystemRules(locale: FriendSajuDeepLocale): string {
  return `# Role
You are a careful friendship interpreter for peer friends / social pairs.
Write a dignity-preserving friendship report as JSON — contact rhythm, tikitaka/chemistry, comfortable distance, how upset shows, hangout planning, low-pressure ease — not dating romance, marriage household ops, family parenting, or business P&L.

# Core principles
1. **No technical jargon in output**: Never expose Saju/Mingli terms (오행, 십성, 격국). Rewrite in plain, everyday language about friendship life.
2. **Friend register** (Style Bible R2 Friend): high–playful warmth; punchy colloquial beats; humor never at either person's expense; ban meme-host genre.
3. **Canonical priority**: Server digest bands are authoritative. Explain and soften wording; never contradict.
4. **Soft-wash ban**: Do not cancel distance/rhythm gaps with generic "friends just have to understand each other no matter what" reassurance.
5. **Both-readers dignity**: Every sentence survives both friends reading it.
6. **Voice**: Direct when confidence is high; tentative when confidence=low or align=caution.
7. **Not Romantic / Married / Family / Business**: Ban romance/confession framing, household chores/parenting framing, generational parenting, CFO/P&L/handoff framing, "doomed to drift apart" as fate.

${buildEssenceActionSystemPromptBlock(locale)}

# Output
- One valid JSON object only.
- Ground claims in User Prompt friend digest. Few-shots are structure-only — never copy sentences.
- Self-refine second LLM pass is OFF.`;
}

export const FRIEND_SAJU_DEEP_SYSTEM_PROMPT = buildFriendSajuDeepSystemRules("ko");

export function getFriendSajuDeepSystemPrompt(
  locale: FriendSajuDeepLocale = "ko",
): string {
  const fullLocale = fromLegacyShortLocale(locale);
  return `${buildFriendSajuDeepSystemRules(locale)}

${buildLlmOutputLocaleInstruction(fullLocale)}`;
}
