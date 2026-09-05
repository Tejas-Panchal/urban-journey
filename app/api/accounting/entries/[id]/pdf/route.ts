import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;

  const entry = await db.journalEntry.findUnique({
    where: { id },
    include: {
      journal: true,
      lines: true,
    },
  });

  if (!entry) return apiError("Journal entry not found", 404);

  const accounts = await db.account.findMany();
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const contacts = await db.contact.findMany();
  const contactMap = new Map(contacts.map((c) => [c.id, c]));

  const analytics = await db.analytic.findMany();
  const analyticMap = new Map(analytics.map((an) => [an.id, an]));

  const lines = entry.lines.map((l) => ({
    id: l.id,
    accountCode: accountMap.get(l.accountId)?.code || "N/A",
    accountName: accountMap.get(l.accountId)?.name || "Unknown Account",
    partnerName: l.partnerId ? contactMap.get(l.partnerId)?.name || null : null,
    analyticName: l.analyticId ? analyticMap.get(l.analyticId)?.name || null : null,
    narration: l.narration || l.lineLabel || "—",
    debit: l.debit,
    credit: l.credit,
  }));

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);

  const voucherData = {
    voucherType: "ACCOUNTING JOURNAL VOUCHER",
    company: "Odoo ERP Accounting System",
    entryNumber: entry.entryNumber || entry.id,
    journalName: entry.journal.name,
    journalCode: entry.journal.code || entry.journal.type,
    date: entry.date,
    reference: entry.reference,
    narration: entry.narration || "N/A",
    status: entry.status,
    postedAt: entry.postedAt,
    lines,
    summary: {
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    },
  };

  return NextResponse.json({ voucher: voucherData });
}
