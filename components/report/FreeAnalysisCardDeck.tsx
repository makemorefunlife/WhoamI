"use client";

import { Fragment, type ReactNode, useMemo } from "react";
import { motion } from "framer-motion";
import { Radar, Satellite, ScanSearch, Orbit } from "lucide-react";

const CARD_META = [
  {
    title: "외면",
    subtitle: "겉으로 보이는 나",
    icon: Satellite,
    borderAccent: "border-[rgba(255,255,255,0.12)]",
    titleAccent: "text-[#f1ddb1]",
    iconTint: "text-[#d8bc7e]",
  },
  {
    title: "내면",
    subtitle: "나도 모르는 내마음",
    icon: ScanSearch,
    borderAccent: "border-[rgba(255,255,255,0.12)]",
    titleAccent: "text-[#e2d9bb]",
    iconTint: "text-[#b7bddf]",
  },
  {
    title: "관계에서의 나",
    subtitle: "",
    icon: Orbit,
    borderAccent: "border-[rgba(255,255,255,0.12)]",
    titleAccent: "text-[#eedab0]",
    iconTint: "text-[#d2ba86]",
  },
  {
    title: "실천가능한 조언",
    subtitle: "",
    icon: Radar,
    borderAccent: "border-[rgba(255,255,255,0.12)]",
    titleAccent: "text-[#f1ddb0]",
    iconTint: "text-[#dfc891]",
  },
] as const;

const MAX_PARAGRAPHS = 3;
const SOFT_WRAP = 200;

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

/** 모델이 남긴 마크다운식 별표 제거 (화면은 평문 + 자동 동사 강조만) */
function stripMarkdownLikeStars(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*(?=\S)/g, "")
    .replace(/(?<=\S)\*/g, "");
}

const HIGHLIGHT_SKIP = new Set([
  "그래",
  "근데",
  "그런데",
  "그리고",
  "하지만",
  "그냥",
  "정말",
  "진짜",
  "아니",
  "그래서",
]);

/** 행동·감정을 나타내는 구어체 어미 등 → 해당 어절만 굵게 */
function renderActionEmotionBold(text: string): ReactNode[] {
  const plain = stripMarkdownLikeStars(text);

  type Hit = { start: number; end: number; phrase: string };
  const patterns: RegExp[] = [
    /(?<![가-힣])([가-힣]{2,8})(거예요|거야|겠어|겠지|했어|했지|해요|하네|하는데|하는 게|하려고|하려|됐어|되면|되는데|보여|느껴져|느껴|싶어|싶은|말해|갔어|왔어|봤어|참아|피해|읽혀|맞춰|잡아|놓고|버려|줬어|줄게|할게|할래|잖아|거든|주는|주고|맞추|묻혀|숨겨|달려|서둘러|미뤄|밀어|내려|올려)(?![가-힣])/gu,
    /(?<![가-힣])([가-힣]{2,6})(해|워|져|네)(?=\s|[,.!?…]|$)(?![가-힣])/gu,
  ];

  const hits: Hit[] = [];
  for (const re of patterns) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(plain)) !== null) {
      const phrase = m[0];
      if (phrase.length < 3) continue;
      if (HIGHLIGHT_SKIP.has(phrase)) continue;
      hits.push({ start: m.index, end: m.index + phrase.length, phrase });
    }
  }

  hits.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return b.end - b.start - (a.end - a.start);
  });
  const picked: Hit[] = [];
  const MAX = 10;
  for (const h of hits) {
    if (picked.some((p) => h.start < p.end && h.end > p.start)) continue;
    picked.push(h);
    if (picked.length >= MAX) break;
  }
  picked.sort((a, b) => a.start - b.start);

  const out: ReactNode[] = [];
  let cursor = 0;
  picked.forEach((h, idx) => {
    if (h.start > cursor) {
      out.push(
        <Fragment key={`t-${idx}-${cursor}`}>
          {plain.slice(cursor, h.start)}
        </Fragment>,
      );
    }
    out.push(
      <strong
        key={`b-${idx}-${h.start}`}
        className="font-semibold text-[rgba(255,255,255,0.96)]"
      >
        {h.phrase}
      </strong>,
    );
    cursor = h.end;
  });
  if (cursor < plain.length) {
    out.push(<Fragment key={`t-end-${cursor}`}>{plain.slice(cursor)}</Fragment>);
  }
  return out.length ? out : [<Fragment key="all">{plain}</Fragment>];
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
        const { title, subtitle, icon: Icon, borderAccent, titleAccent, iconTint } =
          meta;
        const body = (paragraphs[i] ?? "").trim();
        const bodyParts = splitBodies[i] ?? [];
        return (
          <motion.article
            key={title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.004 }}
            whileTap={{ scale: 0.997 }}
            className={[
              "group relative overflow-hidden rounded-[22px] border backdrop-blur-md",
              "bg-[rgba(12,17,28,0.72)] shadow-[0_14px_36px_rgba(0,0,0,0.28)]",
              borderAccent,
            ].join(" ")}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.035] via-transparent to-[#d6b46a]/[0.03]" />

            <div className="relative z-[2] border-b border-white/[0.08] px-4 py-3.5 sm:px-5 sm:py-4">
              <div
                className={[
                  "mx-auto flex max-w-lg flex-nowrap items-center justify-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                  borderAccent,
                ].join(" ")}
              >
                <span
                  className={[
                    "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.14] bg-white/[0.04]",
                    iconTint,
                  ].join(" ")}
                  aria-hidden
                >
                  <Icon className="h-4 w-4" strokeWidth={1.85} />
                </span>
                <h3
                  className={`flex min-w-0 flex-nowrap items-baseline gap-0 text-[13px] font-semibold leading-none sm:text-[15px] ${titleAccent}`}
                >
                  <span className="shrink-0 whitespace-nowrap">{title}</span>
                  {subtitle ? (
                    <span className="shrink-0 whitespace-nowrap font-normal text-[var(--space-text-muted)]">
                      {" "}
                      · {subtitle}
                    </span>
                  ) : null}
                </h3>
              </div>
            </div>

            <div className="relative space-y-0 px-4 pb-5 pt-4 sm:px-5">
              <div className="rounded-2xl border border-white/[0.12] bg-gradient-to-b from-white/[0.05] to-white/[0.02] px-3.5 py-4 sm:px-4 sm:py-4">
                {bodyParts.length > 0 ? (
                  <div className="space-y-3.5 sm:space-y-4">
                    {bodyParts.map((chunk, j) => (
                      <p
                        key={j}
                        className="text-[15px] leading-[1.78] text-[var(--space-text)] [text-wrap:pretty]"
                      >
                        {renderActionEmotionBold(chunk)}
                      </p>
                    ))}
                  </div>
                ) : body ? (
                  <p className="text-[15px] leading-[1.78] text-[var(--space-text)] [text-wrap:pretty]">
                    {renderActionEmotionBold(body)}
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
