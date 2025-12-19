"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Play,
  Settings,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import { RecentExecutions } from "@/components/recent-execution";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Pipeline = {
  name: string;
  spec: {
    pipeline: {
      name: string;
      description: string;
      version: string;
    };
  } | null;
  valid: boolean;
};

type Stats = {
  totalExecutions: number;
  successRate: number;
  avgExecutionTime: number;
  pipelineCount: number;
};

export default function DashboardPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [pipelinesRes, statsRes] = await Promise.all([
          fetch("/api/pipelines"),
          fetch("/api/stats"),
        ]);

        const pipelinesData = await pipelinesRes.json();
        const statsData = await statsRes.json();

        setPipelines(pipelinesData.pipelines || []);
        setStats(statsData.stats || null);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="size-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-gray-600">Manage and execute your pipelines</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/new">
              <Plus className="mr-2 size-4" />
              New Pipeline
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Report Generated
                </CardTitle>
                <TrendingUp className="size-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalExecutions}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Success Rate
                </CardTitle>
                <CheckCircle className="size-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.successRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
                <Clock className="size-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(stats.avgExecutionTime / 1000).toFixed(1)}s
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pipelines</CardTitle>
                <FileText className="size-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pipelineCount}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pipelines Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Your Pipelines</h2>

          {pipelines.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="size-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No pipelines yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first pipeline to get started
                </p>
                <Button asChild>
                  <Link href="/dashboard/new">
                    <Plus className="mr-2 size-4" />
                    Create Pipeline
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pipelines.map((pipeline) => (
                <Card
                  key={pipeline.name}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg">
                        {pipeline.spec?.pipeline.name || pipeline.name}
                      </CardTitle>
                      <Badge
                        variant={pipeline.valid ? "default" : "destructive"}
                      >
                        {pipeline.valid ? "Valid" : "Invalid"}
                      </Badge>
                    </div>
                    <CardDescription>
                      {pipeline.spec?.pipeline.description || "No description"}
                    </CardDescription>
                    {pipeline.spec && (
                      <p className="text-xs text-gray-500 mt-2">
                        v{pipeline.spec.pipeline.version}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button size="sm" asChild className="flex-1">
                        <Link href={`/dashboard/execute/${pipeline.name}`}>
                          <Play className="mr-2 size-4" />
                          Execute
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/pipelines/${pipeline.name}`}>
                          <Settings className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Executions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Recent Executions</h2>
            <Button variant="outline" asChild>
              <Link href="/dashboard/history">View All</Link>
            </Button>
          </div>
          <RecentExecutions />
        </div>
      </div>
    </div>
  );
}
