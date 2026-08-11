interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Small in-memory cache keyed by request signature, plus in-flight request
 * de-dupe: if two callers ask for the same key while a fetch is already
 * pending (e.g. a fast typer re-triggering search, or StrictMode double
 * effects), they share one network call instead of firing two.
 */
export class RequestCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private inFlight = new Map<string, Promise<unknown>>();

  constructor(private ttlMs: number) {}

  private isFresh(entry: CacheEntry<unknown> | undefined): entry is CacheEntry<unknown> {
    return !!entry && entry.expiresAt > Date.now();
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    return this.isFresh(entry) ? (entry.value as T) : undefined;
  }

  set<T>(key: string, value: T): void {
    if (this.ttlMs <= 0) return;
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  /** Wraps a producer so concurrent calls with the same key share one promise. */
  async dedupe<T>(key: string, produce: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;

    const pending = this.inFlight.get(key) as Promise<T> | undefined;
    if (pending) return pending;

    const promise = produce()
      .then((value) => {
        this.set(key, value);
        this.inFlight.delete(key);
        return value;
      })
      .catch((err) => {
        this.inFlight.delete(key);
        throw err;
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  clear(): void {
    this.store.clear();
  }
}
