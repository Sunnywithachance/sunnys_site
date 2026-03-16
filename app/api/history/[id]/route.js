import { NextResponse } from "next/server";
import { getUserFromBearerToken } from "@/lib/supabase/auth-helpers";
import { createSupabaseAdminClient } from "@/lib/supabase/client";

export async function DELETE(request, { params }) {
  const { user } = await getUserFromBearerToken(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const historyId = typeof params?.id === "string" ? params.id : "";
  if (!historyId) {
    return NextResponse.json({ error: "History id is required." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("search_history")
    .delete()
    .eq("id", historyId)
    .eq("auth_user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Unable to delete history item." }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
