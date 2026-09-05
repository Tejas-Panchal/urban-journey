import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/api";

export async function GET() {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;

  const journals = await db.journal.findMany({
    orderBy: { name: "asc" },
  });

  const accounts = await db.account.findMany();
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const enrichedJournals = await Promise.all(
    journals.map(async (j) => {
      const totalEntries = await db.journalEntry.count({ where: { journalId: j.id } });
      const draftEntries = await db.journalEntry.count({
        where: { journalId: j.id, status: "DRAFT" },
      });
      const postedEntries = await db.journalEntry.count({
        where: { journalId: j.id, status: "POSTED" },
      });

      // Calculate ledger balance for default account if set
      let ledgerBalance = 0;
      const targetAccountId = j.defaultAccountId || j.defaultDebitId || j.defaultCreditId;
      if (targetAccountId) {
        const lines = await db.journalLine.findMany({
          where: {
            accountId: targetAccountId,
            entry: { journalId: j.id, status: "POSTED" },
          },
        });
        const dr = lines.reduce((s, l) => s + l.debit, 0);
        const cr = lines.reduce((s, l) => s + l.credit, 0);
        ledgerBalance = Math.round((dr - cr) * 100) / 100;
      }

      return {
        ...j,
        defaultDebit: j.defaultDebitId ? accountMap.get(j.defaultDebitId) || null : null,
        defaultCredit: j.defaultCreditId ? accountMap.get(j.defaultCreditId) || null : null,
        defaultAccount: j.defaultAccountId ? accountMap.get(j.defaultAccountId) || null : null,
        analytics: {
          totalEntries,
          draftEntries,
          postedEntries,
          ledgerBalance,
        },
      };
    })
  );

  return NextResponse.json({ journals: enrichedJournals });
}
