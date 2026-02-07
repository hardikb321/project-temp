"use client";

import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { uploadToPresignedUrl } from "@/lib/uploadToPresignedUrl";

/** Backend endpoint that returns a pre-signed URL. Same origin as the app. */
const PRESIGNED_ENDPOINT = "/api/upload/presigned";

type UploadStatus = "idle" | "getting-url" | "uploading" | "success" | "error";

/** Get pre-signed URL from backend, then upload is done via uploadToPresignedUrl. */
async function getPresignedUrlFromBackend(filename: string): Promise<string> {
  const res = await fetch(PRESIGNED_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to get upload URL: ${res.status}`);
  }
  const data = (await res.json()) as { uploadUrl?: string; url?: string; presignedUrl?: string };
  const url = data.uploadUrl ?? data.url ?? data.presignedUrl;
  if (!url || typeof url !== "string") {
    throw new Error("Invalid response: missing upload URL (expected uploadUrl, url, or presignedUrl)");
  }
  return url;
}

export function AdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);

  const reset = useCallback(() => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    setErrorMessage("");
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    if (chosen) {
      if (!chosen.name.toLowerCase().endsWith(".csv")) {
        setStatus("error");
        setErrorMessage("Please select a .csv file.");
        return;
      }
      setFile(chosen);
      setStatus("idle");
      setErrorMessage("");
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const dropped = e.dataTransfer.files?.[0];
      if (dropped) {
        if (!dropped.name.toLowerCase().endsWith(".csv")) {
          setStatus("error");
          setErrorMessage("Please drop a .csv file.");
          return;
        }
        setFile(dropped);
        setStatus("idle");
        setErrorMessage("");
      }
    },
    []
  );

  const handleUpload = useCallback(async () => {
    if (!file) return;

    setErrorMessage("");
    setStatus("getting-url");
    setProgress(0);

    try {
      // 1. Get pre-signed URL from your backend
      const presignedUrl = await getPresignedUrlFromBackend(file.name);
      setStatus("uploading");
      // 2. Upload CSV file to that URL
      await uploadToPresignedUrl(presignedUrl, file, (percent) => setProgress(percent));
      setStatus("success");
      setProgress(100);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Upload failed");
    }
  }, [file]);

  const isBusy = status === "getting-url" || status === "uploading";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="w-full border-b border-border bg-card">
        <div className="flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to map
            </Link>
            <span className="font-semibold text-lg">Admin — CSV Upload</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 flex items-start justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6" />
              Upload CSV to S3
            </CardTitle>
            <CardDescription>
              Your backend provides a pre-signed URL at <code className="text-xs bg-muted px-1 rounded">{PRESIGNED_ENDPOINT}</code>; the CSV is uploaded to that URL.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
                ${file ? "bg-muted/30" : ""}
              `}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer block">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">
                  {file ? file.name : "Choose a CSV file or drag it here"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">.csv only</p>
              </label>
            </div>

            {status === "uploading" && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading…</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {status === "getting-url" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Getting upload URL…
              </div>
            )}

            {status === "success" && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                File uploaded successfully.
              </div>
            )}

            {status === "error" && (
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleUpload}
                disabled={!file || isBusy}
                className="flex-1"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {status === "getting-url" ? "Preparing…" : "Uploading…"}
                  </>
                ) : (
                  "Upload to S3"
                )}
              </Button>
              {(file || status !== "idle") && (
                <Button type="button" variant="outline" onClick={reset} disabled={isBusy}>
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
