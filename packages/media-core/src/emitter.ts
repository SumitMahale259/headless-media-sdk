import type { MediaEventName, MediaEventPayload, MediaEventListener } from "./types";

/**
 * Minimal typed pub/sub. No dependencies, no globals — one instance lives
 * inside each MediaCoreClient. Framework wrappers subscribe to this via
 * `client.on(...)`; they never need to know it's implemented this way.
 *
 * Internally backed by a single untyped Map rather than a mapped object
 * type — TypeScript can't prove `listeners[event].add(listener)` is safe
 * when `event`/`listener` share a generic type parameter K (a known
 * limitation, not a bug), so the cast is isolated to these two private
 * methods. The public `on`/`off`/`emit` signatures stay fully typed, which
 * is the boundary that actually matters to callers.
 */
export class MediaEventEmitter {
  private listeners = new Map<MediaEventName, Set<(payload: unknown) => void>>();

  private setFor(event: MediaEventName): Set<(payload: unknown) => void> {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    return set;
  }

  on<K extends MediaEventName>(event: K, listener: MediaEventListener<K>): () => void {
    const set = this.setFor(event);
    const cast = listener as (payload: unknown) => void;
    set.add(cast);
    // Returning the unsubscribe fn directly avoids a second "off" call site
    // and matches the pattern React's useEffect cleanup expects.
    return () => set.delete(cast);
  }

  off<K extends MediaEventName>(event: K, listener: MediaEventListener<K>): void {
    this.listeners.get(event)?.delete(listener as (payload: unknown) => void);
  }

  emit<K extends MediaEventName>(event: K, payload: MediaEventPayload[K]): void {
    this.listeners.get(event)?.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        // A broken listener (e.g. a third-party analytics callback) must
        // never break the emit loop for other listeners.
        console.error(`[media-core] listener for "${event}" threw`, err);
      }
    });
  }
}
