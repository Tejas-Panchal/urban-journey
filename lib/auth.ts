import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const secretNew = new TextEncoder().encode(process.env.JWT_SECRET ?? "urban-journey-local-dev-secret-change-me");
const secretOld = new TextEncoder().encode("urban-furniture-local-dev-secret-change-me");

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
    .sign(secretNew);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretNew);
    return payload as unknown as SessionPayload;
  } catch {
    try {
      const { payload } = await jwtVerify(token, secretOld);
      return payload as unknown as SessionPayload;
    } catch {
      return null;
    }
  }
}

export function sessionCookie(token: string) {
  return `uj_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`;
}
export function clearSessionCookie() {
  return `uj_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
