import { describe, it, expect } from "vitest";
import {
  isStaleWorkReportBlock,
  isStaleCohabitationReportBlock,
} from "@/lib/relationship/reportStalenessGuard";

describe("Batch A Correctness & Staleness Negative Regression Tests", () => {
  it("rejects legacy Work report lacking canonical role & mix fit sections", () => {
    const legacyWorkPayload = {
      format: "work_colleague_deep_v1",
      report: {
        office: {
          my_work_style: { headline: "Old Style" },
          // Missing section_roles, section_mix_fit, section_respect
        },
      },
    };

    expect(isStaleWorkReportBlock(legacyWorkPayload)).toBe(true);
  });

  it("accepts modern VNext Work report containing canonical role & mix fit sections", () => {
    const modernWorkPayload = {
      format: "work_colleague_deep_v1",
      report: {
        office: {
          section_roles: { person_a: {}, person_b: {} },
          section_mix_fit: { fit_pct: 85 },
          section_respect: { headline: "Valid" },
        },
      },
    };

    expect(isStaleWorkReportBlock(modernWorkPayload)).toBe(false);
  });

  it("rejects legacy Cohabitation report lacking canonical story plan or chapter intelligences", () => {
    const legacyMarriagePayload = {
      format: "cohabitation_deep_v1",
      report: {
        household: {
          summary_line: "Old Summary",
        },
        // Missing canonicalStoryPlan, chapter07Intelligence, chapter08Intelligence
      },
    };

    expect(isStaleCohabitationReportBlock(legacyMarriagePayload)).toBe(true);
  });

  it("accepts modern VNext Cohabitation report containing canonical story plan", () => {
    const modernMarriagePayload = {
      format: "cohabitation_deep_v1",
      report: {
        canonicalStoryPlan: {
          chapters: [{ chapterId: "c1_who_we_are" }],
        },
        chapter07Intelligence: { introNarrative: "Valid" },
        chapter08Intelligence: { introSentence: "Valid" },
        household: {
          section_dna: { person_a: {}, person_b: {} },
        },
      },
    };

    expect(isStaleCohabitationReportBlock(modernMarriagePayload)).toBe(false);
  });
});
