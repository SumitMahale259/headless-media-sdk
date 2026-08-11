import { useEffect, useState } from "react";
import { MediaError, MediaItem } from "media-core";
import { useMediaCore } from "../MediaProvider";

export interface UseMediaItemResult<T extends MediaItem> {
  item: T | null;
  loading: boolean;
  error: MediaError | null;
}

export function useMediaItem<T extends MediaItem = MediaItem>(
  id: number | null,
  type: "photos" | "videos" = "photos"
): UseMediaItemResult<T> {
  const client = useMediaCore();
  const [item, setItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<MediaError | null>(null);

  useEffect(() => {
    if (id == null) {
      setItem(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetcher = type === "videos" ? client.getVideo : client.getPhoto;
    fetcher(id)
      .then((result) => {
        if (!cancelled) setItem(result as T);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof MediaError ? err : new MediaError("UNKNOWN", "Failed to load item."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [client, id, type]);

  return { item, loading, error };
}
