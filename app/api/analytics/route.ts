import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { z } from "zod";

export async function GET(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};
  return NextResponse.json({ analytics: await db.analytic.findMany({ where, orderBy: { name: "asc" } }) });
}
export async function POST(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const body = await req.json().catch(() => ({}));
  const parsed = z.object({ name: z.string().min(1), type: z.enum(["INCOME", "EXPENSE"]) }).safeParse(body);
  if (!parsed.success) return apiError("Invalid input");
  try {
    const a = await db.analytic.create({ data: parsed.data });
    return NextResponse.json({ analytic: a }, { status: 201 });
  } catch { return apiError("Analytic already exists", 409); }
}
