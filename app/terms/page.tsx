import type { Metadata } from "next";
import PolicyDocumentView from "@/components/legal/PolicyDocumentView";
import { termsOfService } from "@/lib/legal/termsOfService";

export const metadata: Metadata = {
  title: "Terms of Service | Ahaitsme",
  description: termsOfService.description,
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return <PolicyDocumentView document={termsOfService} />;
}
