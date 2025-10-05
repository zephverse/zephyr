import { getPostDataInclude, type PostData, prisma } from "@zephyr/db";
import { getSessionFromApi } from "@/lib/session";

type VoteInfo = {
  aura: number;
  userVote: number;
};

export async function GET(
  _req: Request,
  props: { params: Promise<{ postId: string }> }
) {
  const params = await props.params;
  const { postId } = params;

  try {
    const session = await getSessionFromApi();
    const user = session?.user;
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: getPostDataInclude(user.id),
    });

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    const voteInfo: VoteInfo = {
      aura: post.aura,
      userVote: post.vote[0]?.value || 0,
    };

    const postData: PostData & VoteInfo = {
      ...post,
      ...voteInfo,
    };

    return Response.json(postData);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ postId: string }> }
) {
  const { postId } = await context.params;
  const session = await getSessionFromApi();
  const user = session?.user;
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { value } = await request.json();
  await prisma.vote.upsert({
    where: { userId_postId: { userId: user.id, postId } },
    create: { userId: user.id, postId, value },
    update: { value },
  });
  return Response.json({ success: true });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ postId: string }> }
) {
  const { postId } = await context.params;
  const session = await getSessionFromApi();
  const user = session?.user;
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  await prisma.vote.deleteMany({ where: { userId: user.id, postId } });
  return Response.json({ success: true });
}
