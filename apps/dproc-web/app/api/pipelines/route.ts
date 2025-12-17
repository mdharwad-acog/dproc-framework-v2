import { NextResponse } from "next/server";
// Import only what we need, not the whole package
import { PipelineScanner } from "@dproc/core";

const PIPELINES_DIR = process.env.PIPELINES_DIR || "./pipelines";

export async function GET() {
  try {
    const scanner = new PipelineScanner(PIPELINES_DIR);
    const pipelines = await scanner.scanPipelines();

    return NextResponse.json({ pipelines });
  } catch (error) {
    console.error("Error loading pipelines:", error);
    return NextResponse.json(
      { error: "Failed to load pipelines", details: String(error) },
      { status: 500 }
    );
  }
}
