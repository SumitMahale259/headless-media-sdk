---
name: wiring-media-data
description: Use when writing or reviewing code that fetches, searches, paginates, or tracks activity for media (photos/videos) via media-react. Covers MediaProvider setup, the data hooks, and the event-tracking calls. Do NOT use for styling or DOM structure of Grid/Lightbox/ReelSwiper — see using-media-components.
---

# Wiring media data with `media-react`

## The one hard rule

`media-react` is the ONLY package allowed to import `media-core`. If you are
about to write `import ... from "media-core"` anywhere under `apps/` or
`packages/media-ui-react/`, stop — that's wrong. Go through a `media-react`
hook instead. If the hook you need doesn't exist, add it to
`packages/media-react/src/hooks/`, don't reach past the wrapper.

## Setup (once, at the app root)

```tsx
import { MediaProvider } from "media-react";

<MediaProvider apiKey={import.meta.env.VITE_PEXELS_API_KEY}>
  <App />
</MediaProvider>
```

- `apiKey` is required. Never hardcode it — it always comes from an env var.
- Everything below this provider can call `useMediaCore()` / the data hooks.
  Nothing above it can.

## Fetching a list (search or curated feed)

Two hooks, same return shape — pick based on whether the user has typed a query:

```tsx
import { useSearch, useCuratedFeed } from "media-react";

const results = useSearch(query, { type: "photos" }); // query non-empty
const feed = useCuratedFeed({ type: "photos" });       // no query yet
```

Both return `{ items, loading, loadingMore, error, hasMore, loadMore }`.
**Always branch on `query` to pick which one is live** — don't call both and
merge; that double-fetches. See `apps/web-app/src/components/PhotoBrowser.tsx`
for the canonical pattern:

```tsx
const feed = query ? useSearch(query, { type: "photos" }) : useCuratedFeed({ type: "photos" });
```

For videos, pass `{ type: "videos" }` and type the result as `PexelsVideo`.

## Loading a single item

```tsx
const { item, loading, error } = useMediaItem(id, "photos");
```

`id` may be `null` — the hook just returns `{ item: null, loading: false, error: null }` and does not fetch. Use this to defer fetching until a route param resolves.

## Error handling — always check `MediaError.code`, don't string-match `.message`

```tsx
import { MediaError } from "media-react";

if (feed.error) {
  if (feed.error.code === "RATE_LIMITED") return <RetryLater />;
  if (feed.error.code === "UNAUTHORIZED") return <BadApiKeyNotice />;
  return <GenericError message={feed.error.message} />;
}
```

`.message` strings are for logs/debugging, not branching logic — they can
change without it being a breaking change; `.code` is the stable contract.

## Tracking activity (view / download events)

Every `MediaItem` a user opens or downloads should go through `trackView`/
`trackDownload` — this is what feeds the shared event stream (console logger
by default, plus anything else subscribed via `useMediaEventListener`).

```tsx
import { useMediaEvents } from "media-react";

const { trackView, trackDownload } = useMediaEvents();

// when a lightbox opens on an item:
trackView(item, "lightbox");
// when a user actually downloads/saves:
trackDownload(item, "large2x");
```

Do NOT call `client.trackView` directly by pulling `useMediaCore()` unless
you're inside `media-react` itself — app code uses `useMediaEvents()`.

To *observe* the stream (e.g. an activity log, analytics) rather than emit
into it:

```tsx
import { useMediaEventListener } from "media-react";

useMediaEventListener("view", (payload) => {
  // payload: { item, source?, timestamp }
});
```

## Anti-patterns to flag in review

- ❌ `import { MediaCoreClient } from "media-core"` inside `apps/web-app` — go through `media-react` hooks.
- ❌ Calling `useSearch` and `useCuratedFeed` in the same component and merging results — pick one based on query state.
- ❌ Passing raw Pexels API JSON shapes around — always use the mapped `PexelsPhoto`/`PexelsVideo` types re-exported from `media-react`.
- ❌ Skipping `trackView`/`trackDownload` when wiring a new place users can open/save media — every new surface should call these, that's the whole point of the event pattern.
