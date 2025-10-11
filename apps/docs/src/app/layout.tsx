import { SofiaProSoft } from "@zephyr/ui";
import type { Metadata } from "next";
import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import { Layout, Navbar } from "nextra-theme-docs";
import "nextra-theme-docs/style.css";
import Image from "next/image";
import "./styles.css";

const navbar = (
  <Navbar
    logo={<Image alt="Zephyr Logo" height={44} src="/zeph.png" width={44} />}
  />
);

export const metadata: Metadata = {
  title: "Zephyr Docs",
  description: "Documentation for Zephyr for developers to get started.",
  icons: {
    icon: { url: "/favicon.svg", type: "image/svg+xml" },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${SofiaProSoft.className} ${SofiaProSoft.variable} antialiased`}
      dir="ltr"
      lang="en"
      suppressHydrationWarning
    >
      <Head>
        <meta content="width=device-width, initial-scale=1" name="viewport" />
      </Head>
      <body>
        <Layout
          docsRepositoryBase="https://github.com/zephverse/zephyr/tree/main/apps/docs"
          navbar={navbar}
          pageMap={await getPageMap()}
          sidebar={{ autoCollapse: true }}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
