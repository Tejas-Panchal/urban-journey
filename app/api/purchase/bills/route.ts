import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { vendorBillSchema } from "@/lib/validations";
import { lineTotal, nextBillNo, postJournal, getAccountIdByName } from "@/lib/accounting";

export async function GET() {
  const { error, session } = await requireSession(["ADMIN", "ACCOUNTANT", "CONTACT"]);
  if (error || !session) return error!;

  const whereVendor = session.role === "CONTACT" && session.contactId
    ? { vendorId: session.contactId }
    : {};

  const bills = await db.vendorBill.findMany({
    where: whereVendor,
    include: { vendor: true, lines: true, payments: true },
    orderBy: { createdAt: "desc" },
  });
  const analytics = session.role === "CONTACT" ? [] : await db.analytic.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ bills, analytics });
}

export async function POST(req: Request) {
  try {
    const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
    if (error) return error!;
    const body = await req.json().catch(() => ({}));
    const parsed = vendorBillSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);

    const lines = parsed.data.lines.map(l => ({
      productId: l.productId,
      analyticId: l.analyticId || null,
      qty: l.qty,
      unitPrice: l.unitPrice,
      total: lineTotal(l.qty, l.unitPrice),
    }));
    const subtotal = lines.reduce((s, l) => s + l.total, 0);

    const billDate = parsed.data.billDate ? new Date(parsed.data.billDate) : new Date();
    const dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const bill = await db.$transaction(async (tx) => {
      const no = await nextBillNo(tx, billDate);
      return tx.vendorBill.create({
        data: {
          no,
          vendorId: parsed.data.vendorId,
          poId: parsed.data.poId || null,
          billRef: parsed.data.billRef,
          billDate,
          dueDate,
          subtotal,
          due: subtotal,
          lines: { create: lines },
        },
        include: { lines: true },
      });
    });
    return NextResponse.json({ bill }, { status: 201 });
  } catch (err: any) {
    return apiError(err.message || "Failed to create vendor bill", 500);
  }
}
