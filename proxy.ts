import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function proxy(req: NextRequest) {
  const p = req.nextUrl.pathname;
  const isApi = p.startsWith("/api/");
  const isAuthPage = p === "/login" || p === "/signup" || p === "/forgot";
  const isPublic =
    p === "/" || isAuthPage || p.startsWith("/_next") || p === "/favicon.ico";
  if (
    isPublic ||
    (isApi &&
      (p.startsWith("/api/auth/login") ||
        p.startsWith("/api/auth/signup") ||
        p.startsWith("/api/auth/reset-password")))
  )
    return NextResponse.next();
  const token = req.cookies.get("uj_session")?.value || req.cookies.get("uf_session")?.value;
  if (!token) {
    if (isApi)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", req.url));
  }
  try {
    await jwtVerify(
      token,
      new TextEncoder().encode(
        process.env.JWT_SECRET ?? "sdjfjFjjjJFNOASFDIWfiann9f3ubfa9FN(bf3#",
      ),
    );
    return NextResponse.next();
  } catch {
    if (isApi)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
