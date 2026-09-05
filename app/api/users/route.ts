import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, signSession, sessionCookie } from "@/lib/auth";
import { requireSession, apiError } from "@/lib/api";
import { createUserSchema } from "@/lib/validations";

// Admin creates User / Administrator (also used for contact portal user creation)
export async function POST(req: Request) {
  const { error, session } = await requireSession(["ADMIN"]);
  if (error || !session) return error!;
  const body = await req.json().catch(() => ({}));
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success)
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  const { name, loginId, email, password, role } = parsed.data;
  if (await db.user.findUnique({ where: { loginId } }))
    return apiError("Login Id already exists", 409);
  if (await db.user.findUnique({ where: { email } }))
    return apiError("Email already exists", 409);
  const passwordHash = await hashPassword(password);
  try {
    const user = await db.user.create({
      data: { loginId, email, passwordHash, role },
    });
    return NextResponse.json({
      ok: true,
      user: { id: user.id, loginId, email, role, name },
    });
  } catch (e: any) {
    return apiError("Could not create user", 400);
  }
}

export async function GET() {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      loginId: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ users });
}
