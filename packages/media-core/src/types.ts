/**
 * media-core — pure TypeScript types.
 * No React. No DOM. No React Native. This file (and this package) must be
 * importable from a CLI, a server, a test runner — anything.
 */

export type MediaType = "photos" | "videos";

export interface PexelsPhoto {
  id: number;
  type: "photo";
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  avg_color: string | null;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

export interface PexelsVideoFile {
  id: number;
  quality: "hd" | "sd" | string;
  file_type: string;
  width: number | null;
  height: number | null;
  link: string;
}

export interface PexelsVideoPicture {
  id: number;
  nr: number;
  picture: string;
}

export interface PexelsVideo {
  id: number;
  type: "video";
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: { id: number; name: string; url: string };
  video_files: PexelsVideoFile[];
  video_pictures: PexelsVideoPicture[];
}

export type MediaItem = PexelsPhoto | PexelsVideo;

export interface Page<T> {
  items: T[];
  page: number;
  perPage: number;
  totalResults: number;
  hasNextPage: boolean;
  nextPage: number | null;
}

export interface SearchParams {
  query: string;
  page?: number;
  perPage?: number;
  orientation?: "landscape" | "portrait" | "square";
  size?: "large" | "medium" | "small";
}

export interface CuratedParams {
  page?: number;
  perPage?: number;
}

export interface MediaCoreConfig {
  /** Pexels API key. Kept private inside the client closure — never exported. */
  apiKey: string;
  /** Override for testing / proxying. Defaults to https://api.pexels.com */
  baseUrl?: string;
  /** Cache TTL in ms for GET responses. 0 disables caching. Default 60_000. */
  cacheTtlMs?: number;
  /** Injectable fetch for non-browser environments / tests. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Registers a console.log listener for "view" on construction. Default true. */
  enableDefaultLogging?: boolean;
}

// ---- Errors -----------------------------------------------------------

export type MediaErrorCode =
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "NETWORK_ERROR"
  | "BAD_REQUEST"
  | "UNKNOWN";

export class MediaError extends Error {
  code: MediaErrorCode;
  status?: number;
  cause?: unknown;

  constructor(code: MediaErrorCode, message: string, status?: number, cause?: unknown) {
    super(message);
    this.name = "MediaError";
    this.code = code;
    this.status = status;
    this.cause = cause;
  }
}

// ---- Events -------------------------------------------------------------

/**
 * Events the SDK can emit. These are not fetched from Pexels — they are
 * triggered explicitly by consumers (e.g. a UI component calls
 * `client.trackView(item)` when a lightbox opens) so that every layer of the
 * app — analytics, app-level state, a debug console listener — can react to
 * the same activity stream without each caller having to fan out manually.
 */
export type MediaEventName = "view";

export interface MediaEventPayload {
  view: { item: MediaItem; source?: string; timestamp: number };
}

export type MediaEventListener<K extends MediaEventName> = (
  payload: MediaEventPayload[K]
) => void;
