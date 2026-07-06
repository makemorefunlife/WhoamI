"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import {
  BookOpen,
  Flame,
  Gem,
  Heart,
  MessageCircle,
  Moon,
  Sparkles,
} from "lucide-react";
import {
  parseReportStructure,
  type PartBodyBlock,
  type ParsedReportSection,
} from "@/lib/report/parseReportStructure";

/** Part 1~5 + 부록 (우주 톤 그라데이션) */
const PART_HEADER_GRADIENT: Record<number, string> = {
  0: "bg-gradient-to-br from-[#1a2238] via-[#243152] to-[#2d3f62]",
  1: "bg-gradient-to-br from-[#FFD700] via-[#f5c518] to-[#d4a017]",
  2: "bg-gradient-to-br from-[#FF8C42] via-[#ff7a35] to-[#e85d20]",
  3: "bg-gradient-to-br from-[#4b5563] via-[#6b7280] to-[#9ca3af]",
  4: "bg-gradient-to-br from-[#4A90E2] via-[#3d7fc9] to-[#2f6cb0]",
  5: "bg-gradient-to-br from-[#6B5B95] via-[#5d4e82] to-[#4a3f6b]",
};

const APPENDIX_HEADER_GRADIENT =
  "bg-gradient-to-br from-[#2D9C7A] via-[#27906f] to-[#1f7a5c]";

const PART_ACCENT: Record<number, string> = {
  0: "#94a3b8",
  1: "#FFD700",
  2: "#FF8C42",
  3: "#C0C0C0",
  4: "#4A90E2",
  5: "#6B5B95",
};

const APPENDIX_ACCENT = "#2D9C7A";

const PART_ICONS = [Moon, Sparkles, Flame, Gem, MessageCircle, Heart];

function getPartGradient(num: number): string {
  return PART_HEADER_GRADIENT[num] ?? PART_HEADER_GRADIENT[5];
}

function getPartAccent(num: number): string {
  return PART_ACCENT[num] ?? PART_ACCENT[5];
}

/** 본문: 모바일 14px · md+ 16px */
const bodyText =
  "text-[14px] leading-[1.55] text-[var(--space-text)] md:text-[16px] md:leading-[1.6]";

