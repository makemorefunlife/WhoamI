import type { Metadata } from "next";
import TossSuccessClient from "./TossSuccessClient";

export const metadata: Metadata = {
  title: "Payment | Aha It's me!",
  robots: { index: false, follow: false },
};

export default function TossSuccessPage() {
  return <TossSuccessClient />;
}
