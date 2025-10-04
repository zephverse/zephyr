import { keys } from "@root/keys";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return Response.json(
      { ok: false, error: "missing-token" },
      { status: 400 }
    );
  }

  const authBase = keys.NEXT_PUBLIC_AUTH_URL;
  const tryPending = async () => {
    try {
      const res = await fetch(`${authBase}/api/trpc/pendingSignupVerify`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": req.headers.get("user-agent") ?? "",
        },
        credentials: "include",
        body: JSON.stringify({ token }),
      });
      const data = (await res.json().catch(() => ({}) as unknown)) as
        | { result?: { data?: unknown } }
        | { success?: boolean };
      // @ts-expect-error loose parsing for cross-shape tolerance
      const wrapped = data?.result?.data;
      const ok =
        (wrapped &&
          (wrapped.success === true || wrapped?.json?.success === true)) ||
        // @ts-expect-error loose parsing
        data?.success === true ||
        res.ok;
      return ok === true;
    } catch {
      return false;
    }
  };

  const url = `${authBase}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  try {
    const pendingOk = await tryPending();
    if (pendingOk) {
      return Response.json({ ok: true }, { status: 200 });
    }
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "user-agent": req.headers.get("user-agent") ?? "",
      },
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}) as unknown);
    const ok =
      (data as { status?: boolean; ok?: boolean }).status === true ||
      (data as { status?: boolean; ok?: boolean }).ok === true ||
      res.ok;

    return Response.json({ ok }, { status: ok ? 200 : 400 });
  } catch {
    return Response.json(
      { ok: false, error: "network-error" },
      { status: 502 }
    );
  }
}
