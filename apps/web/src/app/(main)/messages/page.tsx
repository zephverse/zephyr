import type { Metadata } from "next";
import Chat from "@/components/Messages/chat";

export const metadata: Metadata = {
  title: "Whispers",
  description: "Zephyr Whispers",
};

export default function Page() {
  return <Chat />;
}
