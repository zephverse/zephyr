import { config, withStreamConfig } from "@zephyr/next";
import type { NextConfig } from "next";

let nextConfig: NextConfig = {
  ...config,
  output: "standalone",
};

nextConfig = withStreamConfig(nextConfig);

export default nextConfig;
