"use server";

import {
  type UpdateUserProfileValues,
  updateUserProfileSchema,
} from "@zephyr/auth/validation";
import { getUserDataSelect, prisma } from "@zephyr/db";
import { authClient } from "@/lib/auth";

export async function updateUserProfile(values: UpdateUserProfileValues) {
  const validatedValues = updateUserProfileSchema.parse(values);
  const session = await authClient.getSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: validatedValues,
    select: getUserDataSelect(session.user.id),
  });

  return updatedUser;
}
