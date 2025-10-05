import { prisma } from "@zephyr/db";
import { getSessionFromApi } from "@/lib/session";

export async function PATCH(
  request: Request,
  props: { params: { userId: string } }
) {
  const session = await getSessionFromApi();
  const user = session?.user;
  if (!user || user.id !== props.params.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  await prisma.user.update({ where: { id: user.id }, data: body });
  return Response.json({ success: true });
}
