import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { paymentSchema } from "@/lib/validations";
import { postJournal, getAccountIdByName } from "@/lib/accounting";

export async function GET() {
  const { error, session } = await requireSession(["ADMIN", "ACCOUNTANT", "CONTACT"]);
  if (error || !session) return error!;
  const payments = await db.payment.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ payments });
}

export async function POST(req: Request) {
  const { error, session } = await requireSession(["ADMIN", "ACCOUNTANT", "CONTACT"]);
  if (error || !session) return error!;
  const body = await req.json().catch(() => ({}));
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  const { partnerId, billId, invoiceId, amount, via } = parsed.data;
  const date = parsed.data.date ? new Date(parsed.data.date) : new Date();

  // CONTACT can pay only own docs
  if (session.role === "CONTACT" && session.contactId && partnerId !== session.contactId) {
    return apiError("Forbidden", 403);
  }

  if (billId) {
    const bill = await db.vendorBill.findUnique({ where: { id: billId } });
    if (!bill) return apiError("Bill not found", 404);
    if (amount - bill.due > 0.01) return apiError("Amount exceeds due", 400);
    if (bill.status === "DRAFT") return apiError("Confirm bill first", 400);
    await db.$transaction(async (tx) => {
      const creditorId = await getAccountIdByName(tx, "Creditors");
      const cashBankId = await getAccountIdByName(tx, via === "CASH" ? "Cash" : "Bank");
      const entry = await postJournal(tx, {
        journalType: via === "CASH" ? "CASH" : "BANK",
        date, reference: `PAY-${bill.no}`, sourceType: "Payment", sourceId: "pending",
        lines: [
          { accountId: creditorId, partnerId, debit: amount, credit: 0 },
          { accountId: cashBankId, partnerId, debit: 0, credit: amount },
        ],
      });
      const paid = Math.round((bill.paid + amount) * 100) / 100;
      const due = Math.round((bill.subtotal - paid) * 100) / 100;
      await tx.payment.create({ data: { partnerId, billId, amount, date, via, note: parsed.data.note, journalEntryId: entry.id } });
      await tx.vendorBill.update({ where: { id: billId }, data: { paid, due, status: due <= 0.01 ? "PAID" : "PARTIAL" } });
      await tx.journalEntry.update({ where: { id: entry.id }, data: { sourceId: billId } });
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } else {
    const inv = await db.customerInvoice.findUnique({ where: { id: invoiceId! } });
    if (!inv) return apiError("Invoice not found", 404);
    if (amount - inv.due > 0.01) return apiError("Amount exceeds due", 400);
    if (inv.status === "DRAFT") return apiError("Confirm invoice first", 400);
    await db.$transaction(async (tx) => {
      const debtorId = await getAccountIdByName(tx, "Debtors");
      const cashBankId = await getAccountIdByName(tx, via === "CASH" ? "Cash" : "Bank");
      const entry = await postJournal(tx, {
        journalType: via === "CASH" ? "CASH" : "BANK",
        date, reference: `PAY-${inv.no}`, sourceType: "Payment", sourceId: "pending",
        lines: [
          { accountId: cashBankId, partnerId, debit: amount, credit: 0 },
          { accountId: debtorId, partnerId, debit: 0, credit: amount },
        ],
      });
      const paid = Math.round((inv.paid + amount) * 100) / 100;
      const invTotal = inv.total > 0 ? inv.total : inv.subtotal;
      const due = Math.max(0, Math.round((invTotal - paid) * 100) / 100);
      await tx.payment.create({ data: { partnerId, invoiceId, amount, date, via, note: parsed.data.note, journalEntryId: entry.id } });
      await tx.customerInvoice.update({ where: { id: invoiceId! }, data: { paid, due, status: due <= 0.01 ? "PAID" : "PARTIAL" } });
      await tx.journalEntry.update({ where: { id: entry.id }, data: { sourceId: invoiceId! } });
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  }
}
