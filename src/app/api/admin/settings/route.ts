import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { requireAdminAccess } from "@/server/adminAuth";
import { readStorefrontSettings, saveStorefrontSettings } from "@/server/repositories/settingsRepository";
export async function GET(request: Request) {
  const denied = requireAdminAccess(request);
  if (denied) return denied;
  try { return NextResponse.json({ data: await readStorefrontSettings() }); }
  catch { return NextResponse.json({ error: "Unable to load store settings." }, { status: 503 }); }
}
export async function PUT(request: Request) {
  const denied = requireAdminAccess(request);
  if (denied) return denied;
  try {
    const input = z.object({ wellnessGuidesEnabled: z.boolean() }).parse(await request.json());
    return NextResponse.json({ data: await saveStorefrontSettings(input) });
  } catch (error) {
    return NextResponse.json({ error: "Store settings were not saved. Please retry." }, { status: error instanceof ZodError || error instanceof SyntaxError ? 400 : 503 });
  }
}
