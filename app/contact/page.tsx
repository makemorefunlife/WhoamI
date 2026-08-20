import Link from "next/link";
import type { Metadata } from "next";
import SpaceBackground from "@/components/space/SpaceBackground";
import GlassCard from "@/components/space/GlassCard";
import { getRequestLocale } from "@/lib/i18n/serverLocale";
import { getMessages } from "@/lib/i18n/messages";
import { localizedPath } from "@/lib/i18n/locale";
import { buildPageMetadata } from "@/lib/seo/pageMetadata";
import { ROUTES } from "@/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  return buildPageMetadata({
    locale,
    path: "/contact",
    title: messages.contact.metaTitle,
    description: messages.contact.metaDescription,
  });
}

export default async function ContactPage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const t = messages.contact;

  return (
    <SpaceBackground>
      <main id="main" className="relative z-10 mx-auto max-w-lg px-4 py-24">
        <GlassCard className="text-center">
          <h1 className="text-lg font-semibold text-[var(--space-text)]">
            {t.title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--space-text-muted)]">
            {t.body}
          </p>

          <dl className="mt-8 space-y-4 text-left">
            <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4 first:border-t-0 first:pt-0">
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--space-text-muted)]">
                {t.emailLabel}
              </dt>
              <dd>
                <a
                  href="mailto:hong@ahaitsme.com"
                  className="text-sm font-medium text-[var(--space-text)] underline underline-offset-2"
                >
                  hong@ahaitsme.com
                </a>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--space-text-muted)]">
                {t.instagramLabel}
              </dt>
              <dd>
                <a
                  href="https://www.instagram.com/ahaitsme"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[var(--space-text)] underline underline-offset-2"
                >
                  @ahaitsme
                </a>
              </dd>
            </div>
          </dl>

          <p className="mt-8 text-xs text-[var(--space-text-muted)]">
            {t.faqPrompt}{" "}
            <Link
              href={localizedPath(ROUTES.faq, locale)}
              className="font-medium text-[var(--space-text)] underline underline-offset-2"
            >
              {t.faqLinkLabel}
            </Link>
          </p>
        </GlassCard>
      </main>
    </SpaceBackground>
  );
}
