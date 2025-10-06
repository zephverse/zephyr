import type { NextConfig } from "next";

export const config: NextConfig = {
  transpilePackages: ["@zephyr/auth", "@zephyr/db", "@zephyr/config"],
  reactStrictMode: true,
  experimental: {
    staleTimes: { dynamic: 30 },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "pbs.twimg.com" },
    ],
    unoptimized: process.env.NODE_ENV === "development",
  },
};

export const withStreamConfig = (sourceConfig: NextConfig): NextConfig => ({
  ...sourceConfig,
});
