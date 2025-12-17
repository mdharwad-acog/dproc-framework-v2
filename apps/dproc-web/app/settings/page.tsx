"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Save } from "lucide-react";

export default function Settings() {
  const [showKeys, setShowKeys] = useState(false);
  const [keys, setKeys] = useState({
    openai: "",
    anthropic: "",
    google: "",
  });

  useEffect(() => {
    setKeys({
      openai: localStorage.getItem("DPROC_OPENAI_API_KEY") || "",
      anthropic: localStorage.getItem("DPROC_ANTHROPIC_API_KEY") || "",
      google: localStorage.getItem("DPROC_GOOGLE_API_KEY") || "",
    });
  }, []);

  const handleSave = () => {
    localStorage.setItem("DPROC_OPENAI_API_KEY", keys.openai);
    localStorage.setItem("DPROC_ANTHROPIC_API_KEY", keys.anthropic);
    localStorage.setItem("DPROC_GOOGLE_API_KEY", keys.google);
    alert("API keys saved locally (browser storage only).");
  };

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            These keys are stored only in your browser (localStorage) and never
            sent to the server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="openai">OpenAI API Key</Label>
            <div className="flex gap-2">
              <Input
                id="openai"
                type={showKeys ? "text" : "password"}
                value={keys.openai}
                onChange={(e) =>
                  setKeys((prev) => ({ ...prev, openai: e.target.value }))
                }
                placeholder="sk-proj-..."
              />
              <Button
                variant="outline"
                size="icon"
                type="button"
                onClick={() => setShowKeys((s) => !s)}
              >
                {showKeys ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="anthropic">Anthropic API Key</Label>
            <Input
              id="anthropic"
              type={showKeys ? "text" : "password"}
              value={keys.anthropic}
              onChange={(e) =>
                setKeys((prev) => ({ ...prev, anthropic: e.target.value }))
              }
              placeholder="sk-ant-..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="google">Google API Key</Label>
            <Input
              id="google"
              type={showKeys ? "text" : "password"}
              value={keys.google}
              onChange={(e) =>
                setKeys((prev) => ({ ...prev, google: e.target.value }))
              }
              placeholder="AIzaSy..."
            />
          </div>

          <Button onClick={handleSave} className="w-full" type="button">
            <Save className="mr-2 h-4 w-4" />
            Save API Keys
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
