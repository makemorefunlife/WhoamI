"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Radar, Satellite, ScanSearch, Orbit } from "lucide-react";

const CARD_META = [
  {
    title: "외면",
    subtitle: "겉으로 보이는 나",
    icon: Satellite,
    heroBg: "from-[#161f30]/92 via-[#26324a]/35 to-[#0d1522]",
    glow: "bg-[#d6b46a]/12",
    borderAccent: "border-[rgba(255,255,255,0.12)]",
    titleAccent: "text-[#f1ddb1]",
    iconTint: "text-[#d8bc7e]",
  },
  {
    title: "내면",
    subtitle: "나도 모르는 내마음",
    icon: ScanSearch,
    heroBg: "from-[#18192c]/92 via-[#2a2a46]/34 to-[#0e1220]",
    glow: "bg-[#9ba2d9]/14",
    borderAccent: "border-[rgba(255,255,255,0.12)]",
    titleAccent: "text-[#e2d9bb]",
    iconTint: "text-[#b7bddf]",
  },
  {
    title: "관계에서의 나",
    subtitle: "",
    icon: Orbit,
    heroBg: "from-[#151d2d]/92 via-[#2a3247]/34 to-[#0b1424]",
    glow: "bg-[#b9a173]/12",
    borderAccent: "border-[rgba(255,255,255,0.12)]",
    titleAccent: "text-[#eedab0]",
    iconTint: "text-[#d2ba86]",
  },
  {
    title: "실천가능한 조언",
    subtitle: "",
    icon: Radar,
    heroBg: "from-[#262016]/90 via-[#3a2f1f]/32 to-[#0f1218]",
    glow: "bg-[#d6b46a]/14",
    borderAccent: "border-[rgba(255,255,255,0.12)]",
    titleAccent: "text-[#f1ddb0]",
    iconTint: "text-[#dfc891]",
  },
] as const;

const MAX_PARAGRAPHS = 3;
/** 이 길이를 넘는 한 덩어리는 쉼표·공백 경계에서 추가로 나눔 */
const SOFT_WRAP = 200;

/** n개 덩어리를 최대 max개로 합치기(앞에서부터 균등 분배) */
function mergeIntoChunks(parts: string[], max: number, joiner: string): string[] {
  const p = parts.map((x) => x.trim()).filter(Boolean);
  if (p.length <= max) return p;
  const n = p.length;
  const out: string[] = [];
  let idx = 0;
  for (let k = 0; k < max; k++) {
    const rem = n - idx;
    const remSlots = max - k;
    const take = Math.ceil(rem / remSlots);
    out.push(p.slice(idx, idx + take).join(joiner));
    idx += take;
  }
  return out.filter(Boolean);
}

/**
 * 같은 카드 안에서 가독성을 위해 2~3문단. 문장·줄바꿈·쉼표 경계 우선.
 * 문장 내용·어투는 유지하고 줄바꿈만 조정한다.
 */
function splitCardBodyIntoParagraphs(raw: string): string[] {
  const t = raw.replace(/\s+/g, " ").trim();
  if (!t) return [];

  const byNewline = t.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  if (byNewline.length >= 2) {
    return mergeIntoChunks(byNewline, MAX_PARAGRAPHS, " ");
  }

  const sentences = t
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) return [t];
  if (sentences.length === 1) {
    return splitLongClause(sentences[0]!);
  }
  if (sentences.length === 2 || sentences.length === 3) {
    return sentences.slice(0, MAX_PARAGRAPHS);
  }
  return mergeIntoChunks(sentences, MAX_PARAGRAPHS, " ");
}

function splitLongClause(s: string): string[] {
  if (s.length <= SOFT_WRAP) return [s];
  const byComma = s.split(/(?<=[,，])\s*/).map((x) => x.trim()).filter(Boolean);
  if (byComma.length >= 2) {
    return mergeIntoChunks(byComma, MAX_PARAGRAPHS, "，");
  }
  const mid = Math.floor(s.length / 2);
  const cut = s.lastIndexOf(" ", mid + 25);
  if (cut > 24 && cut < s.length - 24) {
    return [s.slice(0, cut).trim(), s.slice(cut).trim()];
  }
  return [s];
}

/** 배경 별·먼지 */
function StarField() {
  return (
    <g opacity={0.55}>
      <circle cx="42" cy="28" r="1.1" fill="#fff" />
      <circle cx="258" cy="36" r="0.9" fill="#c9d4ff" />
      <circle cx="78" cy="102" r="0.8" fill="#fff" />
      <circle cx="268" cy="88" r="1" fill="#ffe8b8" />
      <circle cx="24" cy="72" r="0.7" fill="#a8b8ff" />
      <circle cx="190" cy="18" r="0.65" fill="#fff" />
      <path
        d="M112 22 L113 25 L116 25 L113.8 27 L114.6 30 L112 28.2 L109.4 30 L110.2 27 L108 25 L111 25 Z"
        fill="#fff"
        opacity={0.45}
      />
      <ellipse cx="230" cy="104" rx="3" ry="1.2" fill="#8899cc" opacity={0.35} transform="rotate(-25 230 104)" />
      <ellipse cx="58" cy="96" rx="2.5" ry="1" fill="#7788aa" opacity={0.3} transform="rotate(18 58 96)" />
    </g>
  );
}

