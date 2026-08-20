import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/i18n/serverLocale";
import { getMessages } from "@/lib/i18n/messages";
import { buildPageMetadata } from "@/lib/seo/pageMetadata";
import DoNotSellContent from "./DoNotSellContent";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  return buildPageMetadata({
    locale,
    path: "/do-not-sell",
    title: messages.doNotSellPage.metaTitle,
    description: messages.doNotSellPage.metaDescription,
  });
}

export default function DoNotSellPage() {
  return <DoNotSellContent />;
}
