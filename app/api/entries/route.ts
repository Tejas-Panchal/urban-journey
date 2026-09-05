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
  const journalId = searchParams.get("journalId") || undefined;
  const where = journalId ? { journalId } : {};
  const entries = await db.journalEntry.findMany({
    where,
    include: {
      journal: true,
      lines: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const accounts = await db.account.findMany();
  const partners = await db.contact.findMany();
  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const partnerMap = new Map(partners.map((p) => [p.id, p]));

  const enrichedEntries = entries.map((entry) => ({
    ...entry,
    lines: entry.lines.map((line) => ({
      ...line,
      account: line.accountId ? accountMap.get(line.accountId) || null : null,
      partner: line.partnerId ? partnerMap.get(line.partnerId) || null : null,
    })),
  }));

  return NextResponse.json({ entries: enrichedEntries });
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
