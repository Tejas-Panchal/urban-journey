import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { postJournal, getAccountIdByName } from "@/lib/accounting";
import { recomputeAllConfirmedBudgets } from "@/lib/budgets";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireSession(["ADMIN", "ACCOUNTANT", "CONTACT"]);
  if (error || !session) return error!;
  const { id } = await ctx.params;
  const inv = await db.customerInvoice.findUnique({ where: { id }, include: { customer: true, lines: true, payments: true } });
  if (!inv) return apiError("Not found", 404);
  if (session.role === "CONTACT" && session.contactId && inv.customerId !== session.contactId) {
    return apiError("Forbidden", 403);
  }
  return NextResponse.json({ invoice: inv });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  if (body.action !== "confirm") return apiError("Unknown action", 400);
  const inv = await db.customerInvoice.findUnique({ where: { id }, include: { lines: true } });
  if (!inv) return apiError("Not found", 404);
  if (inv.status !== "DRAFT") return apiError("Only Draft can be confirmed", 400);
  await db.$transaction(async (tx) => {
    await tx.customerInvoice.update({ where: { id }, data: { status: "CONFIRMED" } });
    const debtorId = await getAccountIdByName(tx, "Debtors");
    const saleId = await getAccountIdByName(tx, "Sale Income");
    const grandTotal = inv.total > 0 ? inv.total : inv.subtotal;
    const saleEntries = inv.lines.map((l) => ({
      accountId: saleId,
      partnerId: inv.customerId,
      analyticId: l.analyticId,
      debit: 0,
      credit: l.total,
    }));
    const lines = [
      { accountId: debtorId, partnerId: inv.customerId, debit: grandTotal, credit: 0 },
      ...saleEntries,
    ];
    await postJournal(tx, {
      journalType: "SALES",
      date: inv.invDate,
      reference: inv.no,
      sourceType: "CustomerInvoice",
      sourceId: inv.id,
      lines,
    });
  });
  await recomputeAllConfirmedBudgets().catch(() => null);
  return NextResponse.json({ ok: true });
}
