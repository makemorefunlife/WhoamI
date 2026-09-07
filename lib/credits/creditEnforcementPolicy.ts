/**
 * Beta: credit reserve/consume/release ALWAYS runs and ALWAYS writes to
 * credit_ledger (full usage tracking from day one), but does not touch
 * real credit_accounts.balance and never blocks on insufficient balance
 * while this is false — enforcement and usage tracking are deliberately
 * separate concerns. Flip CREDIT_ENFORCEMENT=true once paid access is
 * ready; no schema or code path changes needed, only this flag.
 */
export function isCreditEnforcementEnabled(): boolean {
  return process.env.CREDIT_ENFORCEMENT === "true";
}
