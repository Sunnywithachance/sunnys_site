import { NextResponse } from "next/server";
import {
  INVALID_PASSWORD_MESSAGE,
  PASSWORD_MISMATCH_MESSAGE,
  USERNAME_INVALID_MESSAGE,
  USERNAME_TAKEN_MESSAGE,
  buildAuthEmailFromUsername,
  isValidPassword,
  isValidUsername,
  normalizeUsername
} from "@/lib/supabase/auth-helpers";
import { createSupabaseAdminClient, createSupabaseRouteClient } from "@/lib/supabase/client";

const isDev = process.env.NODE_ENV !== "production";

function withDevDetails(message, stage, error) {
  if (!isDev) return { error: message };
  return {
    error: message,
    details: {
      stage,
      message: error?.message || null,
      code: error?.code || null,
      hint: error?.hint || null
    }
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const usernameInput = typeof body?.username === "string" ? body.username : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const confirmPassword = typeof body?.confirm_password === "string" ? body.confirm_password : "";

    const usernameNormalized = normalizeUsername(usernameInput);

    if (!isValidUsername(usernameNormalized)) {
      return NextResponse.json({ error: USERNAME_INVALID_MESSAGE }, { status: 400 });
    }

    if (!isValidPassword(password)) {
      return NextResponse.json({ error: INVALID_PASSWORD_MESSAGE }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: PASSWORD_MISMATCH_MESSAGE }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();

    const { data: existing, error: checkError } = await admin
      .from("user_profiles")
      .select("id")
      .eq("username_normalized", usernameNormalized)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json(
        withDevDetails("Unable to create account right now.", "check_username_exists", checkError),
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json({ error: USERNAME_TAKEN_MESSAGE }, { status: 409 });
    }

    const authEmail = buildAuthEmailFromUsername(usernameNormalized);
    const { data: createdAuth, error: createAuthError } = await admin.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true
    });

    if (createAuthError || !createdAuth?.user) {
      return NextResponse.json(
        withDevDetails("Unable to create account right now.", "create_auth_user", createAuthError),
        { status: 500 }
      );
    }

    const { error: profileError } = await admin.from("user_profiles").insert({
      auth_user_id: createdAuth.user.id,
      username: usernameNormalized,
      username_normalized: usernameNormalized,
      display_name: null,
      profile_json: {}
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(createdAuth.user.id);
      const isDuplicate = String(profileError?.message || "").toLowerCase().includes("duplicate");
      return NextResponse.json(
        isDuplicate
          ? { error: USERNAME_TAKEN_MESSAGE }
          : withDevDetails("Unable to create account right now.", "insert_user_profile", profileError),
        { status: isDuplicate ? 409 : 500 }
      );
    }

    // Sign in immediately and return session tokens to browser client.
    const routeClient = createSupabaseRouteClient();
    const { data: signInData, error: signInError } = await routeClient.auth.signInWithPassword({
      email: authEmail,
      password
    });

    if (signInError || !signInData?.session) {
      return NextResponse.json({ created: true, session: null }, { status: 201 });
    }

    return NextResponse.json({ created: true, session: signInData.session }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      withDevDetails("Invalid request payload.", "unexpected_exception", error),
      { status: 400 }
    );
  }
}
