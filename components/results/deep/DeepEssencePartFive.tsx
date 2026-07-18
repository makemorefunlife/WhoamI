"use client";

import type { DeepEssenceStructuredReport } from "@/lib/report/runDeepEssenceStructuredLlm";
import type { DeepEssenceUiStrings } from "@/components/results/deep/deepEssenceUiStrings";

const serifStyle = { fontFamily: "var(--font-stitch-serif)" } as const;

/** 로버블 Part 05(앞으로의 나) 이식 — 기억할 것 3가지 + 다음 도약 + 마무리 인용구 */
export function DeepEssencePartFive({
  future,
  closing,
  t,
}: {
  future: DeepEssenceStructuredReport["future"];
  closing: string;
  t: DeepEssenceUiStrings;
}) {
  return (
    <div className="space-y-10">
      <div>
        <div className="text-[13px] font-medium text-primary">{t.part5.remember}</div>
        <ol className="mt-6 space-y-4">
          {future.remember.map((line, i) => (
            <li key={i} className="grid grid-cols-[auto_1fr] items-baseline gap-4">
              <span className="text-primary text-[26px] leading-none tabular-nums" style={serifStyle}>
                0{i + 1}
              </span>
              <span className="text-[18px] leading-[1.45] text-on-surface" style={serifStyle}>
                {line}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <div className="text-accent-rose text-[13px] font-medium">{t.part5.nextLeap}</div>
        <p className="mt-5 text-[14.5px] leading-[1.7] text-on-surface">{future.leap}</p>
      </div>

      <blockquote className="border-primary border-l-2 py-2 pl-6">
        <p className="text-[19px] leading-[1.55] text-on-surface italic" style={serifStyle}>
          {closing}
        </p>
      </blockquote>
    </div>
  );
}
