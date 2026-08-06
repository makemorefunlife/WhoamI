import {
  FORBIDDEN_ENTRY_KEYS,
  REFERENCE_DICTIONARY_SOURCE,
  REFERENCE_DICTIONARY_VERSION,
  type DictionaryCategory,
} from "./constants";
import {
  ELEMENT_BASE,
  GONGMANG_BASE,
  HIDDEN_LAYER_BASE,
  JOHU_MOIST_BASE,
  JOHU_TEMP_BASE,
  PILLAR_SLOT_BASE,
  RELATION_TYPE_BASE,
  SPECIAL_SIGNAL_BASE,
  STRENGTH_BASE,
  TEN_GOD_FALLBACK_BASE,
} from "./curatedBases";
import {
  NOBLE_NAME_TO_ID,
  RELATION_TYPE_IDS,
  SPECIAL_SIGNAL_IDS,
} from "../individualSaju/constants";
import {
  branchReferenceId,
  hiddenStemReferenceId,
  relationReferenceId,
  shinsalReferenceId,
  shinsalSlug,
  stemReferenceId,
  tenGodReferenceId,
  twelveStageReferenceId,
} from "../individualSaju/refIds";
import {
  REF_EARTHLY_BRANCHES,
  REF_HEAVENLY_STEMS,
  REF_HIDDEN_STEMS,
  REF_RELATION_RULES,
  REF_SHINSAL,
  REF_TEN_GODS,
  REF_TWELVE_STAGES,
} from "@/lib/hardcoded/sajuReferenceData";
import type {
  LocalizedText,
  ReferenceDictionary,
  ReferenceEntry,
  ReferenceLimits,
} from "./types";

const LIMITS: ReferenceLimits = {
  allows_domain_lens: false,
  allows_advice: false,
  allows_narrative: false,
};

function text(ko: string, en?: string | null): LocalizedText {
  const out: LocalizedText = { ko: ko.trim() };
  if (en && String(en).trim()) out.en = String(en).trim();
  return out;
}

function entry(partial: Omit<ReferenceEntry, "limits">): ReferenceEntry {
  return { ...partial, limits: LIMITS };
}

function pushUnique(
  list: ReferenceEntry[],
  seen: Set<string>,
  e: ReferenceEntry,
): void {
  if (seen.has(e.reference_id)) {
    throw new Error(`duplicate reference_id: ${e.reference_id}`);
  }
  seen.add(e.reference_id);
  list.push(e);
}

function assertNoForbiddenKeys(e: ReferenceEntry): void {
  const blob = JSON.stringify(e).toLowerCase();
  for (const key of FORBIDDEN_ENTRY_KEYS) {
    // Structural limits flags mention "advice" / "narrative" — skip those keys on limits.
    if ((key as string) === "advice" || key === "narrative") continue;
    if (key.endsWith("_ko") || key.endsWith("_en")) {
      if (Object.prototype.hasOwnProperty.call(e, key)) {
        throw new Error(`${e.reference_id} leaked forbidden field ${key}`);
      }
      // also reject nested property names in JSON except limits booleans
      const re = new RegExp(`"${key}"\\s*:`);
      if (re.test(JSON.stringify(e))) {
        throw new Error(`${e.reference_id} leaked forbidden field ${key}`);
      }
    } else if (
      key === "romantic" ||
      key === "marriage" ||
      key === "friend" ||
      key === "family" ||
      key === "work"
    ) {
      // category_tag may say "relationship" from shinsal — allowed as REF category tag.
      // Block only product domain keys as top-level fields.
      continue;
    } else if (key === "prompt" && blob.includes('"prompt"')) {
      throw new Error(`${e.reference_id} leaked prompt field`);
    }
  }
}

function buildStemEntries(list: ReferenceEntry[], seen: Set<string>): void {
  for (const row of REF_HEAVENLY_STEMS) {
    const code = row.code as string;
    const kor = (row.kor_name as string) ?? code;
    const hanja = (row.hanja as string | null) ?? null;
    const element = (row.element as string) ?? "";
    const yin = (row.yin_yang as string) ?? "";
    const metaphorKo = (row.metaphor_ko as string | null) ?? null;
    const metaphorEn = (row.metaphor_en as string | null) ?? null;
    const baseKo = [
      hanja ? `${hanja}${kor}` : kor,
      element && yin ? `${yin} ${element}` : null,
      metaphorKo ? `상징 ${metaphorKo}` : null,
    ]
      .filter(Boolean)
      .join(". ");
    const baseEn = [
      (row.eng_name as string) ?? code,
      element && yin ? `${yin} ${element}` : null,
      metaphorEn ? `symbol: ${metaphorEn}` : null,
    ]
      .filter(Boolean)
      .join(". ");
    pushUnique(
      list,
      seen,
      entry({
        reference_id: stemReferenceId(code),
        category: "stem",
        base_meaning: text(baseKo, baseEn),
        aliases: {
          kor_name: kor,
          hanja,
          eng_name: (row.eng_name as string | null) ?? null,
          symbol_ko: metaphorKo,
          symbol_en: metaphorEn,
        },
        display: {
          order: (row.order_no as number | null) ?? null,
          yin_yang: yin || null,
          element: element || null,
        },
        provenance: {
          source: REFERENCE_DICTIONARY_SOURCE,
          version: REFERENCE_DICTIONARY_VERSION,
          upstream_ref: "REF_HEAVENLY_STEMS",
        },
      }),
    );
  }
}

