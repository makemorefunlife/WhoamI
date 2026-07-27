import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";

export const runtime = "nodejs";

/**
 * Self-serve account deletion:
 * 1) Delete user's owned DB data (reports row delete + FK cascade)
 * 2) Delete Clerk user account
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createRouteSupabaseClient();
  if (!supabase) return supabaseConfigErrorResponse();

  const { error: deleteReportsError } = await supabase
    .from("reports")
    .delete()
    .eq("clerk_user_id", userId);

  if (deleteReportsError) {
    console.error("[account.delete] db_delete_failed", {
      code: deleteReportsError.code ?? "unknown",
    });
    return NextResponse.json(
      { error: "계정 데이터 삭제 중 오류가 발생했어요. 다시 시도해 주세요." },
      { status: 500 },
    );
  }

  try {
    const client = await clerkClient();
    await client.users.deleteUser(userId);
  } catch (error) {
    console.error("[account.delete] clerk_delete_failed", error);
    return NextResponse.json(
      {
        error:
          "계정 삭제 마무리 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
