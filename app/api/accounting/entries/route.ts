import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { createJournalEntry } from "@/lib/accounting";
import { z } from "zod";

export async function GET(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;

  const { searchParams } = new URL(req.url);
  const journalId = searchParams.get("journalId");
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const accountId = searchParams.get("accountId");
  const contactId = searchParams.get("partnerId") || searchParams.get("contactId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const where: any = {};

  if (journalId) where.journalId = journalId;
  if (status && status !== "ALL") where.status = status;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  if (search) {
    where.OR = [
      { reference: { contains: search } },
      { entryNumber: { contains: search } },
      { narration: { contains: search } },
    ];
  }

  if (accountId || contactId) {
    where.lines = {
      some: {
        ...(accountId ? { accountId } : {}),
        ...(contactId ? { partnerId: contactId } : {}),
      },
    };
  }

  const total = await db.journalEntry.count({ where });
  const entries = await db.journalEntry.findMany({
    where,
    include: {
      journal: true,
      lines: true,
      reversedEntry: true,
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  // Attach accounts & partners map
  const accounts = await db.account.findMany();
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const contacts = await db.contact.findMany();
  const contactMap = new Map(contacts.map((c) => [c.id, c]));

  const enrichedEntries = entries.map((entry) => ({
    ...entry,
    lines: entry.lines.map((l) => ({
      ...l,
      account: accountMap.get(l.accountId) || null,
      partner: l.partnerId ? contactMap.get(l.partnerId) || null : null,
    })),
  }));

  return NextResponse.json({
    entries: enrichedEntries,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;

  const body = await req.json().catch(() => ({}));

  const schema = z.object({
    journalId: z.string().optional(),
    journalType: z.enum(["SALES", "PURCHASE", "BANK", "CASH", "GENERAL"]).optional(),
    date: z.string().optional(),
    reference: z.string().min(1),
    narration: z.string().optional(),
    status: z.enum(["DRAFT", "POSTED", "CANCELLED"]).default("DRAFT"),
    lines: z
      .array(
        z.object({
          accountId: z.string().min(1),
          partnerId: z.string().nullable().optional(),
          analyticId: z.string().nullable().optional(),
          narration: z.string().nullable().optional(),
          debit: z.number().min(0),
          credit: z.number().min(0),
        })
      )
      .min(2, "Journal entry must have at least 2 lines."),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  try {
    const entry = await createJournalEntry(db, {
      ...parsed.data,
      date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (err: any) {
    return apiError(err.message || "Failed to create journal entry", 400);
  }
}
