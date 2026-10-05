import { NextResponse } from "next/server";
import { readTheme, saveTheme } from "@/server/repositories/settingsRepository";
import { themeLayoutSchema } from "@/lib/validation";
import { requireAdminAccess } from "@/server/adminAuth";

export async function GET(request: Request) {
  const denied = requireAdminAccess(request);
  if (denied) return denied;

  try { return NextResponse.json({ data: await readTheme() }); }
  catch { return NextResponse.json({ error: "Unable to load saved theme." }, { status: 503 }); }
}

export async function PUT(request: Request) {
  const denied = requireAdminAccess(request);
  if (denied) return denied;

  try {
    const layout = themeLayoutSchema.parse(await request.json());
    return NextResponse.json({ data: await saveTheme(layout), status: "saved" });
  } catch { return NextResponse.json({ error: "Unable to save theme. Check the payload and database connection." }, { status: 400 }); }
}
