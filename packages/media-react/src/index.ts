export { MediaProvider, useMediaCore } from "./MediaProvider";
export type { MediaProviderProps } from "./MediaProvider";

export { useSearch } from "./hooks/useSearch";
export type { UseSearchOptions, UseSearchResult } from "./hooks/useSearch";

export { useCuratedFeed } from "./hooks/useCuratedFeed";
export type { UseCuratedFeedOptions } from "./hooks/useCuratedFeed";

export { useMediaItem } from "./hooks/useMediaItem";
export type { UseMediaItemResult } from "./hooks/useMediaItem";

export { useMediaEvents, useMediaEventListener } from "./hooks/useMediaEvents";
export type { UseMediaEventsResult } from "./hooks/useMediaEvents";

// Re-export the types (and the MediaError class, needed at runtime for
// `instanceof` checks) so the app never has to import from "media-core"
// directly — media-react is the only package allowed to import media-core
// (see README dependency rules).
export { MediaError } from "media-core";
export type { MediaItem, PexelsPhoto, PexelsVideo, MediaType, MediaErrorCode } from "media-core";
