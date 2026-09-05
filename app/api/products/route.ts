import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { productSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const products = await db.product.findMany({
    where: search ? { name: { contains: search } } : {},
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products });
}
export async function POST(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const body = await req.json().catch(() => ({}));
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  const p = await db.product.create({ data: parsed.data });
  return NextResponse.json({ product: p }, { status: 201 });
}
