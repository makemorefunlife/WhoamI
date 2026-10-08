import type { Metadata } from "next";
import GuestUseClient from "./GuestUseClient";

export const metadata: Metadata = {
  title: "Personal | Aha It's me!",
  robots: { index: false, follow: false },
};

export default function GuestUsePage() {
  return <GuestUseClient />;
}
