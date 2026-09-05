import { db } from "@/lib/db";

export function lineTotal(qty: number, unitPrice: number) {
  return Math.round(qty * unitPrice * 100) / 100;
}

export function lineSubtotal(qty: number, unitPrice: number) {
  return Math.round(qty * unitPrice * 100) / 100;
}

export function lineTaxAmount(qty: number, unitPrice: number, tax: number = 0) {
  return Math.round(qty * unitPrice * (tax / 100) * 100) / 100;
}

export function lineGrandTotal(qty: number, unitPrice: number, tax: number = 0) {
  return lineSubtotal(qty, unitPrice) + lineTaxAmount(qty, unitPrice, tax);
}

export async function nextPoNo(tx: any) {
  const last = await tx.purchaseOrder.findFirst({ orderBy: { createdAt: "desc" } });
  const n = last ? parseInt(last.no.replace(/\D/g, "") || "0", 10) + 1 : 1;
  return "P" + String(n).padStart(5, "0");
}
export async function nextSoNo(tx: any) {
  const last = await tx.salesOrder.findFirst({ orderBy: { createdAt: "desc" } });
  const n = last ? parseInt(last.no.replace(/\D/g, "") || "0", 10) + 1 : 1;
  return "S" + String(n).padStart(5, "0");
}
export async function nextBillNo(tx: any, date = new Date()) {
  const y = new Date(date).getFullYear();
  const count = await tx.vendorBill.count();
  return `Bill/${y}/${String(count + 1).padStart(4, "0")}`;
}
export async function nextInvNo(tx: any, date = new Date()) {
  const y = new Date(date).getFullYear();
  const count = await tx.customerInvoice.count();
  return `INV/${y}/${String(count + 1).padStart(4, "0")}`;
}

export function checkBalanced(lines: { debit: number; credit: number }[]) {
  const d = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const c = lines.reduce((s, l) => s + (l.credit || 0), 0);
  if (Math.abs(d - c) > 0.01) throw new Error(`Unbalanced journal: debit ${d} != credit ${c}`);
}

export async function getAccountIdByName(tx: any, name: string) {
  const a = await tx.account.findUnique({ where: { name } });
  if (!a) throw new Error(`Account not found: ${name}`);
  return a.id;
}
export async function getJournalIdByType(tx: any, type: "SALES" | "PURCHASE" | "BANK" | "CASH") {
  const j = await tx.journal.findFirst({ where: { type } });
  if (!j) throw new Error(`Journal not found: ${type}`);
  return j.id;
}

export async function postJournal(
  tx: any,
  opts: { journalType: "SALES" | "PURCHASE" | "BANK" | "CASH"; date: Date; reference: string; sourceType: string; sourceId: string; lines: { accountId: string; partnerId?: string; analyticId?: string; debit: number; credit: number }[] }
) {
  checkBalanced(opts.lines);
  const journalId = await getJournalIdByType(tx, opts.journalType);
  return tx.journalEntry.create({
    data: {
      journalId,
      date: opts.date,
      reference: opts.reference,
      status: "POSTED",
      sourceType: opts.sourceType,
      sourceId: opts.sourceId,
      lines: { create: opts.lines },
    },
  });
}