/** 카드별 일러스트: flat vector + soft minimal */
function CardHeroArt({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg
        className="h-[138px] w-full max-w-[320px]"
        viewBox="0 0 320 132"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <StarField />
        <ellipse cx="92" cy="74" rx="68" ry="18" stroke="rgba(223,201,144,0.4)" strokeWidth="1" fill="none" />
        <circle cx="82" cy="76" r="30" fill="rgba(139,160,196,0.3)" stroke="rgba(255,255,255,0.18)" />
        <path d="M68 74h28M74 84h18" stroke="rgba(230,238,252,0.45)" strokeWidth="1.2" strokeLinecap="round" />
        <g transform="translate(190,48)">
          <rect x="-7" y="-5" width="14" height="10" rx="2" fill="rgba(218,228,244,0.55)" />
          <rect x="-23" y="-4" width="12" height="8" rx="1.5" fill="rgba(168,188,216,0.5)" />
          <rect x="11" y="-4" width="12" height="8" rx="1.5" fill="rgba(168,188,216,0.5)" />
          <line x1="0" y1="-5" x2="0" y2="-11" stroke="rgba(255,226,168,0.72)" strokeLinecap="round" />
        </g>
        <path d="M182 54 Q140 60 108 72" stroke="rgba(180,206,238,0.35)" strokeWidth="1" strokeDasharray="3 5" fill="none" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg
        className="h-[138px] w-full max-w-[320px]"
        viewBox="0 0 320 132"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <StarField />
        <path d="M0 132V92c45-14 85-12 124-6 45 7 95 5 196-9v55H0Z" fill="rgba(78,70,108,0.35)" />
        <ellipse cx="172" cy="92" rx="46" ry="12" fill="rgba(40,30,60,0.45)" stroke="rgba(180,150,220,0.22)" />
        <path d="M166 92l5-8 5 8-5 6-5-6Z" fill="rgba(230,205,140,0.72)" />
        <g transform="translate(106,84)">
          <rect x="0" y="6" width="26" height="8" rx="2" fill="rgba(176,182,194,0.5)" />
          <circle cx="6" cy="16" r="3" fill="rgba(104,108,118,0.72)" />
          <circle cx="20" cy="16" r="3" fill="rgba(104,108,118,0.72)" />
          <path d="M26 10h24l6 5" stroke="rgba(194,202,216,0.65)" strokeWidth="1.1" strokeLinecap="round" />
        </g>
      </svg>
    );
  }
  if (index === 2) {
    return (
      <svg
        className="h-[138px] w-full max-w-[320px]"
        viewBox="0 0 320 132"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <StarField />
        <circle cx="92" cy="76" r="27" fill="rgba(121,160,213,0.42)" stroke="rgba(255,255,255,0.16)" />
        <g transform="translate(234, 74)">
          <ellipse cx="0" cy="0" rx="38" ry="10" stroke="rgba(226,199,146,0.5)" strokeWidth="1" transform="rotate(-12)" fill="none" />
          <circle r="24" fill="rgba(194,163,112,0.35)" stroke="rgba(255,255,255,0.12)" />
        </g>
        <path d="M118 74c36-32 70-30 96-10" stroke="rgba(233,223,197,0.56)" strokeWidth="1.2" strokeDasharray="5 6" strokeLinecap="round" fill="none" />
        <circle cx="164" cy="56" r="2" fill="rgba(255,255,255,0.42)" />
      </svg>
    );
  }
  return (
    <svg
      className="h-[138px] w-full max-w-[320px]"
      viewBox="0 0 320 132"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <StarField />
      <circle cx="160" cy="72" r="30" fill="rgba(120,146,184,0.35)" stroke="rgba(214,180,106,0.35)" />
      <g transform="translate(44,44)">
        <rect x="0" y="0" width="58" height="38" rx="8" fill="rgba(18,24,38,0.46)" stroke="rgba(214,180,106,0.32)" />
        <path d="M8 28h42M10 24l10-8 8 4 11-10 8 5" stroke="rgba(166,200,236,0.72)" strokeWidth="1.2" strokeLinecap="round" />
      </g>
      <g transform="translate(220,42)">
        <rect x="0" y="0" width="56" height="40" rx="8" fill="rgba(18,24,38,0.46)" stroke="rgba(214,180,106,0.32)" />
        <circle cx="16" cy="20" r="8" stroke="rgba(245,229,190,0.52)" />
        <path d="M16 12a8 8 0 0 1 6.5 10.8L16 20Z" fill="rgba(214,180,106,0.52)" />
        <path d="M32 12h14M32 18h12M32 24h10" stroke="rgba(226,235,248,0.55)" strokeWidth="1.1" strokeLinecap="round" />
      </g>
      <g transform="translate(160,112)">
        <path d="M-18 0h36" stroke="rgba(214,180,106,0.65)" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M0 0V-14" stroke="rgba(214,180,106,0.65)" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="0" cy="-17" r="3.3" fill="rgba(214,180,106,0.52)" />
      </g>
      <path d="M102 64c18-8 33-7 48 0M220 64c-18-8-33-7-48 0" stroke="rgba(214,180,106,0.4)" strokeWidth="1" strokeDasharray="3 5" fill="none" />
    </svg>
  );
}

