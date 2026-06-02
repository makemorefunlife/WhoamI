import GlassCard from "@/components/space/GlassCard";
import type { PolicyDocument } from "@/lib/legal/types";

const EMAIL_SPLIT = /([\w.-]+@[\w.-]+\.\w+)/g;
const EMAIL_ONLY = /^[\w.-]+@[\w.-]+\.\w+$/;

function renderInlineText(text: string) {
  const parts = text.split(EMAIL_SPLIT);
  return parts.map((part, index) =>
    EMAIL_ONLY.test(part) ? (
      <a
        key={`${part}-${index}`}
        href={`mailto:${part}`}
        className="text-[#8eb8ff] underline underline-offset-2 hover:text-[#a8ccff]"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

export default function PolicyDocumentView({ document }: { document: PolicyDocument }) {  return (
    <div className="relative z-10 mx-auto w-full max-w-lg px-4 py-10 sm:py-14">
      <GlassCard className="!px-5 !py-6 sm:!px-7 sm:!py-8">
        <header className="border-b border-white/10 pb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#CBB38E]">
            Legal
          </p>
          <h1 className="mt-2 text-lg font-semibold leading-snug text-[var(--space-text)] sm:text-xl">
            {document.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--space-text-muted)]">
            {document.description}
          </p>
          <p className="mt-3 text-xs text-white/45">
            최종 업데이트: {document.lastUpdated}
          </p>
        </header>

        <div className="policy-scroll mt-6 max-h-[min(70vh,42rem)] overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]">
          <div className="space-y-8 pb-2">
            {document.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-sm font-semibold text-[var(--space-text)]">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3">
                  {section.paragraphs.map((paragraph, index) => (
                    <p
                      key={`${section.id}-p-${index}`}
                      className="text-sm leading-relaxed text-[var(--space-text-muted)] [word-break:keep-all]"
                    >
                      {renderInlineText(paragraph)}
                    </p>
                  ))}
                  {section.listItems?.length ? (
                    <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--space-text-muted)]">
                      {section.listItems.map((item, index) => (
                        <li key={`${section.id}-li-${index}`}>
                          {renderInlineText(item)}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </section>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
