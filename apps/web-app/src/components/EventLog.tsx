import React, { useState } from "react";
import { useMediaEventListener } from "media-react";

/**
 * Demonstrates the requirement that "the app can also subscribe
 * independently to track activity" — this component doesn't trigger any
 * view event itself, it only observes the shared stream that
 * PhotoBrowser/VideoReels emit into, same as the SDK's own default console
 * listener does.
 */
export function EventLog() {
  const [log, setLog] = useState<string[]>([]);

  const append = (line: string) => setLog((prev) => [line, ...prev].slice(0, 8));

  useMediaEventListener("view", (p) => append(`view · #${p.item.id} · ${p.source ?? "unknown"}`));

  if (log.length === 0) return null;

  return (
    <aside className="event-log" aria-label="Activity log">
      <h2>Activity</h2>
      <ul>
        {log.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </aside>
  );
}
