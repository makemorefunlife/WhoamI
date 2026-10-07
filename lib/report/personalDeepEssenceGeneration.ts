import type { SlimV1ReportResult } from "@/lib/v1/slim/types";

/**
 * The paid generation transaction for the Personal Deep Report, with its
 * collaborators injected so the credit rules are unit-testable.
 *
 * Invariant: a reserved credit is consumed ONLY after the generated report
 * has been successfully persisted. Every other exit (reserve failure aside,
 * which reserves nothing) -- LLM failure, placeholder fallback, lost lock,
 * failed save, any thrown error -- releases the reservation, returns an error
 * outcome, and never saves a placeholder as a completed report. The caller
 * owns the generation lock and releases it in its own `finally`.
 */
export type PersonalDeepEssenceDeps = {
  /** null when there is no signed-in user (no credit is involved). */
  reserveCredit:
    | (() => Promise<{ ok: true } | { ok: false; reason: "insufficient_balance" | "error" }>)
    | null;
  generate: () => Promise<SlimV1ReportResult>;
  stillOwnsLock: () => Promise<boolean>;
  /** Resolves true only when the report row was really written. */
  persist: (slim_v1: SlimV1ReportResult) => Promise<boolean>;
  consumeCredit: () => Promise<void>;
  releaseCredit: () => Promise<void>;
  log: (tag: string, error: unknown, code: string) => void;
};

export type PersonalDeepEssenceOutcome =
  | { kind: "ok"; slim_v1: SlimV1ReportResult }
  | { kind: "insufficient_credit" }
  | { kind: "failed"; status: 500 | 502; code: string };

export async function runPersonalDeepEssenceGeneration(
  deps: PersonalDeepEssenceDeps,
): Promise<PersonalDeepEssenceOutcome> {
  let creditReserved = false;
  let succeeded = false;
  try {
    if (deps.reserveCredit) {
      const reserve = await deps.reserveCredit();
      if (!reserve.ok) {
        if (reserve.reason === "insufficient_balance") return { kind: "insufficient_credit" };
        return { kind: "failed", status: 500, code: "reserve_failed" };
      }
      creditReserved = true;
    }

    const slim_v1 = await deps.generate();

    if (!(await deps.stillOwnsLock())) {
      deps.log("v2/deep/essence:", new Error("Lock ownership lost during generation"), "lock_lost");
      return { kind: "failed", status: 500, code: "lock_lost" };
    }

    // Placeholder fallback (no API key / LLM failure) is not a real report.
    if (slim_v1.llm_source === "fallback") {
      deps.log("v2/deep/essence:", new Error("LLM fallback result not persisted"), "llm_fallback");
      return { kind: "failed", status: 502, code: "llm_fallback" };
    }

    const saved = await deps.persist(slim_v1);
    if (!saved) {
      deps.log("v2/deep/essence:", new Error("Report was not saved"), "persist_failed");
      return { kind: "failed", status: 500, code: "persist_failed" };
    }

    if (creditReserved) await deps.consumeCredit();
    succeeded = true;
    return { kind: "ok", slim_v1 };
  } catch (e) {
    deps.log("v2/deep/essence:", e, "generation_failed");
    return { kind: "failed", status: 500, code: "generation_failed" };
  } finally {
    if (creditReserved && !succeeded) {
      await deps.releaseCredit().catch((e) => deps.log("v2/deep/essence:", e, "release_failed"));
    }
  }
}
