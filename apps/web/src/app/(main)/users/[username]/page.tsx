import { getUserDataSelect, prisma } from "@zephyr/db";
import { notFound } from "next/navigation";
import { cache } from "react";
import { authClient } from "@/lib/auth";
import ClientProfile from "./client-profile";

type PageProps = {
  params: Promise<{ username: string }>;
};

const getUser = cache(async (username: string, loggedInUserId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      username: {
        equals: username,
        mode: "insensitive",
      },
    },
    select: getUserDataSelect(loggedInUserId),
  });

  if (!user) {
    notFound();
  }

  return user;
});

export default async function Page(props: PageProps) {
  const params = await props.params;
  const { username } = params;
  const session = await authClient.getSession();

  if (!session?.user) {
    return (
      <p className="text-destructive">
        You&apos;re not authorized to view this page.
      </p>
    );
  }

  const userData = await getUser(username, session.user.id);

  return (
    <ClientProfile
      loggedInUserId={session.user.id}
      userData={userData}
      username={username}
    />
  );
}
