import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { z } from "zod";

const updateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["ASSET", "LIABILITY", "INCOME", "EXPENSE", "CAPITAL"]).optional(),
  subtype: z.enum(["CASH", "BANK", "DEBTOR", "CREDITOR", "SALE", "PURCHASE", "OTHER", "CAPITAL"]).optional(),
  isArchived: z.boolean().optional(),
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;

  const a = await db.account.findUnique({ where: { id } });
  if (!a) return apiError("Account not found", 404);

  return NextResponse.json({ account: a });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = updateAccountSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid input");

  try {
    const updated = await db.account.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json({ account: updated });
  } catch {
    return apiError("Account update failed or name already exists", 400);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;
  await db.account.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
