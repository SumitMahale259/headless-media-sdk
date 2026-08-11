# media-native — scoped out (see root README "Scoping decisions")

Not implemented in this submission. The contract it would need to satisfy:

- Same public shape as `media-react`: a `MediaProvider` + the hook set
  (`useSearch`, `useCuratedFeed`, `useMediaItem`, `useMediaEvents`,
  `useMediaEventListener`), adapted to React Native idioms (e.g. no
  `document`/`IntersectionObserver` assumptions — RN has none).
- Imports `media-core` exactly the way `media-react` does. Because
  `media-core` has zero DOM/React assumptions (see its `tsconfig.json`,
  which excludes the DOM lib entirely and declares only the `fetch`/`URL`
  surface it needs), it is already RN-portable with **zero changes** — this
  is the concrete proof of the "core must be portable" constraint, not just
  an assertion.
- The state-management logic in `media-react`'s hooks (loading/error/
  pagination via `useState`/`useEffect`/`useCallback`) is not
  React-DOM-specific — it should port to `media-native` almost verbatim,
  since none of it touches `window`/`document`.
