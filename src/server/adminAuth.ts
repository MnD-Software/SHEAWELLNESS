import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const ADMIN_KEY_HEADER = "x-shea-admin-key";

function matchesAccessKey(provided: string, expected: string) {
  const providedValue = Buffer.from(provided);
  const expectedValue = Buffer.from(expected);
  return providedValue.length === expectedValue.length && timingSafeEqual(providedValue, expectedValue);
}

/**
 * Protects the operational CMS and order queue without putting an access key
 * in the client bundle. The dashboard asks the administrator for this value
 * and keeps it in session storage only for the active browser session.
 */
export function requireAdminAccess(request: Request) {
  const expectedKey = process.env.ADMIN_DASHBOARD_KEY?.trim();
  if (!expectedKey) {
    return NextResponse.json(
      { error: "Admin access is not configured. Set ADMIN_DASHBOARD_KEY in the deployment environment." },
      { status: 503 }
    );
  }

  const providedKey = request.headers.get(ADMIN_KEY_HEADER) ?? "";
  if (!matchesAccessKey(providedKey, expectedKey)) {
    return NextResponse.json({ error: "Admin access code required." }, { status: 401 });
  }

  return null;
}

export { ADMIN_KEY_HEADER };
