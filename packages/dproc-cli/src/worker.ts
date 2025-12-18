import { DProcWorker } from "@dproc/core";
import path from "path";

// Validate environment
const requiredEnvVars = [
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GOOGLE_API_KEY",
];
const missing = requiredEnvVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.warn(`⚠️  Warning: Missing API keys: ${missing.join(", ")}`);
  console.warn("Some LLM providers may not work.\n");
}

// Start worker
const worker = new DProcWorker(path.join(process.cwd(), "pipelines"), {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
});

console.log("🚀 DProc Worker started");
console.log("📂 Pipelines directory:", path.join(process.cwd(), "pipelines"));
console.log(
  "📡 Redis:",
  `${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || "6379"}`
);
console.log("\n💻 Accepting jobs from:");
console.log("  - CLI (pnpm dproc execute)");
console.log("  - Web UI (http://localhost:3000)");
console.log("\nWaiting for jobs...\n");

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("\nShutting down worker...");
  await worker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("\nShutting down worker...");
  await worker.close();
  process.exit(0);
});
