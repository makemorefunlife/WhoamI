import type { Metadata } from "next";
import PolicyDocumentView from "@/components/legal/PolicyDocumentView";
import SpaceBackground from "@/components/space/SpaceBackground";
import { privacyPolicy } from "@/lib/legal/privacyPolicy";

export const metadata: Metadata = {
  title: "Privacy Policy | Ahaitsme",
  description: privacyPolicy.description,
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <SpaceBackground showPlanet={false} showOrbit={false} showProbe={false}>
      <PolicyDocumentView document={privacyPolicy} />
    </SpaceBackground>
  );
}
