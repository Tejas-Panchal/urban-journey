import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "urban-furniture-local-dev-secret-change-me");

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export type SessionPayload = { sub: string; loginId: string; role: "ADMIN" | "ACCOUNTANT" | "CONTACT"; contactId?: string | null };

export async function signSession(p: SessionPayload) {
  return new SignJWT({ ...p } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function sessionCookie(token: string) {
  return `uf_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`;
}
export function clearSessionCookie() {
  return `uf_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
