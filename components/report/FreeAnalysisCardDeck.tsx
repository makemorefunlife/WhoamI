"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

const CARD_META = [
  {
    title: "외면",
    subtitle: "밖으로 드러나는 행동과 리듬",
    heroBg: "from-[#1a2d4a]/90 via-[#67b7ff]/12 to-[#0d1522]",
    glow: "bg-[#67b7ff]/25",
    borderAccent: "border-[#67b7ff]/30",
    titleAccent: "text-[#b8dcff]",
  },
  {
    title: "내면",
    subtitle: "스스로도 잘 모르는 속의 이유",
    heroBg: "from-[#1f1a35]/90 via-[#8b7cff]/14 to-[#0d1220]",
    glow: "bg-[#8b7cff]/20",
    borderAccent: "border-[#a89cff]/28",
    titleAccent: "text-[#d4ccff]",
  },
  {
    title: "관계",
    subtitle: "나와 타인이 맞닿는 지점",
    heroBg: "from-[#152238]/90 via-[#5b8bd9]/10 to-[#0c1424]",
    glow: "bg-[#8eb8ff]/18",
    borderAccent: "border-[#8eb8ff]/26",
    titleAccent: "text-[#c5dafb]",
  },
  {
    title: "실천적 조언",
    subtitle: "오늘 바로 써먹을 한 걸음",
    heroBg: "from-[#2a2318]/85 via-[#c9a227]/08 to-[#0f1218]",
    glow: "bg-[#e8c078]/18",
    borderAccent: "border-[#d4b078]/32",
    titleAccent: "text-[#f0d9a8]",
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

/**
 * 카드별 일러스트 — 외면(인공위성이 지구 바깥을 관측) / 내면(탐사선·크레이터·속 보석) /
 * 관계(서로 다른 두 행성을 잇는 궤적) / 실천적 조언(두 데이터 소스를 비교·수집하는 홀로그램·안테나)
 */
function CardHeroArt({ index }: { index: number }) {
  const u = `fac-${index}`;
  if (index === 0) {
    return (
      <svg
        className="h-[138px] w-full max-w-[320px]"
        viewBox="0 0 320 132"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <radialGradient id={`${u}-ocean`} cx="0.32" cy="0.28" r="0.95">
            <stop offset="0%" stopColor="#7ec4f0" />
            <stop offset="45%" stopColor="#4a8bc8" />
            <stop offset="88%" stopColor="#204870" />
            <stop offset="100%" stopColor="#102238" />
          </radialGradient>
          <linearGradient id={`${u}-panel`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9ec8f0" />
            <stop offset="100%" stopColor="#5a8ec8" />
          </linearGradient>
          <radialGradient id={`${u}-glow`} cx="0.5" cy="0.9" r="0.5">
            <stop offset="0%" stopColor="rgba(180,220,255,0.25)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <StarField />
        <ellipse cx="118" cy="98" rx="70" ry="18" fill={`url(#${u}-glow)`} />
        {/* 궤도 타원 (위성 경로) */}
        <ellipse
          cx="118"
          cy="72"
          rx="88"
          ry="22"
          stroke="rgba(255,230,180,0.45)"
          strokeWidth="0.9"
          transform="rotate(-14 118 72)"
          fill="none"
        />
        {/* 행성 (지구) — 왼쪽 큰 구 */}
        <circle cx="88" cy="76" r="38" fill={`url(#${u}-ocean)`} stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
        <ellipse cx="78" cy="68" rx="14" ry="10" fill="rgba(120,200,150,0.45)" transform="rotate(-10 78 68)" />
        <ellipse cx="98" cy="82" rx="10" ry="7" fill="rgba(80,150,190,0.35)" />
        <ellipse cx="72" cy="86" rx="18" ry="6" fill="rgba(255,255,255,0.06)" />
        {/* 구름 느낌 */}
        <path
          d="M62 78 Q78 74 92 78 T118 79"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
        />
        {/* 인공위성 — 본체 + 태양전지 패널 */}
        <g transform="translate(178, 44) rotate(12)">
          <rect x="-6" y="-4" width="12" height="8" rx="1.5" fill="#a8bcd8" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
          <rect x="-22" y="-3.5" width="14" height="7" rx="1" fill={`url(#${u}-panel)`} stroke="rgba(255,255,255,0.2)" strokeWidth="0.4" />
          <rect x="8" y="-3.5" width="14" height="7" rx="1" fill={`url(#${u}-panel)`} stroke="rgba(255,255,255,0.2)" strokeWidth="0.4" />
          <line x1="-6" y1="0" x2="-8" y2="0" stroke="#8899aa" strokeWidth="0.6" />
          <line x1="6" y1="0" x2="8" y2="0" stroke="#8899aa" strokeWidth="0.6" />
          {/* 안테나 */}
          <line x1="0" y1="-4" x2="0" y2="-12" stroke="#dde8f8" strokeWidth="0.8" strokeLinecap="round" />
          <circle cx="0" cy="-14" r="1.5" fill="#ffe8a8" />
        </g>
        {/* 관측 시선 암시 (은은한 점선) */}
        <path
          d="M172 48 Q 130 58 100 72"
          stroke="rgba(147,200,255,0.22)"
          strokeWidth="0.7"
          strokeDasharray="2 5"
          fill="none"
        />
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
        <defs>
          <linearGradient id={`${u}-sky`} x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#1a1430" />
            <stop offset="100%" stopColor="#0d0a18" />
          </linearGradient>
          <radialGradient id={`${u}-crater`} cx="0.5" cy="0.4" r="0.65">
            <stop offset="0%" stopColor="#3d2f58" />
            <stop offset="70%" stopColor="#251a38" />
            <stop offset="100%" stopColor="#120c1c" />
          </radialGradient>
          <radialGradient id={`${u}-crystal`} cx="0.5" cy="0.65" r="0.5">
            <stop offset="0%" stopColor="#fff8c8" />
            <stop offset="40%" stopColor="#ffd44a" />
            <stop offset="100%" stopColor="#c87818" stopOpacity={0.85} />
          </radialGradient>
          <linearGradient id={`${u}-ground`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6b5588" />
            <stop offset="55%" stopColor="#4a3a65" />
            <stop offset="100%" stopColor="#2d2440" />
          </linearGradient>
        </defs>
        <rect width="320" height="132" fill={`url(#${u}-sky)`} rx="0" />
        <StarField />
        {/* 보라 크레이터 지형 */}
        <path
          d="M0 132 L0 88 Q40 76 90 82 Q140 70 200 78 Q260 68 320 85 L320 132 Z"
          fill={`url(#${u}-ground)`}
        />
        <ellipse cx="168" cy="98" rx="52" ry="14" fill={`url(#${u}-crater)`} stroke="rgba(180,150,220,0.25)" strokeWidth="0.8" />
        <ellipse cx="168" cy="96" rx="36" ry="9" fill="rgba(40,30,60,0.6)" />
        {/* 크레이터 속 발광 수정 */}
        <path d="M158 96 L162 88 L168 92 L172 86 L176 94 L170 98 L164 94 Z" fill={`url(#${u}-crystal)`} opacity={0.95} />
        <path d="M170 100 L174 93 L180 98 L178 104 Z" fill="#ffe066" opacity={0.85} />
        <circle cx="164" cy="100" r="3" fill="rgba(255,240,180,0.5)" />
        {/* 탐사선(로버) — 팔을 크레이터로 */}
        <g transform="translate(108, 84)">
          <rect x="0" y="4" width="28" height="10" rx="2" fill="#8a9098" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
          <circle cx="6" cy="16" r="3.5" fill="#5a5e68" />
          <circle cx="22" cy="16" r="3.5" fill="#5a5e68" />
          <path
            d="M28 8 L48 2 L50 6 L42 10 L32 9 Z"
            fill="#7a8088"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="0.4"
          />
          {/* 기계 팔 */}
          <path
            d="M40 6 L58 4 L62 12 L54 16 L46 14"
            fill="none"
            stroke="#a0a8b0"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <ellipse cx="60" cy="14" rx="4" ry="3" fill="#6a7078" />
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
        <defs>
          <radialGradient id={`${u}-p1`} cx="0.35" cy="0.35" r="0.95">
            <stop offset="0%" stopColor="#7eb8e8" />
            <stop offset="60%" stopColor="#4a86c4" />
            <stop offset="100%" stopColor="#1e3a58" />
          </radialGradient>
          <radialGradient id={`${u}-p2`} cx="0.45" cy="0.35" r="0.95">
            <stop offset="0%" stopColor="#d8c4a8" />
            <stop offset="55%" stopColor="#b8956a" />
            <stop offset="100%" stopColor="#5c4428" />
          </radialGradient>
          <linearGradient id={`${u}-ring`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e8d4b0" />
            <stop offset="100%" stopColor="#a88860" stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <StarField />
        {/* 행성 A — 나(푸른) */}
        <circle cx="92" cy="74" r="32" fill={`url(#${u}-p1)`} stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
        <ellipse cx="84" cy="68" rx="9" ry="6" fill="rgba(100,190,140,0.4)" />
        <ellipse cx="96" cy="80" rx="7" ry="5" fill="rgba(70,130,200,0.25)" />
        {/* 행성 B — 상대(모래색 + 고리) */}
        <g transform="translate(234, 74)">
          <ellipse cx="0" cy="0" rx="38" ry="10" stroke={`url(#${u}-ring)`} strokeWidth="1.2" opacity={0.7} transform="rotate(-12)" fill="none" />
          <ellipse cx="0" cy="0" rx="44" ry="7" stroke="rgba(232,210,170,0.35)" strokeWidth="0.7" transform="rotate(8)" fill="none" />
          <circle r="28" fill={`url(#${u}-p2)`} stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
          <ellipse cx="-6" cy="-4" rx="8" ry="5" fill="rgba(140,110,80,0.35)" />
        </g>
        {/* 두 세계를 잇는 점선 궤적 */}
        <path
          d="M124 74 Q 162 36 200 62 Q 220 78 206 74"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1.1"
          strokeDasharray="5 6"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="162" cy="52" r="2" fill="rgba(255,255,255,0.5)" />
        <circle cx="184" cy="64" r="1.5" fill="rgba(255,255,255,0.4)" />
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
      <defs>
        <radialGradient id={`${u}-planet`} cx="0.42" cy="0.32" r="0.95">
          <stop offset="0%" stopColor="#6a8ab8" />
          <stop offset="100%" stopColor="#283448" />
        </radialGradient>
        <linearGradient id={`${u}-holo`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,200,140,0.35)" />
          <stop offset="100%" stopColor="rgba(255,160,80,0.12)" />
        </linearGradient>
      </defs>
      <StarField />
      {/* 중앙 행성 — 두 데이터가 모이는 대상 */}
      <circle cx="160" cy="72" r="34" fill={`url(#${u}-planet)`} stroke="rgba(232,192,120,0.3)" strokeWidth="1" />
      <ellipse cx="152" cy="66" rx="10" ry="7" fill="rgba(100,160,210,0.2)" />
      {/* 왼쪽: 선 그래프(외면/설문 쪽 데이터 비유) */}
      <g transform="translate(36, 38)" opacity={0.95}>
        <rect x="-4" y="-4" width="56" height="44" rx="6" fill="rgba(20,28,44,0.55)" stroke={`url(#${u}-holo)`} strokeWidth="0.8" />
        <polyline
          points="4,32 16,18 26,24 36,10 46,16"
          fill="none"
          stroke="#7ec8ff"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="4" y1="36" x2="48" y2="36" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      </g>
      {/* 오른쪽: 원형 차트 + 목록(내면/기질 쪽 데이터 비유) */}
      <g transform="translate(228, 36)" opacity={0.95}>
        <rect x="-4" y="-4" width="56" height="48" rx="6" fill="rgba(20,28,44,0.55)" stroke={`url(#${u}-holo)`} strokeWidth="0.8" />
        <circle cx="18" cy="18" r="10" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />
        <path
          d="M18 8 A10 10 0 0 1 26 22 L18 18 Z"
          fill="#e8a868"
          opacity={0.9}
        />
        <path
          d="M18 8 A10 10 0 0 0 10 24 L18 18 Z"
          fill="#7aa8d8"
          opacity={0.85}
        />
        <rect x="34" y="8" width="14" height="3" rx="1" fill="rgba(255,230,200,0.5)" />
        <rect x="34" y="14" width="12" height="3" rx="1" fill="rgba(200,220,255,0.35)" />
        <rect x="34" y="20" width="16" height="3" rx="1" fill="rgba(255,230,200,0.35)" />
      </g>
      {/* 위성 안테나 — 신호 수집·비교 */}
      <g transform="translate(160, 118)">
        <path d="M-18 0 Q0 -28 18 0" fill="none" stroke="#b8a078" strokeWidth="1.4" />
        <ellipse cx="0" cy="2" rx="22" ry="5" fill="rgba(200,170,120,0.35)" stroke="rgba(232,200,140,0.4)" strokeWidth="0.8" />
        <line x1="0" y1="2" x2="0" y2="-14" stroke="#c9b090" strokeWidth="1.2" />
        <circle cx="0" cy="-16" r="4" fill="rgba(40,48,60,0.9)" stroke="#e8c890" strokeWidth="0.6" />
      </g>
      {/* 데이터 → 행성으로 모이는 선 */}
      <path
        d="M72 58 Q 110 48 130 62"
        stroke="rgba(126,200,255,0.25)"
        strokeWidth="0.8"
        strokeDasharray="3 4"
        fill="none"
      />
      <path
        d="M248 58 Q 210 48 190 62"
        stroke="rgba(255,200,140,0.3)"
        strokeWidth="0.8"
        strokeDasharray="3 4"
        fill="none"
      />
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
        const { title, subtitle, heroBg, glow, borderAccent, titleAccent } = meta;
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
              "bg-[var(--space-card)]/80 shadow-[0_16px_48px_rgba(0,0,0,0.32)]",
              borderAccent,
            ].join(" ")}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-[#8b7cff]/[0.05]" />

            {/* 카드 최상단: 제목(굵게) + 소제목(일반) — 테두리 박스 */}
            <div className="relative z-[2] px-4 pt-4 sm:px-5 sm:pt-5">
              <div
                className={[
                  "mx-auto max-w-lg rounded-2xl border bg-white/[0.04] px-4 py-3 text-center backdrop-blur-sm",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
                  borderAccent,
                ].join(" ")}
              >
                <h3 className="text-[15px] leading-snug sm:text-base">
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
              <div className="rounded-2xl border border-white/[0.1] bg-gradient-to-b from-white/[0.07] to-white/[0.02] px-3.5 py-4 sm:px-4 sm:py-4">
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
