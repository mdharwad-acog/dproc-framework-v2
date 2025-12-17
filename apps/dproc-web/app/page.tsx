"use client";

import { useEffect, useState } from "react";
import { PipelineForm, type ExecutionData } from "@/components/pipeline-form";
import { ReportPreview } from "@/components/report-preview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PipelineSpec } from "@dproc/types";

interface Pipeline {
  name: string;
  path: string;
  spec: PipelineSpec;
}

export default function Home() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(
    null
  );
  const [lastExecution, setLastExecution] = useState<{
    report: string;
    metadata: any;
    keySource: "user" | "system";
    format: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/pipelines")
      .then((res) => res.json())
      .then((data) => {
        setPipelines(data.pipelines || []);
        if (data.pipelines?.length > 0) {
          setSelectedPipeline(data.pipelines[0]);
        }
      });
  }, []);

  const handleExecute = async (data: ExecutionData) => {
    const response = await fetch("/api/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Execution failed");
      return;
    }

    setLastExecution({
      report: result.report,
      metadata: result.metadata,
      keySource: result.keySource,
      format: data.outputFormat,
    });
  };

  return (
    <main className="container mx-auto p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">DProc Framework</h1>
        <p className="text-slate-600">
          LLM-powered report generation with pipelines and hybrid API keys.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedPipeline?.name || ""}
                onValueChange={(name) => {
                  const pipeline =
                    pipelines.find((p) => p.name === name) || null;
                  setSelectedPipeline(pipeline);
                  setLastExecution(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map((p) => (
                    <SelectItem key={p.name} value={p.name}>
                      {p.spec.name || p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedPipeline && (
            <PipelineForm
              pipeline={selectedPipeline}
              onSubmit={handleExecute}
            />
          )}
        </div>

        <div>
          {lastExecution && (
            <ReportPreview
              report={lastExecution.report}
              metadata={lastExecution.metadata}
              keySource={lastExecution.keySource}
              format={lastExecution.format}
            />
          )}
        </div>
      </div>
    </main>
  );
}
