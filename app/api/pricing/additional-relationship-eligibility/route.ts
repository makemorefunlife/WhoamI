import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { isAdditionalRelationshipEligible } from "@/lib/credits/creditEngine";

export const runtime = "nodejs";

/**
 * Whether to show the $9.99 Additional Relationship card at all -- checked
 * BEFORE checkout opens, not after payment. additional_relationship_eligible
 * (the shared engine RPC) is the single source of truth here; this route
 * exists only to let the client-rendered pricing page ask it for its own
 * signed-in user without exposing the RPC or a service-role key
 * client-side.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ eligible: false });
  }

  const supabase = createRouteSupabaseClient();
  if (!supabase) return supabaseConfigErrorResponse();

  const eligible = await isAdditionalRelationshipEligible(supabase, userId);
  return NextResponse.json({ eligible });
}
