"use server";

import { createCommentSchema } from "@zephyr/auth/validation";
import { getCommentDataInclude, type PostData, prisma } from "@zephyr/db";
import { authClient } from "@/lib/auth";

export async function submitComment({
  post,
  content,
}: {
  post: PostData;
  content: string;
}) {
  const session = await authClient.getSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const { content: contentValidated } = createCommentSchema.parse({ content });

  const [newComment] = await prisma.$transaction([
    prisma.comment.create({
      data: {
        content: contentValidated,
        postId: post.id,
        userId: session.user.id,
      },
      include: getCommentDataInclude(session.user.id),
    }),
    ...(post.session.user.id !== session.user.id
      ? [
          prisma.notification.create({
            data: {
              issuerId: session.user.id,
              recipientId: post.session.user.id,
              postId: post.id,
              type: "COMMENT",
            },
          }),
        ]
      : []),
  ]);

  return newComment;
}

export async function deleteComment(id: string) {
  const session = await authClient.getSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const comment = await prisma.comment.findUnique({
    where: { id },
  });

  if (!comment) {
    throw new Error("Comment not found");
  }

  if (comment.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  const deletedComment = await prisma.comment.delete({
    where: { id },
    include: getCommentDataInclude(session.user.id),
  });

  return deletedComment;
}
