import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, signSession, sessionCookie } from "@/lib/auth";
import { signupSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const { name, loginId, email, password } = parsed.data;
  const existsLogin = await db.user.findUnique({ where: { loginId } });
  if (existsLogin) return NextResponse.json({ error: "Login Id already exists" }, { status: 409 });
  const existsEmail = await db.user.findUnique({ where: { email } });
  if (existsEmail) return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  const contactExists = await db.contact.findUnique({ where: { email } }).catch(() => null);
  const passwordHash = await hashPassword(password);
  // Signup creates ACCOUNTANT user + optional contact link by email
  const user = await db.user.create({
    data: { loginId, email, passwordHash, role: "ACCOUNTANT", contactId: contactExists?.id ?? undefined },
  });
  const token = await signSession({ sub: user.id, loginId: user.loginId, role: user.role, contactId: user.contactId });
  const res = NextResponse.json({ ok: true, user: { id: user.id, loginId, email, role: user.role, name } });
  res.headers.set("Set-Cookie", sessionCookie(token));
  return res;
}
