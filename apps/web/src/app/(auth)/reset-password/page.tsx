import type { Metadata } from "next";
import ResetPasswordForm from "@/components/Auth/ResetPasswordForm";

export const metadata: Metadata = {
	title: "Reset Password",
};

export default function ResetPasswordPage() {
	return <ResetPasswordForm />;
}
