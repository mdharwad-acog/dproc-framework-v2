import { NextResponse } from "next/server";
import { MetadataDB } from "@dproc/core";

export async function GET() {
  try {
    const db = new MetadataDB("./dproc.db");
    const executions = db.listExecutions(undefined, 1000);

    const totalReports = executions.length;
    const completed = executions.filter((e) => e.status === "completed");
    const failedReports = executions.filter(
      (e) => e.status === "failed"
    ).length;

    const avgTimeMs =
      completed.length > 0
        ? completed.reduce((sum, e) => sum + (e.executionTime || 0), 0) /
          completed.length
        : 0;

    const totalTokens = completed.reduce(
      (sum, e) => sum + (e.tokensUsed || 0),
      0
    );

    const estimatedCost = (totalTokens / 1000) * 0.01;

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const reportsThisWeek = executions.filter(
      (e) => e.createdAt > oneWeekAgo
    ).length;

    const successRate =
      totalReports > 0
        ? Math.round((completed.length / totalReports) * 100)
        : 0;

    db.close();

    return NextResponse.json({
      totalReports,
      reportsThisWeek,
      avgTime: (avgTimeMs / 1000).toFixed(1),
      totalTokens,
      estimatedCost,
      successRate,
      failedReports,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
