/**
 * Tiny, safe markdown-ish renderer for course descriptions authored in the admin panel.
 * Everything is HTML-escaped first, so no markup can be injected.
 * Supports: #..#### headings, - / * bullets, 1. numbered lists, **bold**, *italic*,
 * `code`, [text](url), bare URLs and blank-line paragraphs.
 */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inline(text: string) {
  let out = esc(text);
  out = out.replace(/`([^`]+)`/g, '<code class="rounded bg-ink-50 px-1.5 py-0.5 text-[.85em] text-ink-700">$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong class=\"font-semibold text-ink-900\">$1</strong>");
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a class="font-medium text-volt-600 underline decoration-volt-300 underline-offset-2 hover:text-volt-700" href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  return out;
}

export function renderMarkdown(src?: string | null): string {
  if (!src) return "";
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const html: string[] = [];
  let list: "ul" | "ol" | null = null;
  let para: string[] = [];

  const closeList = () => {
    if (list) {
      html.push(list === "ul" ? "</ul>" : "</ol>");
      list = null;
    }
  };
  const closePara = () => {
    if (para.length) {
      html.push(`<p class="mt-3 leading-7 text-slate-600">${inline(para.join(" "))}</p>`);
      para = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      closePara();
      closeList();
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      closePara();
      closeList();
      const level = Math.min(heading[1].length + 1, 5);
      const cls =
        heading[1].length <= 2
          ? "mt-8 mb-1 text-xl font-semibold tracking-tight text-ink-900"
          : "mt-6 mb-1 text-base font-semibold text-ink-900";
      html.push(`<h${level} class="${cls}">${inline(heading[2])}</h${level}>`);
      continue;
    }

    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    if (bullet) {
      closePara();
      if (list !== "ul") {
        closeList();
        html.push('<ul class="mt-3 space-y-2">');
        list = "ul";
      }
      html.push(
        `<li class="flex gap-2.5 text-slate-600"><svg class="mt-[5px] h-3.5 w-3.5 flex-none text-volt-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clip-rule="evenodd"/></svg><span>${inline(bullet[1])}</span></li>`,
      );
      continue;
    }

    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    if (numbered) {
      closePara();
      if (list !== "ol") {
        closeList();
        html.push('<ol class="mt-3 list-decimal space-y-2 pl-5 marker:font-semibold marker:text-ink-400">');
        list = "ol";
      }
      html.push(`<li class="text-slate-600">${inline(numbered[1])}</li>`);
      continue;
    }

    if (/^https?:\/\/\S+$/.test(line)) {
      closePara();
      closeList();
      html.push(
        `<p class="mt-3"><a class="break-all font-medium text-volt-600 underline underline-offset-2" href="${esc(line)}" target="_blank" rel="noopener noreferrer">${esc(line)}</a></p>`,
      );
      continue;
    }

    closeList();
    para.push(line);
  }
  closePara();
  closeList();
  return html.join("\n");
}
