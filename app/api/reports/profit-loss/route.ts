import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/api";

export async function GET(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined;
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined;
  const accounts = await db.account.findMany();
  const byName = Object.fromEntries(accounts.map(a => [a.name, a]));
  const lines = await db.journalLine.findMany({
    where: { entry: { ...(from || to ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}) } },
  });
  const bal = (name: string) => {
    const id = byName[name]?.id;
    if (!id) return 0;
    return lines.filter(l => l.accountId === id).reduce((s, l) => s + l.debit - l.credit, 0);
  };
  const income = -bal("Sale Income");
  const purchaseExpense = bal("Purchase Expense");
  return NextResponse.json({ income, incomeBreakdown: { sales: income }, purchaseExpense, otherExpense: 0, totalExpense: purchaseExpense, net: income - purchaseExpense });
}
