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

  // Find parent budget if this budget is a revision
  let revisionOf = null;
  if (b.revisionOfId) {
    revisionOf = await db.budget.findUnique({
      where: { id: b.revisionOfId },
      select: { id: true, name: true, status: true },
    });
  }

  // Find child budget if this budget was revised
  const revisedWith = await db.budget.findFirst({
    where: { revisionOfId: b.id },
    select: { id: true, name: true, status: true },
  });

  if (b.status === "CONFIRMED" || b.status === "REVISED") {
    await computeBudgetAchieved(b.id).catch(() => null);
  }

  const updatedB = await db.budget.findUnique({ where: { id }, include: { lines: true } });

  return NextResponse.json({ budget: updatedB, revisionOf, revisedWith });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const { name, start, end, responsibleId, lines } = body;

  const existing = await db.budget.findUnique({ where: { id } });
  if (!existing) return apiError("Not found", 404);

  if (lines && Array.isArray(lines)) {
    await db.budgetLine.deleteMany({ where: { budgetId: id } });
    await db.budgetLine.createMany({
      data: lines.map((l: any) => ({
        budgetId: id,
        analyticId: l.analyticId,
        type: l.type || "EXPENSE",
        committed: Number(l.committed) || 0,
        achievedCached: Number(l.achievedCached) || 0,
      })),
    });
  }

  const b = await db.budget.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(start ? { start: new Date(start) } : {}),
      ...(end ? { end: new Date(end) } : {}),
      ...(responsibleId !== undefined ? { responsibleId } : {}),
    },
    include: { lines: true },
  });

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
    if (b.status !== "CONFIRMED") return apiError("Only confirmed budgets can be revised", 400);
    
    const revisedName = b.name.includes("Revised") ? b.name : `${b.name} Revised`;
    const revised = await db.budget.create({
      data: {
        name: revisedName,
        start: b.start,
        end: b.end,
        responsibleId: b.responsibleId,
        status: "CONFIRMED",
        revisionOfId: b.id,
        lines: {
          create: b.lines.map((l) => ({
            analyticId: l.analyticId,
            type: l.type as any,
            committed: l.committed,
            achievedCached: l.achievedCached,
          })),
        },
      },
      include: { lines: true },
    });

    await db.budget.update({ where: { id }, data: { status: "REVISED" } });
    await computeBudgetAchieved(revised.id).catch(() => null);

    return NextResponse.json({ budget: revised }, { status: 201 });
  }

  if (action === "recompute") {
    await computeBudgetAchieved(id);
    return NextResponse.json({ ok: true });
  }

  return apiError("Unknown action", 400);
}

