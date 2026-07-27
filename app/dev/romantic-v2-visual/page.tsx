import { notFound } from "next/navigation";
import PreviewClient from "./PreviewClient";
import {
  romanticExperienceCompleteFixture,
  romanticExperienceMinimalFixture,
} from "@/lib/relationship/romantic/experience/romanticExperienceDevFixtures";

type PageProps = {
  searchParams?: Promise<{ variant?: string }>;
};

export default async function RomanticV2VisualPage({ searchParams }: PageProps) {
  if (process.env.NODE_ENV !== "development") notFound();

  const params = await searchParams;
  const variant = params?.variant === "minimal" ? "minimal" : "complete";
  const report =
    variant === "minimal"
      ? romanticExperienceMinimalFixture
      : romanticExperienceCompleteFixture;

  return <PreviewClient report={report} />;
}
