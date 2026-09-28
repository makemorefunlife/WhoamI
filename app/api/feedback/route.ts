import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/serverClient";
import { logServerError } from "@/lib/security/safeLog";
import { buildFeedbackSheetPayload } from "@/lib/feedback/feedbackContext";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    // Existing fields + report context (analysis_category, relationship_type,
    // report_type, report_id, locale). Context is optional so older clients
    // still submit; missing values are written as blank cells.
    const payload = buildFeedbackSheetPayload(
      body && typeof body === "object" ? (body as Record<string, unknown>) : {},
    );

    // 1. Post to Google Sheet Webhook if configured
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch((err) => {
        console.error("[feedback webhook error]", err);
      });
    }

    // 2. If founder_applied is true and user is authenticated, update Clerk publicMetadata & Supabase profiles
    if (payload.founder_applied) {
      const { userId } = await auth();
      if (userId) {
        // Update Clerk publicMetadata
        try {
          const client = await clerkClient();
          await client.users.updateUserMetadata(userId, {
            publicMetadata: { is_founder: true },
          });
        } catch (err) {
          console.error("[feedback clerk metadata error]", err);
        }

        // Update Supabase profiles table
        try {
          const supabase = createServerSupabaseClient();
          if (supabase) {
            await supabase
              .from("profiles")
              .upsert(
                { id: userId, is_founder: true, updated_at: new Date().toISOString() },
                { onConflict: "id" },
              );
          }
        } catch (err) {
          console.error("[feedback supabase profiles error]", err);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    logServerError("feedback.post", e, "internal_error");
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
