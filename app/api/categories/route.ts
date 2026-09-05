import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { z } from "zod";

export async function GET() {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  return NextResponse.json({ categories: await db.category.findMany({ orderBy: { name: "asc" } }) });
}
export async function POST(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const body = await req.json().catch(() => ({}));
  const parsed = z.object({ name: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return apiError("Name required");
  try {
    const c = await db.category.create({ data: { name: parsed.data.name } });
    return NextResponse.json({ category: c }, { status: 201 });
  } catch { return apiError("Category already exists", 409); }
}
