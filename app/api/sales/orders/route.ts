import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { salesOrderStrict } from "@/lib/validations";
import { lineSubtotal, lineTaxAmount, lineGrandTotal, nextSoNo } from "@/lib/accounting";

export async function GET() {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const orders = await db.salesOrder.findMany({ include: { customer: true, lines: true }, orderBy: { createdAt: "desc" } });
  const invoices = await db.customerInvoice.findMany({
    where: { soId: { in: orders.map(o => o.id) } },
    select: { id: true, no: true, soId: true, status: true, total: true }
  });
  const analytics = await db.analytic.findMany({ orderBy: { name: "asc" } });
  const ordersWithInvoice = orders.map(o => ({
    ...o,
    invoice: invoices.find(inv => inv.soId === o.id) || null
  }));
  return NextResponse.json({ orders: ordersWithInvoice, analytics });
}
export async function POST(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const body = await req.json().catch(() => ({}));
  const parsed = salesOrderStrict.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  const lines = parsed.data.lines.map(l => {
    const sub = lineSubtotal(l.qty, l.unitPrice);
    const taxRate = l.tax ?? 0;
    const taxAmt = lineTaxAmount(l.qty, l.unitPrice, taxRate);
    const tot = sub + taxAmt;
    return { ...l, tax: taxRate, total: tot };
  });
  const subtotal = lines.reduce((s, l) => s + lineSubtotal(l.qty, l.unitPrice), 0);
  const taxTotal = lines.reduce((s, l) => s + lineTaxAmount(l.qty, l.unitPrice, l.tax), 0);
  const total = subtotal + taxTotal;
  const order = await db.$transaction(async (tx) => {
    const no = await nextSoNo(tx);
    return tx.salesOrder.create({
      data: {
        no,
        customerId: parsed.data.customerId,
        date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
        subtotal,
        taxTotal,
        total,
        lines: { create: lines },
      },
      include: { lines: true },
    });
  });
  return NextResponse.json({ order }, { status: 201 });
}
