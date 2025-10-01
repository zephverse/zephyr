import type { Metadata } from "next";
import ConfirmResetForm from "@/components/Auth/ConfirmResetForm";

export const metadata: Metadata = {
	title: "Reset Your Password",
};

export default function ConfirmResetPage() {
	return <ConfirmResetForm />;
}
