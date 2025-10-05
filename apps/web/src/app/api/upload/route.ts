import type { MediaType } from "@prisma/client";
import { prisma } from "@zephyr/db";
import { NextResponse } from "next/server";
import { uploadToMinio } from "@/lib/minio";
import { getSessionFromApi } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSessionFromApi();
  const user = session?.user;
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const postId = formData.get("postId") as string | null;

  if (!file) {
    return new NextResponse("No file provided", { status: 400 });
  }

  console.log("Uploading file:", {
    name: file.name,
    type: file.type,
    size: file.size,
    postId,
  });

  const upload = await uploadToMinio(file, user.id);

  const media = await prisma.media.create({
    data: {
      url: upload.url,
      type: upload.type as MediaType,
      key: upload.key,
      mimeType: upload.mimeType,
      size: upload.size,
      postId,
    },
  });

  return NextResponse.json({
    mediaId: media.id,
    url: upload.url,
    key: upload.key,
    type: media.type,
  });
}
