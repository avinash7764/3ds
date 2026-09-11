"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import { parseVideo } from "@/lib/video";
import { cn } from "@/lib/utils";

/**
 * One player for every source the admin can paste:
 * YouTube video / playlist, Google Drive file, Vimeo, or a direct .mp4 on any host.
 */
export function VideoPlayer({
  url,
  title,
  autoAdvance,
  onHeartbeat,
  onEnded,
  className,
  startSeconds,
}: {
  url: string | null | undefined;
  title?: string;
  autoAdvance?: boolean;
  onHeartbeat?: (watchedSecs: number) => void;
  onEnded?: () => void;
  className?: string;
  startSeconds?: number;
}) {
  const parsed = useMemo(() => parseVideo(url), [url]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [copied, setCopied] = useState(false);
  const lastBeat = useRef(0);

  const embed = useMemo(() => {
    if (!parsed.embedUrl) return null;
    if (parsed.provider === "youtube" && startSeconds) {
      const sep = parsed.embedUrl.includes("?") ? "&" : "?";
      return `${parsed.embedUrl}${sep}start=${startSeconds}`;
    }
    return parsed.embedUrl;
  }, [parsed.embedUrl, parsed.provider, startSeconds]);

  useEffect(() => {
    lastBeat.current = 0;
  }, [url]);

  if (!url) {
    return (
      <div className={cn("flex aspect-video w-full flex-col items-center justify-center gap-2 bg-ink-950 text-center text-ink-300", className)}>
        <Icon name="video" className="h-8 w-8 text-volt-400" />
        <p className="text-sm font-semibold text-white">No video attached yet</p>
        <p className="max-w-xs text-xs leading-5 text-ink-400">
          An admin can paste a YouTube or Google Drive link for this lesson in the course builder.
        </p>
      </div>
    );
  }

  if (!parsed.playable || !embed) {
    return (
      <div className={cn("card flex aspect-video w-full flex-col items-center justify-center gap-3 bg-ink-50 p-6 text-center", className)}>
        <Icon name="external" className="h-7 w-7 text-ink-500" />
        <p className="text-sm font-semibold text-ink-900">{parsed.hint}</p>
        {parsed.watchUrl ? (
          <a
            href={parsed.watchUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-2 text-sm font-bold text-white hover:bg-volt-600"
          >
            Open the link <Icon name="arrowRight" className="h-4 w-4" />
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-black", className)}>
      <div className="relative aspect-video w-full">
        {parsed.provider === "file" ? (
          <video
            ref={videoRef}
            src={embed}
            controls
            autoPlay={autoAdvance}
            playsInline
            className="absolute inset-0 h-full w-full bg-black"
            onEnded={onEnded}
            onTimeUpdate={(e) => {
              const t = Math.floor(e.currentTarget.currentTime);
              if (t - lastBeat.current >= 15) {
                lastBeat.current = t;
                onHeartbeat?.(t);
              }
            }}
          />
        ) : (
          <iframe
            key={embed}
            src={embed}
            title={title ?? "Course video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full border-0"
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-ink-950 px-3 py-2 text-[11px] font-semibold text-ink-300">
        <span className="inline-flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider",
              parsed.provider === "youtube" ? "bg-rose-500/20 text-rose-200" : parsed.provider === "drive" ? "bg-volt-500/20 text-volt-200" : "bg-emerald-500/20 text-emerald-200",
            )}
          >
            {parsed.provider === "file" ? "hosted file" : parsed.provider}
          </span>
          <span className="hidden max-w-[46ch] truncate sm:inline">{parsed.hint}</span>
        </span>
        <span className="flex items-center gap-1">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(parsed.watchUrl ?? url).catch(() => {});
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            }}
            className="rounded-lg px-2 py-1 hover:bg-white/10"
          >
            {copied ? "Copied link" : "Copy link"}
          </button>
          {parsed.watchUrl ? (
            <a href={parsed.watchUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-white/10">
              Open original <Icon name="external" className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </span>
      </div>
    </div>
  );
}
