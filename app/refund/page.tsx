import type { Metadata } from "next";
import PolicyDocumentView from "@/components/legal/PolicyDocumentView";
import SpaceBackground from "@/components/space/SpaceBackground";
import { refundPolicy } from "@/lib/legal/refundPolicy";

export const metadata: Metadata = {
  title: "Refund Policy | Ahaitsme",
  description: refundPolicy.description,
  robots: { index: true, follow: true },
};

export default function RefundPage() {
  return (
    <SpaceBackground showPlanet={false} showOrbit={false} showProbe={false}>
      <PolicyDocumentView document={refundPolicy} />
    </SpaceBackground>
  );
}
