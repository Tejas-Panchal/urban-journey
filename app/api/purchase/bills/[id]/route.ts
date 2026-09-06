import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { postJournal, getAccountIdByName } from "@/lib/accounting";
import { recomputeAllConfirmedBudgets } from "@/lib/budgets";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;
  const b = await db.vendorBill.findUnique({ where: { id }, include: { lines: true, payments: true } });
  if (!b) return apiError("Not found", 404);
  return NextResponse.json({ bill: b });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  if (body.action !== "confirm") return apiError("Unknown action", 400);
  const bill = await db.vendorBill.findUnique({ where: { id }, include: { lines: true } });
  if (!bill) return apiError("Not found", 404);
  if (bill.status !== "DRAFT") return apiError("Only Draft can be confirmed", 400);
  await db.$transaction(async (tx) => {
    await tx.vendorBill.update({ where: { id }, data: { status: "CONFIRMED" } });
    const purchaseId = await getAccountIdByName(tx, "Purchase Expense");
    const creditorId = await getAccountIdByName(tx, "Creditors");
    const lineEntries = bill.lines.map((l) => ({
      accountId: purchaseId,
      partnerId: bill.vendorId,
      analyticId: l.analyticId,
      debit: l.total,
      credit: 0,
    }));
    await postJournal(tx, {
      journalType: "PURCHASE",
      date: bill.billDate, reference: bill.no, sourceType: "VendorBill", sourceId: bill.id,
      lines: [
        ...lineEntries,
        { accountId: creditorId, partnerId: bill.vendorId, debit: 0, credit: bill.subtotal },
      ],
    });
  });
  await recomputeAllConfirmedBudgets().catch(() => null);
  return NextResponse.json({ ok: true });
}
