import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { cancelJournalEntry } from "@/lib/accounting";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;

  try {
    const cancelled = await cancelJournalEntry(db, id);
    return NextResponse.json({ entry: cancelled });
  } catch (err: any) {
    return apiError(err.message || "Failed to cancel journal entry", 400);
  }
}
