import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth/config";
import AdminDashboardClient from "./admin-dashboard.client";

export default async function AdminDashboard() {
  const hdrs = await headers();
  const serverHeaders = new Headers();
  hdrs.forEach((value, key) => {
    serverHeaders.set(key, value);
  });
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
