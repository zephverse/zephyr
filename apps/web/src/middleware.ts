import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = new Set([
  "/login",
  "/signup",
  "/verify-email",
  "/reset-password",
]);

const PROTECTED_PREFIXES = [
  "/",
  "/compose",
  "/settings",
  "/discover",
  "/bookmarks",
  "/notifications",
  "/users",
  "/posts",
  "/search",
];

function isProtectedPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) {
    return false;
  }
  if (pathname.startsWith("/api/")) {
    return false;
  }
  if (pathname.startsWith("/_next")) {
    return false;
  }
  if (pathname === "/favicon.ico") {
    return false;
  }
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname, origin, search } = request.nextUrl;
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  try {
    const cookie = request.headers.get("cookie") || "";
    const res = await fetch(`${origin}/api/auth/get-session`, {
      method: "GET",
      headers: cookie ? { cookie } : {},
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error("session-fetch-failed");
    }
    const data = (await res.json()) as { user?: unknown } | null;
    if (data && (data as { user?: unknown }).user) {
      return NextResponse.next();
    }
  } catch {
    // ignore and fallthrough to redirect
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = search
    ? `?next=${encodeURIComponent(pathname + search)}`
    : `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon.ico).*)"],
};
