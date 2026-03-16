import { NextResponse } from "next/server";
import { getUserFromBearerToken, sanitizeProfilePayload } from "@/lib/supabase/auth-helpers";
import { createSupabaseAdminClient } from "@/lib/supabase/client";

export async function GET(request) {
  const { user } = await getUserFromBearerToken(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, username, username_normalized, display_name, profile_json, created_at, updated_at")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Unable to load profile." }, { status: 500 });
  }

  return NextResponse.json({ profile: data || null });
}

export async function PUT(request) {
  const { user } = await getUserFromBearerToken(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const displayName = typeof body?.display_name === "string" ? body.display_name.trim() : null;
    const incomingProfile = sanitizeProfilePayload(body?.profile_json);

    const supabase = createSupabaseAdminClient();
    const { data: existing, error: existingError } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (existingError || !existing) {
      return NextResponse.json({ error: "Unable to update profile." }, { status: 500 });
    }

    if (!Array.isArray(incomingProfile.conditions) || incomingProfile.conditions.length < 1) {
      return NextResponse.json({ error: "At least 1 condition is required." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        display_name: displayName || null,
        profile_json: incomingProfile,
        updated_at: new Date().toISOString()
      })
      .eq("auth_user_id", user.id)
      .select("id, username, username_normalized, display_name, profile_json, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: "Unable to update profile." }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
}
