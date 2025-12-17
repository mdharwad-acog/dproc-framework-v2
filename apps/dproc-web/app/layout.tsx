import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { FileText, BarChart3, Settings, Wrench } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DProc Framework - LLM Report Generation",
  description: "LLM-powered data pipelines and report generation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-slate-50">
          <nav className="bg-white border-b border-slate-200">
            <div className="container mx-auto px-8 py-4">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span className="text-xl font-bold">DProc</span>
                </Link>

                <div className="flex items-center gap-6">
                  <Link
                    href="/"
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
                  >
                    <Wrench className="h-4 w-4" />
                    <span>Generate</span>
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          <main>{children}</main>

          <footer className="border-t border-slate-200 mt-16">
            <div className="container mx-auto px-8 py-6 text-center text-sm text-slate-600">
              DProc Framework v0.1.0 · Next.js · Vercel AI SDK
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
