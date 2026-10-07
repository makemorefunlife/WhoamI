import type { Metadata } from "next";
import TossFailClient from "./TossFailClient";

export const metadata: Metadata = {
  title: "Payment | Aha It's me!",
  robots: { index: false, follow: false },
};

export default function TossFailPage() {
  return <TossFailClient />;
}
