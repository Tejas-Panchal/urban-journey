import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { productSchema } from "@/lib/validations";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;
  const p = await db.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!p) return apiError("Product not found", 404);
  return NextResponse.json({ product: p });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = productSchema.partial().safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  try {
    const p = await db.product.update({
      where: { id },
      data: parsed.data,
      include: { category: true },
    });
    return NextResponse.json({ product: p });
  } catch {
    return apiError("Product not found or update failed", 400);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;
  await db.product.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
