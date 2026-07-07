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

export default function PolicyDocumentView({
  document,
}: {
  document: PolicyDocument;
}) {
  return (
    <div className="relative z-10 mx-auto w-full max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
      <GlassCard className="!border-white/[0.08] !bg-[#0a0f1a]/80 !px-6 !py-8 sm:!px-10 sm:!py-10">
        <header className="border-b border-white/[0.08] pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#CBB38E]">
            Legal
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-snug tracking-[-0.02em] text-[var(--space-text)] sm:text-[1.65rem]">
            {document.title}
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-[1.75] text-[var(--space-text-muted)]">
            {document.description}
          </p>
          <p className="mt-4 text-xs text-white/40">
            최종 업데이트 · {document.lastUpdated}
          </p>
        </header>

        <article className="policy-scroll mt-10 max-h-none overflow-visible sm:max-h-[min(72vh,48rem)] sm:overflow-y-auto sm:overscroll-contain sm:pr-2">
          <div className="space-y-10 pb-4">
            {document.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-28">
                <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--space-text)]">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4">
                  {section.paragraphs.map((paragraph, index) => (
                    <p
                      key={`${section.id}-p-${index}`}
                      className="text-[15px] leading-[1.85] text-[var(--space-text-muted)] [word-break:keep-all]"
                    >
                      {renderInlineText(paragraph)}
                    </p>
                  ))}
                  {section.listItems?.length ? (
                    <ul className="list-disc space-y-2.5 pl-5 text-[15px] leading-[1.85] text-[var(--space-text-muted)]">
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
        </article>
      </GlassCard>
    </div>
  );
}
