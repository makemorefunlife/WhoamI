"use client";

import React, { useState } from "react";
import PsychMatchRadarChart from "@/components/relationship/reportLayout/PsychMatchRadarChart";
import type { RomanticV4PrototypePayload } from "@/lib/relationship/romantic/prototypeV4/types";
import { ChevronDown, ChevronUp, Bookmark, ArrowRight, Heart, RefreshCw, AlertCircle, Quote, HeartPulse, Check, MessageCircle } from "lucide-react";

export type SectionProps = {
  payload: RomanticV4PrototypePayload;
  debug: boolean;
  personA: string;
  personB: string;
  enSmoke: boolean;
  t: (text: string) => string;
};

const DebugPanel = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="mt-4 border-t border-dashed border-[#C9A66B]/40 pt-4 text-[11px] text-[#705e4d] font-mono bg-[#f4ebd9]/30 p-3 rounded-lg">
      <div className="font-semibold mb-2 flex items-center gap-1"><AlertCircle size={12} /> Debug Info</div>
      {children}
    </div>
  );
};

const cleanText = (text: string | undefined, t: (s: string) => string) => {
  if (!text) return "";
  let translated = t(text);
  // Remove Hanja
  translated = translated.replace(/[\u4e00-\u9fa5]/g, '');
  // Remove Saju english like "yang metal", "yin earth"
  translated = translated.replace(/[A-Za-z\s]+(metal|earth|wood|water|fire)/gi, '');
  // Remove stray ()
  translated = translated.replace(/\(\s*\)/g, '');
  // Fix spacing around quotes
  translated = translated.replace(/"\s+/g, '"').replace(/\s+"/g, '"');
  return translated.trim();
};

const isDevKey = (text: string) => {
  if (!text) return true;
  if (text.includes("b_to_a") || text.includes("a_to_b") || text.includes("_")) return true;
  return false;
};

// 1) 관계 정체성
export const HeroSection = ({ payload, personA, personB, t, debug }: SectionProps) => {
  const openingBlocks = payload.chapters.find((c) => c.chapter === "ch0_opening")?.blocks || [];
  const signature = openingBlocks.find((b) => b.blockId === "opening.signature");
  const paradox = openingBlocks.find((b) => b.blockId === "opening.paradox");

  return (
    <section className="relative w-full bg-[#F8FAFA] pt-16 pb-12 sm:pt-24 sm:pb-20 px-4 sm:px-6 flex flex-col items-center justify-center">
      <div className="mx-auto max-w-4xl text-center relative z-10 w-full">
        {signature && !isDevKey(signature.content) && (
          <div className="mb-6 px-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl text-[#083F45] font-serif font-extrabold leading-[1.2] sm:leading-[1.1] break-keep">
              {cleanText(signature.content, t)}
            </h1>
          </div>
        )}
        
        {paradox && !isDevKey(paradox.content) && (
          <div className="mx-auto max-w-2xl px-4 sm:px-8 mb-8 sm:mb-12 mt-6">
            <p className="text-base sm:text-xl font-medium leading-relaxed text-[#4A5568] break-keep">
              {cleanText(paradox.content, t)}
            </p>
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-[#E2E8F0] w-2/3 mx-auto flex items-center justify-center gap-4 text-[#083F45]">
          <span className="font-semibold text-lg">{personA}</span>
          <span className="text-[#C9A66B] font-light">×</span>
          <span className="font-semibold text-lg">{personB}</span>
        </div>

        {debug && (
          <DebugPanel>
            <p>Variant: {payload.variant}</p>
          </DebugPanel>
        )}
      </div>
    </section>
  );
};

// 1-1) 우리라는 관계 (Who We Are Together)
export const RelationshipIdentitySection = ({ payload, personA, personB, t }: SectionProps) => {
  const chapter1 = payload.chapters.find((c) => c.chapter === "ch1_who_we_are_together");
  const narrative = chapter1?.blocks.find((b) => b.blockId === "together.narrative");
  const signals = chapter1?.blocks.find((b) => b.blockId === "together.signals");
  const scene = chapter1?.blocks.find((b) => b.blockId === "together.scene");

  const hasNarrative = Boolean(narrative && !isDevKey(narrative.content));
  const hasScene = Boolean(scene && !isDevKey(scene.content));

  // signals is authored as "① 문장 ② 문장 ③ 문장" — split into short supporting
  // chips for display without changing the underlying payload content.
  const signalItems =
    signals && !isDevKey(signals.content)
      ? cleanText(signals.content, t)
          .split(/①|②|③/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  if (!hasNarrative && signalItems.length === 0 && !hasScene) return null;

  return (
    <section className="bg-white py-16 sm:py-20 px-4 sm:px-6 border-t border-[#E2E8F0]">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#083F45]">우리라는 관계</h2>
        </div>

        {hasNarrative && (
          <p className="text-base sm:text-xl font-medium leading-relaxed text-[#334155] text-center max-w-2xl mx-auto mb-10 break-keep">
            {cleanText(narrative!.content, t)}
          </p>
        )}

        {signalItems.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3 mb-10 max-w-3xl mx-auto">
            {signalItems.map((item, idx) => {
              const sepIdx = item.indexOf(":");
              const itemLabel = sepIdx > -1 ? item.slice(0, sepIdx).trim() : null;
              const itemValue = sepIdx > -1 ? item.slice(sepIdx + 1).trim() : item;
              return (
                <div key={idx} className="bg-[#F8FAFA] rounded-2xl p-4 border border-[#E2E8F0] text-center">
                  {itemLabel && (
                    <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1 break-keep">
                      {itemLabel}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-[#083F45] break-keep">{itemValue}</p>
                </div>
              );
            })}
          </div>
        )}

        {hasScene && (
          <div className="bg-[#F8FAFA] rounded-2xl p-6 sm:p-8 border border-[#E2E8F0] max-w-3xl mx-auto">
            <p className="text-[11px] font-bold text-[#C9A66B] uppercase tracking-wider mb-2">
              {personA} & {personB}의 일상 장면
            </p>
            <p className="text-[#334155] leading-relaxed break-keep">{cleanText(scene!.content, t)}</p>
          </div>
        )}
      </div>
    </section>
  );
};

// 2) 우리의 핵심 차이
export const CoreDifferencesSection = ({ payload, personA, personB, t, debug }: SectionProps) => {
  const [showAll, setShowAll] = useState(false);
  const coreInsights = payload.selectedAxisInsights.slice(0, 3);
  const otherInsights = payload.selectedAxisInsights.slice(3);

  return (
    <section className="bg-white py-16 sm:py-24 px-4 sm:px-6 border-t border-[#E2E8F0]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center max-w-2xl mx-auto px-4">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#083F45] mb-4">우리가 부딪히고 보완되는 곳</h2>
          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed break-keep">
            서로의 기질이 가장 크게 교차하는 핵심 차이를 확인합니다. 다름은 갈등의 원인이 되기도 하지만, 관계를 성장시키는 힘이기도 합니다.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start mb-16">
          <div className="w-full lg:w-1/3 flex-shrink-0 bg-[#F8FAFA] rounded-3xl p-6 border border-[#E2E8F0] flex flex-col justify-center min-h-[300px]">
            <PsychMatchRadarChart
              axisResults={payload.axisOverview}
              personALabel={personA}
              personBLabel={personB}
            />
          </div>

          <div className="w-full lg:w-2/3 space-y-6">
            {coreInsights.map((axis, idx) => (
              <div key={axis.axisKey} className="bg-white border-l-4 border-[#083F45] rounded-r-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1 block">
                      {cleanText(axis.axisLabel, t)}
                    </span>
                    <h3 className="font-bold text-xl text-[#083F45] mb-2 break-keep">
                      {cleanText(axis.relationshipEffect || axis.dailyManifestation, t)}
                    </h3>
                    <p className="text-sm text-[#4A5568] font-medium leading-relaxed break-keep">{cleanText(axis.whyItMatters, t)}</p>
                  </div>
                  <span className="shrink-0 ml-4 px-3 py-1 bg-[#F1F5F9] text-[#475569] text-xs font-bold rounded-full">
                    격차 {axis.gap}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-[#F8FAFA] rounded-xl border border-[#E2E8F0]">
                  <div>
                    <span className="text-[10px] font-bold text-[#64748B] uppercase mb-1 block">{personA}</span>
                    <span className="text-sm font-medium text-[#334155] leading-snug break-keep">{cleanText(axis.personAPattern, t)}</span>
                  </div>
                  <div className="pl-4 border-l border-[#E2E8F0]">
                    <span className="text-[10px] font-bold text-[#C9A66B] uppercase mb-1 block">{personB}</span>
                    <span className="text-sm font-medium text-[#334155] leading-snug break-keep">{cleanText(axis.personBPattern, t)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {otherInsights.length > 0 && (
          <div className="text-center">
            <button 
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-2 text-sm font-bold text-[#0E5A63] hover:text-[#083F45] transition-colors py-2 px-6 rounded-full bg-[#F1F5F9]"
            >
              {showAll ? '나머지 세부 차이 접기' : '나머지 세부 차이 확인하기'}
              {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {showAll && (
              <div className="grid sm:grid-cols-2 gap-4 mt-8 animate-in fade-in duration-300 text-left">
                {otherInsights.map((axis) => (
                  <div key={axis.axisKey} className="bg-white border border-[#E2E8F0] p-4 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">{cleanText(axis.axisLabel, t)}</span>
                        <span className="font-bold text-[#083F45] text-sm break-keep">{cleanText(axis.relationshipEffect || axis.dailyManifestation, t)}</span>
                      </div>
                      <span className="text-xs text-[#64748B] font-bold shrink-0 ml-2">격차 {axis.gap}</span>
                    </div>
                    <p className="text-[13px] text-[#4A5568] leading-relaxed break-keep mt-2">{cleanText(axis.whyItMatters, t)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

// 3) 너와 나
export const YouAndMeSection = ({ payload, personA, personB, t, debug }: SectionProps) => {
  const chapter2 = payload.chapters.find((c) => c.chapter === "ch2_you_and_me");
  const profileA = chapter2?.blocks.find((b) => b.blockId === "profile.a");
  const profileB = chapter2?.blocks.find((b) => b.blockId === "profile.b");

  return (
    <section className="bg-[#083F45] py-16 sm:py-24 px-4 sm:px-6 text-white">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-12 text-center text-white">우리가 세상을 대하는 방식</h2>
        
        {/* Comparison Table Redesign */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden text-[#334155]">
          {/* Header */}
          <div className="grid grid-cols-3 border-b-2 border-[#083F45]">
            <div className="p-3 sm:p-5 bg-[#F8FAFA] flex items-center">
              <span className="text-xs sm:text-sm font-bold text-[#64748B] uppercase">관계에서 비교하는 부분</span>
            </div>
            <div className="p-3 sm:p-5 bg-white border-l border-[#E2E8F0] text-center">
              <span className="font-serif text-lg sm:text-2xl font-bold text-[#083F45]">{personA}</span>
            </div>
            <div className="p-3 sm:p-5 bg-white border-l border-[#E2E8F0] text-center">
              <span className="font-serif text-lg sm:text-2xl font-bold text-[#C9A66B]">{personB}</span>
            </div>
          </div>
          
          {/* Rows */}
          {payload.comparisonTable.map((row, idx) => {
            // Remove names from the personA/personB strings to prevent duplication
            const cleanA = cleanText(row.personA, t).replace(new RegExp(`^${personA}은\\s*|^${personA}는\\s*|^${personA}:\\s*`), '');
            const cleanB = cleanText(row.personB, t).replace(new RegExp(`^${personB}은\\s*|^${personB}는\\s*|^${personB}:\\s*`), '');

            return (
              <div key={row.rowId} className={`grid grid-cols-3 border-b border-[#E2E8F0] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}`}>
                {/* Context Column */}
                <div className="p-3 sm:p-5 border-r border-[#E2E8F0] flex flex-col justify-center">
                  <p className="text-[11px] sm:text-sm font-bold text-[#0E5A63] mb-1 break-keep">{cleanText(row.relationshipQuestion, t)}</p>
                  <p className="hidden sm:block text-xs text-[#64748B] font-medium leading-relaxed break-keep">{cleanText(row.understandingPoint || row.relationshipManifestation, t)}</p>
                </div>
                
                {/* Person A Column */}
                <div className="p-3 sm:p-5 border-r border-[#E2E8F0] flex flex-col justify-center text-center">
                  <p className="text-xs sm:text-sm font-medium leading-relaxed break-keep">{cleanA}</p>
                </div>
                
                {/* Person B Column */}
                <div className="p-3 sm:p-5 flex flex-col justify-center text-center">
                  <p className="text-xs sm:text-sm font-medium leading-relaxed break-keep">{cleanB}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Profiles */}
        <div className="mt-16 grid md:grid-cols-2 gap-6">
          {profileA && !isDevKey(profileA.content) && (
            <div className="bg-white/10 p-6 sm:p-8 rounded-2xl border border-white/20">
              <p className="text-sm text-[#C9A66B] font-bold mb-4">{personA}의 목소리</p>
              <p className="leading-relaxed font-medium text-white/90 break-keep">"{cleanText(profileA.content, t)}"</p>
            </div>
          )}
          {profileB && !isDevKey(profileB.content) && (
            <div className="bg-white/10 p-6 sm:p-8 rounded-2xl border border-white/20">
              <p className="text-sm text-[#C9A66B] font-bold mb-4">{personB}의 목소리</p>
              <p className="leading-relaxed font-medium text-white/90 break-keep">"{cleanText(profileB.content, t)}"</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// 4) 우리가 잘 맞는 이유
export const WhyItWorksSection = ({ payload, personA, personB, t, debug }: SectionProps) => {
  const chapter3 = payload.chapters.find((c) => c.chapter === "ch3_why_this_works");
  if (!chapter3) return null;
  const aToB = chapter3.blocks.find((b) => b.blockId === "why.a_to_b");
  const bToA = chapter3.blocks.find((b) => b.blockId === "why.b_to_a");
  const together = chapter3.blocks.find((b) => b.blockId === "why.together");

  return (
    <section className="bg-[#F8FAFA] py-16 sm:py-20 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#083F45] mb-8 sm:mb-12 text-center">함께할 때 더 강해지는 이유</h2>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-8">
          {aToB && !isDevKey(aToB.content) && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-[#E2E8F0]">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
                <span className="font-bold text-[#0E5A63]">{personA}</span>
                <ArrowRight size={16} className="text-[#C9A66B]" />
                <span className="font-bold text-[#083F45]">{personB}</span>
              </div>
              <p className="text-[#4A5568] font-medium leading-relaxed break-keep text-center sm:text-left">{cleanText(aToB.content, t)}</p>
            </div>
          )}

          {bToA && !isDevKey(bToA.content) && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-[#E2E8F0]">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
                <span className="font-bold text-[#C9A66B]">{personB}</span>
                <ArrowRight size={16} className="text-[#0E5A63]" />
                <span className="font-bold text-[#083F45]">{personA}</span>
              </div>
              <p className="text-[#4A5568] font-medium leading-relaxed break-keep text-center sm:text-left">{cleanText(bToA.content, t)}</p>
            </div>
          )}
        </div>

        {together && !isDevKey(together.content) && (
          <div className="bg-[#C9A66B]/10 p-6 sm:p-10 rounded-2xl border border-[#C9A66B]/20 text-center max-w-3xl mx-auto">
            <Heart className="mx-auto text-[#C9A66B] mb-4" size={24} fill="currentColor" />
            <h3 className="font-bold text-[#083F45] mb-4 text-base sm:text-lg">우리가 함께 만드는 힘</h3>
            <p className="text-[#4A5568] font-medium leading-relaxed text-base sm:text-lg break-keep">{cleanText(together.content, t)}</p>
          </div>
        )}
      </div>
    </section>
  );
};

// 5) 관계의 반복 흐름
export const RelationshipFlowSection = ({ payload, t, debug }: SectionProps) => {
  const flow = payload.relationshipFlow;
  if (!flow || !flow.steps.length) return null;
  const chapter4 = payload.chapters.find((c) => c.chapter === "ch4_relationship_flow");
  const summary = chapter4?.blocks.find((b) => b.blockId === "flow.summary");

  return (
    <section className="bg-white py-16 sm:py-20 px-6 border-y border-[#E2E8F0]">
      <div className="mx-auto max-w-3xl">
        <h2 className="font-serif text-3xl font-bold text-[#083F45] mb-6 text-center">관계의 반복 흐름</h2>
        
        {summary && !isDevKey(summary.content) && (
          <p className="text-center text-[#64748B] font-medium mb-12 leading-relaxed break-keep">
            {cleanText(summary.content, t)}
          </p>
        )}

        <div className="space-y-6 relative border-l-2 border-[#E2E8F0] ml-4 md:ml-8 pl-8 md:pl-12">
          {flow.steps.map((step, idx) => (
            <div key={idx} className="relative">
              <div className="absolute -left-[43px] md:-left-[59px] w-6 h-6 md:w-8 md:h-8 bg-white border-2 border-[#0E5A63] rounded-full flex items-center justify-center top-1">
                <span className="text-[10px] md:text-xs font-bold text-[#0E5A63]">{idx + 1}</span>
              </div>
              <p className="text-[#334155] font-medium leading-relaxed pt-1 text-sm sm:text-base md:text-lg break-keep">{cleanText(step, t)}</p>
            </div>
          ))}
          
          <div className="relative pt-8">
            <div className="absolute -left-[45px] md:-left-[61px] w-7 h-7 md:w-9 md:h-9 bg-[#C9A66B] rounded-full flex items-center justify-center text-white top-8">
              <RefreshCw size={14} />
            </div>
            <div className="bg-[#F8FAFA] border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
              <span className="text-xs font-bold text-[#C9A66B] uppercase tracking-widest mb-2 block">전환 지점</span>
              <p className="font-bold text-[#083F45] leading-relaxed text-sm sm:text-base md:text-lg break-keep">{cleanText(flow.pivotPoint, t)}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// 6) 우리가 서로를 오해할 때
export const MisunderstandingSection = ({ payload, personA, personB, t, debug }: SectionProps) => {
  if (!payload.conflicts.length) return null;

  return (
    <section className="bg-[#F8FAFA] py-16 sm:py-20 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-serif text-3xl font-bold text-[#083F45] mb-4 text-center">오해 번역기</h2>
        <p className="text-center text-[#64748B] font-medium mb-12 max-w-2xl mx-auto break-keep">
          겉으로 드러난 말과 행동 속에는, 서로가 진짜 원했던 <strong>마음</strong>이 숨어 있습니다.
        </p>

        <div className="space-y-8">
          {payload.conflicts.map((conflict, idx) => (
            <div key={conflict.patternId} className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
              <h3 className="font-bold text-lg text-[#083F45] mb-6 border-b border-[#E2E8F0] pb-4">
                {idx + 1}. {cleanText(conflict.trigger, t)}
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-[#F1F5F9] p-5 rounded-xl">
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-2">내가 했던 말과 행동</span>
                  <p className="text-[#334155] font-medium leading-relaxed break-keep">{cleanText(conflict.whatIMeant, t)}</p>
                </div>
                <div className="bg-[#F1F5F9] p-5 rounded-xl">
                  <span className="text-[11px] font-bold text-[#0E5A63] uppercase tracking-wider block mb-2">상대에게 들린 의미</span>
                  <p className="text-[#334155] font-medium leading-relaxed break-keep">{cleanText(conflict.whatYouHeard, t)}</p>
                </div>
              </div>
              
              <div className="bg-[#FFF8F1] border border-[#FFEDD5] p-5 rounded-xl mb-6">
                <span className="text-[11px] font-bold text-[#C9A66B] uppercase tracking-wider block mb-2">사실 진짜 필요했던 것</span>
                <p className="text-[#5B4736] font-bold text-base leading-relaxed break-keep">{cleanText(conflict.hiddenNeed, t)}</p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#0E5A63]/5 p-5 rounded-xl border border-[#0E5A63]/10">
                <div className="flex-1">
                  <span className="text-[11px] font-bold text-[#0E5A63] uppercase tracking-wider block mb-2">이렇게 바꿔 말해볼 수 있어요</span>
                  <p className="font-serif italic text-lg font-bold text-[#083F45] break-keep">"{cleanText(conflict.betterWords, t)}"</p>
                </div>
                <div className="shrink-0 bg-white px-3 py-1.5 rounded border border-[#E2E8F0] text-xs font-semibold text-[#4A5568]">
                  타이밍: {cleanText(conflict.repairTiming, t)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 7) 숨은 마음
export const HiddenHeartSection = ({ payload, personA, personB, t, debug }: SectionProps) => {
  const hidden = payload.hiddenHeart;
  if (!hidden.personA && !hidden.personB) return null;

  return (
    <section className="bg-[#2A1717] text-white py-24 sm:py-32 px-4 sm:px-6 relative text-center">
      <div className="mx-auto max-w-4xl">
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F8FAFA] mb-16">가장 깊은 곳, 숨은 마음</h2>

        <div className="space-y-20">
          {hidden.personA && (
            <div>
              <p className="text-lg sm:text-xl font-medium leading-loose text-white/80 mb-8 max-w-2xl mx-auto break-keep">
                {cleanText(hidden.personA, t)}
              </p>
              <p className="font-serif text-xl sm:text-2xl font-bold text-[#E5B5B5] italic">
                "{cleanText(hidden.personAOneLineForPartner, t)}"
              </p>
              <p className="text-xs text-white/30 uppercase tracking-widest mt-4">- {personA} -</p>
            </div>
          )}

          {hidden.personB && (
            <div>
              <p className="text-lg sm:text-xl font-medium leading-loose text-white/80 mb-8 max-w-2xl mx-auto break-keep">
                {cleanText(hidden.personB, t)}
              </p>
              <p className="font-serif text-xl sm:text-2xl font-bold text-[#E5B5B5] italic">
                "{cleanText(hidden.personBOneLineForPartner, t)}"
              </p>
              <p className="text-xs text-white/30 uppercase tracking-widest mt-4">- {personB} -</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// 8) 다시 가까워지는 방법
export const RepairGuideSection = ({ payload, personA, personB, t, debug }: SectionProps) => {
  const guide = payload.repairGuide;
  if (!guide.sequence.length) return null;

  return (
    <section className="bg-white py-16 sm:py-20 px-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-serif text-3xl font-bold text-[#083F45] mb-12 text-center">다시 가까워지는 방법</h2>

        <div className="mb-16">
          <h3 className="font-bold text-lg text-[#0E5A63] mb-6 flex items-center justify-center gap-2">
            다시 가까워지기 위한 다섯 걸음
          </h3>
          <div className="grid sm:grid-cols-5 gap-4">
            {guide.sequence.map((step, idx) => (
              <div key={idx} className="bg-[#F8FAFA] p-4 rounded-xl text-center border border-[#E2E8F0]">
                <div className="font-serif text-3xl font-black text-[#E2E8F0] mb-2">{idx + 1}</div>
                <p className="text-sm font-bold text-[#334155] leading-relaxed break-keep">{cleanText(step, t)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm">
            <h4 className="font-bold text-[#0E5A63] mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#0E5A63]/10 text-[#0E5A63] flex items-center justify-center font-serif text-sm">{personA[0]}</span>
              {personA}에게 도움이 되는 것
            </h4>
            <ul className="space-y-4">
              {guide.sideBySide.helpsA.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Check size={18} className="text-[#C9A66B] shrink-0 mt-0.5" strokeWidth={3} />
                  <span className="text-[#4A5568] font-medium leading-relaxed break-keep">{cleanText(item, t)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm">
            <h4 className="font-bold text-[#C9A66B] mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#C9A66B]/10 text-[#C9A66B] flex items-center justify-center font-serif text-sm">{personB[0]}</span>
              {personB}에게 도움이 되는 것
            </h4>
            <ul className="space-y-4">
              {guide.sideBySide.helpsB.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Check size={18} className="text-[#0E5A63] shrink-0 mt-0.5" strokeWidth={3} />
                  <span className="text-[#4A5568] font-medium leading-relaxed break-keep">{cleanText(item, t)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-[#083F45] text-white rounded-2xl p-6 sm:p-8 text-center max-w-3xl mx-auto shadow-md">
          <h4 className="font-bold text-[#C9A66B] mb-6 flex items-center justify-center gap-2">
            <Heart size={20} className="text-[#C9A66B]" fill="currentColor" /> 공동의 약속
          </h4>
          <ul className="space-y-4 text-left inline-block">
            {guide.sideBySide.together.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-white/90 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A66B] shrink-0 mt-2"></span>
                <span className="leading-relaxed break-keep">{cleanText(item, t)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

// 9) 현실 속 사랑
export const RealLifeSection = ({ payload, personA, personB, t, debug }: SectionProps) => {
  if (!payload.realLifeScenes.length) return null;

  return (
    <section className="bg-[#F8FAFA] py-16 sm:py-20 px-6 border-y border-[#E2E8F0]">
      <div className="mx-auto max-w-4xl">
        <h2 className="font-serif text-3xl font-bold text-[#083F45] mb-10 text-center">현실에서 마주하는 장면들</h2>

        <div className="space-y-4">
          {payload.realLifeScenes.map((scene) => (
            <details key={scene.sceneId} className="group bg-white rounded-2xl border border-[#E2E8F0] shadow-sm cursor-pointer [&_summary::-webkit-details-marker]:hidden">
              <summary className="w-full flex justify-between items-center p-6 outline-none">
                <h3 className="font-bold text-lg text-[#334155] group-open:text-[#0E5A63] transition-colors break-keep">
                  {cleanText(scene.sceneTitle, t)}
                </h3>
                <div className="p-2 rounded-full bg-gray-50 text-gray-400 group-open:bg-[#0E5A63] group-open:text-white transition-colors">
                  <ChevronDown size={20} className="group-open:rotate-180 transition-transform" />
                </div>
              </summary>
              
              <div className="px-6 pb-8 border-t border-[#E2E8F0] pt-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">무엇이 자주 일어나는가</p>
                      <p className="text-[#334155] font-medium leading-relaxed bg-[#F1F5F9] p-4 rounded-xl break-keep">{cleanText(scene.whatHappens, t)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">왜 우리에게 생기는가</p>
                      <p className="text-[#4A5568] font-medium leading-relaxed break-keep">{cleanText(scene.whyForThisPair, t)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="border border-[#E2E8F0] p-4 rounded-xl bg-white">
                      <p className="text-xs font-bold text-[#0E5A63] mb-1">{personA}가 할 수 있는 것</p>
                      <p className="text-sm text-[#4A5568] font-medium leading-relaxed break-keep">{cleanText(scene.whatACanDo, t)}</p>
                    </div>
                    <div className="border border-[#E2E8F0] p-4 rounded-xl bg-white">
                      <p className="text-xs font-bold text-[#C9A66B] mb-1">{personB}가 할 수 있는 것</p>
                      <p className="text-sm text-[#4A5568] font-medium leading-relaxed break-keep">{cleanText(scene.whatBCanDo, t)}</p>
                    </div>
                    <div className="bg-[#083F45] p-4 rounded-xl text-white">
                      <p className="text-xs font-bold text-[#C9A66B] mb-1 flex items-center gap-1">
                        공동 합의
                      </p>
                      <p className="text-sm text-white/90 font-medium leading-relaxed break-keep">{cleanText(scene.sharedAgreement, t)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

// 10) 우리의 다음 장
export const NextChapterSection = ({ payload, t, debug }: SectionProps) => {
  if (!payload.nextChapter.length) return null;

  return (
    <section className="bg-white py-16 sm:py-20 px-6">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-serif text-3xl font-bold text-[#083F45] mb-10">우리의 다음 장</h2>
        
        <div className="space-y-4 text-left">
          {payload.nextChapter.map((item, idx) => (
            <div key={idx} className="bg-[#F8FAFA] rounded-2xl p-6 border border-[#E2E8F0]">
              <p className="text-[#334155] leading-relaxed font-bold break-keep">{cleanText(item, t)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 11) 마지막 기억 문장
export const ClosingSection = ({ payload, personA, personB, t, debug }: SectionProps) => {
  const closing = payload.closing;
  if (!closing.concludingStatement) return null;

  return (
    <section className="bg-[#F8FAFA] py-16 sm:py-24 px-4 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div id="takeaway-ticket" className="bg-gradient-to-br from-[#083F45] to-[#14737A] text-white rounded-[2rem] p-8 sm:p-12 shadow-xl relative overflow-hidden mb-12">
          
          <div className="relative z-10 text-center mb-12">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#C9A66B] leading-relaxed break-keep">
              "{cleanText(closing.concludingStatement, t)}"
            </h2>
          </div>

          <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/20">
            <p className="text-[#C9A66B] text-xs font-bold uppercase tracking-widest mb-6 text-center border-b border-white/10 pb-4">기억할 문장</p>
            <div className="space-y-6 mb-8">
              <div>
                <p className="text-white/50 text-[10px] font-bold uppercase mb-1">{personA}</p>
                <p className="font-medium text-white/90 leading-relaxed text-sm sm:text-base break-keep">{cleanText(closing.rememberA, t).replace(`${personA}이 기억할 문장: `, '').replace(`${personA}가 기억할 문장: `, '')}</p>
              </div>
              <div>
                <p className="text-white/50 text-[10px] font-bold uppercase mb-1">{personB}</p>
                <p className="font-medium text-white/90 leading-relaxed text-sm sm:text-base break-keep">{cleanText(closing.rememberB, t).replace(`${personB}이 기억할 문장: `, '').replace(`${personB}가 기억할 문장: `, '')}</p>
              </div>
            </div>
            
            <p className="text-[#C9A66B] text-xs font-bold uppercase tracking-widest mb-4 text-center border-t border-white/10 pt-6">작은 약속</p>
            <ul className="space-y-3">
              {closing.shareLines.map((line, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm sm:text-base">
                  <Heart size={16} className="text-[#C9A66B] shrink-0 mt-0.5" fill="currentColor" />
                  <span className="text-white/90 font-medium leading-relaxed break-keep">{cleanText(line, t)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[#64748B] text-xs font-bold uppercase tracking-widest mb-4">마지막 질문</p>
          <p className="font-serif text-xl sm:text-2xl text-[#083F45] font-bold italic break-keep px-4">
            "{cleanText(closing.reflectionQuestion, t)}"
          </p>
        </div>
      </div>
    </section>
  );
};
