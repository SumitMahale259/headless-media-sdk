---
name: using-media-components
description: Use when writing or reviewing JSX that renders Grid, Lightbox, or ReelSwiper from media-ui-react. Covers the prop-getter pattern, required refs, the styling contract, and accessibility. Do NOT use for data-fetching or event-tracking logic — see wiring-media-data.
---

# Using the headless components in `media-ui-react`

## The one hard rule

Every component here is a **render-prop function returning zero built-in
markup**. There is no default CSS, no default `<div>` wrapper you can skip.
If you write `<Grid items={x} />` with no `children` function, it renders
nothing and TypeScript will already refuse to compile it — `children` is
required, not optional.

## The `key` gotcha (read this before your first prop-getter)

`getItemProps(item, index)` returns an object that **includes a `key`
field**. React does not let you spread `key` from an object onto JSX — it
must be a literal JSX attribute. Always destructure it out first:

```tsx
const { key, ...itemProps } = getItemProps(photo, i);
return <div key={key} {...itemProps}>...</div>;
```

Spreading `{...getItemProps(photo, i)}` directly onto the element without
destructuring `key` first will produce a silent React warning and a missing
key — grep for `{...getItemProps(` without a preceding `const { key, ... }`
line and flag it in review.

## Grid — infinite scroll

```tsx
import { Grid } from "media-ui-react";

<Grid items={items} hasMore={hasMore} loading={loading} onLoadMore={loadMore}>
  {({ getContainerProps, getItemProps, sentinelRef }) => (
    <div className="my-grid" {...getContainerProps()}>
      {items.map((item, i) => {
        const { key, ...itemProps } = getItemProps(item, i);
        return <div key={key} {...itemProps}>{/* your markup */}</div>;
      })}
      <div ref={sentinelRef} />  {/* REQUIRED — infinite scroll won't fire without this node in the DOM */}
    </div>
  )}
</Grid>
```

- `sentinelRef` must land on a real rendered element (an empty trailing
  `<div>` is fine and is exactly what the demo app does) — it's what the
  `IntersectionObserver` watches. Forgetting it means `onLoadMore` never
  fires.
- `items`/`hasMore`/`loading`/`onLoadMore` come from a `media-react` data
  hook (`useSearch`/`useCuratedFeed`) — Grid itself has never heard of
  Pexels or media-core, it only knows "list of T + a callback."

## Lightbox — controlled vs uncontrolled

**Almost always use the controlled form** — call `useLightbox()` yourself in
the parent so a click on a Grid item elsewhere in the tree can call `.open(i)`:

```tsx
import { Lightbox, useLightbox } from "media-ui-react";

const lightbox = useLightbox({ items });
// ... Grid item: onClick={() => lightbox.open(i)}

<Lightbox items={items} state={lightbox}>
  {({ isOpen, currentItem, getOverlayProps, getContentProps, getCloseButtonProps }) =>
    isOpen && currentItem ? (
      <div {...getOverlayProps()}>
        <div {...getContentProps()}>
          <button {...getCloseButtonProps()}>×</button>
          {/* your markup */}
        </div>
      </div>
    ) : null
  }
</Lightbox>
```

If you omit `state`, `<Lightbox>` creates its own internal `useLightbox()`
instance that nothing outside its own `children` closure can open — only do
this for a fully self-contained demo.

**Accessibility that's already wired for you** (don't re-implement, don't
strip out): `getContentProps()` sets `role="dialog"`, `aria-modal`, and a
`ref` that autofocuses the dialog on open; Escape/ArrowLeft/ArrowRight are
bound to `close`/`prev`/`next` automatically while `isOpen` is true; closing
restores focus to whatever triggered `open()`. If a reviewer sees a custom
`onKeyDown` re-implementing Escape-to-close on the overlay, that's redundant
— remove it.

## ReelSwiper — vertical snap paging

```tsx
import { ReelSwiper } from "media-ui-react";

<ReelSwiper items={videos} onActiveChange={(i, item) => trackView(item, "reels")}>
  {({ getContainerProps, getItemProps, containerRef, itemRef, activeIndex }) => (
    <div ref={containerRef} {...getContainerProps()}>
      {videos.map((v, i) => {
        const { key, ...itemProps } = getItemProps(i);
        return (
          <div key={key} ref={itemRef(i)} {...itemProps}>
            <video autoPlay={i === activeIndex} muted loop src={v.video_files[0]?.link} />
          </div>
        );
      })}
    </div>
  )}
</ReelSwiper>
```

- Both `containerRef` AND `itemRef(i)` must be attached — active-item
  detection uses an `IntersectionObserver` rooted on the container node,
  observing each item node. Missing either ref means `activeIndex` never
  updates.
- **Styling contract exception**: snap-paging needs actual CSS
  (`overflow-y: scroll; scroll-snap-type: y mandatory;` on the container,
  `scroll-snap-align: start;` on each item) — this is *behavioral* CSS, not
  visual polish, and the hook does not inject it. Copy the `.reel-container`
  / `.reel-item` rules from `apps/web-app/src/styles.css` into any new
  consumer; without them the swiper still tracks the active item correctly
  but won't snap.
- Only autoplay the video matching `activeIndex` (`autoPlay={i === activeIndex}`) — autoplaying every item at once is a common mistake when copy-pasting from Grid patterns.

## Anti-patterns to flag in review

- ❌ Any `import ... from "media-core"` or `"media-react"` inside a file under `packages/media-ui-react/` — components are data-agnostic by contract.
- ❌ `{...getItemProps(...)}` spread directly without destructuring `key` first.
- ❌ Baked-in class names or inline color/size choices inside `media-ui-react` source — all visual styling belongs in the consuming app.
- ❌ Re-implementing keyboard/focus handling that a prop-getter already provides (see Lightbox note above).
- ❌ `<ReelSwiper>` items rendered without `itemRef(i)` — active-item tracking silently breaks.
