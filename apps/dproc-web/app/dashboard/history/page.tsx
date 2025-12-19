"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import Link from "next/link";

type Execution = {
  id: string;
  pipelineName: string;
  status: string;
  executionTime?: number;
  createdAt: number;
  error?: string;
  outputPath?: string;
};

export default function HistoryPage() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/history?limit=50");
        const data = await res.json();
        setExecutions(data.history || []);
      } catch (error) {
        console.error("Failed to load history:", error);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 size-4" />
            Back to Dashboard
          </Link>
        </Button>

        <h1 className="text-3xl font-bold mb-6">History</h1>

        {executions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="size-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No reports yet</h3>
              <p className="text-gray-600">
                Execute a pipeline to see history here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {executions.map((execution) => (
              <Card key={execution.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {execution.pipelineName}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(execution.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        execution.status === "completed"
                          ? "default"
                          : execution.status === "failed"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {execution.status === "completed" && (
                        <CheckCircle className="mr-1 size-3" />
                      )}
                      {execution.status === "failed" && (
                        <XCircle className="mr-1 size-3" />
                      )}
                      {execution.status === "processing" && (
                        <Clock className="mr-1 size-3" />
                      )}
                      {execution.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Execution ID:</span>
                      <p className="font-mono text-xs mt-1">{execution.id}</p>
                    </div>
                    {execution.executionTime && (
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <p className="font-medium mt-1">
                          {(execution.executionTime / 1000).toFixed(2)}s
                        </p>
                      </div>
                    )}
                  </div>
                  {execution.error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      {execution.error}
                    </div>
                  )}
                  {execution.outputPath && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.open(`/api/preview/${execution.id}`, "_blank")
                        }
                      >
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          window.open(`/api/download/${execution.id}`, "_blank")
                        }
                      >
                        Download
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
