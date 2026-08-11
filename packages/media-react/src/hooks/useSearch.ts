import { useCallback, useEffect, useRef, useState } from "react";
import { MediaError, MediaItem, SearchParams } from "media-core";
import { useMediaCore } from "../MediaProvider";

export interface UseSearchOptions extends Omit<SearchParams, "query" | "page"> {
  /** Media type to search. Defaults to "photos". */
  type?: "photos" | "videos";
  /** Skip fetching while the query is empty. Default true. */
  skipEmptyQuery?: boolean;
}

export interface UseSearchResult<T extends MediaItem> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  error: MediaError | null;
  hasMore: boolean;
  loadMore: () => void;
}

/**
 * Thin adaptation of `client.searchPhotos` / `client.searchVideos` into React
 * state (loading / error / pagination). No decisions about caching, auth, or
 * request shape live here — that's all in media-core; this hook just tracks
 * "what does the component re-render with."
 */
export function useSearch<T extends MediaItem = MediaItem>(
  query: string,
  options: UseSearchOptions = {}
): UseSearchResult<T> {
  const client = useMediaCore();
  const { type = "photos", skipEmptyQuery = true, ...rest } = options;

  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<MediaError | null>(null);

  // Guards against a slow, stale request overwriting a newer query's results.
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (pageToFetch: number, mode: "replace" | "append") => {
      if (!query && skipEmptyQuery) {
        setItems([]);
        setHasMore(false);
        return;
      }
      const thisRequest = ++requestId.current;
      mode === "replace" ? setLoading(true) : setLoadingMore(true);
      setError(null);

      try {
        const fetcher = type === "videos" ? client.searchVideos : client.searchPhotos;
        // const result = await fetcher({ query, page: pageToFetch, ...rest });
        const result =
          type === "videos"
            ? await client.searchVideos({
                query,
                page: pageToFetch,
                ...rest,
              })
            : await client.searchPhotos({
                query,
                page: pageToFetch,
                ...rest,
              });
        if (thisRequest !== requestId.current) return; // stale

        setItems((prev) => (mode === "replace" ? (result.items as T[]) : [...prev, ...(result.items as T[])]));
        setHasMore(result.hasNextPage);
        setPage(result.page);
      } catch (err) {
        if (thisRequest !== requestId.current) return;
        setError(err instanceof MediaError ? err : new MediaError("UNKNOWN", "Search failed."));
      } finally {
        if (thisRequest === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, query, type, rest.orientation, rest.size, rest.perPage]
  );

  useEffect(() => {
    fetchPage(1, "replace");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, type, rest.orientation, rest.size, rest.perPage]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    fetchPage(page + 1, "append");
  }, [fetchPage, loading, loadingMore, hasMore, page]);

  return { items, loading, loadingMore, error, hasMore, loadMore };
}
