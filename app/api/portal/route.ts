import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";

// Contact portal: own invoices/bills only
export async function GET(req: Request) {
  const { error, session } = await requireSession(["ADMIN", "ACCOUNTANT", "CONTACT"]);
  if (error || !session) return error!;
  const partnerId = session.contactId ?? new URL(req.url).searchParams.get("partnerId");
  if (!partnerId) return apiError("No linked contact", 400);
  if (session.role === "CONTACT" && session.contactId !== partnerId) return apiError("Forbidden", 403);
  const [invoices, bills] = await Promise.all([
    db.customerInvoice.findMany({ where: { customerId: partnerId }, include: { lines: true, payments: true }, orderBy: { createdAt: "desc" } }),
    db.vendorBill.findMany({ where: { vendorId: partnerId }, include: { lines: true, payments: true }, orderBy: { createdAt: "desc" } }),
  ]);
  return NextResponse.json({ invoices, bills });
}
