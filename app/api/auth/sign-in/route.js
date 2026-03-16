import { NextResponse } from "next/server";
import {
  INVALID_PASSWORD_MESSAGE,
  USERNAME_INVALID_MESSAGE,
  USERNAME_MISSING_LOGIN_MESSAGE,
  buildAuthEmailFromUsername,
  isValidUsername,
  normalizeUsername
} from "@/lib/supabase/auth-helpers";
import { createSupabaseAdminClient, createSupabaseRouteClient } from "@/lib/supabase/client";

export async function POST(request) {
  try {
    const body = await request.json();
    const usernameInput = typeof body?.username === "string" ? body.username : "";
    const password = typeof body?.password === "string" ? body.password : "";

    const usernameNormalized = normalizeUsername(usernameInput);

    if (!isValidUsername(usernameNormalized)) {
      return NextResponse.json({ error: USERNAME_INVALID_MESSAGE }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { data: existing, error: checkError } = await admin
      .from("user_profiles")
      .select("auth_user_id")
      .eq("username_normalized", usernameNormalized)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json({ error: "Unable to sign in right now." }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: USERNAME_MISSING_LOGIN_MESSAGE }, { status: 404 });
    }

    const routeClient = createSupabaseRouteClient();
    const authEmail = buildAuthEmailFromUsername(usernameNormalized);
    const { data: signInData, error: signInError } = await routeClient.auth.signInWithPassword({
      email: authEmail,
      password
    });

    if (signInError || !signInData?.session) {
      return NextResponse.json({ error: INVALID_PASSWORD_MESSAGE }, { status: 401 });
    }

    return NextResponse.json({ session: signInData.session });
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
}
