import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { customerInvoiceSchema } from "@/lib/validations";
import { lineSubtotal, lineTaxAmount, nextInvNo } from "@/lib/accounting";

export async function GET() {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  return NextResponse.json({
    invoices: await db.customerInvoice.findMany({
      include: { customer: true, lines: { include: { product: true } }, payments: true },
      orderBy: { createdAt: "desc" },
    }),
  });
}
export async function POST(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const body = await req.json().catch(() => ({}));
  const parsed = customerInvoiceSchema.safeParse(body);
  if (!parsed.success)
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  const lines = parsed.data.lines.map((l) => {
    const sub = lineSubtotal(l.qty, l.unitPrice);
    const taxRate = l.tax ?? 0;
    const taxAmt = lineTaxAmount(l.qty, l.unitPrice, taxRate);
    const tot = sub + taxAmt;
    return { ...l, tax: taxRate, total: tot };
  });
  const subtotal = lines.reduce(
    (s, l) => s + lineSubtotal(l.qty, l.unitPrice),
    0,
  );
  const taxTotal = lines.reduce(
    (s, l) => s + lineTaxAmount(l.qty, l.unitPrice, l.tax),
    0,
  );
  const total = subtotal + taxTotal;
  const inv = await db.$transaction(async (tx) => {
    const no = await nextInvNo(
      tx,
      parsed.data.invDate ? new Date(parsed.data.invDate) : new Date(),
    );
    return tx.customerInvoice.create({
      data: {
        no,
        customerId: parsed.data.customerId,
        soId: parsed.data.soId,
        invRef: parsed.data.invRef,
        invDate: parsed.data.invDate
          ? new Date(parsed.data.invDate)
          : new Date(),
        dueDate: new Date(parsed.data.dueDate),
        subtotal,
        taxTotal,
        total,
        due: total,
        lines: { create: lines },
      },
      include: { customer: true, lines: true },
    });
  });
  return NextResponse.json({ invoice: inv }, { status: 201 });
}