function buildBranchEntries(list: ReferenceEntry[], seen: Set<string>): void {
  for (const row of REF_EARTHLY_BRANCHES) {
    const code = row.code as string;
    const meaningKo = (row.meaning_ko as string | null)?.trim();
    const meaningEn = (row.meaning_en as string | null)?.trim();
    const kor = (row.kor_name as string) ?? code;
    const hanja = (row.hanja as string | null) ?? null;
    const baseKo =
      meaningKo ||
      [hanja ? `${hanja}${kor}` : kor, row.element, row.season]
        .filter(Boolean)
        .join(". ");
    pushUnique(
      list,
      seen,
      entry({
        reference_id: branchReferenceId(code),
        category: "branch",
        base_meaning: text(baseKo, meaningEn || undefined),
        aliases: {
          kor_name: kor,
          hanja,
          eng_name: (row.eng_name as string | null) ?? null,
          symbol_ko: (row.metaphor_ko as string | null) ?? null,
          symbol_en: (row.metaphor_en as string | null) ?? null,
        },
        display: {
          order: (row.order_no as number | null) ?? null,
          yin_yang: (row.yin_yang as string | null) ?? null,
          element: (row.element as string | null) ?? null,
          season: (row.season as string | null) ?? null,
          zodiac_en: (row.zodiac_en as string | null) ?? null,
        },
        provenance: {
          source: REFERENCE_DICTIONARY_SOURCE,
          version: REFERENCE_DICTIONARY_VERSION,
          upstream_ref: "REF_EARTHLY_BRANCHES",
        },
      }),
    );
  }
}

function buildTenGodEntries(list: ReferenceEntry[], seen: Set<string>): void {
  for (const row of REF_TEN_GODS) {
    const code = row.code as string;
    const meaningKo = (row.meaning_ko as string | null)?.trim();
    const meaningEn = (row.meaning_en as string | null)?.trim();
    const fallback = TEN_GOD_FALLBACK_BASE[code];
    const base =
      meaningKo != null && meaningKo.length > 0
        ? text(meaningKo, meaningEn)
        : fallback ??
          text(
            `${(row.kor_name as string) ?? code}. 십성 코드 ${code}.`,
            (row.eng_name as string) ?? code,
          );
    pushUnique(
      list,
      seen,
      entry({
        reference_id: tenGodReferenceId(code),
        category: "ten_god",
        base_meaning: base,
        aliases: {
          kor_name: (row.kor_name as string | null) ?? null,
          hanja: (row.hanja as string | null) ?? null,
          eng_name: (row.eng_name as string | null) ?? null,
        },
        display: {
          order: (row.display_order as number | null) ?? null,
          category_tag: (row.category as string | null) ?? null,
        },
        provenance: {
          source: REFERENCE_DICTIONARY_SOURCE,
          version: REFERENCE_DICTIONARY_VERSION,
          upstream_ref: "REF_TEN_GODS",
        },
      }),
    );
  }
}

function buildTwelveStageEntries(
  list: ReferenceEntry[],
  seen: Set<string>,
): void {
  for (const row of REF_TWELVE_STAGES) {
    const code = row.code as string;
    const meaningKo = (row.meaning_ko as string | null)?.trim();
    const meaningEn = (row.meaning_en as string | null)?.trim();
    const kor = (row.kor_name as string) ?? code;
    // Keep stage definition; strip nothing that is advice_* (those fields are omitted).
    const baseKo = meaningKo || `${kor}. 12운성 단계.`;
    pushUnique(
      list,
      seen,
      entry({
        reference_id: twelveStageReferenceId(code),
        category: "twelve_stage",
        base_meaning: text(baseKo, meaningEn || undefined),
        aliases: {
          kor_name: kor,
          hanja: (row.hanja as string | null) ?? null,
          eng_name: (row.eng_name as string | null) ?? null,
        },
        display: {
          order: (row.display_order as number | null) ?? null,
          energy_level: (row.energy_level as string | null) ?? null,
        },
        provenance: {
          source: REFERENCE_DICTIONARY_SOURCE,
          version: REFERENCE_DICTIONARY_VERSION,
          upstream_ref: "REF_TWELVE_STAGES",
        },
      }),
    );
  }
}

