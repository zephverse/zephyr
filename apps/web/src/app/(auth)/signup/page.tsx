import type { Metadata } from "next";
import ClientSignupPage from "@/app/(auth)/client/ClientSignUpPage";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignupPage() {
  return <ClientSignupPage />;
}
