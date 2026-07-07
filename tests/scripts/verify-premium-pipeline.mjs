/**
 * 심화(integrated) 파이프라인 단계 검증 (서버 API 직접 호출)
 *
 * Usage:
 *   node scripts/verify-premium-pipeline.mjs [reportId]
 *   node scripts/verify-premium-pipeline.mjs [reportId] --llm   # OpenAI 호출 포함 (시간·비용)
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
const reportId =
  process.argv[2]?.trim() || "f5f8eb50-5f7f-4140-8ba5-83e1636c1408";
const runLlm = process.argv.includes("--llm");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

function step(name, ok, detail = "") {
  const mark = ok ? "OK" : "FAIL";
  console.log(`[${mark}] ${name}${detail ? ` — ${detail}` : ""}`);
  return ok;
}

async function main() {
  console.log(`\n=== Premium pipeline verify ===`);
  console.log(`reportId: ${reportId}`);
  console.log(`base: ${BASE}\n`);

  if (!url || !key) {
    step("env", false, "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  const { data: report, error: repErr } = await supabase
    .from("reports")
    .select(
      "id, name, payment_status, plan_type, birth_date, birth_time, birth_place",
    )
    .eq("id", reportId)
    .maybeSingle();

  if (!step("1. reports row", !repErr && !!report, repErr?.message ?? "")) {
    process.exit(1);
  }

  console.log(
    `   payment=${report.payment_status} birth=${report.birth_date} ${report.birth_time} place=${report.birth_place ?? "(none)"}`,
  );

  const paid =
    report.payment_status === "paid" || report.plan_type === "paid";
  step("   has_premium", paid);

  const { data: analyses } = await supabase
    .from("report_analyses")
    .select("analysis_type, content, updated_at")
    .eq("report_id", reportId)
    .in("analysis_type", ["integrated", "detailed_survey", "astrology"]);

  const byType = Object.fromEntries(
    (analyses ?? []).map((r) => [r.analysis_type, r]),
  );
  step(
    "6. DB report_analyses.integrated (before)",
    true,
    byType.integrated
      ? `${byType.integrated.content?.length ?? 0} chars @ ${byType.integrated.updated_at}`
      : "empty",
  );
  step(
    "   detailed_survey in DB",
    true,
    byType.detailed_survey
      ? `${byType.detailed_survey.content?.length ?? 0} chars`
      : "empty",
  );

  const sajuRes = await fetch(`${BASE}/api/saju`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      birthDate: report.birth_date,
      birthTime: report.birth_time,
      birthPlace: report.birth_place ?? undefined,
      reportId,
    }),
  });
  const sajuBody = await sajuRes.text();
  if (
    !step(
      "3. POST /api/saju",
      sajuRes.ok,
      `status=${sajuRes.status} body=${sajuBody.slice(0, 120)}`,
    )
  ) {
    console.log("\n→ 파이프라인은 여기서 중단됩니다 (sajuStatus.ok=false).\n");
    process.exit(1);
  }

  let sajuJson;
  try {
    sajuJson = JSON.parse(sajuBody);
  } catch {
    sajuJson = null;
  }
  step(
    "   saju payload",
    Boolean(sajuJson?.saju),
    `json_chars=${sajuBody.length}`,
  );

  const { data: surveyRow } = await supabase
    .from("survey_responses")
    .select("answers")
    .eq("report_id", reportId)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  const answers = surveyRow?.answers ?? {};
  const patterns = {
    mbti: pattern3(answers, "q1", "q2", "q3"),
    disc: pattern3(answers, "q4", "q5", "q6"),
    enneagram: pattern3(answers, "q7", "q8", "q9"),
    riasec: pattern3(answers, "q10", "q11", "q12"),
    pss: pattern3(answers, "q13", "q14", "q15"),
    tci: pattern3(answers, "q16", "q17", "q18"),
  };

  step(
    "2. survey patterns",
    Object.values(patterns).some((p) => p && p !== "N/A"),
    JSON.stringify(patterns),
  );

  if (runLlm) {
    const dsRes = await fetch(`${BASE}/api/llm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "detailed_survey", reportId, patterns }),
    });
    const dsText = await dsRes.text();
    step(
      "4a. POST /api/llm detailed_survey",
      dsRes.ok,
      `status=${dsRes.status} chars=${dsText.length}`,
    );

    let detailedSurvey = "";
    if (dsRes.ok) {
      try {
        detailedSurvey = JSON.parse(dsText).report ?? "";
      } catch {
        /* ignore */
      }
    }

    const intRes = await fetch(`${BASE}/api/llm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "integrated",
        reportId,
        detailedSurvey: detailedSurvey || "(없음)",
        sajuData: sajuJson,
        astrologyText: null,
        stream: false,
      }),
    });
    const intText = await intRes.text();
    step(
      "4b. POST /api/llm integrated (non-stream)",
      intRes.ok,
      `status=${intRes.status} chars=${intText.length}`,
    );

    if (intRes.ok) {
      let reportText = "";
      try {
        reportText = JSON.parse(intText).report ?? "";
      } catch {
        reportText = intText;
      }
      if (reportText.trim()) {
        const saveRes = await fetch(`${BASE}/api/my/report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId, integrated: reportText }),
        });
        step(
          "5. POST /api/my/report persist integrated",
          saveRes.ok,
          `status=${saveRes.status}`,
        );
      }
    }
  } else {
    console.log("\n   (--llm 생략: node scripts/verify-premium-pipeline.mjs <id> --llm)\n");
  }

  const { data: integratedAfter } = await supabase
    .from("report_analyses")
    .select("content, updated_at")
    .eq("report_id", reportId)
    .eq("analysis_type", "integrated")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  step(
    "5–6. DB integrated (after)",
    true,
    integratedAfter?.content
      ? `${integratedAfter.content.length} chars — Part parseable: ${/Part\s*1/i.test(integratedAfter.content)}`
      : "still empty — run with --llm or trigger UI 심화 탭",
  );

  const quickRes = await fetch(
    `${BASE}/api/my/report?reportId=${encodeURIComponent(reportId)}&quick=1`,
  );
  const quickJson = await quickRes.json().catch(() => ({}));
  step(
    "   GET /api/my/report?quick=1 premium_result",
    quickRes.ok,
    `has_premium=${quickJson.has_premium} premium_chars=${quickJson.premium_result?.length ?? 0}`,
  );

  console.log("\n브라우저 콘솔: [premium-pipeline] stage=… 로그 확인 (심화 탭)\n");
}

function pattern3(ans, a, b, c) {
  const v = (k) => (ans[k] === "Y" ? "Y" : "N");
  return `${v(a)}${v(b)}${v(c)}`;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
