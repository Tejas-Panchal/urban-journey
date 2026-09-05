import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { contactSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const type = searchParams.get("type");
  const contacts = await db.contact.findMany({
    where: {
      ...(type ? { type: type as any } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ contacts });
}

export async function POST(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const body = await req.json().catch(() => ({}));
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success)
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  if (await db.contact.findUnique({ where: { email: parsed.data.email } }))
    return apiError("Email already exists", 409);
  const c = await db.contact.create({ data: parsed.data });
  return NextResponse.json({ contact: c }, { status: 201 });
}
