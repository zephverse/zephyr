import { getUserDataSelect, prisma } from "@zephyr/db";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth";
import ClientSettings from "./client-settings";

export default async function SettingsPage() {
  const session = await authClient.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: getUserDataSelect(session.user.id),
  });

  if (!user) {
    redirect("/login");
  }

  return <ClientSettings user={user} />;
}
