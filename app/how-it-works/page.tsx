import Link from "next/link";
import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/i18n/serverLocale";
import { getMessages } from "@/lib/i18n/messages";
import { localizedPath } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  return {
    title: messages.howItWorks.metaTitle,
    description: messages.howItWorks.metaDescription,
  };
}

export default async function HowItWorksPage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">
        {messages.howItWorks.eyebrow}
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-primary">
        {messages.howItWorks.title}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
        {messages.howItWorks.body}
      </p>
      <Link
        href={localizedPath("/", locale)}
        className="mt-8 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary"
      >
        {messages.howItWorks.homeCta}
      </Link>
    </div>
  );
}
