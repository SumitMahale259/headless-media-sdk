import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import { createMediaCore, MediaCoreClient, MediaCoreConfig } from "media-core";

const MediaCoreContext = createContext<MediaCoreClient | null>(null);

export interface MediaProviderProps extends MediaCoreConfig {
  children: ReactNode;
  /**
   * Escape hatch for tests / storybook: inject an already-constructed
   * client instead of building one from config. Wrapper concerns only —
   * still zero business logic here.
   */
  client?: MediaCoreClient;
}

/**
 * The single place `media-core` gets constructed for a React tree. Everything
 * else in `media-react` reads the client via `useMediaCore()` instead of
 * importing `media-core` directly — that keeps this the ONLY file in the
 * package that calls `createMediaCore`.
 */
export function MediaProvider({ children, client, ...config }: MediaProviderProps) {
  const instance = useMemo(() => client ?? createMediaCore(config), [
    client,
    config.apiKey,
    config.baseUrl,
    config.cacheTtlMs,
  ]);

  return <MediaCoreContext.Provider value={instance}>{children}</MediaCoreContext.Provider>;
}

export function useMediaCore(): MediaCoreClient {
  const ctx = useContext(MediaCoreContext);
  if (!ctx) {
    throw new Error("useMediaCore() must be called within a <MediaProvider>.");
  }
  return ctx;
}
