import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "bullmq"],
  reactCompiler: true,
};

export default nextConfig;
