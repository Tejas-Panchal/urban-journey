import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { z } from "zod";
import { checkBalanced } from "@/lib/accounting";

const lineSchema = z.object({ accountId: z.string().min(1), partnerId: z.string().optional(), analyticId: z.string().optional(), debit: z.number().nonnegative().default(0), credit: z.number().nonnegative().default(0) });

export async function GET(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { searchParams } = new URL(req.url);
  const journalId = searchParams.get("journalId") ?? undefined;
  const entries = await db.journalEntry.findMany({ where: { journalId }, include: { lines: true }, orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ entries });
}
export async function POST(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const body = await req.json().catch(() => ({}));
  const parsed = z.object({ journalId: z.string().min(1), date: z.string().optional(), reference: z.string().min(1), lines: z.array(lineSchema).min(2) }).safeParse(body);
  if (!parsed.success) return apiError("Invalid input");
  try { checkBalanced(parsed.data.lines); } catch (e: any) { return apiError(e.message, 400); }
  const e = await db.journalEntry.create({ data: { journalId: parsed.data.journalId, date: parsed.data.date ? new Date(parsed.data.date) : new Date(), reference: parsed.data.reference, status: "POSTED", lines: { create: parsed.data.lines } } });
  return NextResponse.json({ entry: e }, { status: 201 });
}
