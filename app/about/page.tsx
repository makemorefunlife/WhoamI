import type { Metadata } from "next";
import AboutPageContent from "@/components/about/AboutPageContent";
import { getRequestLocale } from "@/lib/i18n/serverLocale";
import { getMessages } from "@/lib/i18n/messages";
import { buildPageMetadata } from "@/lib/seo/pageMetadata";

/** Avoid SSG: root Clerk chrome can throw useContext null during /about prerender. */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  return buildPageMetadata({
    locale,
    path: "/about",
    title: messages.about.metaTitle,
    description: messages.about.metaDescription,
  });
}

export default function AboutPage() {
  return <AboutPageContent />;
}
