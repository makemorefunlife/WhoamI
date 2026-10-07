import type { Metadata } from "next";
import TossClaimClient from "./TossClaimClient";

export const metadata: Metadata = {
  title: "Payment | Aha It's me!",
  robots: { index: false, follow: false },
};

export default function TossClaimPage() {
  return <TossClaimClient />;
}
