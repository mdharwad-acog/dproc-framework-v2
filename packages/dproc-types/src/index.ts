import { z } from "zod";

// LLM Provider Configuration
export const ProviderConfigSchema = z.object({
  type: z.enum(["openai", "anthropic", "google"]),
  apiKey: z.string(),
  model: z.string(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

// Pipeline Specification (what's in each pipeline's config.yml)
export const PipelineSpecSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  inputs: z.array(
    z.object({
      name: z.string(),
      type: z.enum(["text", "number", "select", "file"]),
      label: z.string(),
      required: z.boolean().optional(),
      options: z.array(z.string()).optional(),
    })
  ),
  outputs: z.array(z.enum(["md", "pdf", "docx", "html"])),
  files: z.object({
    prompts: z.string(),
    template: z.string(),
    mdxTemplate: z.string().optional(),
    bundle: z.string().optional(),
  }),
});

export type PipelineSpec = z.infer<typeof PipelineSpecSchema>;

// Individual Pipeline Config File (just has spec)
export const PipelineFileConfigSchema = z.object({
  spec: PipelineSpecSchema,
});

export type PipelineFileConfig = z.infer<typeof PipelineFileConfigSchema>;

// System-wide Pipeline Configuration (dproc.config.yml)
export const SystemConfigSchema = z.object({
  providers: z.record(z.string(), ProviderConfigSchema),
  activeProvider: z.string(),
  pipelinesDir: z.string(),
});

export type SystemConfig = z.infer<typeof SystemConfigSchema>;

// Execution Context
export interface ExecutionContext {
  pipelineName: string;
  inputs: Record<string, any>;
  outputFormat: string;
  provider: ProviderConfig;
}

// Bundle Data
export interface BundleData {
  data: any;
  metadata?: Record<string, any>;
}

// Report Result
export interface ReportResult {
  content: string;
  format: string;
  metadata: {
    executionTime: number;
    tokensUsed?: number;
    model: string;
  };
}
