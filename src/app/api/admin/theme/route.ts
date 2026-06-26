import { NextResponse } from "next/server";
import { platformSnapshot } from "@/lib/platform-data";
import { themeLayoutSchema } from "@/lib/validation";

export async function GET() {
  return NextResponse.json({ data: platformSnapshot.theme });
}

export async function PUT(request: Request) {
  const layout = themeLayoutSchema.parse(await request.json());

  return NextResponse.json({
    data: layout,
    status: "validated",
    message: "Theme payload is valid and ready for draft persistence."
  });
}
