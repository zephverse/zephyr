import type { Session, User } from "@zephyr/auth/core";
import { headers as nextHeaders } from "next/headers";

export type SessionResponse = { session: Session; user: User } | null;

export async function getSessionFromApi(): Promise<SessionResponse> {
  const hdrs = await nextHeaders();
  const cookie = hdrs.get("cookie") || "";
  const proto = hdrs.get("x-forwarded-proto") || "http";
  const host = hdrs.get("host") || "localhost:3000";
  const url = `${proto}://${host}/api/auth/get-session`;
  const res = await fetch(url, {
    method: "GET",
    headers: cookie ? { cookie } : {},
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    return null;
  }
  try {
    const data = (await res.json()) as SessionResponse;
    return data ?? null;
  } catch {
    return null;
  }
}
