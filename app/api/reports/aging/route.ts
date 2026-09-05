import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/api";

export async function GET() {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;

  const now = new Date();

  // Fetch unpaid/partial customer invoices
  const customerInvoices = await db.customerInvoice.findMany({
    where: {
      status: { in: ["CONFIRMED", "PARTIAL"] },
      due: { gt: 0 },
    },
    include: { customer: true },
    orderBy: { dueDate: "asc" },
  });

  // Fetch unpaid/partial vendor bills
  const vendorBills = await db.vendorBill.findMany({
    where: {
      status: { in: ["CONFIRMED", "PARTIAL"] },
      due: { gt: 0 },
    },
    include: { vendor: true },
    orderBy: { dueDate: "asc" },
  });

  const categorizeAging = (dueDate: Date, amount: number) => {
    const diffTime = now.getTime() - new Date(dueDate).getTime();
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let current = 0,
      d1_30 = 0,
      d31_60 = 0,
      d61_90 = 0,
      d90Plus = 0;

    if (days <= 0) current = amount;
    else if (days <= 30) d1_30 = amount;
    else if (days <= 60) d31_60 = amount;
    else if (days <= 90) d61_90 = amount;
    else d90Plus = amount;

    return { days: Math.max(0, days), current, d1_30, d31_60, d61_90, d90Plus };
  };

  // Group Receivables by Customer
  const arMap = new Map<string, { partnerName: string; current: number; d1_30: number; d31_60: number; d61_90: number; d90Plus: number; totalDue: number }>();
  for (const inv of customerInvoices) {
    const partnerId = inv.customerId;
    const name = inv.customer?.name || "Unknown Customer";
    const aging = categorizeAging(inv.dueDate, inv.due);

    const existing = arMap.get(partnerId) || {
      partnerName: name,
      current: 0,
      d1_30: 0,
      d31_60: 0,
      d61_90: 0,
      d90Plus: 0,
      totalDue: 0,
    };

    arMap.set(partnerId, {
      partnerName: name,
      current: existing.current + aging.current,
      d1_30: existing.d1_30 + aging.d1_30,
      d31_60: existing.d31_60 + aging.d31_60,
      d61_90: existing.d61_90 + aging.d61_90,
      d90Plus: existing.d90Plus + aging.d90Plus,
      totalDue: existing.totalDue + inv.due,
    });
  }

  // Group Payables by Vendor
  const apMap = new Map<string, { partnerName: string; current: number; d1_30: number; d31_60: number; d61_90: number; d90Plus: number; totalDue: number }>();
  for (const bill of vendorBills) {
    const partnerId = bill.vendorId;
    const name = bill.vendor?.name || "Unknown Vendor";
    const aging = categorizeAging(bill.dueDate, bill.due);

    const existing = apMap.get(partnerId) || {
      partnerName: name,
      current: 0,
      d1_30: 0,
      d31_60: 0,
      d61_90: 0,
      d90Plus: 0,
      totalDue: 0,
    };

    apMap.set(partnerId, {
      partnerName: name,
      current: existing.current + aging.current,
      d1_30: existing.d1_30 + aging.d1_30,
      d31_60: existing.d31_60 + aging.d31_60,
      d61_90: existing.d61_90 + aging.d61_90,
      d90Plus: existing.d90Plus + aging.d90Plus,
      totalDue: existing.totalDue + bill.due,
    });
  }

  const receivables = Array.from(arMap.values());
  const payables = Array.from(apMap.values());

  const arSummary = {
    current: receivables.reduce((s, r) => s + r.current, 0),
    d1_30: receivables.reduce((s, r) => s + r.d1_30, 0),
    d31_60: receivables.reduce((s, r) => s + r.d31_60, 0),
    d61_90: receivables.reduce((s, r) => s + r.d61_90, 0),
    d90Plus: receivables.reduce((s, r) => s + r.d90Plus, 0),
    total: receivables.reduce((s, r) => s + r.totalDue, 0),
  };

  const apSummary = {
    current: payables.reduce((s, p) => s + p.current, 0),
    d1_30: payables.reduce((s, p) => s + p.d1_30, 0),
    d31_60: payables.reduce((s, p) => s + p.d31_60, 0),
    d61_90: payables.reduce((s, p) => s + p.d61_90, 0),
    d90Plus: payables.reduce((s, p) => s + p.d90Plus, 0),
    total: payables.reduce((s, p) => s + p.totalDue, 0),
  };

  return NextResponse.json({
    receivables,
    payables,
    arSummary,
    apSummary,
    asOfDate: now.toISOString(),
  });
}
