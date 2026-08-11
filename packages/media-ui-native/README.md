# media-ui-native — scoped out (see root README "Scoping decisions")

Not implemented in this submission. The contract it would need to satisfy:

- Mirror `media-ui-react`'s three components at the *behavioral* level, not
  the implementation level — RN has no `IntersectionObserver` or CSS
  scroll-snap, so:
  - **Grid** → `useGrid`'s public shape (`items`, `hasMore`, `loading`,
    `onLoadMore`) stays identical, but the trigger mechanism becomes
    `FlatList`'s `onEndReached`/`onEndReachedThreshold` instead of a
    sentinel + observer.
  - **Lightbox** → same open/close/next/prev state machine and prop-getter
    shape; `getContentProps()` drops the DOM-specific `role`/`aria-modal`
    attributes for RN's accessibility props (`accessibilityViewIsModal`,
    `accessible`), and keyboard handling is replaced by hardware
    back-button handling on Android.
  - **ReelSwiper** → same active-index concept, but implemented via
    `FlatList`'s `onViewableItemsChanged`/`viewabilityConfig` instead of an
    `IntersectionObserver`, since RN has no such API.
- Same rule as the web version: zero imports from `media-core` or
  `media-native` — components take data and callbacks purely as props.
