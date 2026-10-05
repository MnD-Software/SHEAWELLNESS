import { NextResponse } from "next/server";
import { z } from "zod";
import { saveEnquiry } from "@/server/repositories/settingsRepository";
const schema = z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(254), type: z.enum(["Wholesale", "Retail order", "Spa essentials", "Media"]), message: z.string().trim().min(10).max(4000) });
export async function POST(request: Request) {
  try {
    const id = await saveEnquiry(schema.parse(await request.json()));
    return NextResponse.json({ data: { id } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return NextResponse.json({ error: "Check your name, email, and message (at least 10 characters)." }, { status: 400 });
    return NextResponse.json({ error: "We could not save your enquiry. Please email sheabutterwellness@gmail.com." }, { status: 503 });
  }
}
