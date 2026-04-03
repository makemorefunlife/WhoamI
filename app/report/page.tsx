"use client";

import { Suspense } from "react";
import ReportContent from "./reportcontent";

export default function ReportPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {" "}
      <ReportContent />{" "}
    </Suspense>
  );
}
