import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { purchaseOrderSchema } from "@/lib/validations";
import { lineTotal, nextPoNo } from "@/lib/accounting";

export async function GET() {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const orders = await db.purchaseOrder.findMany({ include: { lines: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const body = await req.json().catch(() => ({}));
  const parsed = purchaseOrderSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  const vendor = await db.contact.findUnique({ where: { id: parsed.data.vendorId } });
  if (!vendor) return apiError("Vendor not found", 404);
  const lines = parsed.data.lines.map(l => ({ ...l, total: lineTotal(l.qty, l.unitPrice) }));
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const order = await db.$transaction(async (tx) => {
    const no = await nextPoNo(tx);
    return tx.purchaseOrder.create({
      data: { no, vendorId: parsed.data.vendorId, date: parsed.data.date ? new Date(parsed.data.date) : new Date(), subtotal, lines: { create: lines } },
      include: { lines: true },
    });
  });
  return NextResponse.json({ order }, { status: 201 });
}
