import { NextResponse, type NextRequest } from "next/server";
import { resolveTenantFromHost } from "@/lib/tenant";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const tenant = resolveTenantFromHost(request.headers.get("host"));

  response.headers.set("x-tenant-id", tenant.id);
  response.headers.set("x-tenant-slug", tenant.slug);
  response.headers.set("x-tenant-domain", tenant.customDomain ?? tenant.platformDomain);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
