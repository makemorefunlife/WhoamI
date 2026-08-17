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

/** Exposed so the orchestrator (DeepEssenceReport.tsx) can decide whether this Part renders at all — no empty Part, no fabricated content when every layer was omitted. */
export function hasLayeredIdentityContent(
  layeredIdentity: DeepEssenceStructuredReport["layered_identity"],
): boolean {
  if (!layeredIdentity) return false;
  return LAYER_DEFS.some((def) => Boolean(layeredIdentity[def.key]?.narrative));
}

/**
 * IA Batch 1 — New Part 02 ("당신은 생각보다 여러 겹이에요"). Promoted from a
 * fragment inside the old Part 01 into its own top-level Part (see
 * DeepEssenceReport.tsx). Renders nothing when `layered_identity` is absent
 * or every layer was omitted (too-thin evidence) — never padded.
 *
 * Layout changed from a 2-column card grid to a sequential read (layer 1 →
 * 2 → 3 → 4), since the point of this Part is the *progression* between
 * layers, not four independent facts.
 *
 * Future insertion point (NOT implemented this batch — no
 * `layered_identity.synthesis` field exists yet, so nothing is fabricated
 * here): once a schema field for a layer-to-layer synthesis sentence exists,
 * it renders directly below the sequential list, above the closing
 * separator. Do not add a synthesis paragraph before that field exists.
 */
export function DeepEssenceLayeredIdentity({
  layeredIdentity,
  t,
}: {
  layeredIdentity: DeepEssenceStructuredReport["layered_identity"];
  t: DeepEssenceUiStrings["layeredIdentity"];
}) {
  if (!hasLayeredIdentityContent(layeredIdentity)) return null;

  const layers = LAYER_DEFS.map((def, i) => {
    const layer = layeredIdentity![def.key];
    if (!layer?.narrative) return null;
    return { ...layer, index: i, key: def.key, label: t.layers[def.labelKey] };
  }).filter((layer): layer is NonNullable<typeof layer> => layer !== null);

  return (
    <div className="space-y-8">
      {layers.map((layer, i) => (
        <div key={layer.key} className={i === 0 ? "" : "border-t border-outline-variant pt-8"}>
          <div className="flex items-baseline gap-3">
            <span className="text-[10.5px] tracking-[0.2em] text-primary tabular-nums">
              0{layer.index + 1}
            </span>
            <span className="text-[10px] tracking-[0.18em] text-on-surface-variant uppercase">
              {layer.label}
            </span>
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
      {/* Future insertion point: layered_identity.synthesis renders here, once that field exists (next batch). Nothing rendered this batch. */}
    </div>
  );
}