function buildHiddenStemEntries(
  list: ReferenceEntry[],
  seen: Set<string>,
): void {
  for (const row of REF_HIDDEN_STEMS) {
    const branch = row.branch_code as string;
    const stem = row.stem_code as string;
    const layer = row.layer_type as string;
    const id = hiddenStemReferenceId(branch, stem, layer);
    // Factual composition only — REF personality meaning_* excluded (CE/legacy).
    pushUnique(
      list,
      seen,
      entry({
        reference_id: id,
        category: "hidden_stem",
        base_meaning: text(
          `지지 ${branch}의 ${layer} 지장간 ${stem}.`,
          `Hidden stem ${stem} (${layer}) in branch ${branch}.`,
        ),
        aliases: {},
        display: {
          order: (row.display_order as number | null) ?? null,
          category_tag: layer,
        },
        provenance: {
          source: REFERENCE_DICTIONARY_SOURCE,
          version: REFERENCE_DICTIONARY_VERSION,
          upstream_ref: "REF_HIDDEN_STEMS",
        },
      }),
    );
  }
}

function buildShinsalAndNobleEntries(
  list: ReferenceEntry[],
  seen: Set<string>,
): void {
  for (const row of REF_SHINSAL) {
    const id = row.id as number;
    const nameKo = row.name_ko as string;
    const meaningKo = (row.meaning_ko as string | null)?.trim();
    const meaningEn = (row.meaning_en as string | null)?.trim();
    const baseKo = meaningKo || `${nameKo}. 신살.`;
    const refId = shinsalReferenceId(id);
    pushUnique(
      list,
      seen,
      entry({
        reference_id: refId,
        category: "shinsal",
        base_meaning: text(baseKo, meaningEn || undefined),
        aliases: {
          kor_name: nameKo,
          hanja: (row.name_hanja as string | null) ?? null,
          eng_name: (row.name_en as string | null) ?? null,
          slug: shinsalSlug(nameKo),
        },
        display: {
          order: (row.display_order as number | null) ?? null,
          category_tag: (row.category as string | null) ?? null,
        },
        provenance: {
          source: REFERENCE_DICTIONARY_SOURCE,
          version: REFERENCE_DICTIONARY_VERSION,
          upstream_ref: "REF_SHINSAL",
        },
      }),
    );

    const nobleId = NOBLE_NAME_TO_ID[nameKo];
    if (nobleId) {
      pushUnique(
        list,
        seen,
        entry({
          reference_id: `noble:${nobleId}`,
          category: "noble",
          base_meaning: text(baseKo, meaningEn || undefined),
          aliases: {
            kor_name: nameKo,
            hanja: (row.name_hanja as string | null) ?? null,
            eng_name: (row.name_en as string | null) ?? null,
            slug: nobleId,
          },
          display: {
            order: (row.display_order as number | null) ?? null,
            category_tag: (row.category as string | null) ?? null,
          },
          provenance: {
            source: REFERENCE_DICTIONARY_SOURCE,
            version: REFERENCE_DICTIONARY_VERSION,
            upstream_ref: `REF_SHINSAL#${id}`,
          },
        }),
      );
    }
  }
}

function buildRelationPairEntries(
  list: ReferenceEntry[],
  seen: Set<string>,
): void {
  for (const row of REF_RELATION_RULES) {
    const id = row.id as number;
    const type = row.relation_type as string;
    const typeBase = RELATION_TYPE_BASE[type];
    const desc = (row.description as string | null)?.trim();
    const a = row.code_a as string;
    const b = row.code_b as string;
    // Structural only — REF meaning_ko/en are interpretive → not imported.
    const baseKo = [
      desc || `${type}`,
      typeBase?.ko,
      `${a}+${b}`,
    ]
      .filter(Boolean)
      .join(" — ");
    const baseEn = [
      desc || type,
      typeBase?.en,
      `${a}+${b}`,
    ]
      .filter(Boolean)
      .join(" — ");
    pushUnique(
      list,
      seen,
      entry({
        reference_id: relationReferenceId(id),
        category: "relation_pair",
        base_meaning: text(baseKo, baseEn),
        aliases: {
          kor_name: desc ?? null,
          slug: type,
        },
        display: {
          order: (row.priority_score as number | null) ?? null,
          category_tag: type,
        },
        provenance: {
          source: REFERENCE_DICTIONARY_SOURCE,
          version: REFERENCE_DICTIONARY_VERSION,
          upstream_ref: "REF_RELATION_RULES",
        },
      }),
    );
  }
}

