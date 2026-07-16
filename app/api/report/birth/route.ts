import { auth } from "@clerk/nextjs/server";
import { logServerError, logServerEvent, maskId } from "@/lib/security/safeLog";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mergeBirthCoordinateFields, updateReportPatchSafely } from "@/lib/report/applyBirthCoordinatePatch";
import {
  BIRTH_DATE_CORRECTION_COLUMN,
  isBirthDateCorrectionUsed,
  isMissingBirthDateCorrectionColumnError,
} from "@/lib/report/birthDateCorrection";
import { resolveAstrologyCoordinates } from "@/lib/report/resolveAstrologyCoordinates";
import { assertGuestOrOwnerReportAccess } from "@/lib/report/assertGuestOrOwnerReportAccess";
import { deleteReportAnalysis } from "@/lib/report/reportAnalyses";
import { fetchReportWithBirthCoords } from "@/lib/report/fetchReportWithBirthCoords";
import { invalidatePersonCoreBlueprint } from "@/lib/personCore";
import { invalidateRelationshipPremiumsForReport } from "@/lib/relationship/invalidateRelationshipPremiums";
import { UNKNOWN_BIRTH_FALLBACK } from "@/lib/v2/onboarding/birthFallbackPolicy";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function routeLocale(req: Request) {
  return resolveRequestLocale({
    bodyLanguage: null,
    headerLanguage:
      req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
  });
}

type BirthBody = {
  reportId?: string;
  birthDate?: string | null;
  birthTime?: string | null;
  birthPlace?: string | null;
  birthTimeUnknown?: boolean;
  birthPlaceUnknown?: boolean;
  birthLatitude?: number;
  birthLongitude?: number;
};

