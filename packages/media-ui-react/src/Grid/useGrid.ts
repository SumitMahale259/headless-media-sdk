import { useCallback, useEffect, useRef } from "react";

export interface UseGridOptions<T> {
  items: T[];
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  /** IntersectionObserver rootMargin — how far before the end to trigger loadMore. Default "200px". */
  rootMargin?: string;
}

export interface GridItemProps {
  key: number | string;
  role: "listitem";
  tabIndex: 0;
}

export interface UseGridResult<T> {
  /** Attach to the element whose visibility triggers loadMore (usually a sentinel div after the last item, or the last item itself). */
  sentinelRef: (node: Element | null) => void;
  getContainerProps: () => { role: "list" };
  getItemProps: (item: T, index: number) => GridItemProps;
}

/**
 * Headless: owns *behavior* (when to fire loadMore, what a11y roles apply)
 * and returns nothing that paints pixels. The consumer supplies every bit of
 * markup, className, and CSS. media-ui-react has zero dependency on
 * media-core or media-react — `items` is a generic T, so this hook has no
 * idea a Pexels photo even exists.
 */
export function useGrid<T>({ items, hasMore, loading, onLoadMore, rootMargin = "200px" }: UseGridOptions<T>): UseGridResult<T> {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;
  const stateRef = useRef({ hasMore, loading });
  stateRef.current = { hasMore, loading };

  const sentinelRef = useCallback(
    (node: Element | null) => {
      observerRef.current?.disconnect();
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const { hasMore: hm, loading: ld } = stateRef.current;
          if (entries[0]?.isIntersecting && hm && !ld) {
            onLoadMoreRef.current();
          }
        },
        { rootMargin }
      );
      observerRef.current.observe(node);
    },
    [rootMargin]
  );

  useEffect(() => () => observerRef.current?.disconnect(), []);

  const getContainerProps = useCallback(() => ({ role: "list" as const }), []);

  const getItemProps = useCallback(
    (_item: T, index: number): GridItemProps => ({
      key: index,
      role: "listitem",
      tabIndex: 0,
    }),
    []
  );

  return { sentinelRef, getContainerProps, getItemProps };
}
