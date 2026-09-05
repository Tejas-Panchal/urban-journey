import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySession, type SessionPayload } from "@/lib/auth";

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get("uf_session")?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireSession(roles?: string[]) {
  const s = await getSession();
  if (!s) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) as NextResponse, session: null };
  if (roles && !roles.includes(s.role)) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) as NextResponse, session: null };
  return { error: null, session: s };
}

export function apiError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}
