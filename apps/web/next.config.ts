import { config, withStreamConfig } from "@zephyr/next";
import type { NextConfig } from "next";

let nextConfig: NextConfig = { ...config };

nextConfig = withStreamConfig(nextConfig);

export default nextConfig;
