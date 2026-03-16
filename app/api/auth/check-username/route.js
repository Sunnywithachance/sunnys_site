import { NextResponse } from "next/server";
import {
  USERNAME_INVALID_MESSAGE,
  normalizeUsername,
  isValidUsername
} from "@/lib/supabase/auth-helpers";
import { createSupabaseAdminClient } from "@/lib/supabase/client";

export async function POST(request) {
  try {
    const body = await request.json();
    const username = typeof body?.username === "string" ? body.username : "";
    const normalized = normalizeUsername(username);

    if (!isValidUsername(normalized)) {
      return NextResponse.json({ exists: false, valid: false, message: USERNAME_INVALID_MESSAGE }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("username_normalized", normalized)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Unable to check username right now." }, { status: 500 });
    }

    return NextResponse.json({ exists: Boolean(data), valid: true });
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
}
