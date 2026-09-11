"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Icon } from "@/components/ui";

export function VerifyForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = value.trim().replace(/\s+/g, "");
    if (!/^[A-Za-z0-9-]{6,40}$/.test(clean)) {
      setError("Credential IDs look like 3DSA-17EE40-O0ND");
      return;
    }
    setError(null);
    router.push(`/verify/${encodeURIComponent(clean.toUpperCase())}`);
  }

  return (
    <form onSubmit={submit}>
      <label className="label" htmlFor="credential">Credential ID</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="credential"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="3DSA-XXXXXX-XXXX"
          className="input font-mono uppercase"
          autoComplete="off"
        />
        <Button type="submit" size="md" className="sm:w-auto">
          Verify <Icon name="arrowRight" className="h-4 w-4" />
        </Button>
      </div>
      {error ? <p className="mt-2 text-[12px] font-semibold text-rose-600">{error}</p> : null}
    </form>
  );
}
