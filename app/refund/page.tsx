import type { Metadata } from "next";
import PolicyDocumentView from "@/components/legal/PolicyDocumentView";
import { refundPolicy } from "@/lib/legal/refundPolicy";
import { getRequestLocale } from "@/lib/i18n/serverLocale";
import { buildPageMetadata } from "@/lib/seo/pageMetadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return buildPageMetadata({
    locale,
    path: "/refund",
    title: "Refund Policy | Aha It's me!",
    description: refundPolicy.description,
    robots: { index: true, follow: true },
  });
}

export default function RefundPage() {
  return <PolicyDocumentView document={refundPolicy} />;
}
