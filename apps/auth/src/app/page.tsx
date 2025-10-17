import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth/config";
import AdminDashboardClient from "./admin-dashboard.client";

export default async function AdminDashboard() {
  const hdrs = await headers();
  const serverHeaders = new Headers();
  const cookie = hdrs.get("cookie");
  const userAgent = hdrs.get("user-agent");
  if (cookie) {
    serverHeaders.set("cookie", cookie);
  }
  if (userAgent) {
    serverHeaders.set("user-agent", userAgent);
  }
  const session = await auth.api.getSession({
    headers: serverHeaders,
  });

  const isAdmin = Boolean(
    session?.user &&
      "role" in session.user &&
      (session.user as { role?: string }).role === "admin"
  );

  if (!isAdmin) {
    redirect(process.env.NEXT_PUBLIC_URL || "http://localhost:3000");
  }

  return <AdminDashboardClient />;
}
