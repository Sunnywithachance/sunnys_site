import { NextResponse } from "next/server";

export async function POST() {
  // Browser handles local session removal. Endpoint exists for API parity.
  return NextResponse.json({ ok: true });
}
