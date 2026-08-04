"use client";

import { useEffect, useState } from "react";
import type { RomanticV4PrototypePayload } from "@/lib/relationship/romantic/prototypeV4/types";
import { CanonicalReportView } from "./CanonicalReportView";

type Props = {
  payload: RomanticV4PrototypePayload;
  debug?: boolean;
};

export default function PrototypeClient({ payload, debug = false }: Props) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const isComplete = payload.variant === "complete";

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

  return (
    <main data-v4-prototype-root className="w-full bg-rel-bg min-h-screen text-rel-ink relative">

      {/* Sticky Progress Bar */}
      {isComplete && payload.canonicalReport && (
        <div className="fixed top-0 left-0 w-full z-50 pointer-events-none">
          <div className="h-1.5 w-full bg-rel-line">
            <div
              className="h-full bg-rel-deep transition-all duration-150 ease-out"
              style={{ width: `${scrollProgress * 100}%` }}
            />
          </div>
          <div className="absolute top-4 right-4 sm:right-8 bg-rel-surface/80 backdrop-blur-md border border-rel-line shadow-sm px-4 py-2 rounded-full font-rel-sans text-[11px] font-semibold text-rel-deep tracking-widest uppercase pointer-events-auto">
            {Math.round(scrollProgress * 100)}% Reading
          </div>
        </div>
      )}

      {isComplete && payload.canonicalReport ? (
        <article className="pb-24">
          <CanonicalReportView report={payload.canonicalReport} payload={payload} debug={debug} />
        </article>
      ) : isComplete ? (
        // canonicalReport is built for every PrototypeLocale ("ko-KR" | "en-US"),
        // so this is not a normal state — canonicalReport.sections is the single
        // ViewModel source for this route; there is no fixture-shaped fallback
        // (chapters/hiddenHeart/repairGuide/...) to render instead, since those
        // fields are explicit empty states in real mode, not renderable content.
        <section className="mx-auto max-w-4xl p-8 mt-12 bg-white rounded-3xl border border-[#e9dccf]">
          <h2 className="font-serif text-2xl text-[#2c3e35]">Canonical report unavailable</h2>
          <p className="mt-4 text-[#5b4736]">
            This payload has no canonicalReport for locale &quot;{payload.locale}&quot;.
          </p>
        </section>
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

      {/* Global Debug Info — insightOwnership is a dev_fixture-only audit trail
          (empty in real mode; canonicalReport.validation/hiddenChapters is the
          real-mode equivalent, already shown inside CanonicalReportView). */}
      {isComplete && debug && payload.insightOwnership.length > 0 && (
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
                      <td className="border p-2">{row.phenomenon}</td>
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
