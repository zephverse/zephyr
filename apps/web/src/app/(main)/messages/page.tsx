import type { Metadata } from "next";
import Chat from "@/components/Messages/Chat";

export const metadata: Metadata = {
	title: "Whispers",
	description: "Zephyr Whispers",
};

export default function Page() {
	return <Chat />;
}
