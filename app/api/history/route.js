import { NextResponse } from "next/server";
import { getUserFromBearerToken } from "@/lib/supabase/auth-helpers";
import { createSupabaseAdminClient } from "@/lib/supabase/client";

export async function GET(request) {
  const { user } = await getUserFromBearerToken(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("search_history")
    .select("id, food_name, food_key, response_json, last_updated_at, created_at")
    .eq("auth_user_id", user.id)
    .order("last_updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Unable to load history." }, { status: 500 });
  }

  return NextResponse.json({ history: data || [] });
}

export async function POST(request) {
  const { user } = await getUserFromBearerToken(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const foodName = typeof body?.food_name === "string" ? body.food_name.trim() : "";
    const foodKey = typeof body?.food_key === "string" ? body.food_key.trim().toLowerCase() : "";
    const responseJson = body?.response_json;

    if (!foodName || !foodKey || !responseJson || typeof responseJson !== "object") {
      return NextResponse.json({ error: "Invalid history payload." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("search_history")
      .upsert(
        {
          auth_user_id: user.id,
          food_name: foodName,
          food_key: foodKey,
          response_json: responseJson,
          last_updated_at: now
        },
        { onConflict: "auth_user_id,food_key" }
      )
      .select("id, food_name, food_key, response_json, last_updated_at, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: "Unable to save history." }, { status: 500 });
    }

    const { data: overflowRows } = await supabase
      .from("search_history")
      .select("id")
      .eq("auth_user_id", user.id)
      .order("last_updated_at", { ascending: false })
      .range(20, 200);

    if (overflowRows?.length) {
      const overflowIds = overflowRows.map((row) => row.id);
      await supabase.from("search_history").delete().in("id", overflowIds);
    }

    return NextResponse.json({ item: data });
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
}

export async function DELETE(request) {
  const { user } = await getUserFromBearerToken(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("search_history").delete().eq("auth_user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Unable to clear history." }, { status: 500 });
  }

  return NextResponse.json({ cleared: true });
}
