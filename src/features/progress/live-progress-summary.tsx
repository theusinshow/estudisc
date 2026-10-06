"use client";

import { useEffect, useState } from "react";
import { ProgressSummary, type ProgressSummaryData } from "./progress-summary";

export const ATTEMPT_RECORDED_EVENT = "estudisc:attempt-recorded";

/** Re-reads lesson progress after each recorded attempt without re-rendering (and re-exposing) the questions. */
export function LiveLessonProgress({ lessonStableId, initial }: Readonly<{ lessonStableId: string; initial: ProgressSummaryData | null }>) {
  const [progress, setProgress] = useState(initial);

  useEffect(() => {
    let controller: AbortController | undefined;
    const refresh = () => {
      controller?.abort();
      controller = new AbortController();
      fetch(`/api/lessons/${encodeURIComponent(lessonStableId)}/progress`, { signal: controller.signal, cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((next: ProgressSummaryData | null) => { if (next) setProgress(next); })
        .catch(() => { /* keep the last known progress; the next attempt retries */ });
    };
    window.addEventListener(ATTEMPT_RECORDED_EVENT, refresh);
    // Deprecated event from cached legacy clients, during the deployment transition.
    window.addEventListener("kos:attempt-recorded", refresh);
    return () => { window.removeEventListener(ATTEMPT_RECORDED_EVENT, refresh); window.removeEventListener("kos:attempt-recorded", refresh); controller?.abort(); };
  }, [lessonStableId]);

  return <ProgressSummary progress={progress} />;
}
