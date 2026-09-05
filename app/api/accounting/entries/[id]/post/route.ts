import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { postJournalEntry } from "@/lib/accounting";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;

  try {
    const entry = await postJournalEntry(db, id);
    return NextResponse.json({ entry });
  } catch (err: any) {
    return apiError(err.message || "Failed to post journal entry", 400);
  }
}
