import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  Zap,
  Brain,
  Play,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-blue-600 via-blue-700 to-purple-600 text-white">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 size-80 rounded-full bg-purple-500/30 blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-blue-500/30 blur-3xl animate-pulse [animation-delay:1s]" />
        </div>

        <div className="relative container mx-auto px-6 py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-green-500" />
              </span>
              <span className="text-sm font-medium">v1.0 Now Available</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Build AI-Powered
              <br />
              <span className="bg-clip-text text-transparent bg-linear-to-r from-white to-blue-200">
                Report Pipelines
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Framework for creating custom data processing pipelines with
              LLM-powered analysis. From research to reports, build your
              pipeline in minutes.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                asChild
                className="bg-white text-blue-700 hover:bg-gray-100 shadow-xl"
              >
                <Link href="/dashboard">
                  <Play className="mr-2 size-5" />
                  Create Pipeline
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/dashboard">
                  <FileText className="mr-2 size-5" />
                  View Examples
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">1,247</div>
                <div className="text-sm text-blue-200">Reports Generated</div>
              </div>
              <div className="text-center border-x border-white/20">
                <div className="text-3xl font-bold mb-1">94.2%</div>
                <div className="text-sm text-blue-200">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">23.4s</div>
                <div className="text-sm text-blue-200">Avg Time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="currentColor"
              className="text-gray-50"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything you need</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful framework with built-in job queuing, data processing, and
              LLM orchestration
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="size-12 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
                  <Zap className="size-6 text-white" />
                </div>
                <CardTitle>Custom Data Processing</CardTitle>
                <CardDescription>
                  Fetch from APIs, process files, or scrape data. Your pipeline,
                  your rules.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="size-12 rounded-lg bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
                  <Brain className="size-6 text-white" />
                </div>
                <CardTitle>LLM Orchestration</CardTitle>
                <CardDescription>
                  Enrich data with AI analysis. Support for Claude, GPT-4, and
                  Gemini.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="size-12 rounded-lg bg-linear-to-br from-green-500 to-green-600 flex items-center justify-center mb-4">
                  <FileText className="size-6 text-white" />
                </div>
                <CardTitle>Multi-Format Output</CardTitle>
                <CardDescription>
                  Generate reports in Markdown, HTML, PDF, or PowerPoint
                  automatically.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How it works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Four simple steps to automated intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              {
                num: "01",
                title: "Define Pipeline",
                desc: "Configure inputs and outputs",
              },
              {
                num: "02",
                title: "Process Data",
                desc: "Fetch and transform your data",
              },
              {
                num: "03",
                title: "AI Enrichment",
                desc: "LLM analyzes and enriches",
              },
              {
                num: "04",
                title: "Generate Report",
                desc: "Multi-format output ready",
              },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="size-16 rounded-full bg-blue-100 text-blue-600 font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-linear-to-br from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Create your first pipeline in minutes
          </p>
          <Button
            size="lg"
            asChild
            className="bg-white text-blue-700 hover:bg-gray-100"
          >
            <Link href="/dashboard">
              Get Started
              <ArrowRight className="ml-2 size-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
