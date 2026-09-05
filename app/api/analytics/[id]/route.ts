import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { z } from "zod";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = z.object({ name: z.string().min(1).optional(), type: z.enum(["INCOME", "EXPENSE"]).optional() }).safeParse(body);
  if (!parsed.success) return apiError("Invalid input");
  try {
    const a = await db.analytic.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ analytic: a });
  } catch {
    return apiError("Failed to update analytic account or name already exists", 400);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;
  try {
    await db.analytic.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return apiError("Cannot delete analytic account as it is referenced by transactions", 400);
  }
}
