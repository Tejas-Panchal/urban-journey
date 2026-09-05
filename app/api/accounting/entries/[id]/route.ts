import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { updateJournalEntry } from "@/lib/accounting";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;

  const entry = await db.journalEntry.findUnique({
    where: { id },
    include: {
      journal: true,
      lines: true,
      reversedEntry: true,
      reversals: true,
    },
  });

  if (!entry) return apiError("Journal entry not found", 404);

  const accounts = await db.account.findMany();
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const contacts = await db.contact.findMany();
  const contactMap = new Map(contacts.map((c) => [c.id, c]));

  const analytics = await db.analytic.findMany();
  const analyticMap = new Map(analytics.map((an) => [an.id, an]));

  const enrichedLines = entry.lines.map((l) => ({
    ...l,
    account: accountMap.get(l.accountId) || null,
    partner: l.partnerId ? contactMap.get(l.partnerId) || null : null,
    analytic: l.analyticId ? analyticMap.get(l.analyticId) || null : null,
  }));

  return NextResponse.json({
    entry: {
      ...entry,
      lines: enrichedLines,
    },
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));

  try {
    const updated = await updateJournalEntry(db, id, body);
    return NextResponse.json({ entry: updated });
  } catch (err: any) {
    return apiError(err.message || "Failed to update journal entry", 400);
  }
}
