import { validateRequest } from "@zephyr/auth/auth";
import { getUserData } from "@/hooks/useUserData";
import ClientHome from "./client-home";

export default async function Page() {
  const { user } = await validateRequest();

  if (!user) {
    return (
      <p className="text-destructive">
        You&apos;re not authorized to view this page.
      </p>
    );
  }

  const userData = await getUserData(user.id);

  if (!userData) {
    return <p className="text-destructive">Unable to load user data.</p>;
  }

  return <ClientHome userData={userData} />;
}
