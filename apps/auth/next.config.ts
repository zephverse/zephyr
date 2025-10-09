import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@zephyr/auth", "@zephyr/db", "@zephyr/config"],
  reactStrictMode: true,
  experimental: {
    staleTimes: { dynamic: 30 },
  },
};

export default config;
