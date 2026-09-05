import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { z } from "zod";

export async function GET(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  const where = search
    ? {
        name: {
          contains: search,
        },
      }
    : {};

  const journals = await db.journal.findMany({
    where,
    orderBy: { name: "asc" },
  });

  const entries = await db.journalEntry.findMany({
    include: { lines: true },
  });

  const accounts = await db.account.findMany();
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const enrichedJournals = journals.map((j) => {
    const journalEntries = entries.filter((e) => e.journalId === j.id);
    const draftCount = journalEntries.filter((e) => e.status === "DRAFT").length;
    const postedCount = journalEntries.filter((e) => e.status === "POSTED").length;
    const totalAmount = journalEntries.reduce((sum, e) => {
      const entryDebit = e.lines.reduce((s, l) => s + l.debit, 0);
      return sum + entryDebit;
    }, 0);

    const roundedBalance = Math.round((totalAmount + Number.EPSILON) * 100) / 100;
    const defaultAccountObj = j.defaultDebitId
      ? accountMap.get(j.defaultDebitId) || null
      : j.defaultCreditId
      ? accountMap.get(j.defaultCreditId) || null
      : null;

    return {
      ...j,
      defaultAccount: defaultAccountObj,
      defaultDebit: j.defaultDebitId ? accountMap.get(j.defaultDebitId) || null : null,
      defaultCredit: j.defaultCreditId ? accountMap.get(j.defaultCreditId) || null : null,
      entriesCount: journalEntries.length,
      totalAmount: roundedBalance,
      analytics: {
        totalEntries: journalEntries.length,
        draftEntries: draftCount,
        postedEntries: postedCount,
        ledgerBalance: roundedBalance,
      },
    };
  });

  return NextResponse.json({ journals: enrichedJournals });
}

export async function POST(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const body = await req.json().catch(() => ({}));
  const parsed = z
    .object({
      name: z.string().min(1),
      type: z.enum(["SALES", "PURCHASE", "BANK", "CASH"]),
      defaultDebitId: z.string().nullable().optional(),
      defaultCreditId: z.string().nullable().optional(),
    })
    .safeParse(body);
  if (!parsed.success) return apiError("Invalid input");
  try {
    const data: any = {
      name: parsed.data.name,
      type: parsed.data.type,
      defaultDebitId: parsed.data.defaultDebitId || null,
      defaultCreditId: parsed.data.defaultCreditId || null,
    };
    const j = await db.journal.create({ data });
    return NextResponse.json({ journal: j }, { status: 201 });
  } catch {
    return apiError("Journal already exists", 409);
  }
}

