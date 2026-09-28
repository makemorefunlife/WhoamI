import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/i18n/serverLocale";
import { getMessages } from "@/lib/i18n/messages";
import { localizedPath } from "@/lib/i18n/locale";
import { buildPageMetadata } from "@/lib/seo/pageMetadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  return buildPageMetadata({
    locale,
    path: "/how-it-works",
    title: messages.howItWorks.metaTitle,
    description: messages.howItWorks.metaDescription,
  });
}

export default async function HowItWorksPage() {
  const locale = await getRequestLocale();
  redirect(localizedPath("/#how-it-works", locale));
}
