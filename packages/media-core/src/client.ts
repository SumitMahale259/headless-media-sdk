import { MediaEventEmitter } from "./emitter";
import { RequestCache } from "./cache";
import {
  MediaCoreConfig,
  MediaError,
  MediaErrorCode,
  MediaEventListener,
  MediaEventName,
  MediaItem,
  Page,
  PexelsPhoto,
  PexelsVideo,
  SearchParams,
  CuratedParams,
} from "./types";

const DEFAULT_BASE_URL = "https://api.pexels.com";
const DEFAULT_TTL_MS = 60_000;
const DEFAULT_PER_PAGE = 20;

function statusToCode(status: number): MediaErrorCode {
  if (status === 401 || status === 403) return "UNAUTHORIZED";
  if (status === 404) return "NOT_FOUND";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 400 && status < 500) return "BAD_REQUEST";
  return "UNKNOWN";
}

// ---- Mappers --------------------------------------------------------------
// Decouples our domain model from Pexels' exact wire shape. If a candidate
// swaps in Unsplash, only these two functions (and the request builders
// below) change — nothing above the client needs to know.

function mapPhoto(raw: any): PexelsPhoto {
  return {
    id: raw.id,
    type: "photo",
    width: raw.width,
    height: raw.height,
    url: raw.url,
    photographer: raw.photographer,
    photographer_url: raw.photographer_url,
    avg_color: raw.avg_color ?? null,
    src: raw.src,
    alt: raw.alt ?? "",
  };
}

function mapVideo(raw: any): PexelsVideo {
  return {
    id: raw.id,
    type: "video",
    width: raw.width,
    height: raw.height,
    url: raw.url,
    image: raw.image,
    duration: raw.duration,
    user: raw.user,
    video_files: raw.video_files ?? [],
    video_pictures: raw.video_pictures ?? [],
  };
}

/**
 * The framework-agnostic core. Holds the API key in a closure — nothing
 * downstream of this file (wrappers, components, app) ever sees or needs it.
 *
 * This class has zero React / DOM / RN imports and could power a CLI or a
 * server-side script unmodified.
 */
export class MediaCoreClient {
  private apiKey: string;
  private baseUrl: string;
  private fetchImpl: typeof fetch;
  private cache: RequestCache;
  private emitter = new MediaEventEmitter();

  constructor(config: MediaCoreConfig) {
    if (!config.apiKey) {
      throw new MediaError("UNAUTHORIZED", "media-core: apiKey is required to initialize the client.");
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    // this.fetchImpl = config.fetchImpl ?? fetch;
    this.fetchImpl =
      config.fetchImpl ??
      (typeof globalThis.fetch === "function"
        ? globalThis.fetch.bind(globalThis)
        : (() => {
            throw new MediaError(
              "NETWORK_ERROR",
              "media-core: fetch is not available in this environment."
            );
          })());
    this.cache = new RequestCache(config.cacheTtlMs ?? DEFAULT_TTL_MS);

    if (config.enableDefaultLogging !== false) {
      this.emitter.on("view", (p) => console.log(`[media-core] view`, p.item.id, p.source ?? ""));
    }
  }

  // -- events ---------------------------------------------------------------

  on<K extends MediaEventName>(event: K, listener: MediaEventListener<K>): () => void {
    return this.emitter.on(event, listener);
  }

  off<K extends MediaEventName>(event: K, listener: MediaEventListener<K>): void {
    this.emitter.off(event, listener);
  }

  trackView(item: MediaItem, source?: string): void {
    this.emitter.emit("view", { item, source, timestamp: Date.now() });
  }

  // -- requests ---------------------------------------------------------------

  private async request<T>(path: string, params: Record<string, unknown> = {}): Promise<T> {
    const url = new URL(path, this.baseUrl);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
    const key = url.toString();

    return this.cache.dedupe(key, async () => {
      let res: Response;
      try {
        res = await this.fetchImpl(url.toString(), {
          headers: { Authorization: this.apiKey },
        });
      } catch (err) {
        throw new MediaError("NETWORK_ERROR", "media-core: network request failed.", undefined, err);
      }

      if (!res.ok) {
        throw new MediaError(statusToCode(res.status), `media-core: request failed (${res.status}).`, res.status);
      }

      return (await res.json()) as T;
    });
  }

  private toPage<TRaw, TItem>(
    raw: { page: number; per_page: number; total_results: number; next_page?: string },
    rawItems: TRaw[],
    mapper: (raw: TRaw) => TItem
  ): Page<TItem> {
    return {
      items: rawItems.map(mapper),
      page: raw.page,
      perPage: raw.per_page,
      totalResults: raw.total_results,
      hasNextPage: !!raw.next_page,
      nextPage: raw.next_page ? raw.page + 1 : null,
    };
  }

  // -- photos ---------------------------------------------------------------

  async searchPhotos(params: SearchParams): Promise<Page<PexelsPhoto>> {
    const raw = await this.request<any>("/v1/search", {
      query: params.query,
      page: params.page ?? 1,
      per_page: params.perPage ?? DEFAULT_PER_PAGE,
      orientation: params.orientation,
      size: params.size,
    });
    return this.toPage(raw, raw.photos, mapPhoto);
  }

  async curatedPhotos(params: CuratedParams = {}): Promise<Page<PexelsPhoto>> {
    const raw = await this.request<any>("/v1/curated", {
      page: params.page ?? 1,
      per_page: params.perPage ?? DEFAULT_PER_PAGE,
    });
    return this.toPage(raw, raw.photos, mapPhoto);
  }

  async getPhoto(id: number): Promise<PexelsPhoto> {
    const raw = await this.request<any>(`/v1/photos/${id}`);
    return mapPhoto(raw);
  }

  // -- videos ---------------------------------------------------------------

  async searchVideos(params: SearchParams): Promise<Page<PexelsVideo>> {
    const raw = await this.request<any>("/videos/search", {
      query: params.query,
      page: params.page ?? 1,
      per_page: params.perPage ?? DEFAULT_PER_PAGE,
      orientation: params.orientation,
      size: params.size,
    });
    return this.toPage(raw, raw.videos, mapVideo);
  }

  async popularVideos(params: CuratedParams = {}): Promise<Page<PexelsVideo>> {
    const raw = await this.request<any>("/videos/popular", {
      page: params.page ?? 1,
      per_page: params.perPage ?? DEFAULT_PER_PAGE,
    });
    return this.toPage(raw, raw.videos, mapVideo);
  }

  async getVideo(id: number): Promise<PexelsVideo> {
    const raw = await this.request<any>(`/videos/videos/${id}`);
    return mapVideo(raw);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export function createMediaCore(config: MediaCoreConfig): MediaCoreClient {
  return new MediaCoreClient(config);
}
