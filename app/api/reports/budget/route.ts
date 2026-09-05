import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/api";
import { computeBudgetAchieved } from "@/lib/budgets";

export async function GET() {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const budgets = await db.budget.findMany({ include: { lines: true }, orderBy: { createdAt: "desc" } });
  const out = [];
  for (const b of budgets) {
    if (b.status === "CONFIRMED") await computeBudgetAchieved(b.id).catch(() => null);
    const full = await db.budget.findUnique({ where: { id: b.id }, include: { lines: true } });
    const lines = (full?.lines ?? []).map(l => ({
      ...l,
      pct: l.committed ? Math.round((l.achievedCached / l.committed) * 10000) / 100 : 0,
      toAchieve: Math.round((l.committed - l.achievedCached) * 100) / 100,
    }));
    out.push({ ...b, lines });
  }
  return NextResponse.json({ budgets: out });
}
