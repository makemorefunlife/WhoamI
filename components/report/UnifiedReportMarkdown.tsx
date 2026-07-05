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
  UserRound,
  Zap,
  Users,
  Activity,
  Compass,
} from "lucide-react";
import {
  parseReportStructure,
  type PartBodyBlock,
  type ParsedReportSection,
} from "@/lib/report/parseReportStructure";
import {
  logPremiumReportQuality,
  measurePremiumReportQuality,
} from "@/lib/report/premiumReportQuality";
import { useEffect, useMemo, useRef, useState } from "react";

/** Part 0~5 + 부록 (premium cosmic palette) */
const PART_HEADER_GRADIENT: Record<number, string> = {
  0: "bg-gradient-to-br from-[#141b34] via-[#1a2446] to-[#202f58]",
  1: "bg-gradient-to-br from-[#2a1d4a] via-[#3a2868] to-[#4a3484]",
  2: "bg-gradient-to-br from-[#1c2750] via-[#243c73] to-[#2f4f90]",
  3: "bg-gradient-to-br from-[#3a1f4f] via-[#5b2f73] to-[#73358a]",
  4: "bg-gradient-to-br from-[#18324f] via-[#204d74] to-[#2d6996]",
  5: "bg-gradient-to-br from-[#2a2148] via-[#3b2f67] to-[#4d3d84]",
};

const APPENDIX_HEADER_GRADIENT =
  "bg-gradient-to-br from-[#2D9C7A] via-[#27906f] to-[#1f7a5c]";

const PART_ACCENT: Record<number, string> = {
  0: "#7F95C2",
  1: "#A78BFA",
  2: "#8CC9FF",
  3: "#E7A8D7",
  4: "#6BB5FF",
  5: "#BBA6FF",
};

const APPENDIX_ACCENT = "#2D9C7A";

