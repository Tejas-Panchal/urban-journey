import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { z } from "zod";

export async function GET() {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  return NextResponse.json({ journals: await db.journal.findMany({ orderBy: { name: "asc" } }) });
}
export async function POST(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const body = await req.json().catch(() => ({}));
  const parsed = z.object({
    name: z.string().min(1),
    type: z.enum(["SALES", "PURCHASE", "BANK", "CASH"]),
    defaultDebitId: z.string().optional(),
    defaultCreditId: z.string().optional(),
  }).safeParse(body);
  if (!parsed.success) return apiError("Invalid input");
  try {
    const j = await db.journal.create({ data: parsed.data });
    return NextResponse.json({ journal: j }, { status: 201 });
  } catch { return apiError("Journal already exists", 409); }
}
