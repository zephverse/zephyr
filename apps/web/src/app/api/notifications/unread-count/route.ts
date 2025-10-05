import type { NotificationCountInfo } from "@zephyr/db";
import { prisma } from "@zephyr/db";
import { getSessionFromApi } from "@/lib/session";

export async function GET() {
  const session = await getSessionFromApi();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const unreadCount = await prisma.notification.count({
    where: { recipientId: userId, read: false },
  });

  return Response.json({ unreadCount } satisfies NotificationCountInfo);
}