export default function FreeAnalysisCardDeck({
  paragraphs,
}: {
  paragraphs: string[];
}) {
  const splitBodies = useMemo(
    () =>
      [0, 1, 2, 3].map((i) =>
        splitCardBodyIntoParagraphs((paragraphs[i] ?? "").trim()),
      ),
    [paragraphs],
  );

  return (
    <div className="space-y-6 sm:space-y-7">
      {CARD_META.map((meta, i) => {
        const { title, subtitle, icon: Icon, heroBg, glow, borderAccent, titleAccent, iconTint } = meta;
        const body = (paragraphs[i] ?? "").trim();
        const bodyParts = splitBodies[i] ?? [];
        return (
          <motion.article
            key={title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.008 }}
            whileTap={{ scale: 0.997 }}
            className={[
              "group relative overflow-hidden rounded-[22px] border backdrop-blur-md",
              "bg-[rgba(12,17,28,0.66)] shadow-[0_14px_36px_rgba(0,0,0,0.28)]",
              borderAccent,
            ].join(" ")}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-[#d6b46a]/[0.04]" />

            {/* 카드 최상단: 제목(굵게) + 소제목(일반) — 테두리 박스 */}
            <div className="relative z-[2] px-4 pt-4 sm:px-5 sm:pt-5">
              <div
                className={[
                  "mx-auto max-w-lg rounded-2xl border bg-white/[0.035] px-4 py-3 text-center backdrop-blur-sm",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
                  borderAccent,
                ].join(" ")}
              >
                <h3 className="inline-flex items-center gap-2 text-[15px] leading-snug sm:text-base">
                  <span
                    className={[
                      "inline-flex h-6 w-6 items-center justify-center rounded-lg border border-white/[0.14] bg-white/[0.03]",
                      iconTint,
                    ].join(" ")}
                    aria-hidden
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.85} />
                  </span>
                  <span className={`font-semibold ${titleAccent}`}>{title}</span>
                  <span className="font-normal text-[var(--space-text-muted)]">
                    {" "}
                    · {subtitle}
                  </span>
                </h3>
              </div>
            </div>

            {/* 히어로 비주얼 */}
            <div
              className={[
                "relative flex min-h-[178px] flex-col items-center justify-center overflow-hidden bg-gradient-to-b px-4 pt-2 pb-2 sm:min-h-[196px]",
                heroBg,
              ].join(" ")}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.35]"
                style={{
                  backgroundImage: [
                    "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.12) 0 0.8px, transparent 1.2px)",
                    "radial-gradient(circle at 80% 20%, rgba(139,124,255,0.2) 0 0.8px, transparent 1.5px)",
                    "radial-gradient(circle at 55% 70%, rgba(103,183,255,0.12) 0 0.7px, transparent 1.2px)",
                  ].join(" ,"),
                }}
              />
              <div
                className={[
                  "pointer-events-none absolute -top-1/2 left-1/2 h-[120%] w-[90%] -translate-x-1/2 rounded-full blur-3xl",
                  glow,
                ].join(" ")}
              />
              <div className="relative z-[1] flex w-full flex-col items-center">
                <CardHeroArt index={i} />
              </div>
            </div>

            {/* 본문: 2~3문단 */}
            <div className="relative space-y-0 px-4 pb-5 pt-1 sm:px-5">
              <div className="rounded-2xl border border-white/[0.12] bg-gradient-to-b from-white/[0.06] to-white/[0.02] px-3.5 py-4 sm:px-4 sm:py-4">
                {bodyParts.length > 0 ? (
                  <div className="space-y-3.5 sm:space-y-4">
                    {bodyParts.map((chunk, j) => (
                      <p
                        key={j}
                        className="text-[15px] leading-[1.78] text-[var(--space-text)] [text-wrap:pretty]"
                      >
                        {chunk}
                      </p>
                    ))}
                  </div>
                ) : body ? (
                  <p className="text-[15px] leading-[1.78] text-[var(--space-text)] [text-wrap:pretty]">
                    {body}
                  </p>
                ) : (
                  <p className="text-sm leading-relaxed text-[var(--space-text-muted)]">
                    이 구간 해석을 불러오지 못했어요. 잠시 후 다시 열어보세요.
                  </p>
                )}
              </div>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
