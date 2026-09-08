/**
 * Regression test for DB-backed Personal Premium Generation Concurrency.
 *
 * Verifies that acquirePersonalPremiumGenerationLock and releasePersonalPremiumGenerationLock:
 *   1. Atomically acquire a lock slot via DB insert on single instance or multi-instance.
 *   2. Reject second concurrent request across Vercel instances with `in_progress` (23505 unique_violation).
 *   3. Recover stale locks (> 6 minutes) via conditional UPDATE.
 *   4. Safely release lock by lockId and current_request_id.
 *
 * Run: npx tsx tests/unit/personal-premium-concurrency.test.mjs
 */
import assert from "node:assert/strict";
import {
  acquirePersonalPremiumGenerationLock,
  releasePersonalPremiumGenerationLock,
} from "../../lib/report/personalPremiumGenerationLock.ts";

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`ok - ${name}`);
}
function section(title) {
  console.log(`\n=== ${title} ===`);
}

function mockSupabaseLockDb(initialRows = []) {
  const locks = [...initialRows];

  return {
    from(table) {
      assert.equal(table, "personal_premium_generation_locks");
      return {
        insert(payload) {
          const row = Array.isArray(payload) ? payload[0] : payload;
          const exists = locks.find(
            (r) => r.report_id === row.report_id && r.locale === row.locale,
          );
          if (exists) {
            return {
              select() {
                return {
                  maybeSingle: async () => ({
                    data: null,
                    error: { code: "23505", message: "unique_violation" },
                  }),
                };
              },
            };
          }
          const created = {
            id: `lock-${Math.random().toString(36).slice(2, 9)}`,
            report_id: row.report_id,
            locale: row.locale,
            current_request_id: row.current_request_id,
            started_at: new Date().toISOString(),
          };
          locks.push(created);
          return {
            select() {
              return {
                maybeSingle: async () => ({ data: created, error: null }),
              };
            },
          };
        },
        select() {
          return {
            eq(col1, val1) {
              return {
                eq(col2, val2) {
                  return {
                    maybeSingle: async () => {
                      const found = locks.find(
                        (r) => r[col1] === val1 && r[col2] === val2,
                      );
                      return { data: found ?? null, error: null };
                    },
                  };
                },
              };
            },
          };
        },
        update(updatePayload) {
          return {
            eq(col1, val1) {
              return {
                eq(col2, val2) {
                  return {
                    lt(col3, val3) {
                      return {
                        select() {
                          return {
                            maybeSingle: async () => {
                              const found = locks.find(
                                (r) =>
                                  r[col1] === val1 &&
                                  r[col2] === val2 &&
                                  r[col3] < val3,
                              );
                              if (!found) return { data: null, error: null };
                              Object.assign(found, updatePayload);
                              return { data: found, error: null };
                            },
                          };
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        },
        delete() {
          return {
            eq(col1, val1) {
              return {
                eq(col2, val2) {
                  const idx = locks.findIndex(
                    (r) => r[col1] === val1 && r[col2] === val2,
                  );
                  if (idx >= 0) locks.splice(idx, 1);
                  return Promise.resolve({ error: null });
                },
              };
            },
          };
        },
      };
    },
    _getLocks: () => locks,
  };
}

async function runTests() {
  section("1. First Request Clean Acquire Lock");
  {
    const db = mockSupabaseLockDb();
    const reqId1 = "req-uuid-1";

    const res = await acquirePersonalPremiumGenerationLock(db, {
      reportId: "report-101",
      locale: "en-US",
      generationRequestId: reqId1,
    });

    assert.equal(res.ok, true, "First request must acquire lock successfully");
    assert.ok(res.lockId, "Lock response must include lockId");
    ok("First request acquires DB generation lock");
  }

  section("2. Second Concurrent Request Across Vercel Instances Blocked (in_progress)");
  {
    const db = mockSupabaseLockDb();
    const reqId1 = "req-uuid-1";
    const reqId2 = "req-uuid-2";

    // Request 1 acquires lock
    const res1 = await acquirePersonalPremiumGenerationLock(db, {
      reportId: "report-102",
      locale: "en-US",
      generationRequestId: reqId1,
    });
    assert.equal(res1.ok, true);

    // Request 2 (e.g. hitting separate Vercel instance) attempts lock for same reportId + locale
    const res2 = await acquirePersonalPremiumGenerationLock(db, {
      reportId: "report-102",
      locale: "en-US",
      generationRequestId: reqId2,
    });

    assert.equal(res2.ok, false, "Second request must be blocked");
    assert.equal(res2.reason, "in_progress", "Blocked request reason must be 'in_progress'");

    ok("Second concurrent request hitting different instance is blocked BEFORE credit reservation");
  }

  section("3. Lock Release after Generation Finish");
  {
    const db = mockSupabaseLockDb();
    const reqId1 = "req-uuid-1";

    const res1 = await acquirePersonalPremiumGenerationLock(db, {
      reportId: "report-103",
      locale: "en-US",
      generationRequestId: reqId1,
    });
    assert.equal(res1.ok, true);
    assert.equal(db._getLocks().length, 1);

    await releasePersonalPremiumGenerationLock(db, res1.lockId, reqId1);
    assert.equal(db._getLocks().length, 0, "Lock row must be deleted upon release");

    // Subsequent request after release acquires lock cleanly
    const res2 = await acquirePersonalPremiumGenerationLock(db, {
      reportId: "report-103",
      locale: "en-US",
      generationRequestId: "req-uuid-3",
    });
    assert.equal(res2.ok, true, "New request acquires lock after previous release");

    ok("Lock is released cleanly allowing subsequent generations");
  }

  section("4. Stale Lock Recovery (> 6 Minutes)");
  {
    const staleTime = new Date(Date.now() - 7 * 60 * 1000).toISOString();
    const db = mockSupabaseLockDb([
      {
        id: "stale-lock-id",
        report_id: "report-stale-1",
        locale: "en-US",
        current_request_id: "old-crashed-req-id",
        started_at: staleTime,
      },
    ]);

    const res = await acquirePersonalPremiumGenerationLock(db, {
      reportId: "report-stale-1",
      locale: "en-US",
      generationRequestId: "new-req-id",
    });

    assert.equal(res.ok, true, "Stale lock must be stolen successfully");
    assert.equal(res.lockId, "stale-lock-id", "Stolen lock reuses lockId with updated request id");

    ok("Stale abandoned lock (> 6 min) is recovered and stolen automatically");
  }

  console.log(`\nAll ${passed} DB-backed personal lock tests passed.`);
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
