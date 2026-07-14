import type { Metadata } from "next";
import PolicyDocumentView from "@/components/legal/PolicyDocumentView";
import { privacyPolicy } from "@/lib/legal/privacyPolicy";

export const metadata: Metadata = {
  title: "Privacy Policy | Ahaitsme",
  description: privacyPolicy.description,
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return <PolicyDocumentView document={privacyPolicy} />;
}
