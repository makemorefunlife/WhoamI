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
 * IA Batch 2 — fills the insertion point Batch 1 left below the sequential
 * list with `layered_identity.synthesis`: one closing paragraph naming the
 * change between layers (not a fifth card, not a repeat of the four above).
 * Rendered only when the LLM actually produced one — the server already
 * enforces "only when >= 2 layers are populated" in
 * coerceDeepEssenceStructured.ts, so this component doesn't re-check that
 * condition, only whether the field is present.
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
      {layeredIdentity!.synthesis ? (
        <div className="border-t border-outline-variant pt-8">
          <p className="text-[11px] tracking-[0.06em] text-primary italic">
            {t.synthesisLabel}
          </p>
          <p className="mt-3 text-[14.5px] leading-[1.75] text-on-surface" style={serifStyle}>
            {layeredIdentity!.synthesis.narrative}
          </p>
        </div>
      ) : null}
    </div>
  );
}
