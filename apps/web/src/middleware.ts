import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function isProtectedPath(pathname: string): boolean {
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return false;
  }
  return pathname === "/";
}

export async function middleware(request: NextRequest) {
  const { pathname, origin, search } = request.nextUrl;

  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") !== "https"
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get("host")}${request.nextUrl.pathname}${request.nextUrl.search}`,
      301
    );
  }

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
