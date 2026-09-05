import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { budgetSchema } from "@/lib/validations";
import { computeBudgetAchieved } from "@/lib/budgets";

export async function GET() {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const budgets = await db.budget.findMany({
    include: { lines: true },
    orderBy: { createdAt: "desc" },
  });

  const analytics = await db.analytic.findMany();
  const analyticsMap = Object.fromEntries(analytics.map((a) => [a.id, a]));

  const enrichedBudgets = [];
  for (const b of budgets) {
    if (b.status === "CONFIRMED" || b.status === "REVISED") {
      await computeBudgetAchieved(b.id).catch(() => null);
    }
    const updated = await db.budget.findUnique({
      where: { id: b.id },
      include: { lines: true },
    });

    let revisionOf = null;
    if (b.revisionOfId) {
      revisionOf = await db.budget.findUnique({
        where: { id: b.revisionOfId },
        select: { id: true, name: true, status: true },
      });
    }

    const revisedWith = await db.budget.findFirst({
      where: { revisionOfId: b.id },
      select: { id: true, name: true, status: true },
    });

    const lines = (updated?.lines || []).map((l) => ({
      ...l,
      analyticName: analyticsMap[l.analyticId]?.name || l.analyticId,
    }));

    enrichedBudgets.push({
      ...updated,
      lines,
      revisionOf,
      revisedWith,
    });
  }

  return NextResponse.json({ budgets: enrichedBudgets, analytics });
}

export async function POST(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const body = await req.json().catch(() => ({}));
  const parsed = budgetSchema.safeParse(body);
  if (!parsed.success)
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  const { name, start, end, responsibleId, lines } = parsed.data;
  if (new Date(start) >= new Date(end))
    return apiError("Start must be before End");
  const b = await db.budget.create({
    data: {
      name,
      start: new Date(start),
      end: new Date(end),
      responsibleId,
      lines: { create: lines },
    },
    include: { lines: true },
  });
  return NextResponse.json({ budget: b }, { status: 201 });
}

