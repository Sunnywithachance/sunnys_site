import { NextResponse } from "next/server";
import { INVALID_PASSWORD_MESSAGE, getUserFromBearerToken } from "@/lib/supabase/auth-helpers";
import { createSupabaseAdminClient, createSupabaseRouteClient } from "@/lib/supabase/client";

export async function POST(request) {
  try {
    const { user } = await getUserFromBearerToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const password = typeof body?.password === "string" ? body.password : "";

    if (!password || !user.email) {
      return NextResponse.json({ error: INVALID_PASSWORD_MESSAGE }, { status: 400 });
    }

    const routeClient = createSupabaseRouteClient();
    const { error: checkPasswordError } = await routeClient.auth.signInWithPassword({
      email: user.email,
      password
    });

    if (checkPasswordError) {
      return NextResponse.json({ error: INVALID_PASSWORD_MESSAGE }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();

    await admin.from("search_history").delete().eq("auth_user_id", user.id);
    await admin.from("user_profiles").delete().eq("auth_user_id", user.id);

    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteAuthError) {
      return NextResponse.json({ error: "Unable to delete account right now." }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
}
