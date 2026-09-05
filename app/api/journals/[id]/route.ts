import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { z } from "zod";

const updateJournalSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["SALES", "PURCHASE", "BANK", "CASH"]).optional(),
  defaultDebitId: z.string().nullable().optional(),
  defaultCreditId: z.string().nullable().optional(),
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;

  const j = await db.journal.findUnique({ where: { id } });
  if (!j) return apiError("Journal not found", 404);

  const accounts = await db.account.findMany();
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const enrichedJournal = {
    ...j,
    defaultDebit: j.defaultDebitId ? accountMap.get(j.defaultDebitId) || null : null,
    defaultCredit: j.defaultCreditId ? accountMap.get(j.defaultCreditId) || null : null,
  };

  return NextResponse.json({ journal: enrichedJournal });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = updateJournalSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid input");

  try {
    const dataToUpdate: any = {};
    if (parsed.data.name !== undefined) dataToUpdate.name = parsed.data.name;
    if (parsed.data.type !== undefined) dataToUpdate.type = parsed.data.type;
    if (parsed.data.defaultDebitId !== undefined) dataToUpdate.defaultDebitId = parsed.data.defaultDebitId;
    if (parsed.data.defaultCreditId !== undefined) dataToUpdate.defaultCreditId = parsed.data.defaultCreditId;

    const updated = await db.journal.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ journal: updated });
  } catch {
    return apiError("Journal update failed or already exists", 400);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { id } = await ctx.params;
  await db.journal.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
