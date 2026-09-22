import type { Metadata } from "next";
import ThankYouClient from "./ThankYouClient";
import { getRequestLocale } from "@/lib/i18n/serverLocale";
import { getMessages } from "@/lib/i18n/messages";
import { buildPageMetadata } from "@/lib/seo/pageMetadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  return buildPageMetadata({
    locale,
    path: "/thank-you",
    title: messages.thankYou.metaTitle,
    description: messages.thankYou.metaDescription,
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default function ThankYouPage() {
  return <ThankYouClient />;
}
