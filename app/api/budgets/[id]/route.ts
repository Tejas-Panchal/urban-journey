import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { computeBudgetAchieved } from "@/lib/budgets";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;
  const b = await db.budget.findUnique({ where: { id }, include: { lines: true } });
  if (!b) return apiError("Not found", 404);
  return NextResponse.json({ budget: b });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;
  const b = await db.budget.findUnique({ where: { id }, include: { lines: true } });
  if (!b) return apiError("Not found", 404);

  if (action === "confirm") {
    if (b.status !== "DRAFT") return apiError("Only Draft can be confirmed", 400);
    await db.budget.update({ where: { id }, data: { status: "CONFIRMED" } });
    await computeBudgetAchieved(id);
    return NextResponse.json({ ok: true });
  }
  if (action === "cancel") {
    await db.budget.update({ where: { id }, data: { status: "CANCELLED" } });
    return NextResponse.json({ ok: true });
  }
  if (action === "revise") {
    if (b.status !== "CONFIRMED") return apiError("Only Visible at confirmed Stage", 400);
    const revised = await db.budget.create({
      data: {
        name: `${b.name} Revised`,
        start: b.start, end: b.end, responsibleId: b.responsibleId,
        status: "DRAFT", revisionOfId: b.id,
        lines: { create: b.lines.map(l => ({ analyticId: l.analyticId, type: l.type as any, committed: body.committed ?? l.committed })) },
      },
      include: { lines: true },
    });
    await db.budget.update({ where: { id }, data: { status: "REVISED" } });
    return NextResponse.json({ budget: revised }, { status: 201 });
  }
  if (action === "recompute") {
    await computeBudgetAchieved(id);
    return NextResponse.json({ ok: true });
  }
  return apiError("Unknown action", 400);
}
