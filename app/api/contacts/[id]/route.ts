import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { contactSchema } from "@/lib/validations";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;
  const c = await db.contact.findUnique({ where: { id } });
  if (!c) return apiError("Not found", 404);
  return NextResponse.json({ contact: c });
}
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = contactSchema.partial().safeParse(body);
  if (!parsed.success) return apiError("Invalid input");
  try {
    const c = await db.contact.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ contact: c });
  } catch { return apiError("Not found or duplicate email", 400); }
}
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN"]);
  if (error) return error!;
  const { id } = await ctx.params;

  const contact = await db.contact.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          customerInvoices: true,
          vendorBills: true,
          salesOrders: true,
          purchaseOrders: true,
          payments: true,
        },
      },
    },
  });

  if (!contact) return apiError("Contact not found", 404);

  const { customerInvoices, vendorBills, salesOrders, purchaseOrders, payments } = contact._count;
  const totalRefs = customerInvoices + vendorBills + salesOrders + purchaseOrders + payments;

  if (totalRefs > 0) {
    return apiError("Cannot delete contact with existing financial documents or orders", 400);
  }

  try {
    await db.contact.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return apiError(err.message || "Failed to delete contact", 400);
  }
}
