import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/server/adminAuth";
import { listEnquiries } from "@/server/repositories/settingsRepository";
export async function GET(request: Request) {
  const denied = requireAdminAccess(request);
  if (denied) return denied;
  try { return NextResponse.json({ data: await listEnquiries() }); }
  catch { return NextResponse.json({ error: "Unable to load enquiries." }, { status: 503 }); }
}
