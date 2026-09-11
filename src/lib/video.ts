/**
 * Turn anything a user pastes (YouTube watch/shorts/embed/playlist link, Google Drive
 * share / preview / open link, raw file id, or a direct .mp4) into something the player
 * can actually embed.
 */

export type VideoProvider = "youtube" | "drive" | "vimeo" | "file" | "link";

export type ParsedVideo = {
  provider: VideoProvider;
  /** id used for the embed (video id / file id) */
  mediaId: string | null;
  playlistId: string | null;
  startSeconds: number | null;
  /** src for the <iframe>/<video> */
  embedUrl: string | null;
  /** "open original" link */
  watchUrl: string | null;
  /** poster image for cards & the player */
  thumbnail: string | null;
  playable: boolean;
  /** human note shown in the admin editor */
  hint: string;
};

const YT_ID = /^[a-zA-Z0-9_-]{11}$/;
const DRIVE_ID = /^[a-zA-Z0-9_-]{20,}$/;

function num(v: string | null | undefined): number | null {
  if (!v) return null;
  const m = /^(\d+)([hm]s?)?$/i.exec(v.trim());
  if (m) {
    const n = Number(m[1]);
    if (/^h/i.test(m[2] ?? "")) return n * 3600;
    if (/^m/i.test(m[2] ?? "")) return n * 60;
    return n;
  }
  const plain = Number(v);
  return Number.isFinite(plain) ? Math.floor(plain) : null;
}

export function looksLikeUrl(input: string) {
  return /^(https?:\/\/|www\.)/i.test(input.trim()) || /^[a-zA-Z0-9_-]{11,}$/.test(input.trim());
}

/** "Paste a YouTube or Drive link" → structured embed info. */
export function parseVideo(raw: string | null | undefined): ParsedVideo {
  const empty: ParsedVideo = {
    provider: "link",
    mediaId: null,
    playlistId: null,
    startSeconds: null,
    embedUrl: null,
    watchUrl: null,
    thumbnail: null,
    playable: false,
    hint: "No video link yet",
  };
  const input = (raw ?? "").trim();
  if (!input) return empty;

  // Bare IDs are accepted too: 11-char YouTube id, or a long Drive file id.
  if (/^[a-zA-Z0-9_-]{11}$/.test(input) && !input.includes(".")) {
    return youtube({ videoId: input });
  }
  if (DRIVE_ID.test(input) && !input.includes(".")) {
    return drive({ fileId: input });
  }

  // Site-relative uploads from the admin panel: /uploads/2026-09/ab12cd-lesson.mp4
  if (/^\/uploads\/[^\s]+$/i.test(input)) {
    if (/\.(mp4|webm|ogg|m4v|ogv)(\?.*)?$/i.test(input)) {
      return {
        provider: "file",
        mediaId: null,
        playlistId: null,
        startSeconds: null,
        embedUrl: input,
        watchUrl: input,
        thumbnail: null,
        playable: true,
        hint: "Uploaded recording — plays in the native HTML5 player",
      };
    }
    return {
      provider: "link",
      mediaId: null,
      playlistId: null,
      startSeconds: null,
      embedUrl: null,
      watchUrl: input,
      thumbnail: null,
      playable: false,
      hint: "Uploaded file — opens as a download link",
    };
  }

  let url: URL;
  try {
    url = new URL(input.startsWith("www.") ? `https://${input}` : input);
  } catch {
    return { ...empty, hint: "Not a valid URL" };
  }
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const path = url.pathname;

  /* ------------------------------- YouTube ------------------------------- */
  if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be" || host === "m.youtube.com") {
    const params = url.searchParams;
    let videoId: string | null = null;
    const segs = path.split("/").filter(Boolean);

    if (host === "youtu.be") videoId = segs[0] ?? null;
    else if (params.get("v")) videoId = params.get("v");
    else if (["embed", "shorts", "live", "v"].includes(segs[0] ?? "")) videoId = segs[1] ?? null;
    else if (segs[0] === "playlist") videoId = null;

    if (videoId && !YT_ID.test(videoId)) videoId = null;
    const playlistId = params.get("list") && /^PL[A-Za-z0-9_-]{10,}$/.test(params.get("list")!) ? params.get("list") : params.get("list");

    if (!videoId && playlistId) {
      return {
        ...youtube({ videoId: null, playlistId, start: num(params.get("t") ?? params.get("start")) }),
        hint: "YouTube playlist embedded",
      };
    }
    if (videoId) return youtube({ videoId, playlistId, start: num(params.get("t") ?? params.get("start")) });
    return { ...empty, provider: "youtube", watchUrl: url.toString(), hint: "Couldn't find a video id in that YouTube link" };
  }

  /* ---------------------------- Google Drive ----------------------------- */
  if (host === "drive.google.com" || host === "docs.google.com") {
    const segs = path.split("/").filter(Boolean);
    let fileId: string | null = null;
    if (segs[0] === "file" && segs[1] === "d") fileId = segs[2] ?? null;
    else if (segs[0] === "open" || segs[0] === "uc" || segs[0] === "thumbnail") fileId = url.searchParams.get("id");
    else if (segs[0] === "drive" && segs[1] === "folders") return { ...empty, provider: "drive", watchUrl: url.toString(), hint: "Drive folder — link only, not embeddable" };
    else if (host === "docs.google.com") fileId = segs[1] ?? null;
    else if (segs[0] === "file") fileId = segs[2] ?? null;

    if (fileId && DRIVE_ID.test(fileId)) {
      const isDoc = host === "docs.google.com";
      return {
        provider: "drive",
        mediaId: fileId,
        playlistId: null,
        startSeconds: null,
        embedUrl: isDoc
          ? `https://docs.google.com/document/d/${fileId}/preview`
          : `https://drive.google.com/file/d/${fileId}/preview`,
        watchUrl: isDoc
          ? url.toString()
          : `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
        thumbnail: null,
        playable: !isDoc,
        hint: isDoc
          ? "Google Docs preview embedded"
          : "Google Drive video embedded — make sure sharing is set to “Anyone with the link”",
      };
    }
    return { ...empty, provider: "drive", watchUrl: url.toString(), hint: "Unrecognised Drive link" };
  }

  /* -------------------------------- Vimeo -------------------------------- */
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = path.split("/").filter(Boolean).pop() ?? "";
    if (/^\d+$/.test(id)) {
      return {
        provider: "vimeo",
        mediaId: id,
        playlistId: null,
        startSeconds: null,
        embedUrl: `https://player.vimeo.com/video/${id}?byline=0&portrait=0`,
        watchUrl: url.toString(),
        thumbnail: null,
        playable: true,
        hint: "Vimeo player embedded",
      };
    }
  }

  /* --------------------- Direct file (mp4/webm hosted elsewhere) ---------- */
  if (/\.(mp4|webm|ogg|m4v)(\?.*)?$/i.test(path + url.search)) {
    return {
      provider: "file",
      mediaId: null,
      playlistId: null,
      startSeconds: null,
      embedUrl: url.toString(),
      watchUrl: url.toString(),
      thumbnail: null,
      playable: true,
      hint: "Direct video file — plays in the native HTML5 player",
    };
  }

  return {
    provider: "link",
    mediaId: null,
    playlistId: null,
    startSeconds: null,
    embedUrl: null,
    watchUrl: url.toString(),
    thumbnail: null,
    playable: false,
    hint: "External link — will open in a new tab",
  };
}

