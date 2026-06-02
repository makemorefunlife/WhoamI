import type { Metadata } from "next";
import PolicyDocumentView from "@/components/legal/PolicyDocumentView";
import SpaceBackground from "@/components/space/SpaceBackground";
import { termsOfService } from "@/lib/legal/termsOfService";

export const metadata: Metadata = {
  title: "Terms of Service | Ahaitsme",
  description: termsOfService.description,
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <SpaceBackground showPlanet={false} showOrbit={false} showProbe={false}>
      <PolicyDocumentView document={termsOfService} />
    </SpaceBackground>
  );
}
