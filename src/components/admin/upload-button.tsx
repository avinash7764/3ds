"use client";

import { useRef, useState } from "react";
import { Button, Icon } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Uploads a recording/handbook to the server and hands the resulting URL back to the caller
 * (used for both lesson videos and course resources).
 */
export function UploadButton({
  accept = "video/mp4,video/webm,.pdf,.zip",
  label = "Upload instead",
  hint,
  onUploaded,
  courseId,
  autoAttach = false,
}: {
  accept?: string;
  label?: string;
  hint?: string;
  onUploaded: (result: { url: string; name: string; sizeText: string }) => void;
  courseId?: string;
  autoAttach?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  async function handle(file?: File | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    setProgress(0);
    try {
      const body = new FormData();
      body.append("file", file);
      if (courseId) body.append("courseId", courseId);
      if (autoAttach) body.append("autoAttach", "1");
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onUploaded({ url: data.url as string, name: data.name as string, sizeText: data.sizeText as string });
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => void handle(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[12px] font-bold transition-colors",
          busy ? "border-volt-300 bg-volt-50 text-volt-700" : "border-ink-200 bg-white text-ink-700 hover:border-volt-400",
        )}
        title="Uploads to public/uploads and returns a link you can paste anywhere"
      >
        <Icon name={busy ? "sparkle" : "upload"} className={cn("h-3.5 w-3.5", busy && "animate-spin")} />
        {busy ? `Uploading ${progress}%` : label}
      </button>
      {hint ? <span className="text-[11.5px] text-slate-500">{hint}</span> : null}
      {error ? <span className="text-[11.5px] font-bold text-rose-600">{error}</span> : null}
    </div>
  );
}
