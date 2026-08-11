import React, { useCallback, useEffect, useRef, useState, type SyntheticEvent } from "react";

export interface UseLightboxOptions<T> {
  items: T[];
  onClose?: () => void;
  onIndexChange?: (index: number, item: T) => void;
}

export interface UseLightboxResult<T> {
  isOpen: boolean;
  currentIndex: number;
  currentItem: T | null;
  open: (index: number) => void;
  close: () => void;
  next: () => void;
  prev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  getOverlayProps: () => {
    role: "presentation";
    onClick: (e: SyntheticEvent) => void;
  };
  getContentProps: () => {
    role: "dialog";
    "aria-modal": true;
    "aria-label": string;
    tabIndex: -1;
    ref: (node: HTMLElement | null) => void;
    onClick: (e: SyntheticEvent) => void;
  };
  getCloseButtonProps: () => {
    "aria-label": "Close";
    onClick: () => void;
  };
}

/**
 * Owns: open/closed state, current index, keyboard nav (Esc/Left/Right),
 * and a basic focus-on-open / restore-focus-on-close cycle. Ships zero
 * styling and zero DOM — every prop-getter attaches behavior + a11y
 * attributes to elements the consumer renders themselves.
 */
export function useLightbox<T>({ items, onClose, onIndexChange }: UseLightboxOptions<T>): UseLightboxResult<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const contentRef = useRef<HTMLElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const setIndex = useCallback(
    (index: number) => {
      setCurrentIndex(index);
      onIndexChange?.(index, items[index]);
    },
    [items, onIndexChange]
  );

  const open = useCallback(
    (index: number) => {
      lastFocusedRef.current = (typeof document !== "undefined" ? (document.activeElement as HTMLElement) : null) ?? null;
      setIndex(index);
      setIsOpen(true);
    },
    [setIndex]
  );

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
    lastFocusedRef.current?.focus?.();
  }, [onClose]);

  const next = useCallback(() => {
    if (currentIndex < items.length - 1) setIndex(currentIndex + 1);
  }, [currentIndex, items.length, setIndex]);

  const prev = useCallback(() => {
    if (currentIndex > 0) setIndex(currentIndex - 1);
  }, [currentIndex, setIndex]);

  // Keyboard handling — attached to the document only while open, removed on close.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, close, next, prev]);

  // Focus the dialog content when it opens, so keyboard/screen-reader users land inside it.
  useEffect(() => {
    if (isOpen) contentRef.current?.focus();
  }, [isOpen]);

  const stop = useCallback((e: SyntheticEvent) => e.stopPropagation(), []);

  return {
    isOpen,
    currentIndex,
    currentItem: items[currentIndex] ?? null,
    open,
    close,
    next,
    prev,
    hasNext: currentIndex < items.length - 1,
    hasPrev: currentIndex > 0,
    getOverlayProps: () => ({ role: "presentation", onClick: close }),
    getContentProps: () => ({
      role: "dialog",
      "aria-modal": true,
      "aria-label": "Media viewer",
      tabIndex: -1,
      ref: (node: HTMLElement | null) => {
        contentRef.current = node;
      },
      onClick: stop,
    }),
    getCloseButtonProps: () => ({ "aria-label": "Close" as const, onClick: close }),
  };
}
