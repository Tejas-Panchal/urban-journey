import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { reverseJournalEntry } from "@/lib/accounting";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));

  try {
    const reversal = await reverseJournalEntry(db, id, body);
    return NextResponse.json({ reversal }, { status: 201 });
  } catch (err: any) {
    return apiError(err.message || "Failed to generate reversal entry", 400);
  }
}
