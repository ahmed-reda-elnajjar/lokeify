"use client";

import { useEffect, useState } from "react";

const messages = [
  "Analyzing measurements...",
  "Mapping body proportions...",
  "Building your 3D mesh...",
  "Fitting texture and tone...",
  "Almost ready...",
];

interface Props {
  onDone: () => void;
  durationMs?: number;
}

export default function GeneratingLoader({ onDone, durationMs = 3200 }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const stepMs = durationMs / messages.length;
    const interval = setInterval(() => {
      setIndex((i) => Math.min(i + 1, messages.length - 1));
    }, stepMs);
    const timeout = setTimeout(onDone, durationMs);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [durationMs, onDone]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute h-full w-full animate-spin-slow rounded-full border-4 border-border border-t-brand" />
        <span className="text-3xl">🧍</span>
      </div>
      <p className="text-lg font-medium">{messages[index]}</p>
      <div className="h-1.5 w-64 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-foreground transition-all duration-500"
          style={{ width: `${((index + 1) / messages.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
