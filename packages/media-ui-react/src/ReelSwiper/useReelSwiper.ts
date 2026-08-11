import React, { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

export interface UseReelSwiperOptions<T> {
  items: T[];
  initialIndex?: number;
  onActiveChange?: (index: number, item: T) => void;
}

export interface UseReelSwiperResult<T> {
  activeIndex: number;
  activeItem: T | null;
  /** Attach to the scrollable container. Required for active-item detection to work. */
  containerRef: (node: HTMLElement | null) => void;
  /** Attach to each item's ref so the observer can track it — call with the item's index. */
  itemRef: (index: number) => (node: Element | null) => void;
  goTo: (index: number) => void;
  goNext: () => void;
  goPrev: () => void;
  getContainerProps: () => {
    role: "region";
    "aria-label": "Media reel";
    tabIndex: 0;
    onKeyDown: (e: KeyboardEvent) => void;
  };
  getItemProps: (index: number) => { key: number; role: "group"; "aria-roledescription": "slide" };
}

/**
 * Behavioral contract only: which item counts as "active" (>=60% visible in
 * the viewport, tracked via IntersectionObserver — no scroll-event polling),
 * and imperative goTo/goNext/goPrev for external controls. No CSS is
 * injected; the scroll-snap behavior itself (overflow-y, scroll-snap-type)
 * is a *visual* concern the consumer opts into — see the "using-components"
 * skill doc for the minimal CSS needed to make snap-paging feel native.
 */
export function useReelSwiper<T>({ items, initialIndex = 0, onActiveChange }: UseReelSwiperOptions<T>): UseReelSwiperResult<T> {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const containerNodeRef = useRef<HTMLElement | null>(null);
  const itemNodesRef = useRef<Map<number, Element>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setActive = useCallback(
    (index: number) => {
      setActiveIndex(index);
      onActiveChange?.(index, items[index]);
    },
    [items, onActiveChange]
  );

  const setupObserver = useCallback(() => {
    observerRef.current?.disconnect();
    if (!containerNodeRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Pick whichever observed entry has the greatest visible ratio —
        // handles fast swipes that briefly show two items at once.
        const mostVisible = entries.reduce((best, e) => (e.intersectionRatio > (best?.intersectionRatio ?? 0) ? e : best), entries[0]);
        if (mostVisible?.isIntersecting) {
          const idx = Number((mostVisible.target as HTMLElement).dataset.reelIndex);
          if (!Number.isNaN(idx)) setActive(idx);
        }
      },
      { root: containerNodeRef.current, threshold: [0.6] }
    );
    itemNodesRef.current.forEach((node) => observerRef.current?.observe(node));
  }, [setActive]);

  const containerRef = useCallback(
    (node: HTMLElement | null) => {
      containerNodeRef.current = node;
      setupObserver();
    },
    [setupObserver]
  );

  const itemRef = useCallback(
    (index: number) => (node: Element | null) => {
      if (node) {
        (node as HTMLElement).dataset.reelIndex = String(index);
        itemNodesRef.current.set(index, node);
        observerRef.current?.observe(node);
      } else {
        const existing = itemNodesRef.current.get(index);
        if (existing) observerRef.current?.unobserve(existing);
        itemNodesRef.current.delete(index);
      }
    },
    []
  );

  useEffect(() => () => observerRef.current?.disconnect(), []);

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(items.length - 1, index));
      const node = itemNodesRef.current.get(clamped);
      node?.scrollIntoView({ behavior: "smooth", block: "start" });
      setActive(clamped);
    },
    [items.length, setActive]
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [goTo, activeIndex]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [goTo, activeIndex]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      }
    },
    [goNext, goPrev]
  );

  return {
    activeIndex,
    activeItem: items[activeIndex] ?? null,
    containerRef,
    itemRef,
    goTo,
    goNext,
    goPrev,
    getContainerProps: () => ({ role: "region", "aria-label": "Media reel", tabIndex: 0, onKeyDown }),
    getItemProps: (index: number) => ({ key: index, role: "group", "aria-roledescription": "slide" }),
  };
}
