"use client";

import type { DeepEssenceStructuredReport } from "@/lib/report/runDeepEssenceStructuredLlm";

const serifStyle = { fontFamily: "var(--font-stitch-serif)" } as const;

/** Exposed so the orchestrator (DeepEssenceReport.tsx) can decide whether this Part renders at all — never an empty Part, no "Coming soon" placeholder when the minimum-evidence gate wasn't met. */
export function hasAdaptationStoryContent(
  adaptationStory: DeepEssenceStructuredReport["adaptation_story"],
): boolean {
  return Boolean(adaptationStory?.narrative);
}

/**
 * IA Batch 3 — Part 04 ("그래서 나는 왜 이렇게 살아왔을까요?"). The report's
 * central synthesis — deliberately the simplest component in the whole
 * report: no chart, card, or grid, just an editorial narrative. The text
 * itself is the product here (per the batch spec) — anything more would
 * compete with it.
 *
 * The LLM is instructed to separate its 4-5 paragraphs with a blank line;
 * this component just splits on that and renders each as its own <p> so a
 * long narrative doesn't read as one dense wall of text.
 */
export function DeepEssenceAdaptationStory({
  adaptationStory,
}: {
  adaptationStory: DeepEssenceStructuredReport["adaptation_story"];
}) {
  if (!hasAdaptationStoryContent(adaptationStory)) return null;

  const paragraphs = adaptationStory!.narrative
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="space-y-5">
      {paragraphs.map((p, i) => (
        <p
          key={i}
          className="text-[14.5px] leading-[1.85] text-on-surface"
          style={serifStyle}
        >
          {p}
        </p>
      ))}
    </div>
  );
}
