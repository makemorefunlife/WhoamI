export type PersonCoreErrorCode =
  | "supabase_unconfigured"
  | "report_not_found"
  | "birth_date_missing"
  | "saju_calculation_failed"
  | "invalid_snapshot";

export class PersonCoreError extends Error {
  readonly code: PersonCoreErrorCode;

  constructor(code: PersonCoreErrorCode, message: string) {
    super(message);
    this.name = "PersonCoreError";
    this.code = code;
  }
}