function youtube({
  videoId,
  playlistId,
  start,
}: {
  videoId: string | null;
  playlistId?: string | null;
  start?: number | null;
}): ParsedVideo {
  const q = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1" });
  if (playlistId) q.set("list", playlistId);
  if (start) q.set("start", String(start));
  const embedUrl = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?${q}`
    : playlistId
      ? `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}`
      : null;
  return {
    provider: "youtube",
    mediaId: videoId,
    playlistId: playlistId ?? null,
    startSeconds: start ?? null,
    embedUrl,
    watchUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : playlistId ? `https://www.youtube.com/playlist?list=${playlistId}` : null,
    thumbnail: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null,
    playable: Boolean(embedUrl),
    hint: videoId ? "YouTube video embedded" : "Couldn't parse that YouTube link",
  };
}

function drive({ fileId }: { fileId: string }): ParsedVideo {
  return {
    provider: "drive",
    mediaId: fileId,
    playlistId: null,
    startSeconds: null,
    embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
    watchUrl: `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
    thumbnail: null,
    playable: true,
    hint: "Google Drive video embedded from a raw file id",
  };
}

/** Convenience for card thumbnails: use the course thumbnail, else the trailer's YT poster. */
export function thumbFor(course: { thumbnail?: string | null; heroVideoUrl?: string | null }) {
  return course.thumbnail?.trim() || parseVideo(course.heroVideoUrl).thumbnail || null;
}

/** Validate a link the admin typed; returns an error string or null. */
export function validateVideoLink(raw: string) {
  const value = raw.trim();
  if (!value) return null;
  if (/^\/uploads\//i.test(value)) return parseVideo(value).playable ? null : "Upload a video file (.mp4/.webm) for the player";
  const parsed = parseVideo(value);
  if (!parsed.playable) return parsed.hint === "No video link yet" ? "Enter a YouTube or Google Drive share link" : parsed.hint;
  return null;
}
