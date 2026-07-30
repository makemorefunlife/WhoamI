"use client";

import { useEffect, useState } from "react";
import type { RomanticV3PrototypePayload } from "@/lib/relationship/romantic/prototypeV3/types";
import {
  HeroSection,
  RelationshipIdentitySection,
  CoreDifferencesSection,
  YouAndMeSection,
  WhyItWorksSection,
  RelationshipFlowSection,
  MisunderstandingSection,
  HiddenHeartSection,
  RepairGuideSection,
  RealLifeSection,
  NextChapterSection,
  ClosingSection
} from "./components/ReportSections";

type Props = {
  payload: RomanticV3PrototypePayload;
  debug?: boolean;
};

export default function PrototypeClient({ payload, debug = false }: Props) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const isComplete = payload.variant === "complete";
  const enSmoke = payload.locale === "en-US";
  const personA = enSmoke ? "Person A" : payload.pair.personA;
  const personB = enSmoke ? "Person B" : payload.pair.personB;
  const t = (text: string) => (enSmoke ? "[EN smoke content block]" : text);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${totalScroll / windowHeight}`;
      setScrollProgress(Number(scroll));
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sectionProps = {
    payload,
    debug,
    personA,
    personB,
    enSmoke,
    t
  };

  return (
    <main data-v3-prototype-root className="w-full bg-[#F8FAFA] min-h-screen text-[#2D3748] relative">
      
      {/* Sticky Progress Bar */}
      {isComplete && (
        <div className="fixed top-0 left-0 w-full z-50 pointer-events-none">
          <div className="h-1.5 w-full bg-black/5">
            <div 
              className="h-full bg-[#C9A66B] transition-all duration-150 ease-out" 
              style={{ width: `${scrollProgress * 100}%` }}
            />
          </div>
          <div className="absolute top-4 right-4 sm:right-8 bg-white/80 backdrop-blur-md border border-[#E2E8F0] shadow-sm px-4 py-2 rounded-full text-xs font-semibold text-[#0E5A63] tracking-widest uppercase pointer-events-auto">
            {Math.round(scrollProgress * 100)}% Reading
          </div>
        </div>
      )}

      {isComplete ? (
        <article className="pb-24">
          <HeroSection {...sectionProps} />
          <RelationshipIdentitySection {...sectionProps} />
          <CoreDifferencesSection {...sectionProps} />
          <YouAndMeSection {...sectionProps} />
          <WhyItWorksSection {...sectionProps} />
          <RelationshipFlowSection {...sectionProps} />
          <MisunderstandingSection {...sectionProps} />
          <HiddenHeartSection {...sectionProps} />
          <RepairGuideSection {...sectionProps} />
          <RealLifeSection {...sectionProps} />
          <NextChapterSection {...sectionProps} />
          <ClosingSection {...sectionProps} />
        </article>
      ) : (
        <section className="mx-auto max-w-4xl p-8 mt-12 bg-white rounded-3xl border border-[#e9dccf]">
          <h2 className="font-serif text-2xl text-[#2c3e35]">
            Anti-overfitting Check ({payload.variant})
          </h2>
          <p className="mt-4 text-[#5b4736]">
            This variant does not have the complete content. Please use variant=complete.
          </p>
        </section>
      )}

      {/* Global Debug Info */}
      {isComplete && debug && (
        <section className="mx-auto max-w-5xl py-12 px-6">
          <div className="bg-[#faf7f3] rounded-3xl p-8 border border-[#e9dccf]">
            <h2 className="font-serif text-xl text-[#2c3e35] mb-4">Debug: Global IA Info</h2>
            <div className="overflow-x-auto text-xs text-[#5b4736]">
              <table className="w-full min-w-[800px] border-collapse bg-white">
                <thead>
                  <tr className="bg-[#f3ece4]">
                    <th className="border p-2">Insight ID</th>
                    <th className="border p-2">Phenomenon</th>
                    <th className="border p-2">Primary Chapter</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.insightOwnership.map((row) => (
                    <tr key={row.insightId}>
                      <td className="border p-2">{row.insightId}</td>
                      <td className="border p-2">{t(row.phenomenon)}</td>
                      <td className="border p-2">{row.primaryChapter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
