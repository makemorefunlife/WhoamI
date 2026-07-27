/**
 * Work Narrative Pilot harness — Variants A / B / C.
 *
 * Non-production only. Does not touch premium routing or Work ViewModel.
 *
 * Usage:
 *   npx tsx tests/scripts/work-narrative-pilot/run.ts
 *   npx tsx tests/scripts/work-narrative-pilot/run.ts --a-only
 *   npx tsx tests/scripts/work-narrative-pilot/run.ts --c-only
 *   npx tsx tests/scripts/work-narrative-pilot/run.ts --c-refined
 *   npx tsx tests/scripts/work-narrative-pilot/run.ts --c-package-refined
 *   npx tsx tests/scripts/work-narrative-pilot/run.ts --c-bilingual
 *
 * --c-refined: keeps variant_C_narrative.json; writes variant_C_refined_narrative.json
 * --c-package-refined: Batch IV package; writes context_C_package_refined.json + variant_C_package_refined_narrative.json
 * --c-bilingual: Batch V voice; same package → variant_C_package_refined_ko-KR.json + _en-US.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import OpenAI from "openai";
import { buildWorkColleagueReport } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import { buildWorkPilotContextPackage } from "./buildContextPackage";
import { extractDeterministicBaseline } from "./extractDeterministicBaseline";
import { PILOT_FIXTURES, sajuFromBirth } from "./fixtures";
import {
  buildVariantBSystemPrompt,
  buildVariantCSystemPrompt,
  buildVariantCVoiceSystemPrompt,
  buildVariantUserPrompt,
} from "./prompts";
import { canonicalHash, contextHash } from "./pilotHashes";
import {
  emptyBilingualRubric,
  bilingualRubricMarkdown,
} from "./bilingualRubric";
import { VOICE_POLICY_VERSION } from "./voicePolicy";
import type { PilotNarrativeLocale } from "./voicePolicy";
import {
  canonicalBindingChecklist,
  duplicationChecklist,
  psychSajuContradictionChecklist,
} from "./checklists";
import {
  emptyRubricScoreSheet,
  rubricMarkdownTemplate,
} from "./rubric";
import { WORK_NARRATIVE_SECTION_IDS } from "./types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
dotenv.config({ path: path.join(ROOT, ".env.local") });

const OUT_ROOT = path.join(__dirname, "artifacts");

const MODEL =
  process.env.WORK_NARRATIVE_PILOT_MODEL ??
  process.env.RELATIONSHIP_ROMANTIC_MODEL ??
  "gpt-4o-mini";

function parseArgs(argv: string[]) {
  const aOnly = argv.includes("--a-only");
  const cOnly = argv.includes("--c-only");
  const cRefined = argv.includes("--c-refined");
  const cPackageRefined = argv.includes("--c-package-refined");
  const cBilingual = argv.includes("--c-bilingual");
  const pairIdx = argv.indexOf("--pair");
  const pairFilter = pairIdx >= 0 ? argv[pairIdx + 1] : null;
  return { aOnly, cOnly, cRefined, cPackageRefined, cBilingual, pairFilter };
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function writeJson(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function sanitizeForReview(pkg: unknown): unknown {
  // Fixtures are already synthetic; keep structure but avoid dumping huge raw charts.
  return pkg;
}

function parseNarrativeJson(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("LLM did not return parseable JSON");
  }
}

function validateSections(parsed: unknown): {
  ok: boolean;
  missing: string[];
} {
  const sections =
    parsed &&
    typeof parsed === "object" &&
    "sections" in parsed &&
    (parsed as { sections: unknown }).sections &&
    typeof (parsed as { sections: unknown }).sections === "object"
      ? ((parsed as { sections: Record<string, unknown> }).sections as Record<
          string,
          unknown
        >)
      : null;
  if (!sections) return { ok: false, missing: [...WORK_NARRATIVE_SECTION_IDS] };
  const missing = WORK_NARRATIVE_SECTION_IDS.filter((id) => !sections[id]);
  return { ok: missing.length === 0, missing };
}

async function callLlm(params: {
  system: string;
  user: string;
}): Promise<{ raw: string; parsed: unknown; model: string }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY missing");
  }
  const openai = new OpenAI({ apiKey: key });
  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: params.system },
      { role: "user", content: params.user },
    ],
    temperature: 0.55,
    max_tokens: 6000,
    response_format: { type: "json_object" },
  });
  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  return { raw, parsed: parseNarrativeJson(raw), model: MODEL };
}

async function runPair(
  fixture: (typeof PILOT_FIXTURES)[number],
  opts: {
    aOnly: boolean;
    cOnly: boolean;
    cRefined: boolean;
    cPackageRefined: boolean;
    cBilingual: boolean;
  },
) {
  const sajuA = sajuFromBirth(fixture.birthA, fixture.timeA ?? "12:00");
  const sajuB = sajuFromBirth(fixture.birthB, fixture.timeB ?? "12:00");

  const report = buildWorkColleagueReport({
    nicknameA: fixture.nicknameA,
    nicknameB: fixture.nicknameB,
    sajuJsonA: sajuA,
    sajuJsonB: sajuB,
    psychMasterA: fixture.psychA,
    psychMasterB: fixture.psychB,
    workSignalsA: fixture.workSignalsA,
    workSignalsB: fixture.workSignalsB,
    locale: fixture.locale,
  });

  const baseline = extractDeterministicBaseline({
    pair_id: fixture.pair_id,
    category: fixture.category,
    nicknameA: fixture.nicknameA,
    nicknameB: fixture.nicknameB,
    locale: fixture.locale,
    report,
  });

  const pkgB = buildWorkPilotContextPackage({
    pair_id: fixture.pair_id,
    category: fixture.category,
    nicknameA: fixture.nicknameA,
    nicknameB: fixture.nicknameB,
    sajuJsonA: sajuA,
    sajuJsonB: sajuB,
    psychMasterA: fixture.psychA,
    psychMasterB: fixture.psychB,
    workSignalsA: fixture.workSignalsA,
    workSignalsB: fixture.workSignalsB,
    locale: fixture.locale,
    report,
    variant: "B",
  });

  const pkgC = buildWorkPilotContextPackage({
    pair_id: fixture.pair_id,
    category: fixture.category,
    nicknameA: fixture.nicknameA,
    nicknameB: fixture.nicknameB,
    sajuJsonA: sajuA,
    sajuJsonB: sajuB,
    psychMasterA: fixture.psychA,
    psychMasterB: fixture.psychB,
    workSignalsA: fixture.workSignalsA,
    workSignalsB: fixture.workSignalsB,
    locale: fixture.locale,
    report,
    variant: "C",
  });

  const pairDir = path.join(OUT_ROOT, fixture.pair_id);
  ensureDir(pairDir);

  // Preserve previous Variant C for Batch III diff review
  const prevC = path.join(pairDir, "variant_C_narrative.json");
  if (opts.cOnly && fs.existsSync(prevC)) {
    fs.copyFileSync(
      prevC,
      path.join(pairDir, "variant_C_narrative.pre_batch3.json"),
    );
  }

  if (
    !opts.cOnly &&
    !opts.cRefined &&
    !opts.cPackageRefined &&
    !opts.cBilingual
  ) {
    const inputSummary = {
      pair_id: fixture.pair_id,
      category: fixture.category,
      description: fixture.description,
      nicknames: [fixture.nicknameA, fixture.nicknameB],
      locale: fixture.locale,
      births: { a: fixture.birthA, b: fixture.birthB },
      note: "Synthetic fixture — not production user data",
    };

    writeJson(path.join(pairDir, "00_input_summary.json"), inputSummary);
    writeJson(path.join(pairDir, "variant_A_deterministic.json"), baseline);
    writeJson(
      path.join(pairDir, "context_package_B.json"),
      sanitizeForReview(pkgB),
    );
    writeJson(
      path.join(pairDir, "checklist_canonical_binding.json"),
      canonicalBindingChecklist(pkgC.binding_truth, baseline),
    );
    writeJson(
      path.join(pairDir, "checklist_psych_saju.json"),
      psychSajuContradictionChecklist(baseline),
    );
    writeJson(
      path.join(pairDir, "checklist_duplication.json"),
      duplicationChecklist(),
    );
    writeJson(path.join(pairDir, "rubric_scores_blank.json"), {
      A: emptyRubricScoreSheet(fixture.pair_id, "A"),
      B: emptyRubricScoreSheet(fixture.pair_id, "B"),
      C: emptyRubricScoreSheet(fixture.pair_id, "C"),
    });
    fs.writeFileSync(
      path.join(pairDir, "rubric_sheet.md"),
      rubricMarkdownTemplate(fixture.pair_id),
      "utf8",
    );
  }

  writeJson(
    path.join(pairDir, "context_package_C.json"),
    sanitizeForReview(pkgC),
  );

  let variantB: unknown = null;
  let variantC: unknown = null;
  let llmMeta: Record<string, unknown> = { skipped: opts.aOnly };

  if (opts.aOnly) {
    writeJson(path.join(pairDir, "variant_B_narrative.json"), {
      skipped: true,
      reason: "--a-only",
    });
    writeJson(path.join(pairDir, "variant_C_narrative.json"), {
      skipped: true,
      reason: "--a-only",
    });
  } else if (opts.cBilingual) {
    const canHash = canonicalHash(pkgC);
    const ctxHash = contextHash(pkgC);
    writeJson(
      path.join(pairDir, "context_C_bilingual_shared.json"),
      sanitizeForReview(pkgC),
    );
    writeJson(
      path.join(pairDir, "bilingual_rubric_blank.json"),
      emptyBilingualRubric(fixture.pair_id),
    );
    fs.writeFileSync(
      path.join(pairDir, "bilingual_rubric_sheet.md"),
      bilingualRubricMarkdown(fixture.pair_id),
      "utf8",
    );

    const locales: PilotNarrativeLocale[] = ["ko-KR", "en-US"];
    const localeMeta: Record<string, unknown> = {};
    for (const locale of locales) {
      const cRes = await callLlm({
        system: buildVariantCVoiceSystemPrompt(locale),
        user: buildVariantUserPrompt(pkgC, { outputLocale: locale }),
      });
      const cVal = validateSections(cRes.parsed);
      variantC = cRes.parsed;
      const outName = `variant_C_package_refined_${locale}.json`;
      writeJson(path.join(pairDir, outName), {
        locale,
        model: cRes.model,
        prompt_batch: "V1_stabilize",
        package_schema: pkgC.schema_version,
        voice_policy_version: VOICE_POLICY_VERSION,
        canonical_hash: canHash,
        context_hash: ctxHash,
        sections_valid: cVal.ok,
        missing_sections: cVal.missing,
        narrative: cRes.parsed,
        note: "V1 stabilize bilingual — does not overwrite prior C / IV artifacts",
      });
      localeMeta[locale] = {
        file: outName,
        sections_valid: cVal.ok,
        canonical_hash: canHash,
        context_hash: ctxHash,
      };
      console.log(`  ${locale} → ${outName}`);
    }
    llmMeta = {
      model: MODEL,
      c_bilingual: true,
      prompt_batch: "V1_stabilize",
      package_schema: pkgC.schema_version,
      voice_policy_version: VOICE_POLICY_VERSION,
      canonical_hash: canHash,
      context_hash: ctxHash,
      locales: localeMeta,
    };
  } else if (opts.cPackageRefined) {
    writeJson(
      path.join(pairDir, "context_C_package_refined.json"),
      sanitizeForReview(pkgC),
    );
    const cRes = await callLlm({
      system: buildVariantCSystemPrompt(fixture.locale),
      user: buildVariantUserPrompt(pkgC),
    });
    const cVal = validateSections(cRes.parsed);
    variantC = cRes.parsed;
    writeJson(path.join(pairDir, "variant_C_package_refined_narrative.json"), {
      model: cRes.model,
      prompt_batch: "IV_package",
      package_schema: pkgC.schema_version,
      sections_valid: cVal.ok,
      missing_sections: cVal.missing,
      narrative: cRes.parsed,
      note: "Package-refined C — does not overwrite prior C artifacts",
    });
    llmMeta = {
      model: MODEL,
      c_package_refined: true,
      prompt_batch: "IV_package",
      package_schema: pkgC.schema_version,
      variant_C_package_refined_sections_valid: cVal.ok,
      contrast_supported:
        pkgC.evidence_sources.communication_signals.contrast_supported,
    };
  } else if (opts.cRefined) {
    const cRes = await callLlm({
      system: buildVariantCSystemPrompt(fixture.locale),
      user: buildVariantUserPrompt(pkgC),
    });
    const cVal = validateSections(cRes.parsed);
    variantC = cRes.parsed;
    writeJson(path.join(pairDir, "variant_C_refined_narrative.json"), {
      model: cRes.model,
      prompt_batch: "III_synthesis",
      sections_valid: cVal.ok,
      missing_sections: cVal.missing,
      narrative: cRes.parsed,
      note: "Refined C — does not overwrite variant_C_narrative.json",
    });
    llmMeta = {
      model: MODEL,
      c_refined: true,
      prompt_batch: "III_synthesis",
      variant_C_refined_sections_valid: cVal.ok,
      preserved_baseline_c: fs.existsSync(prevC),
    };
  } else if (opts.cOnly) {
    const cRes = await callLlm({
      system: buildVariantCSystemPrompt(fixture.locale),
      user: buildVariantUserPrompt(pkgC),
    });
    const cVal = validateSections(cRes.parsed);
    variantC = cRes.parsed;
    writeJson(path.join(pairDir, "variant_C_narrative.json"), {
      model: cRes.model,
      prompt_batch: "III",
      sections_valid: cVal.ok,
      missing_sections: cVal.missing,
      narrative: cRes.parsed,
    });
    llmMeta = {
      model: MODEL,
      c_only: true,
      prompt_batch: "III",
      variant_C_sections_valid: cVal.ok,
    };
  } else {
    const bRes = await callLlm({
      system: buildVariantBSystemPrompt(fixture.locale),
      user: buildVariantUserPrompt(pkgB),
    });
    const bVal = validateSections(bRes.parsed);
    variantB = bRes.parsed;
    writeJson(path.join(pairDir, "variant_B_narrative.json"), {
      model: bRes.model,
      sections_valid: bVal.ok,
      missing_sections: bVal.missing,
      narrative: bRes.parsed,
    });

    const cRes = await callLlm({
      system: buildVariantCSystemPrompt(fixture.locale),
      user: buildVariantUserPrompt(pkgC),
    });
    const cVal = validateSections(cRes.parsed);
    variantC = cRes.parsed;
    writeJson(path.join(pairDir, "variant_C_narrative.json"), {
      model: cRes.model,
      sections_valid: cVal.ok,
      missing_sections: cVal.missing,
      narrative: cRes.parsed,
    });

    llmMeta = {
      model: MODEL,
      variant_B_sections_valid: bVal.ok,
      variant_C_sections_valid: cVal.ok,
    };
  }

  const reviewIndex = {
    pair_id: fixture.pair_id,
    category: fixture.category,
    artifacts: fs.readdirSync(pairDir),
    llm: llmMeta,
    production_behavior_changed: false,
  };
  writeJson(path.join(pairDir, "review_index.json"), reviewIndex);

  return {
    pair_id: fixture.pair_id,
    dir: pairDir,
    hasNarrative:
      opts.cOnly ||
      opts.cRefined ||
      opts.cPackageRefined ||
      opts.cBilingual
        ? Boolean(variantC)
        : Boolean(variantB && variantC),
  };
}

async function main() {
  const {
    aOnly,
    cOnly,
    cRefined,
    cPackageRefined,
    cBilingual,
    pairFilter,
  } = parseArgs(process.argv.slice(2));
  ensureDir(OUT_ROOT);

  if (
    [aOnly, cOnly, cRefined, cPackageRefined, cBilingual].filter(Boolean)
      .length > 1
  ) {
    console.error(
      "Use only one of --a-only, --c-only, --c-refined, --c-package-refined, or --c-bilingual",
    );
    process.exitCode = 1;
    return;
  }

  if (!aOnly && !process.env.OPENAI_API_KEY) {
    console.error(
      "PILOT_BLOCKED_BY_LLM_CONFIGURATION: OPENAI_API_KEY not set. Use --a-only to emit Variant A + context packages without LLM.",
    );
    process.exitCode = 2;
    return;
  }

  const fixtures = pairFilter
    ? PILOT_FIXTURES.filter((f) => f.pair_id === pairFilter)
    : PILOT_FIXTURES;

  if (fixtures.length === 0) {
    console.error("No fixtures matched.");
    process.exitCode = 1;
    return;
  }

  console.log(
    `Work narrative pilot — ${fixtures.length} pair(s), aOnly=${aOnly}, cOnly=${cOnly}, cRefined=${cRefined}, cPackageRefined=${cPackageRefined}, cBilingual=${cBilingual}, model=${MODEL}`,
  );

  const results = [];
  for (const fx of fixtures) {
    console.log(`\n→ ${fx.pair_id} (${fx.category})`);
    const r = await runPair(fx, {
      aOnly,
      cOnly,
      cRefined,
      cPackageRefined,
      cBilingual,
    });
    console.log(`  wrote ${r.dir}`);
    results.push(r);
  }

  writeJson(path.join(OUT_ROOT, "run_manifest.json"), {
    created_at: new Date().toISOString(),
    a_only: aOnly,
    c_only: cOnly,
    c_refined: cRefined,
    c_package_refined: cPackageRefined,
    c_bilingual: cBilingual,
    model: aOnly ? null : MODEL,
    voice_policy_version: cBilingual ? VOICE_POLICY_VERSION : undefined,
    results,
    production_behavior_changed: false,
  });

  console.log(`\nDone. Artifacts under ${OUT_ROOT}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
