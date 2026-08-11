import { useCallback, useEffect, useRef, useState } from "react";
import { CuratedParams, MediaError, MediaItem } from "media-core";
import { useMediaCore } from "../MediaProvider";
import { UseSearchResult } from "./useSearch";

export interface UseCuratedFeedOptions extends Omit<CuratedParams, "page"> {
  type?: "photos" | "videos";
}

/**
 * Same shape as useSearch's result, so <Grid /> consumers can treat "curated
 * feed" and "search results" identically — the component library never has
 * to know which hook produced its data.
 */
export function useCuratedFeed<T extends MediaItem = MediaItem>(
  options: UseCuratedFeedOptions = {}
): UseSearchResult<T> {
  const client = useMediaCore();
  const { type = "photos", ...rest } = options;

  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<MediaError | null>(null);
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (pageToFetch: number, mode: "replace" | "append") => {
      const thisRequest = ++requestId.current;
      mode === "replace" ? setLoading(true) : setLoadingMore(true);
      setError(null);

      // try {
      //   const fetcher = type === "videos" ? client.popularVideos : client.curatedPhotos;
      //   const result = await fetcher({ page: pageToFetch, ...rest });
      //   if (thisRequest !== requestId.current) return;

      //   setItems((prev) => (mode === "replace" ? (result.items as T[]) : [...prev, ...(result.items as T[])]));
      //   setHasMore(result.hasNextPage);
      //   setPage(result.page);
      // } catch (err) {
      //   if (thisRequest !== requestId.current) return;
      //   setError(err instanceof MediaError ? err : new MediaError("UNKNOWN", "Failed to load feed."));
      // } 
      try {
        const result =
          type === "videos"
            ? await client.popularVideos({
                page: pageToFetch,
                ...rest,
              })
            : await client.curatedPhotos({
                page: pageToFetch,
                ...rest,
              });

        if (thisRequest !== requestId.current) return;

        setItems((prev) =>
          mode === "replace"
            ? (result.items as T[])
            : [...prev, ...(result.items as T[])]
        );

        setHasMore(result.hasNextPage);
        setPage(result.page);
      } catch (err) {
        console.error("[useCuratedFeed] Error:", err);

        if (thisRequest !== requestId.current) return;

        setError(
          err instanceof MediaError
            ? err
            : new MediaError(
                "UNKNOWN",
                err instanceof Error ? err.message : String(err)
              )
        );
      } finally {
        if (thisRequest === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, type, rest.perPage]
  );

  useEffect(() => {
    fetchPage(1, "replace");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, rest.perPage]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    fetchPage(page + 1, "append");
  }, [fetchPage, loading, loadingMore, hasMore, page]);

  return { items, loading, loadingMore, error, hasMore, loadMore };
}
