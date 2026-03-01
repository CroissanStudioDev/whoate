import { NextResponse } from "next/server";

// Health check endpoint for container orchestration
// Keep it simple and fast - no database calls
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.1.0",
  });
}