/** reports 출생 조회 — 게스트 리포트도 reportId로 조회 가능 */
export async function GET(req: Request) {
  const locale = routeLocale(req);
  const messages = getMessages(locale);
  try {
    const reportId = new URL(req.url).searchParams.get("reportId")?.trim() ?? "";
    if (!reportId) {
      return NextResponse.json(
        { error: messages.errors.reportIdRequired },
        { status: 400 },
      );
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const { userId } = await auth();
    const access = await assertGuestOrOwnerReportAccess(
      supabase,
      reportId,
      userId,
      locale,
    );
    if (access.error) return access.error;

    const { report, error } = await fetchReportWithBirthCoords(
      supabase,
      reportId,
      BIRTH_DATE_CORRECTION_COLUMN,
    );
    if (error || !report) {
      return NextResponse.json(
        { error: error?.message ?? messages.errors.notFound },
        { status: 404 },
      );
    }

    const correctionUsedAt = report[BIRTH_DATE_CORRECTION_COLUMN];
    const correctionUsed =
      typeof correctionUsedAt === "string"
        ? isBirthDateCorrectionUsed(correctionUsedAt)
        : false;

    return NextResponse.json({
      ok: true,
      birth_date: report.birth_date ?? null,
      birth_time: report.birth_time ?? null,
      birth_place: report.birth_place ?? null,
      birth_date_correction_used_at:
        typeof correctionUsedAt === "string" ? correctionUsedAt : null,
      birth_date_correction_used: correctionUsed,
    });
  } catch (e) {
    logServerError("report/birth GET:", e, "internal_error");
    return NextResponse.json(
      { error: messages.errors.generic },
      { status: 500 },
    );
  }
}

/** reports 생년월일·시간·장소 저장 — 로그인 없이 게스트 리포트도 저장 가능 */
export async function POST(req: Request) {
  const locale = routeLocale(req);
  const messages = getMessages(locale);
  try {
    const body = (await req.json()) as BirthBody;
    const reportId =
      typeof body.reportId === "string" ? body.reportId.trim() : "";
    if (!reportId) {
      return NextResponse.json(
        { error: messages.errors.reportIdRequired },
        { status: 400 },
      );
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const { userId } = await auth();
    const access = await assertGuestOrOwnerReportAccess(
      supabase,
      reportId,
      userId,
      locale,
    );
    if (access.error) return access.error;

    const { report: existingReport, error: fetchErr } =
      await fetchReportWithBirthCoords(
        supabase,
        reportId,
        BIRTH_DATE_CORRECTION_COLUMN,
      );
    if (fetchErr || !existingReport) {
      return NextResponse.json(
        { error: fetchErr?.message ?? messages.errors.notFound },
        { status: 404 },
      );
    }

    const currentBirthTime =
      typeof existingReport.birth_time === "string"
        ? existingReport.birth_time.trim()
        : null;
    const currentBirthPlace =
      typeof existingReport.birth_place === "string"
        ? existingReport.birth_place.trim()
        : null;

    const birthTimeUnknown = body.birthTimeUnknown === true;
    const birthPlaceUnknown = body.birthPlaceUnknown === true;
    const birthPlace =
      typeof body.birthPlace === "string" && body.birthPlace.trim()
        ? body.birthPlace.trim()
        : null;

    const currentBirthDate =
      typeof existingReport.birth_date === "string"
        ? existingReport.birth_date.trim()
        : null;
    const requestedBirthDate =
      typeof body.birthDate === "string" && body.birthDate.trim()
        ? body.birthDate.trim()
        : currentBirthDate;

    const correctionUsedAt = existingReport[BIRTH_DATE_CORRECTION_COLUMN];
    const correctionAlreadyUsed =
      typeof correctionUsedAt === "string" &&
      isBirthDateCorrectionUsed(correctionUsedAt);

    const birthDateChanging = Boolean(
      currentBirthDate &&
        requestedBirthDate &&
        requestedBirthDate !== currentBirthDate,
    );

    if (birthDateChanging && correctionAlreadyUsed) {
      return NextResponse.json(
        { error: messages.errors.birthDateCorrectionUsed },
        { status: 403 },
      );
    }

    const basePatch = {
      birth_date: requestedBirthDate,
      birth_time:
        birthTimeUnknown
          ? null
          : typeof body.birthTime === "string" && body.birthTime.trim()
            ? body.birthTime.trim()
            : null,
      birth_place: birthPlaceUnknown
        ? birthPlace || UNKNOWN_BIRTH_FALLBACK.place
        : birthPlace,
      ...(birthDateChanging
        ? { [BIRTH_DATE_CORRECTION_COLUMN]: new Date().toISOString() }
        : {}),
    };

    const birthMateriallyChanged =
      (currentBirthDate ?? "") !== (basePatch.birth_date ?? "") ||
      (currentBirthTime ?? "") !== (basePatch.birth_time ?? "") ||
      (currentBirthPlace ?? "") !== (basePatch.birth_place ?? "");

    const hasClientCoords =
      typeof body.birthLatitude === "number" &&
      Number.isFinite(body.birthLatitude) &&
      typeof body.birthLongitude === "number" &&
      Number.isFinite(body.birthLongitude);

    const patch = birthPlaceUnknown
      ? {
          ...basePatch,
          birth_latitude: UNKNOWN_BIRTH_FALLBACK.latitude,
          birth_longitude: UNKNOWN_BIRTH_FALLBACK.longitude,
          birth_timezone: UNKNOWN_BIRTH_FALLBACK.timezone,
        }
      : hasClientCoords
      ? {
          ...basePatch,
          ...(() => {
            const resolved = resolveAstrologyCoordinates(
              {
                birth_place: basePatch.birth_place,
                birth_latitude: body.birthLatitude,
                birth_longitude: body.birthLongitude,
              },
              { reportId, logDefaultSeoul: false },
            );
            return {
              birth_latitude: resolved.latitude,
              birth_longitude: resolved.longitude,
              birth_timezone: resolved.timezone,
            };
          })(),
        }
      : mergeBirthCoordinateFields(basePatch, basePatch.birth_place);

    const upError = await saveBirthPatch(supabase, reportId, patch, birthDateChanging);
    if (upError) {
      return NextResponse.json({ error: upError.message }, { status: 500 });
    }

    await deleteReportAnalysis(supabase, reportId, "astrology");
    if (birthDateChanging || birthMateriallyChanged) {
      await deleteReportAnalysis(supabase, reportId, "integrated");
    }
    if (birthMateriallyChanged) {
      await Promise.all([
        invalidateRelationshipPremiumsForReport(supabase, reportId),
        invalidatePersonCoreBlueprint(reportId, supabase),
      ]);
    }

    return NextResponse.json({
      ok: true,
      ...patch,
      birth_date_correction_used:
        birthDateChanging || correctionAlreadyUsed,
      birth_date_correction_column_available:
        typeof correctionUsedAt === "string" || correctionAlreadyUsed,
      relationship_premium_invalidated: birthMateriallyChanged,
      person_core_invalidated: birthMateriallyChanged,
    });
  } catch (e) {
    logServerError("report/birth:", e, "internal_error");
    return NextResponse.json(
      { error: messages.errors.generic },
      { status: 500 },
    );
  }
}

/** correction 컬럼 미적용 DB — 생년월일 등은 저장하고 correction 필드만 제외 */
async function saveBirthPatch(
  supabase: SupabaseClient,
  reportId: string,
  patch: Record<string, unknown>,
  birthDateChanging: boolean,
): Promise<{ message?: string } | null> {
  let { error } = await updateReportPatchSafely(supabase, reportId, patch);

  if (
    error &&
    birthDateChanging &&
    BIRTH_DATE_CORRECTION_COLUMN in patch &&
    isMissingBirthDateCorrectionColumnError(error)
  ) {
    const withoutCorrection = { ...patch };
    delete withoutCorrection[BIRTH_DATE_CORRECTION_COLUMN];
    logServerEvent("report/birth", "correction_column_missing", {
      reportId: maskId(reportId),
    });
    const retry = await updateReportPatchSafely(
      supabase,
      reportId,
      withoutCorrection,
    );
    error = retry.error;
  }

  return error;
}

/** 출생 정보 초기화 */
export async function DELETE(req: Request) {
  const locale = routeLocale(req);
  const messages = getMessages(locale);
  try {
    const reportId = new URL(req.url).searchParams.get("reportId")?.trim() ?? "";
    if (!reportId) {
      return NextResponse.json(
        { error: messages.errors.reportIdRequired },
        { status: 400 },
      );
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const { userId } = await auth();
    const access = await assertGuestOrOwnerReportAccess(
      supabase,
      reportId,
      userId,
      locale,
    );
    if (access.error) return access.error;

    const { error: upErr } = await updateReportPatchSafely(supabase, reportId, {
      birth_date: null,
      birth_time: null,
      birth_place: null,
      birth_latitude: null,
      birth_longitude: null,
      birth_timezone: null,
    });

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    await deleteReportAnalysis(supabase, reportId, "astrology");
    await invalidatePersonCoreBlueprint(reportId, supabase);

    return NextResponse.json({ ok: true });
  } catch (e) {
    logServerError("report/birth DELETE:", e, "internal_error");
    return NextResponse.json(
      { error: messages.errors.generic },
      { status: 500 },
    );
  }
}
