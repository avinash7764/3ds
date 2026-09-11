/**
 * Quick sanity check for the YouTube / Google Drive link parser used by the admin panel
 * and the player:  npx tsx scripts/check-video-links.ts
 */
import { parseVideo, validateVideoLink } from "../src/lib/video";

const cases: [string, string, boolean][] = [
  ["https://www.youtube.com/watch?v=RT4z2-bxqe0", "youtube", true],
  ["https://youtu.be/RT4z2-bxqe0?t=90", "youtube", true],
  ["https://www.youtube.com/watch?v=RT4z2-bxqe0&list=PLrOFa8sDv6jdORmv7HQUYVZG3Lh1XC2tV", "youtube", true],
  ["https://www.youtube.com/playlist?list=PLrOFa8sDv6jdORmv7HQUYVZG3Lh1XC2tV", "youtube", true],
  ["https://www.youtube.com/shorts/RT4z2-bxqe0", "youtube", true],
  ["https://m.youtube.com/embed/RT4z2-bxqe0", "youtube", true],
  ["RT4z2-bxqe0", "youtube", true],
  ["https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view?usp=sharing", "drive", true],
  ["https://drive.google.com/open?id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms", "drive", true],
  ["https://drive.google.com/uc?export=download&id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms", "drive", true],
  ["1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms", "drive", true],
  ["https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", "file", true],
  ["https://vimeo.com/76979871", "vimeo", true],
  ["https://drive.google.com/drive/folders/1abcDEF", "drive", false],
  ["https://example.com/some-page", "link", false],
  ["/uploads/2026-09/ab12cd-recording.mp4", "file", true],
  ["/uploads/2026-09/handbook.pdf", "link", false],
  ["", "link", false],
];

let failed = 0;
for (const [input, provider, playable] of cases) {
  const parsed = parseVideo(input);
  const ok = parsed.provider === provider && parsed.playable === playable;
  if (!ok) failed++;
  console.log(
    `${ok ? "✔" : "✘"} ${(input || "(empty)").slice(0, 52).padEnd(54)} ${parsed.provider.padEnd(8)} playable=${String(parsed.playable).padEnd(5)} ${parsed.embedUrl ?? parsed.watchUrl ?? "—"}`,
  );
  if (parsed.provider === "drive" && playable && !parsed.embedUrl?.endsWith("/preview")) {
    console.log("   ✘ drive embed must use /preview");
    failed++;
  }
  if (parsed.provider === "youtube" && playable && !parsed.embedUrl?.includes("/embed/")) {
    console.log("   ✘ youtube embed must use /embed/");
    failed++;
  }
  const validation = validateVideoLink(input);
  if (playable && validation) {
    console.log(`   ✘ valid link rejected by validateVideoLink: ${validation}`);
    failed++;
  }
  if (!playable && input && !validation) {
    console.log(`   ✘ invalid link accepted by validateVideoLink`);
    failed++;
  }
}

console.log(failed ? `\n${failed} check(s) failed` : `\nAll ${cases.length} link cases pass`);
process.exit(failed ? 1 : 0);
