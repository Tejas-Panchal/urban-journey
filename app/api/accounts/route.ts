import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { z } from "zod";

export async function GET() {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  return NextResponse.json({ accounts: await db.account.findMany({ orderBy: { name: "asc" } }) });
}
export async function POST(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const body = await req.json().catch(() => ({}));
  const parsed = z.object({
    name: z.string().min(1),
    type: z.enum(["ASSET", "LIABILITY", "INCOME", "EXPENSE", "CAPITAL"]),
    subtype: z.enum(["CASH", "BANK", "DEBTOR", "CREDITOR", "SALE", "PURCHASE", "OTHER", "CAPITAL"]).default("OTHER"),
  }).safeParse(body);
  if (!parsed.success) return apiError("Invalid input");
  try {
    const a = await db.account.create({ data: parsed.data });
    return NextResponse.json({ account: a }, { status: 201 });
  } catch { return apiError("Account already exists", 409); }
}
