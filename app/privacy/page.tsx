import type { Metadata } from "next";
import PolicyDocumentView from "@/components/legal/PolicyDocumentView";
import { privacyPolicy } from "@/lib/legal/privacyPolicy";
import { getRequestLocale } from "@/lib/i18n/serverLocale";
import { buildPageMetadata } from "@/lib/seo/pageMetadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return buildPageMetadata({
    locale,
    path: "/privacy",
    title: "Privacy Policy | Aha It's me!",
    description: privacyPolicy.description,
    robots: { index: true, follow: true },
  });
}

export default function PrivacyPage() {
  return <PolicyDocumentView document={privacyPolicy} />;
}
