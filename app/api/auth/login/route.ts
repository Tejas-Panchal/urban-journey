import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword, signSession, sessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = z
    .object({ loginId: z.string().min(1), password: z.string().min(1) })
    .safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid Login Id or Password" },
      { status: 401 },
    );
  const user = await db.user.findUnique({
    where: { loginId: parsed.data.loginId },
  });
  if (!user)
    return NextResponse.json(
      { error: "Invalid Login Id or Password" },
      { status: 401 },
    );
  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok)
    return NextResponse.json(
      { error: "Invalid Login Id or Password" },
      { status: 401 },
    );
  const token = await signSession({
    sub: user.id,
    loginId: user.loginId,
    role: user.role,
    contactId: user.contactId,
  });
  const res = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      loginId: user.loginId,
      email: user.email,
      role: user.role,
    },
  });
  res.headers.set("Set-Cookie", sessionCookie(token));
  return res;
}