const PART_CARD_SURFACE: Record<number, string> = {
  0: "border-[#5E78AA]/28 bg-[radial-gradient(circle_at_top,rgba(96,130,190,0.18),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]",
  1: "border-[#8B5CF6]/22 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.16),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]",
  2: "border-[#60A5FA]/22 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.16),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]",
  3: "border-[#F472B6]/20 bg-[radial-gradient(circle_at_top,rgba(244,114,182,0.14),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]",
  4: "border-[#38BDF8]/22 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]",
  5: "border-[#A78BFA]/22 bg-[radial-gradient(circle_at_top,rgba(167,139,250,0.15),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]",
};

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
      <div className="my-3 w-full overflow-x-auto rounded-lg border border-[#8B5CF6]/20 bg-[linear-gradient(180deg,rgba(139,92,246,0.08),rgba(255,255,255,0.02))] sm:my-4">
        <table
          className={`w-full min-w-[320px] border-separate border-spacing-0 text-left md:min-w-[360px] ${bodyText}`}
          {...props}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead
        className="bg-[linear-gradient(90deg,rgba(139,92,246,0.28),rgba(59,130,246,0.22))] text-[#F3F4F6]"
        {...props}
      >
        {children}
      </thead>
    ),
    th: ({ children, ...props }) => (
      <th
        className="border-b border-white/22 px-3 py-2.5 text-left font-semibold leading-snug md:px-4 md:py-3"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td
        className="border-b border-white/14 px-3 py-2.5 align-top leading-[1.55] text-[var(--space-text)] md:px-4 md:py-3 md:leading-[1.6]"
        {...props}
      >
        {children}
      </td>
    ),
    tr: ({ children, ...props }) => (
      <tr className="transition odd:bg-white/[0.02] hover:bg-white/10" {...props}>
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

function PartNavigator({
  parts,
}: {
  parts: Array<{ num: number; title: string }>;
}) {
  const navRef = useRef<HTMLDivElement | null>(null);
  const [activePart, setActivePart] = useState<number | null>(
    parts[0]?.num ?? null,
  );
  const [pinNavigator, setPinNavigator] = useState(false);
  const [navigatorHeight, setNavigatorHeight] = useState(0);

  useEffect(() => {
    if (!parts.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) =>
            Number(entry.target.getAttribute("data-part-num") ?? "0"),
          )
          .filter((n) => Number.isFinite(n));
        if (!visible.length) return;
        setActivePart(visible.sort((a, b) => a - b)[0]);
      },
      {
        rootMargin: "-35% 0px -55% 0px",
        threshold: 0.01,
      },
    );

    for (const p of parts) {
      const el = document.getElementById(`premium-part-${p.num}`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [parts]);

  if (!parts.length) return null;

  const partTheme: Record<
    number,
    {
      text: string;
      activeBg: string;
      activeBorder: string;
      activeText: string;
      icon: typeof Compass;
    }
  > = {
    0: {
      text: "text-[#94A3B8]",
      activeBg: "bg-[#334155]/28",
      activeBorder: "border-[#64748B]/35",
      activeText: "text-[#E2E8F0]",
      icon: Moon,
    },
    1: {
      text: "text-[#9F8BCF]",
      activeBg: "bg-[#8B5CF6]/18",
      activeBorder: "border-[#BBA6FF]/40",
      activeText: "text-[#ECE7FF]",
      icon: UserRound,
    },
    2: {
      text: "text-[#86AFCB]",
      activeBg: "bg-[#38BDF8]/18",
      activeBorder: "border-[#A7D7ED]/35",
      activeText: "text-[#EAF6FD]",
      icon: Zap,
    },
    3: {
      text: "text-[#C693A8]",
      activeBg: "bg-[#FB7185]/16",
      activeBorder: "border-[#E7C2CC]/35",
      activeText: "text-[#F8EAF0]",
      icon: Users,
    },
    4: {
      text: "text-[#8DB5B6]",
      activeBg: "bg-[#5EEAD4]/16",
      activeBorder: "border-[#BEE5DD]/35",
      activeText: "text-[#E8F8F4]",
      icon: Activity,
    },
    5: {
      text: "text-[#C7B38A]",
      activeBg: "bg-[#F4D58D]/16",
      activeBorder: "border-[#E6D6B5]/35",
      activeText: "text-[#FBF8F1]",
      icon: Compass,
    },
  };

  const orderedParts = [...parts]
    .sort((a, b) => a.num - b.num)
    .filter((p) => p.num !== 0);

  useEffect(() => {
    const readHeaderOffsetPx = () => {
      const rootStyles = window.getComputedStyle(document.documentElement);
      const rawOffset = rootStyles.getPropertyValue("--app-header-offset").trim();
      const rootFontSize = Number.parseFloat(rootStyles.fontSize || "16") || 16;
      if (rawOffset.endsWith("rem")) return Number.parseFloat(rawOffset) * rootFontSize;
      if (rawOffset.endsWith("px")) return Number.parseFloat(rawOffset);
      return 12;
    };

    const updatePinState = () => {
      const rect = navRef.current?.getBoundingClientRect();
      if (!rect) return;
      setNavigatorHeight(rect.height);
      const headerOffset = readHeaderOffsetPx();
      setPinNavigator(rect.top <= headerOffset + 4);
    };

    updatePinState();
    window.addEventListener("scroll", updatePinState, { passive: true });
    window.addEventListener("resize", updatePinState);
    return () => {
      window.removeEventListener("scroll", updatePinState);
      window.removeEventListener("resize", updatePinState);
    };
  }, []);

  return (
    <>
      {pinNavigator ? (
        <div style={{ height: navigatorHeight || undefined }} aria-hidden />
      ) : null}
      <div
        className={[
          pinNavigator
            ? "fixed inset-x-0 z-[80] px-3 sm:px-4"
            : "sticky top-[calc(var(--app-header-offset,0.75rem)+0.25rem)] z-20",
        ].join(" ")}
        style={pinNavigator ? { top: "var(--app-header-offset, 0.75rem)" } : undefined}
      >
        <div
          ref={navRef}
          className="mx-auto w-full max-w-3xl rounded-lg border border-[#8B5CF6]/12 bg-[#070B18]/94 p-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.34)] backdrop-blur-md"
        >
          <div className="flex w-max min-w-full flex-nowrap items-stretch gap-0 overflow-x-auto md:w-full md:justify-between md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {orderedParts.map((part) => {
          const isActive = activePart === part.num;
          const theme = partTheme[part.num] ?? partTheme[5];
          const Icon = theme.icon;
          return (
            <button
              key={part.num}
              type="button"
              onClick={() => {
                document
                  .getElementById(`premium-part-${part.num}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
                setActivePart(part.num);
              }}
              className={[
                "relative shrink-0 rounded-md px-1 py-1 text-[9px] transition-colors md:px-0.5",
                isActive
                  ? `${theme.activeBg} ${theme.activeText}`
                  : `${theme.text} hover:text-[#94A3B8]`,
              ].join(" ")}
            >
              <span className="flex min-w-[62px] flex-col items-center gap-1 md:min-w-[56px]">
                <span className="text-[7px] font-medium tracking-[0.12em] text-[#64748B]">
                  {`PART ${part.num}`}
                </span>
                <span
                  className={[
                    "inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all",
                    isActive
                      ? `${theme.activeBorder} ${theme.activeBg}`
                      : "border-white/[0.06] bg-white/[0.04]",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </span>
              <span
                className={[
                  "pointer-events-none absolute inset-x-2 bottom-0.5 h-px rounded-full transition-opacity",
                  isActive ? "bg-[#C4B5FD]/80 opacity-100" : "opacity-0",
                ].join(" ")}
                aria-hidden
              />
            </button>
          );
        })}
          </div>
        </div>
      </div>
    </>
  );
}

function StructuredReport({ sections }: { sections: ParsedReportSection[] }) {
  const parts = useMemo(
    () =>
      sections
        .filter((s): s is Extract<ParsedReportSection, { kind: "part" }> =>
          s.kind === "part",
        )
        .map((s) => ({ num: s.num, title: s.title })),
    [sections],
  );

  return (
    <div className="space-y-8 sm:space-y-10 min-w-0">
      <PartNavigator parts={parts} />
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
          const cardSurface = PART_CARD_SURFACE[sec.num] ?? PART_CARD_SURFACE[5];
          return (
            <article
              key={`part-${sec.num}-${i}`}
              id={`premium-part-${sec.num}`}
              data-part-num={sec.num}
              className="scroll-mt-24 space-y-3 sm:space-y-4 min-w-0"
            >
              <PartHeader partNum={sec.num} title={sec.title} />
              <div
                className={`min-w-0 rounded-xl border p-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] sm:p-6 md:p-7 ${cardSurface}`}
              >
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
    <div className="min-w-0 overflow-x-hidden rounded-xl border border-white/15 bg-[var(--space-card)]/40 p-3.5 sm:p-6 md:p-7">
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
  reportId?: string;
};

export default function UnifiedReportMarkdown({
  content,
  className,
  reportId,
}: Props) {
  const structured = useMemo(() => parseReportStructure(content), [content]);

  useEffect(() => {
    if (!content.trim()) return;
    const metrics = measurePremiumReportQuality(content);
    logPremiumReportQuality(reportId ?? "render", metrics, {
      context: "UnifiedReportMarkdown",
    });
  }, [content, reportId]);

  return (
    <div
      className={[
        "unified-report-markdown max-w-full min-w-0 overflow-x-hidden text-left break-words [overflow-wrap:anywhere]",
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
