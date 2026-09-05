import { db } from "@/lib/db";

// Achieved = sum of confirmed bill/invoice lines with analytic in budget period
export async function computeBudgetAchieved(budgetId: string) {
  const budget = await db.budget.findUnique({ where: { id: budgetId }, include: { lines: true } });
  if (!budget) throw new Error("Budget not found");
  const from = new Date(budget.start);
  const to = new Date(budget.end);
  const out: { lineId: string; achieved: number }[] = [];
  for (const line of budget.lines) {
    let achieved = 0;
    if (line.type === "EXPENSE") {
      const lines = await db.vendorBillLine.findMany({
        where: { analyticId: line.analyticId, bill: { billDate: { gte: from, lte: to }, status: { in: ["CONFIRMED", "PARTIAL", "PAID"] } } },
      });
      achieved = lines.reduce((s, l) => s + l.total, 0);
    } else {
      const lines = await db.customerInvoiceLine.findMany({
        where: { analyticId: line.analyticId, invoice: { invDate: { gte: from, lte: to }, status: { in: ["CONFIRMED", "PARTIAL", "PAID"] } } },
      });
      achieved = lines.reduce((s, l) => s + l.total, 0);
    }
    out.push({ lineId: line.id, achieved });
    await db.budgetLine.update({ where: { id: line.id }, data: { achievedCached: achieved } });
  }
  return out;
}
