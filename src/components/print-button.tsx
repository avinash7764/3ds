"use client";

import { Icon } from "@/components/ui";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-ink-900 px-4 text-[13px] font-bold text-white hover:bg-volt-600"
    >
      <Icon name="download" className="h-4 w-4" /> Print / Save as PDF
    </button>
  );
}
