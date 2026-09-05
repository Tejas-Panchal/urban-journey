import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { lineTotal, nextBillNo } from "@/lib/accounting";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  if (body.action === "confirm") {
    const o = await db.purchaseOrder.update({ where: { id }, data: { status: "CONFIRMED" } }).catch(() => null);
    if (!o) return apiError("Not found", 404);
    return NextResponse.json({ ok: true });
  }
  if (body.action === "create-bill") {
    const po = await db.purchaseOrder.findUnique({ where: { id }, include: { lines: true } });
    if (!po) return apiError("Not found", 404);
    const bill = await db.$transaction(async (tx) => {
      const no = await nextBillNo(tx);
      const lines = po.lines.map(l => ({ productId: l.productId, analyticId: l.analyticId, qty: l.qty, unitPrice: l.unitPrice, total: l.total }));
      const subtotal = lines.reduce((s, l) => s + l.total, 0);
      return tx.vendorBill.create({
        data: { no, vendorId: po.vendorId, poId: po.id, billRef: `FROM-${po.no}`, billDate: new Date(), dueDate: new Date(Date.now() + 15 * 864e5), subtotal, due: subtotal, lines: { create: lines } },
        include: { lines: true },
      });
    });
    return NextResponse.json({ bill }, { status: 201 });
  }
  return apiError("Unknown action", 400);
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;
  const o = await db.purchaseOrder.findUnique({ where: { id }, include: { lines: true } });
  if (!o) return apiError("Not found", 404);
  return NextResponse.json({ order: o });
}
