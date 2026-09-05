import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/api";

async function balance(accountName: string, from?: Date, to?: Date) {
  const lines = await db.journalLine.findMany({
    where: {
      entry: { ...(from || to ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}) },
      ...(accountName ? { } : {}),
    },
    include: { entry: true },
  });
  return lines;
}

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
    include: { entry: true },
  });
  const bal = (name: string) => {
    const id = byName[name]?.id;
    if (!id) return 0;
    return lines.filter(l => l.accountId === id).reduce((s, l) => s + l.debit - l.credit, 0);
  };
  const cash = bal("Cash"), bank = bal("Bank"), debtors = bal("Debtors");
  const creditors = -bal("Creditors");
  const sale = -bal("Sale Income");
  const purchase = bal("Purchase Expense");
  const assets = cash + bank + debtors;
  const liabilities = creditors;
  const net = sale - purchase;
  return NextResponse.json({
    assets: { cash, bank, debtors, total: assets },
    liabilities: { creditors, total: liabilities },
    capital: 0, netIncome: net,
    balanced: Math.abs(assets - (liabilities + net)) < 0.02,
    profitLoss: { income: sale, purchaseExpense: purchase, totalExpense: purchase, net },
  });
}
