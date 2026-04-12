"use client";

import React from "react";

interface TinyToastProps {
  message: string | null;
  tone?: "info" | "success";
}

export default function TinyToast({ message, tone = "info" }: TinyToastProps) {
  if (!message) return null;

  const toneClass =
    tone === "success"
      ? "border-emerald-300/35 bg-emerald-900/20 text-emerald-100"
      : "border-white/20 bg-[#0f1220]/90 text-zinc-100";

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[120]">
      <div
        className={`rounded-full border px-3 py-1.5 text-xs font-medium shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-md ${toneClass}`}
      >
        {message}
      </div>
    </div>
  );
}
