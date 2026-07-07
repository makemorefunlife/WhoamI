/**
 * parseReportStructure 헤더 형식 스모크 테스트
 * Usage: node scripts/parse-report-structure-smoke.mjs
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { parseReportStructure } from "../lib/report/parseReportStructure.ts";

dotenv.config({ path: ".env.local" });

const PAID_REPORT_ID = "f5f8eb50-5f7f-4140-8ba5-83e1636c1408";

const FORMAT_CASES = [
  { line: "Part 1", title: "" },
  { line: "Part 1: 제목", title: "제목" },
  { line: "Part 1 - 제목", title: "제목" },
  { line: "Part 1 — 제목", title: "제목" },
  { line: "**Part 1 — 제목**", title: "제목" },
  { line: "## Part 1 — 제목", title: "제목" },
  { line: "### **Part 1 — 제목**", title: "제목" },
];

function partNums(parsed) {
  return parsed
    .filter((s) => s.kind === "part")
    .map((s) => s.num)
    .sort((a, b) => a - b);
}

let failed = 0;

for (const { line, title } of FORMAT_CASES) {
  const input = `${line}\n\n본문`;
  const parsed = parseReportStructure(input);
  const part = parsed?.find((s) => s.kind === "part" && s.num === 1);
  const ok = Boolean(part) && (part?.title ?? "") === title;
  console.log(`${ok ? "[OK]" : "[FAIL]"} ${line}`);
  if (!ok) {
    failed++;
    console.log("  parsed:", parsed);
  }
}

const multi = parseReportStructure(
  [
    "**Part 0 — 들어가며**",
    "",
    "서문",
    "",
    "Part 1",
    "",
    "1-1. 소제",
    "",
    "본문",
    "",
    "**Part 2 — 에너지**",
    "",
    "2-1. 소제",
  ].join("\n"),
);

const nums = partNums(multi);
const multiOk =
  multi !== null && nums.includes(0) && nums.includes(1) && nums.includes(2);
console.log(`${multiOk ? "[OK]" : "[FAIL]"} Part 0~2 multi-section`);
if (!multiOk) {
  failed++;
  console.log("  nums:", nums);
}

try {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    const sb = createClient(url, key);
    const { data } = await sb
      .from("report_analyses")
      .select("content")
      .eq("report_id", PAID_REPORT_ID)
      .eq("analysis_type", "integrated")
      .maybeSingle();
    const text = data?.content ?? "";
    const dbParsed = parseReportStructure(text);
    const dbNums = partNums(dbParsed ?? []);
    const dbOk =
      dbParsed !== null &&
      [0, 1, 2, 3, 4, 5].every((n) => dbNums.includes(n));
    console.log(
      `${dbOk ? "[OK]" : "[FAIL]"} DB integrated (${text.length} chars) parts=${dbNums.join(",")}`,
    );
    if (!dbOk) failed++;
  } else {
    console.log("[SKIP] DB integrated (no Supabase env)");
  }
} catch (e) {
  console.log("[FAIL] DB integrated:", e instanceof Error ? e.message : e);
  failed++;
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll parseReportStructure smoke checks passed.");
