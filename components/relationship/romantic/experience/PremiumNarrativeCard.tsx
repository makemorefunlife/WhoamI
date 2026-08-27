"use client";

import { RelationshipReportCard, RelationshipReportBody, RelationshipReportInset } from "@/components/relationship/reportLayout";
import type { PremiumNarrativeModule } from "@/lib/relationship/romantic/experience/buildRomanticPremiumNarrative";

export function PremiumNarrativeCard({ module }: { module: PremiumNarrativeModule }) {
  // Opening block doesn't need a card container, we can render it as a hero text
  if (module.id === "opening") {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <h1 className="text-2xl font-serif text-primary mb-4">{module.answer}</h1>
        {module.explanation && <p className="text-on-surface-variant max-w-md">{module.explanation}</p>}
      </div>
    );
  }

  // Final takeaway
  if (module.id === "final_takeaway") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-tertiary mb-6">{module.question}</p>
        <h2 className="text-xl font-serif text-primary mb-4">{module.answer}</h2>
        {module.explanation && <p className="text-on-surface-variant max-w-md">{module.explanation}</p>}
      </div>
    );
  }

  return (
    <RelationshipReportCard
      id={`narrative-${module.id}`}
      title={module.question}
      accentColor="#0E5A63"
      className="scroll-mt-6"
    >
      <RelationshipReportBody>
        <div className="space-y-4">
          <p className="text-lg font-medium leading-snug text-primary">
            {module.answer}
          </p>
          
          {module.explanation && (
            <p className="text-[15px] leading-relaxed text-on-surface-variant">
              {module.explanation}
            </p>
          )}

          {module.evidence && module.evidence.length > 0 && (
            <div className="space-y-2 pt-2">
              {module.evidence.map((ev, idx) => (
                <RelationshipReportInset key={idx} className="border-secondary/25 bg-surface-container-low">
                  <p className="text-[14px] leading-relaxed text-on-surface-variant/80">
                    {ev}
                  </p>
                </RelationshipReportInset>
              ))}
            </div>
          )}

          {module.realLifeExample && (
            <div className="mt-4 rounded-[20px] bg-secondary/5 p-4 sm:p-5">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-secondary/60">
                실제 모습
              </span>
              <p className="text-[15px] font-medium leading-relaxed text-on-surface">
                {module.realLifeExample}
              </p>
            </div>
          )}

          {module.action && (
            <div className="mt-4 border-l-2 border-tertiary pl-4">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-tertiary/80">
                우리의 행동
              </span>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-on-surface-variant">
                {module.action}
              </p>
            </div>
          )}
        </div>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}
