"use server";

export function loginAction(_: { username: string; password: string }): {
  error?: string;
  success?: boolean;
} {
  return { success: true };
}
