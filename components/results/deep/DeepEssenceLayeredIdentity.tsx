"use client";

import type { DeepEssenceStructuredReport } from "@/lib/report/runDeepEssenceStructuredLlm";
import type { DeepEssenceUiStrings } from "@/components/results/deep/deepEssenceUiStrings";

const serifStyle = { fontFamily: "var(--font-stitch-serif)" } as const;

const LAYER_DEFS = [
  { key: "first_impression", labelKey: "firstImpression" },
  { key: "known_self", labelKey: "knownSelf" },
  { key: "close_private_self", labelKey: "closePrivateSelf" },
  { key: "natural_self_and_deep_needs", labelKey: "naturalSelfAndDeepNeeds" },
] as const;

/**
 * Batch 5 — additive Layered Identity section (Part 01, placed after the
 * radar chart). Renders nothing when `layered_identity` is absent, which
 * keeps Part 01 pixel-identical to pre-Batch-5 output for any report that
 * predates the Batch 3/4 grounding pipeline or where the packet failed.
 * A layer the backend omitted (too-thin evidence) is silently skipped —
 * never padded. Renders only the backend's title/narrative; evidence_refs
 * and raw saju terminology never reach this component.
 */
export function DeepEssenceLayeredIdentity({
  layeredIdentity,
  t,
}: {
  layeredIdentity: DeepEssenceStructuredReport["layered_identity"];
  t: DeepEssenceUiStrings["layeredIdentity"];
}) {
  if (!layeredIdentity) return null;

  const layers = LAYER_DEFS.map((def, i) => {
    const layer = layeredIdentity[def.key];
    if (!layer?.narrative) return null;
    return { ...layer, index: i, key: def.key, label: t.layers[def.labelKey] };
  }).filter((layer): layer is NonNullable<typeof layer> => layer !== null);

  if (layers.length === 0) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 border-b border-outline-variant pb-3">
        <h3 className="text-[18px] text-on-surface" style={serifStyle}>
          {t.sectionTitle}
        </h3>
        <span className="shrink-0 text-[10px] tracking-[0.2em] text-primary uppercase">
          {t.sectionTag}
        </span>
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {layers.map((layer) => (
          <div key={layer.key} className="border-t border-primary pt-4">
            <div className="text-[10.5px] tracking-[0.2em] text-primary tabular-nums">
              0{layer.index + 1}
            </div>
            <div className="mt-2 text-[10px] tracking-[0.18em] text-on-surface-variant uppercase">
              {layer.label}
            </div>
            {layer.title ? (
              <h4 className="mt-2 text-[18px] text-on-surface" style={serifStyle}>
                {layer.title}
              </h4>
            ) : null}
            <p className="mt-2 text-[13.5px] leading-[1.65] text-on-surface-variant">
              {layer.narrative}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
