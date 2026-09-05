import { NextResponse } from "next/server";
import { getSession } from "@/lib/api";
import { db } from "@/lib/db";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ user: null }, { status: 401 });
  const user = await db.user.findUnique({ where: { id: s.sub } });
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user: { id: user.id, loginId: user.loginId, email: user.email, role: user.role, contactId: user.contactId } });
}
