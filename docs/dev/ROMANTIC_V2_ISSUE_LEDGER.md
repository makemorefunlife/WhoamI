# ROMANTIC V2 Implementation Issue Ledger

Temporary implementation tracking only (not Product SSOT).

| ID | classification | finding | affected files/module | why deferred | required resolution batch | status |
|---|---|---|---|---|---|---|
| RV2-001 | LATER | Dev-only visual verification route was added for local QA (`/dev/romantic-v2-visual`) and should be removed or explicitly kept behind dev policy after V2 rollout stabilizes. | `app/dev/romantic-v2-visual/*`, `lib/relationship/romantic/experience/romanticExperienceDevFixtures.ts` | Needed now to unblock M1-M3 visual verification without touching auth/data contracts. Removal timing is product-release hygiene, not current blocker. | Romantic V2 rollout cleanup batch | OPEN |
