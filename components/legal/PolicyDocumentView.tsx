import type { PolicyDocument } from "@/lib/legal/types";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { getRequestLocale } from "@/lib/i18n/serverLocale";
import { getMessages } from "@/lib/i18n/messages";
import { localizedPath } from "@/lib/i18n/locale";

const EMAIL_SPLIT = /([\w.-]+@[\w.-]+\.\w+)/g;
const EMAIL_ONLY = /^[\w.-]+@[\w.-]+\.\w+$/;

function renderInlineText(text: string) {
  const parts = text.split(EMAIL_SPLIT);
  return parts.map((part, index) =>
    EMAIL_ONLY.test(part) ? (
      <a
        key={`${part}-${index}`}
        href={`mailto:${part}`}
        className="font-medium text-secondary underline decoration-secondary/35 underline-offset-2 transition hover:text-accent-emerald hover:decoration-accent-emerald/50"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

/** Stitch legal doc — server component, mobile-first, no space chrome. */
export default async function PolicyDocumentView({
  document,
}: {
  document: PolicyDocument;
}) {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  return (
    <div className="stitch-legal relative min-h-dvh text-on-surface">
      <div className="relative z-[1] mx-auto w-full max-w-3xl px-5 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8">
        <p className="mb-6">
          <Link
            href={localizedPath(ROUTES.home, locale)}
            className="text-sm text-on-surface-variant transition hover:text-primary"
          >
            {messages.legal.backHome}
          </Link>
        </p>

        <header className="border-b border-outline-variant/40 pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary">
            {messages.legal.eyebrow}
          </p>
          <h1 className="stitch-headline mt-3 text-balance text-2xl leading-snug text-primary sm:text-3xl">
            {document.title}
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-on-surface-variant sm:text-base">
            {document.description}
          </p>
          <p className="mt-4 text-xs text-on-surface-variant/70">
            {messages.legal.lastUpdatedPrefix}{document.lastUpdated}
          </p>
        </header>

        <article className="mt-10 space-y-10">
          {document.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-28">
              <h2 className="text-base font-semibold tracking-[-0.01em] text-primary sm:text-[1.05rem]">
                {section.title}
              </h2>
              <div className="mt-3 space-y-3.5 sm:mt-4 sm:space-y-4">
                {section.paragraphs.map((paragraph, index) => (
                  <p
                    key={`${section.id}-p-${index}`}
                    className="text-[15px] leading-[1.8] text-on-surface-variant [word-break:keep-all] sm:text-[15.5px] sm:leading-[1.85]"
                  >
                    {renderInlineText(paragraph)}
                  </p>
                ))}
                {section.listItems?.length ? (
                  <ul className="list-disc space-y-2.5 pl-5 text-[15px] leading-[1.8] text-on-surface-variant marker:text-secondary/70 sm:text-[15.5px]">
                    {section.listItems.map((item, index) => (
                      <li key={`${section.id}-li-${index}`} className="pl-0.5">
                        {renderInlineText(item)}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
