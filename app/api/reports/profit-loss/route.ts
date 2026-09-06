import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/api";

export async function GET(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined;
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined;

  const dateFilter = from || to ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {};
  const invDateFilter = from || to ? { invDate: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {};
  const billDateFilter = from || to ? { billDate: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {};

  const accounts = await db.account.findMany();
  const byName = Object.fromEntries(accounts.map((a) => [a.name, a]));

  const journalLines = await db.journalLine.findMany({
    where: { entry: { status: "POSTED", ...dateFilter } },
  });

  const getAccountBal = (name: string) => {
    const id = byName[name]?.id;
    if (!id) return 0;
    return journalLines.filter((l) => l.accountId === id).reduce((s, l) => s + l.debit - l.credit, 0);
  };

  const customerInvoices = await db.customerInvoice.findMany({
    where: { status: { in: ["CONFIRMED", "PARTIAL", "PAID"] }, ...invDateFilter },
  });
  const invoiceRevenue = customerInvoices.reduce((s, inv) => s + inv.total, 0);

  const vendorBills = await db.vendorBill.findMany({
    where: { status: { in: ["CONFIRMED", "PARTIAL", "PAID"] }, ...billDateFilter },
  });
  const billExpense = vendorBills.reduce((s, b) => s + b.subtotal, 0);

  const saleIncomeLedger = -getAccountBal("Sale Income");
  const totalIncome = Math.max(saleIncomeLedger, invoiceRevenue);

  const purchaseExpenseLedger = getAccountBal("Purchase Expense");
  const purchaseExpense = Math.max(purchaseExpenseLedger, billExpense);
  const otherExpense = 0;
  const totalExpense = purchaseExpense + otherExpense;
  const netOperatingIncome = totalIncome - totalExpense;

  const incomeItems = [
    { name: "Invoiced Sales Revenue", code: "INC-4001", amount: totalIncome },
  ];

  const expenseItems = [
    { name: "Cost of Goods & Vendor Purchases", code: "EXP-5001", amount: purchaseExpense },
    ...(otherExpense > 0 ? [{ name: "Other Operating Expenses", code: "EXP-5002", amount: otherExpense }] : []),
  ];

  return NextResponse.json({
    income: totalIncome,
    purchaseExpense,
    otherExpense,
    totalExpense,
    net: netOperatingIncome,
    incomeItems,
    expenseItems,
    incomeBreakdown: { sales: totalIncome },
  });
}

