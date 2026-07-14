import { NextResponse } from "next/server";

export const MAX_JSON_BODY_BYTES = 64 * 1024;
export const MAX_NAME_LEN = 80;
export const MAX_LLM_INPUT_CHARS = 12_000;
export const MAX_SURVEY_ANSWER_LEN = 200;
export const MAX_SURVEY_KEYS = 20;
export const MAX_BIRTH_PLACE_LEN = 200;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const ALLOWED_RELATIONSHIP_KINDS = [
  "romantic",
  "work",
  "cohabitation",
  "friendship",
  "family",
] as const;

export type RelationshipKind = (typeof ALLOWED_RELATIONSHIP_KINDS)[number];

export const ALLOWED_ANALYSIS_TYPES = ["basic", "premium"] as const;
export type AnalysisType = (typeof ALLOWED_ANALYSIS_TYPES)[number];

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function requireUuid(
  value: unknown,
  fieldName = "id",
): { ok: true; value: string } | { ok: false; response: NextResponse } {
  if (typeof value !== "string" || !isUuid(value.trim())) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `invalid ${fieldName}` },
        { status: 400 },
      ),
    };
  }
  return { ok: true, value: value.trim() };
}

/** YYYY-MM-DD within 1900-01-01 .. today+1day */
export function parseBirthDate(
  value: unknown,
): { ok: true; value: string } | { ok: false; response: NextResponse } {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "invalid birth_date" },
        { status: 400 },
      ),
    };
  }
  const s = value.trim();
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "invalid birth_date" },
        { status: 400 },
      ),
    };
  }
  const min = new Date("1900-01-01T00:00:00Z");
  const max = new Date();
  max.setUTCDate(max.getUTCDate() + 1);
  if (d < min || d > max) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "birth_date out of range" },
        { status: 400 },
      ),
    };
  }
  return { ok: true, value: s };
}

/** HH:MM or HH:MM:SS */
export function parseBirthTime(
  value: unknown,
): { ok: true; value: string | null } | { ok: false; response: NextResponse } {
  if (value == null || value === "") return { ok: true, value: null };
  if (typeof value !== "string") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "invalid birth_time" },
        { status: 400 },
      ),
    };
  }
  const s = value.trim();
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(s)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "invalid birth_time" },
        { status: 400 },
      ),
    };
  }
  const [hh, mm, ss = "00"] = s.split(":");
  const h = Number(hh);
  const m = Number(mm);
  const sec = Number(ss);
  if (h > 23 || m > 59 || sec > 59) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "invalid birth_time" },
        { status: 400 },
      ),
    };
  }
  return { ok: true, value: `${hh}:${mm}:${ss}` };
}

export function parseLatLng(
  lat: unknown,
  lng: unknown,
):
  | { ok: true; lat: number; lng: number }
  | { ok: false; response: NextResponse } {
  const la = typeof lat === "number" ? lat : Number(lat);
  const ln = typeof lng === "number" ? lng : Number(lng);
  if (
    !Number.isFinite(la) ||
    !Number.isFinite(ln) ||
    la < -90 ||
    la > 90 ||
    ln < -180 ||
    ln > 180
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "invalid coordinates" },
        { status: 400 },
      ),
    };
  }
  return { ok: true, lat: la, lng: ln };
}

export function parseBoundedString(
  value: unknown,
  maxLen: number,
  fieldName: string,
  opts?: { required?: boolean },
): { ok: true; value: string } | { ok: false; response: NextResponse } {
  if (value == null || value === "") {
    if (opts?.required) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: `${fieldName} required` },
          { status: 400 },
        ),
      };
    }
    return { ok: true, value: "" };
  }
  if (typeof value !== "string") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `invalid ${fieldName}` },
        { status: 400 },
      ),
    };
  }
  const s = value.trim();
  if (s.length > maxLen) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `${fieldName} too long` },
        { status: 400 },
      ),
    };
  }
  return { ok: true, value: s };
}

export function parseSurveyAnswers(
  raw: unknown,
):
  | { ok: true; value: Record<string, string> }
  | { ok: false; response: NextResponse } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "invalid survey answers" },
        { status: 400 },
      ),
    };
  }
  const entries = Object.entries(raw as Record<string, unknown>);
  if (entries.length > MAX_SURVEY_KEYS) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "too many survey answers" },
        { status: 400 },
      ),
    };
  }
  const out: Record<string, string> = {};
  for (const [k, v] of entries) {
    if (!/^q\d+$/i.test(k) && k !== "survey_source") continue;
    if (typeof v !== "string") {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "invalid survey answer" },
          { status: 400 },
        ),
      };
    }
    if (v.length > MAX_SURVEY_ANSWER_LEN) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "survey answer too long" },
          { status: 400 },
        ),
      };
    }
    out[k] = v;
  }
  return { ok: true, value: out };
}

export function parseEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fieldName: string,
): { ok: true; value: T } | { ok: false; response: NextResponse } {
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `invalid ${fieldName}` },
        { status: 400 },
      ),
    };
  }
  return { ok: true, value: value as T };
}

export async function readJsonBodyLimited(
  req: Request,
  maxBytes = MAX_JSON_BODY_BYTES,
): Promise<
  | { ok: true; body: unknown }
  | { ok: false; response: NextResponse }
> {
  const contentLength = req.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json({ error: "payload too large" }, { status: 413 }),
    };
  }
  const text = await req.text();
  if (text.length > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json({ error: "payload too large" }, { status: 413 }),
    };
  }
  if (!text.trim()) {
    return { ok: true, body: {} };
  }
  try {
    return { ok: true, body: JSON.parse(text) as unknown };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "invalid json" }, { status: 400 }),
    };
  }
}

/** Strip client-controlled entitlement / identity fields from bodies. */
export function stripClientTrustFields(
  body: Record<string, unknown>,
): Record<string, unknown> {
  const clone = { ...body };
  for (const key of [
    "clerk_user_id",
    "user_id",
    "payment_status",
    "plan_type",
    "is_premium",
    "premium",
    "paid",
    "entitlement",
    "ownership",
    "model",
    "max_tokens",
    "maxTokens",
    "system_prompt",
    "systemPrompt",
    "analysis_level",
    "analysisLevel",
  ]) {
    delete clone[key];
  }
  return clone;
}
