"use server";

import { cookies } from "next/headers";

export async function logout() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const authCookiePrefixes = ["zephyr", "next-auth", "better-auth"];

  // biome-ignore lint/complexity/noForEach: ignore
  allCookies.forEach((cookie) => {
    const shouldClear = authCookiePrefixes.some(
      (prefix) =>
        cookie.name.startsWith(prefix) ||
        cookie.name.includes("session") ||
        cookie.name.includes("token") ||
        cookie.name.includes("auth")
    );

    if (shouldClear) {
      try {
        cookieStore.delete(cookie.name);
        console.log(`Cleared cookie: ${cookie.name}`);
      } catch (e) {
        console.log(`Failed to clear cookie: ${cookie.name}`, e);
      }
    }
  });

  return { redirect: "/login" };
}
