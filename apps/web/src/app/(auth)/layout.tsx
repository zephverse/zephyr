import { redirect } from "next/navigation";
import type React from "react";
import { authClient } from "@/lib/auth";

// Session handling is now managed by Better Auth

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await authClient.getSession();

  if (session?.user) {
    redirect("/");
  }

  return <div className="font-sofiaProSoftMed">{children}</div>;
}
