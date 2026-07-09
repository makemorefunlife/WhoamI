import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { mergeGuestAccountData } from "@/lib/home/mergeGuestAccount";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export const runtime = "nodejs";

type MergeBody = {
  guestReportId?: string;
};

/**
 * 게스트(비로그인) reportId에 묶인 친구·관계 데이터를
 * 로그인 계정의 canonical reportId로 병합한다.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "서버 Supabase 설정이 필요합니다." },
        { status: 500 },
      );
    }

    let guestReportId: string | undefined;
    try {
      const body = (await req.json()) as MergeBody;
      guestReportId = body.guestReportId?.trim() || undefined;
    } catch {
      guestReportId = undefined;
    }

    const supabase = createServiceRoleClient(url, serviceKey);
    const result = await mergeGuestAccountData(supabase, userId, guestReportId);

    if (!result) {
      return NextResponse.json({
        canonicalReportId: null,
        mergedFromReportIds: [],
        relationshipsRepointed: 0,
        relationshipsMerged: 0,
        invitesRepointed: 0,
        favoritesRepointed: 0,
        logsRepointed: 0,
        relationshipIdMap: {},
        merged: false,
      });
    }

    return NextResponse.json({ ...result, merged: result.mergedFromReportIds.length > 0 });
  } catch (e) {
    console.error("account/merge:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "병합 실패" },
      { status: 500 },
    );
  }
}
