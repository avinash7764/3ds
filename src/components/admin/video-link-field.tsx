"use client";

import { useMemo, useState } from "react";
import { UploadButton } from "@/components/admin/upload-button";
import { Icon } from "@/components/ui";
import { parseVideo } from "@/lib/video";
import { cn } from "@/lib/utils";

/**
 * The heart of "upload a video with a YouTube link or Drive link": paste the share URL,
 * see exactly how the player will resolve it, and test the embed before saving.
 */
export function VideoLinkField({
  value,
  onChange,
  label = "Video link",
  placeholder = "https://youtube.com/watch?v=… or https://drive.google.com/file/d/…/view",
  compact = false,
  error,
  allowUpload = false,
  courseId,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  compact?: boolean;
  error?: string | null;
  /** lets a faculty member upload an .mp4/.webm instead of pasting a link */
  allowUpload?: boolean;
  courseId?: string;
}) {
  const [testing, setTesting] = useState(false);
  const parsed = useMemo(() => parseVideo(value), [value]);

  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          className={cn("input font-mono text-[12.5px]", error && "border-rose-300 focus:ring-rose-200")}
        />
        {value ? (
          <button
            type="button"
            onClick={() => setTesting((v) => !v)}
            className="inline-flex h-10 flex-none items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 text-[12.5px] font-bold text-ink-700 hover:border-volt-400"
          >
            <Icon name={testing ? "chevronDown" : "eye"} className="h-4 w-4" /> {testing ? "Hide" : "Test"}
          </button>
        ) : null}
      </div>

      {allowUpload ? (
        <div className="mt-2">
          <UploadButton
            accept="video/mp4,video/webm,.m4v,.ogv"
            label="Upload a recording instead"
            hint="mp4 / webm land in public/uploads and play in the native player"
            courseId={courseId}
            onUploaded={({ url }) => onChange(url)}
          />
        </div>
      ) : null}

      {value ? (
        <div className="mt-2 rounded-xl border border-ink-100 bg-ink-50/60 p-3">
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                parsed.provider === "youtube"
                  ? "bg-rose-100 text-rose-700"
                  : parsed.provider === "drive"
                    ? "bg-volt-100 text-volt-800"
                    : parsed.provider === "file"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-800",
              )}
            >
              <Icon name={parsed.provider === "drive" ? "layers" : parsed.provider === "file" ? "video" : "play"} className="h-3 w-3" />
              {parsed.provider}
            </span>
            <span className="font-semibold text-slate-600">{parsed.hint}</span>
            {parsed.mediaId ? <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-ink-600">{parsed.mediaId}</code> : null}
            {parsed.playlistId ? <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-ink-600">list={parsed.playlistId.slice(0, 12)}…</code> : null}
          </div>
          {error ? <p className="mt-2 text-[11.5px] font-semibold text-rose-600">{error}</p> : null}

          {testing && parsed.embedUrl ? (
            <div className="mt-3 overflow-hidden rounded-lg border border-ink-200 bg-black">
              <div className="aspect-video">
                {parsed.provider === "file" ? (
                  <video src={parsed.embedUrl} controls className="h-full w-full" />
                ) : (
                  <iframe
                    src={parsed.embedUrl}
                    title="Embed preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                )}
              </div>
            </div>
          ) : null}

          {!compact && parsed.thumbnail ? (
            <div className="mt-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={parsed.thumbnail ?? ""} alt="" className="h-12 w-20 rounded-md object-cover ring-1 ring-ink-200" />
              <p className="text-[11.5px] leading-5 text-slate-500">
                This frame becomes the course thumbnail if you leave the thumbnail field empty.
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-1.5 text-[11.5px] leading-5 text-slate-500">
          Paste a <strong>YouTube</strong> watch/share/playlist link or a <strong>Google Drive</strong> share link (set the file to
          “Anyone with the link”). Raw 11-char YouTube IDs and Drive file IDs also work.
        </p>
      )}
    </div>
  );
}
