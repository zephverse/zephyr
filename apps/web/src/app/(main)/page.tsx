import { getUserData } from "@/hooks/use-user-data";
import { authClient } from "@/lib/auth";
import ClientHome from "./client-home";

export default async function Page() {
  const session = await authClient.getSession();

  if (!session?.user) {
    return (
      <p className="text-destructive">
        You&apos;re not authorized to view this page.
      </p>
    );
  }

  const userData = await getUserData(session.user.id);

  if (!userData) {
    return <p className="text-destructive">Unable to load user data.</p>;
  }

  return <ClientHome userData={userData} />;
}
