import { useCallback, useEffect } from "react";
import { MediaEventName, MediaEventPayload, MediaItem } from "media-core";
import { useMediaCore } from "../MediaProvider";

/**
 * Subscribes a listener to a core event for the lifetime of the calling
 * component. This is what a debug/analytics component uses to observe
 * activity without being the thing that triggered it.
 */
export function useMediaEventListener<K extends MediaEventName>(
  event: K,
  listener: (payload: MediaEventPayload[K]) => void
): void {
  const client = useMediaCore();
  useEffect(() => client.on(event, listener), [client, event, listener]);
}

export interface UseMediaEventsResult {
  trackView: (item: MediaItem, source?: string) => void;
  trackDownload: (item: MediaItem, quality?: string) => void;
}

/**
 * The "emit" half of the events API — components call these when a user
 * views or downloads something, without reaching into media-core directly.
 */
export function useMediaEvents(): UseMediaEventsResult {
  const client = useMediaCore();

  const trackView = useCallback((item: MediaItem, source?: string) => client.trackView(item, source), [client]);
  const trackDownload = useCallback(
    (item: MediaItem, quality?: string) => client.trackDownload(item, quality),
    [client]
  );

  return { trackView, trackDownload };
}
