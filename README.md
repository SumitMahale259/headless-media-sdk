# Headless Media SDK

A framework-agnostic media SDK (Pexels-backed) split into four layers, built
so each layer can only see the layer directly below it.

## Architecture

```
                     ┌──────────────┐
                     │   web-app    │  (apps/web-app)
                     │ (React, Vite)│
                     └──┬────────┬──┘
              imports   │        │  imports
                        ▼        ▼
              ┌──────────────┐  ┌──────────────┐
              │ media-react  │  │media-ui-react│
              │ (wrapper)    │  │ (components) │
              └──────┬───────┘  └──────────────┘
                     │ imports         ▲
                     ▼                 │
              ┌──────────────┐         │
              │  media-core  │  NEVER imports either of these
              │(zero UI, TS) │  ────────────────────────────┘
              └──────────────┘
```

**Dependency direction, enforced two ways:**

1. **By construction** — `media-ui-react`'s components are generic over `T`;
   they've never heard of `PexelsPhoto` or Pexels. `media-core` has no
   `react`/`react-dom` in its dependency tree at all, and its
   `tsconfig.json` deliberately excludes the `"DOM"` lib (see
   `packages/media-core/src/ambient.d.ts` for why that's still safe — it
   hand-declares only the `fetch`/`URL`/`Response` surface it needs, instead
   of pulling in `window`/`document` along with the lib).
2. **By lint rule** — `.eslintrc.cjs` has per-package `no-restricted-imports`
   overrides so `media-ui-react` importing `media-core`, or `media-core`
   importing `react`, fails `npm run lint`, not just code review.

| Package | Role | May import |
|---|---|---|
| `media-core` | Pexels client, auth, caching, typed event emitter | nothing app-specific |
| `media-react` | React provider + hooks, adapts `media-core` to React | `media-core` only |
| `media-ui-react` | Headless Grid / Lightbox / ReelSwiper | nothing from this repo |
| `apps/web-app` | Wires data (`media-react`) to display (`media-ui-react`) | both |

## Running it

```bash
npm install
cp apps/web-app/.env.example apps/web-app/.env
# put a free key from https://www.pexels.com/api/ into apps/web-app/.env
npm run dev
```

Other useful scripts from the repo root:

```bash
npm run typecheck   # tsc --noEmit in every workspace that defines it
npm run lint         # boundary-enforcing eslint rules across all packages
npm run build        # production build of web-app
```

## SDK design notes

- **Auth**: the API key lives only inside `MediaCoreClient`'s constructor
  closure (`packages/media-core/src/client.ts`). It is never re-exported,
  logged, or attached to anything outside the `request()` method's headers.
- **Caching / de-dupe**: `RequestCache` (`packages/media-core/src/cache.ts`)
  does both — a TTL'd cache keyed by full request URL, and in-flight
  promise sharing so two callers asking for the same page while a fetch is
  pending get one network call, not two (this also quietly fixes React
  StrictMode's double-invoke of effects in dev).
- **Events**: `view` is not fetched from Pexels — they're
  triggered explicitly (`client.trackView(item)`) so every layer (a debug
  console listener registered by default in `media-core`, plus anything
  `media-react`'s `useMediaEventListener` subscribes) reacts to one shared
  stream. See `apps/web-app/src/components/EventLog.tsx` for the app
  subscribing independently, as the spec asks for.
- **Errors**: `MediaError` carries a stable `.code` (`UNAUTHORIZED`,
  `RATE_LIMITED`, `NOT_FOUND`, `NETWORK_ERROR`, `BAD_REQUEST`, `UNKNOWN`) so
  consumers branch on that instead of string-matching `.message`.

## Headless component design

`Grid`, `Lightbox`, `ReelSwiper` all follow the same shape: a `use*` hook
that owns behavior and returns state + prop-getters, plus a thin render-prop
component wrapping it for consumers who'd rather not call the hook directly.
No component renders a styled DOM node of its own — see
`apps/web-app/src/styles.css` for every visual decision, all of which lives
in the app, not the library.

`Lightbox` supports controlled usage (`<Lightbox state={externalHookResult}>`)
specifically because a real app needs a Grid click, somewhere else in the
tree, to open a Lightbox that lives elsewhere — see the doc comment in
`packages/media-ui-react/src/Lightbox/Lightbox.tsx` for both usage forms.

## Scoping decisions (what I cut, and why)

- **React Native (`media-native`, `media-ui-native`): not implemented.**
  I prioritized full depth on the web stack — a real boundary-enforced
  architecture, genuinely headless components, and two skill docs that
  actually change AI output — over spreading the same hours thin across a
  second platform. `packages/media-native/README.md` and
  `packages/media-ui-native/README.md` spell out the exact contract each
  would need to satisfy and why `media-core`'s zero-DOM design makes the
  core itself already portable with no changes — that portability claim is
  the part of the RN story that's actually load-bearing for this
  architecture, and it's true today, not aspirational.
- **Video Lightbox**: the Lightbox component is data-generic and would
  accept a `PexelsVideo` the same way it accepts a `PexelsPhoto` — I
  built the video experience as a dedicated Reels view instead (per the
  spec: "a Reels-style view for video results"), so I didn't also wire a
  video branch into `PhotoBrowser`'s lightbox.
- **Docs sites**: not deployed as separate hosted sites in this submission
  — package-level doc comments (TSDoc) are dense throughout
  `media-core`/`media-react`/`media-ui-react` and are what a `typedoc`
  run against each package would render directly. Wiring up a deploy
  target (GitHub Pages / Vercel per package) is mechanical from here but
  I didn't spend the time budget on hosting config.

## AI-assisted vs hand-written

_Fill this in with what actually happened when you build on top of this —
which files you generated vs hand-edited, and how you used the two skill
docs while extending `apps/web-app`. The task explicitly wants this section
plus a link to the chat transcript(s) used._

## Skill docs

- `skills/wiring-data/SKILL.md` — provider setup, data hooks, event tracking, error-code branching.
- `skills/using-components/SKILL.md` — prop-getter usage, the `key`-destructuring gotcha, Lightbox controlled/uncontrolled, ReelSwiper ref requirements, a11y already provided.

Both are written as review checklists with concrete anti-patterns, not
general React advice — the goal was that an agent (or a reviewer) can grep
a diff against the "Anti-patterns to flag" section in each.
