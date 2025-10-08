import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "zephyr-web",
    version: process.env.npm_package_version || "1.0.0",
  });
}