function buildCuratedCatalog(
  list: ReferenceEntry[],
  seen: Set<string>,
): void {
  const add = (
    reference_id: string,
    category: DictionaryCategory,
    base: LocalizedText,
    upstream_ref: string,
    display: ReferenceEntry["display"] = {},
    aliases: ReferenceEntry["aliases"] = {},
  ) => {
    pushUnique(
      list,
      seen,
      entry({
        reference_id,
        category,
        base_meaning: base,
        aliases,
        display,
        provenance: {
          source: REFERENCE_DICTIONARY_SOURCE,
          version: REFERENCE_DICTIONARY_VERSION,
          upstream_ref,
        },
      }),
    );
  };

  for (const [code, base] of Object.entries(ELEMENT_BASE)) {
    add(`element:${code}`, "element", base, "curated:ELEMENT_BASE", {
      element: code,
    });
  }
  for (const [code, base] of Object.entries(HIDDEN_LAYER_BASE)) {
    add(`hidden_layer:${code}`, "hidden_layer", base, "curated:HIDDEN_LAYER_BASE", {
      category_tag: code,
    });
  }
  for (const [code, base] of Object.entries(RELATION_TYPE_BASE)) {
    add(`relation_type:${code}`, "relation_type", base, "curated:RELATION_TYPE_BASE", {
      category_tag: code,
    });
  }
  // Mirror Individual RELATION_TYPE_IDS Korean labels as aliases where missing.
  for (const [ko, typeId] of Object.entries(RELATION_TYPE_IDS)) {
    const id = `relation_type:${typeId}`;
    if (!seen.has(id)) {
      add(
        id,
        "relation_type",
        text(`${ko}. 원국 관계 유형.`, `Relation type ${typeId}.`),
        "individualSaju.RELATION_TYPE_IDS",
        { category_tag: typeId },
        { kor_name: ko, slug: typeId },
      );
    } else {
      const existing = list.find((e) => e.reference_id === id);
      if (existing && !existing.aliases.kor_name) {
        existing.aliases.kor_name = ko;
      }
    }
  }
  for (const [code, base] of Object.entries(STRENGTH_BASE)) {
    add(`strength:${code}`, "strength", base, "curated:STRENGTH_BASE");
  }
  for (const [code, base] of Object.entries(JOHU_TEMP_BASE)) {
    add(`johu_temp:${code}`, "johu_temp", base, "curated:JOHU_TEMP_BASE");
  }
  for (const [code, base] of Object.entries(JOHU_MOIST_BASE)) {
    add(`johu_moist:${code}`, "johu_moist", base, "curated:JOHU_MOIST_BASE");
  }
  for (const [code, base] of Object.entries(PILLAR_SLOT_BASE)) {
    add(`pillar_slot:${code}`, "pillar_slot", base, "curated:PILLAR_SLOT_BASE", {
      category_tag: code,
    });
  }
  for (const code of SPECIAL_SIGNAL_IDS) {
    const base = SPECIAL_SIGNAL_BASE[code] ?? text(`특수 신호 ${code}.`);
    add(`special:${code}`, "special_signal", base, "curated:SPECIAL_SIGNAL_BASE");
  }
  add("gongmang:void", "gongmang", GONGMANG_BASE, "curated:GONGMANG_BASE");
}

/**
 * Build the production Reference Dictionary catalog (immutable snapshot).
 */
export function buildReferenceDictionary(
  nowIso: string = new Date().toISOString(),
): ReferenceDictionary {
  const list: ReferenceEntry[] = [];
  const seen = new Set<string>();

  buildCuratedCatalog(list, seen);
  buildStemEntries(list, seen);
  buildBranchEntries(list, seen);
  buildTenGodEntries(list, seen);
  buildTwelveStageEntries(list, seen);
  buildHiddenStemEntries(list, seen);
  buildShinsalAndNobleEntries(list, seen);
  buildRelationPairEntries(list, seen);

  for (const e of list) assertNoForbiddenKeys(e);

  const by_id: Record<string, ReferenceEntry> = {};
  for (const e of list) by_id[e.reference_id] = e;

  return {
    schema_version: REFERENCE_DICTIONARY_VERSION,
    built_at: nowIso,
    entry_count: list.length,
    entries: list,
    by_id,
  };
}

let cached: ReferenceDictionary | null = null;

/** Process-local singleton catalog. */
export function getReferenceDictionary(): ReferenceDictionary {
  if (!cached) cached = buildReferenceDictionary();
  return cached;
}

/** Test helper — drop singleton. */
export function resetReferenceDictionaryCache(): void {
  cached = null;
}
