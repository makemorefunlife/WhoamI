import type { Metadata } from "next";
import PolicyDocumentView from "@/components/legal/PolicyDocumentView";
import { termsOfService } from "@/lib/legal/termsOfService";
import { getRequestLocale } from "@/lib/i18n/serverLocale";
import { buildPageMetadata } from "@/lib/seo/pageMetadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return buildPageMetadata({
    locale,
    path: "/terms",
    title: "Terms of Service | Aha It's me!",
    description: termsOfService.description,
    robots: { index: true, follow: true },
  });
}

export default function TermsPage() {
  return <PolicyDocumentView document={termsOfService} />;
}
