import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@zephyr/auth", "@zephyr/db", "@zephyr/config"],
  reactStrictMode: true,
  experimental: {
    staleTimes: { dynamic: 30 },
    reactCompiler: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "styles.redditmedia.com" },
    ],
    unoptimized: process.env.NODE_ENV === "development",
  },
};

export default config;
