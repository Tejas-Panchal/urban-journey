import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { lineSubtotal, lineTaxAmount, nextInvNo } from "@/lib/accounting";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  if (body.action === "confirm") {
    await db.salesOrder.update({ where: { id }, data: { status: "CONFIRMED" } }).catch(() => null);
    return NextResponse.json({ ok: true });
  }
  if (body.action === "create-invoice") {
    const so = await db.salesOrder.findUnique({ where: { id }, include: { lines: true } });
    if (!so) return apiError("Not found", 404);
    const inv = await db.$transaction(async (tx) => {
      const no = await nextInvNo(tx);
      const lines = so.lines.map(l => ({
        productId: l.productId,
        analyticId: l.analyticId,
        qty: l.qty,
        unitPrice: l.unitPrice,
        tax: l.tax ?? 0,
        total: l.total,
      }));
      const subtotal = lines.reduce((s, l) => s + lineSubtotal(l.qty, l.unitPrice), 0);
      const taxTotal = lines.reduce((s, l) => s + lineTaxAmount(l.qty, l.unitPrice, l.tax), 0);
      const total = subtotal + taxTotal;
      await tx.salesOrder.update({ where: { id }, data: { status: "CONFIRMED" } });
      return tx.customerInvoice.create({
        data: {
          no,
          customerId: so.customerId,
          soId: so.id,
          invRef: `FROM-${so.no}`,
          invDate: new Date(),
          dueDate: new Date(Date.now() + 15 * 864e5),
          subtotal,
          taxTotal,
          total,
          due: total,
          lines: { create: lines },
        },
        include: { lines: true },
      });
    });
    return NextResponse.json({ invoice: inv }, { status: 201 });
  }
  return apiError("Unknown action", 400);
}
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;
  const o = await db.salesOrder.findUnique({ where: { id }, include: { lines: true } });
  if (!o) return apiError("Not found", 404);
  return NextResponse.json({ order: o });
}
