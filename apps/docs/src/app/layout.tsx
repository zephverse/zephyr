import { SofiaProSoft } from "@zephyr/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zephyr Docs",
  description: "Documentation for Zephyr for developers to get started.",
  icons: {
    icon: { url: "/favicon.svg", type: "image/svg+xml" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${SofiaProSoft.className} ${SofiaProSoft.variable} antialiased`}
      lang="en"
    >
      <body className={"antialiased"}>{children}</body>
    </html>
  );
}
