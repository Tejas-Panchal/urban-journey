import { db } from "@/lib/db";

// Achieved = sum of confirmed bill/invoice lines + posted journal lines for analytic account in budget period
export async function computeBudgetAchieved(budgetId: string) {
  const budget = await db.budget.findUnique({ where: { id: budgetId }, include: { lines: true } });
  if (!budget) throw new Error("Budget not found");
  const from = new Date(budget.start);
  const to = new Date(budget.end);
  const out: { lineId: string; achieved: number }[] = [];

  for (const line of budget.lines) {
    let achieved = 0;
    if (line.type === "EXPENSE") {
      // 1. Vendor Bills (Expenses)
      const billLines = await db.vendorBillLine.findMany({
        where: {
          analyticId: line.analyticId,
          bill: { billDate: { gte: from, lte: to }, status: { in: ["CONFIRMED", "PARTIAL", "PAID"] } },
        },
      });
      const billTotal = billLines.reduce((s, l) => s + l.total, 0);

      // 2. Direct Posted Journal Entry Lines (Expenses = Debit - Credit)
      const journalLines = await db.journalLine.findMany({
        where: {
          OR: [{ analyticId: line.analyticId }, { analyticAccountId: line.analyticId }],
          entry: { date: { gte: from, lte: to }, status: "POSTED" },
        },
      });
      const journalTotal = journalLines.reduce((s, l) => s + Math.max(0, l.debit - l.credit), 0);

      achieved = Math.round((billTotal + journalTotal) * 100) / 100;
    } else {
      // 1. Customer Invoices (Income)
      const invoiceLines = await db.customerInvoiceLine.findMany({
        where: {
          analyticId: line.analyticId,
          invoice: { invDate: { gte: from, lte: to }, status: { in: ["CONFIRMED", "PARTIAL", "PAID"] } },
        },
      });
      const invoiceTotal = invoiceLines.reduce((s, l) => s + l.total, 0);

      // 2. Direct Posted Journal Entry Lines (Income = Credit - Debit)
      const journalLines = await db.journalLine.findMany({
        where: {
          OR: [{ analyticId: line.analyticId }, { analyticAccountId: line.analyticId }],
          entry: { date: { gte: from, lte: to }, status: "POSTED" },
        },
      });
      const journalTotal = journalLines.reduce((s, l) => s + Math.max(0, l.credit - l.debit), 0);

      achieved = Math.round((invoiceTotal + journalTotal) * 100) / 100;
    }

    out.push({ lineId: line.id, achieved });
    await db.budgetLine.update({ where: { id: line.id }, data: { achievedCached: achieved } });
  }

  return out;
}