function createBodyComponents(accent: string): Components {
  return {
    p: ({ children, ...props }) => (
      <p
        className={`mb-2 last:mb-0 md:mb-2.5 ${bodyText}`}
        {...props}
      >
        {children}
      </p>
    ),
    strong: ({ children, ...props }) => (
      <strong className="font-medium text-[#FFD6A5]" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }) => (
      <em className="italic text-[var(--space-text-muted)]" {...props}>
        {children}
      </em>
    ),
    h1: ({ children, ...props }) => (
      <h2
        className="mb-2 mt-5 text-base font-medium leading-snug text-[#FFD6A5] first:mt-0 md:mb-2.5 md:mt-6 md:text-lg"
        {...props}
      >
        {children}
      </h2>
    ),
    h2: ({ children, ...props }) => (
      <h3
        className={`mb-1.5 mt-4 font-medium leading-snug text-[var(--space-text)] first:mt-0 md:mb-2 md:mt-5 ${bodyText}`}
        {...props}
      >
        {children}
      </h3>
    ),
    h3: ({ children, ...props }) => (
      <h4
        className="mb-1.5 mt-3 text-[14px] font-medium leading-snug text-[var(--space-text-muted)] md:mb-2 md:mt-4 md:text-[15px]"
        {...props}
      >
        {children}
      </h4>
    ),
    ul: ({ children, ...props }) => (
      <ul
        className={`mb-2.5 list-disc space-y-1.5 pl-4 marker:text-[var(--space-text-muted)] sm:mb-3 sm:space-y-2 sm:pl-5 ${bodyText}`}
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        className={`mb-2.5 list-decimal space-y-1.5 pl-4 marker:text-[var(--space-text-muted)] sm:mb-3 sm:space-y-2 sm:pl-5 ${bodyText}`}
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="pl-1" {...props}>
        {children}
      </li>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote
        className={`my-3 border-l-[3px] bg-white/5 py-1.5 pl-3 pr-2 text-[var(--space-text-muted)] sm:my-3.5 sm:py-2 sm:pl-4 ${bodyText}`}
        style={{ borderLeftColor: accent }}
        {...props}
      >
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-6 border-0 border-t border-white/15 sm:my-7" />,
    table: ({ children, ...props }) => (
      <div className="my-3 w-full overflow-x-auto rounded-lg border border-white/15 bg-[var(--space-card)]/40 sm:my-4">
        <table
          className={`w-full min-w-[260px] border-collapse text-left md:min-w-[280px] ${bodyText}`}
          {...props}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="bg-white/10 text-[var(--space-text)]" {...props}>
        {children}
      </thead>
    ),
    th: ({ children, ...props }) => (
      <th
        className="border-b border-white/15 px-2 py-2 text-left font-medium leading-snug md:px-4 md:py-2.5"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td
        className="border-b border-white/10 px-2 py-2 align-top leading-[1.55] text-[var(--space-text)] md:px-4 md:py-2.5 md:leading-[1.6]"
        {...props}
      >
        {children}
      </td>
    ),
    tr: ({ children, ...props }) => (
      <tr className="transition hover:bg-white/5" {...props}>
        {children}
      </tr>
    ),
    tbody: ({ children, ...props }) => (
      <tbody className="text-[var(--space-text)]" {...props}>
        {children}
      </tbody>
    ),
    code: ({ className, children, ...props }) => {
      const inline = !className;
      if (inline) {
        return (
          <code
            className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[13px] text-[var(--space-text-muted)]"
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    pre: ({ children, ...props }) => (
      <pre
        className="my-3 overflow-x-auto rounded-lg border border-white/15 bg-[var(--space-card)]/40 p-3 text-[12px] leading-[1.55] text-[var(--space-text-muted)] md:my-4 md:p-4 md:text-[13px] md:leading-[1.6]"
        {...props}
      >
        {children}
      </pre>
    ),
  };
}

function PartHeader({
  partNum,
  title,
  isAppendix,
}: {
  partNum: number;
  title: string;
  isAppendix?: boolean;
}) {
  const gradient = isAppendix
    ? APPENDIX_HEADER_GRADIENT
    : getPartGradient(partNum);
  const Icon = isAppendix
    ? BookOpen
    : PART_ICONS[Math.min(partNum, PART_ICONS.length - 1)];

  const label = isAppendix
    ? title.startsWith("부록")
      ? title
      : `부록 · ${title}`
    : title.trim()
      ? `Part ${partNum}. ${title}`
      : `Part ${partNum}`;

  return (
    <div
      className={[
        "flex items-center gap-2.5 rounded-xl px-3 py-2.5 shadow-lg sm:gap-4 sm:px-5 sm:py-4",
        gradient,
        "text-white",
      ].join(" ")}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20 shadow-inner backdrop-blur-sm sm:h-12 sm:w-12 sm:rounded-xl"
        aria-hidden
      >
        <Icon className="h-[18px] w-[18px] text-white sm:h-6 sm:w-6" strokeWidth={2} />
      </span>
      <h2 className="min-w-0 flex-1 text-[17px] font-bold leading-snug text-white sm:text-2xl md:text-[28px]">
        {label}
      </h2>
    </div>
  );
}

function SubsectionHeader({
  label,
  title,
  accent,
}: {
  label: string;
  title: string;
  accent: string;
}) {
  return (
    <div
      className="mb-2 mt-6 border-l-4 border-solid pl-3 first:mt-0 sm:mb-2.5 sm:mt-7 sm:pl-4"
      style={{ borderLeftColor: accent }}
    >
      <h3 className="text-[16px] font-medium leading-snug md:text-[18px]">
        <span style={{ color: accent }}>{label}</span>
        {title ? (
          <>
            <span className="text-[var(--space-text-muted)]"> · </span>
            <span className="text-[var(--space-text)]">{title}</span>
          </>
        ) : null}
      </h3>
    </div>
  );
}

function BodyBlockMarkdown({
  markdown,
  accent,
}: {
  markdown: string;
  accent: string;
}) {
  if (!markdown.trim()) return null;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={createBodyComponents(accent)}
    >
      {markdown}
    </ReactMarkdown>
  );
}

function renderBlocks(blocks: PartBodyBlock[], accent: string) {
  return blocks.map((block, idx) => {
    if (block.type === "intro") {
      return (
        <div key={`intro-${idx}`} className="mb-1.5 sm:mb-2">
          <BodyBlockMarkdown markdown={block.markdown} accent={accent} />
        </div>
      );
    }
    return (
      <section key={`${block.label}-${idx}`} className="mb-4 sm:mb-5">
        <SubsectionHeader
          label={block.label}
          title={block.title}
          accent={accent}
        />
        <BodyBlockMarkdown markdown={block.markdown} accent={accent} />
      </section>
    );
  });
}

function StructuredReport({ sections }: { sections: ParsedReportSection[] }) {
  return (
    <div className="space-y-8 sm:space-y-10">
      {sections.map((sec, i) => {
        if (sec.kind === "preamble") {
          return (
            <div
              key={`pre-${i}`}
              className="rounded-xl border border-white/10 bg-[var(--space-card)]/40 p-3.5 shadow-sm sm:p-6"
            >
              <BodyBlockMarkdown
                markdown={sec.markdown}
                accent={PART_ACCENT[0]}
              />
            </div>
          );
        }
        if (sec.kind === "part") {
          const accent = getPartAccent(sec.num);
          return (
            <article key={`part-${sec.num}-${i}`} className="space-y-3 sm:space-y-4">
              <PartHeader partNum={sec.num} title={sec.title} />
              <div className="rounded-xl border border-white/15 bg-[var(--space-card)]/40 p-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] sm:p-6 md:p-7">
                {renderBlocks(sec.blocks, accent)}
              </div>
            </article>
          );
        }
        return (
          <article key={`apx-${i}`} className="space-y-3 sm:space-y-4">
            <PartHeader partNum={0} title={sec.title} isAppendix />
            <div className="rounded-xl border border-white/15 bg-[var(--space-card)]/40 p-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] sm:p-6 md:p-7">
              {renderBlocks(sec.blocks, APPENDIX_ACCENT)}
            </div>
          </article>
        );
      })}
    </div>
  );
}

/** 파싱 실패 시: 본문만 어두운 패널 */
function FallbackMarkdown({ content }: { content: string }) {
  return (
    <div className="rounded-xl border border-white/15 bg-[var(--space-card)]/40 p-3.5 sm:p-6 md:p-7">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={createBodyComponents("#4A90E2")}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

type Props = {
  content: string;
  className?: string;
};

export default function UnifiedReportMarkdown({ content, className }: Props) {
  const structured = parseReportStructure(content);

  return (
    <div
      className={[
        "unified-report-markdown max-w-full text-left break-words",
        className ?? "",
      ].join(" ")}
    >
      {structured && structured.length > 0 ? (
        <StructuredReport sections={structured} />
      ) : (
        <FallbackMarkdown content={content} />
      )}
    </div>
  );
}
