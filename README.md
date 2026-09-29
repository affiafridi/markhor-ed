# Markhor Drinks — frontend

Premium WebGL brand experience for Markhor Drinks.

**Phase 2 — the global header and the interactive product hero.** The rest of
the homepage is deliberately not built: there are no placeholder sections.

---

## Requirements

**Node 20.9+ is required** (Next.js 16). Node is managed by nvm-windows and
the active version is now **24.13.0** — see `.nvmrc`.

If `npm run dev` fails with _"You are using Node.js 18.20.8. For Next.js,
Node.js version >=20.9.0 is required"_, the shell is on the old version:

```powershell
nvm use 24.13.0
```

`nvm use` swaps the `C:\nvm4w\nodejs` symlink, so it affects every shell.
**Open a new terminal afterwards** — PowerShell caches command lookups and an
existing session will report `node` as not recognised until it is restarted.

To go back to the old version for another project: `nvm use 18.20.8`.

## Scripts

| Script              | Purpose                  |
| ------------------- | ------------------------ |
| `npm run dev`       | Dev server (Turbopack)   |
| `npm run build`     | Production build         |
| `npm run typecheck` | `tsc --noEmit`           |
| `npm run lint`      | ESLint                   |
| `npm run format`    | Prettier                 |
| `npm run verify`    | typecheck + lint + build |

## Stack

| Concern             | Choice                                                    |
| ------------------- | --------------------------------------------------------- |
| Framework           | Next.js 16 (App Router), React 19                         |
| Language            | TypeScript, strict + `noUncheckedIndexedAccess`           |
| Styling             | Tailwind CSS v4 (CSS-first) + design tokens + CSS Modules |
| Cinematic animation | GSAP 3 + ScrollTrigger                                    |
| Smooth scroll       | Lenis                                                     |
| Interface animation | Motion for React                                          |
| 3D                  | three.js, @react-three/fiber, drei, postprocessing        |
| State               | Zustand                                                   |

---

## Structure

```
src/
  app/            routes, layout, globals.css, fonts, robots, sitemap
  components/
    layout/       SiteHeader, Navigation (desktop nav, menu button, mobile menu)
    sections/     Hero and its parts, plus its interaction hooks
    ui/           Logo, ArrowLink, HornControl (the horn prev/next glyph)
    three/        Experience, Scene, ProductStage, CameraRig, Lighting,
                  Environment, Effects
  providers/      SmoothScrollProvider, AnimationProvider
  hooks/          media query, reduced motion, device tier, viewport tier
  store/          experience-store, ui-store (Zustand)
  lib/
    animation/    GSAP registration + Lenis handle
    hero/         stage position, transforms, transition, theme resolution
    three/        camera and per-tier quality config
    cms/          ContentSource interface, local source, legacy route map
    seo/          metadata builder, site URL / indexability
    utils/        cn, device tier detection
  data/           typed content (site, navigation, products, ambassadors, ...)
  types/          domain model shared by data and CMS
  styles/         reset, tokens, typography
```

---

## Design tokens

`src/styles/tokens.css` is the **single source of truth** for colour, spacing,
layout, layers and easing. No component contains a raw hex value.

`src/app/globals.css` bridges those tokens into Tailwind with `@theme inline`.
`inline` matters — it makes utilities emit `var(--scene-primary)` rather than a
baked colour, so they follow runtime theme changes.

### Scene theming

The global foundation is **neutral near-black**, not green. Product colour
arrives through four semantic tokens:

```
--scene-primary   --scene-accent   --scene-glow   --scene-deep
```

They are redefined under `[data-scene="green"]`, `[data-scene="king"]` and
`[data-scene="next"]`, and `AnimationProvider` writes that attribute onto
`<html>` from the Zustand store. All four tokens are registered with
`@property` as `<color>` and carry a transition, so the browser interpolates
the whole DOM palette natively when the product changes.

`data/product-themes.ts` maps each product to token _names_ — never colour
values — and `lib/hero/theme.ts` resolves them into `THREE.Color`s for the
scene. That is why the lighting, glow and floor reflection can never drift
away from the DOM.

### Typography

Seven roles — display, headline, title, body, label, micro, navigation — each
with size/leading/tracking/weight tokens and a `.type-*` class. Sizes are fluid
via `clamp()`. Sections use the roles, never ad-hoc text sizes.

**The typeface is not final.** The live site pairs Montserrat with a licensed
display face; until real brand files arrive, one neutral variable sans is wired
to `--font-sans` and `--font-display`. Swapping is a two-file change
(`src/app/fonts.ts`, `src/styles/typography.css`) with no component edits.

### Layers

Stacking is centralised — never write an ad-hoc `z-index`.

| Layer | Token                | Use                  |
| ----- | -------------------- | -------------------- |
| 0     | `--layer-background` | page background      |
| 10    | `--layer-webgl`      | persistent canvas    |
| 20    | `--layer-content`    | page content         |
| 30    | `--layer-header`     | header / navigation  |
| 40    | `--layer-overlay`    | interactive overlays |
| 50    | `--layer-menu`       | menu / modal         |

---

## WebGL architecture

**One canvas for the whole site.** `<Experience />` is mounted in the root
layout, not in a page, so the WebGL context and any loaded models survive
navigation. Sections never create their own canvas — that is what lets a
product travel between scenes instead of being rebuilt per section.

```
<html>
  <body>
    <Experience />           fixed, layer 10, pointer-events: none, aria-hidden
    <div id="site-content">  layer 20
```

- Loaded via `next/dynamic({ ssr: false })`, so three.js stays out of the
  server bundle and there is no hydration mismatch.
- The canvas is `aria-hidden`: everything it expresses also exists as real DOM
  text, so screen readers skip it.
- `pointer-events: none` keeps the DOM fully interactive. Interactive scenes
  re-enable it on their own wrapper.
- Split into `CameraRig` / `Lighting` / `SceneEnvironment` / `ProductStage` /
  `Effects`. Scene logic stays out of HTML components, and no product copy
  appears inside the scene.
- `Effects` mounts an `EffectComposer` only when the device tier allows it
  _and_ effects are passed in. None are enabled yet — product readability
  comes first, and the scene has no pass it needs.
- `CameraRig` dollies by viewport tier and applies pointer parallax as a small
  truck/pedestal move, off on touch and under reduced motion.

### Performance

`lib/three/config.ts` defines a `QUALITY` profile per device tier. Mobile keeps
the full experience at a lower DPR without postprocessing; nothing is disabled
outright. The tier is resolved **once** on mount and never recomputed during
scroll.

---

## GSAP + Lenis

**One scroll loop.** Lenis is created with `autoRaf: false` and stepped from
`gsap.ticker`; ScrollTrigger is updated from the Lenis `scroll` event.
`lagSmoothing(0)` is required, or GSAP frame-drop compensation desynchronises
scrubbed timelines. Never add another `requestAnimationFrame` loop for scroll.

```
gsap.ticker --> lenis.raf() --> scroll event --> ScrollTrigger.update()
```

react-three-fiber runs its own render loop. That is separate by design and does
not drive scroll.

Lenis is held in a small subscribable module store (`lib/animation/lenis.ts`)
and read with `useSyncExternalStore` — it is an external imperative object, so
React subscribes to it rather than owning it in state.

### Responsibilities

| System               | Owns                                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| **GSAP**             | pinned sections, scroll scrub, camera and product transitions, scene colour changes, large typography movement |
| **Motion for React** | menus, buttons, hover states, UI transitions                                                                   |
| **R3F**              | per-frame 3D state, inside refs — never in Zustand                                                             |

Use `gsap.matchMedia()` with the `MOTION` conditions from
`lib/animation/gsap.ts` so responsive behaviour and reduced motion are handled
in one place, and `mm.revert()` cleans both up.

### Reduced motion

Under `prefers-reduced-motion: reduce`, Lenis is never instantiated (native
scroll, anchors jump instantly) and scroll-linked timelines are not created.
Content, navigation and functionality are untouched.

### State

`experience-store` holds discrete state only: `currentScene`, `activeProduct`,
`sceneTheme`, `isLoaded`, `deviceTier`, `prefersReducedMotion`. Scroll
progress, camera position and rotation must **never** go here — writing them
would re-render React every frame.

---

## The hero

### One scalar drives everything

The entire carousel is a single continuous number, `heroStage.position`
(`lib/hero/stage.ts`). Each product derives its own transform from it every
frame via `getStageTransform()`, so position, depth, scale, rotation and
opacity can never drift apart — there are no per-product tweens to fall out of
sync.

Because the value is continuous rather than a set of keyframes, a button
press, a drag, a swipe, a key and a scroll all reduce to "tween this number",
and an interrupted transition simply continues from wherever it is. Dragging
moves the number directly, so the products track the pointer.

Advancing brings the incoming product in from the left, which is what puts
King left and the unannounced product right while Green is centred.

### One transition

`useHeroCarousel().goTo()` is the only way the product changes. It does three
things in one place:

1. commits the product to the store, which flips `[data-scene]`; because the
   `--scene-*` tokens are `@property`-registered colours with a transition,
   the browser interpolates the palette for the whole DOM natively
2. runs `runProductTransition()`, which builds **one** GSAP timeline: the
   stage scalar at position 0, then every registered participant
3. realigns the pinned scroll position so scrolling resumes from the right
   product

Anything that must move with a product change joins that timeline through
`registerTransitionParticipant()` rather than starting its own tween — the
hero uses it for the copy crossfade and the statement's drift. Sharing one
clock is what stops the hero reading as several animations that happen to
fire together.

`--duration-scene` / `--ease-scene` (CSS) and `TRANSITION_DURATION` /
`TRANSITION_EASE` (GSAP) are deliberately the same 1.2s quartic ease-out.
**Change them together.** It is not `expo.out`: that front-loads two thirds
of the movement into the first fifth of the duration and reads as a snap
followed by drift, rather than a glide.

One rule the copy depends on: the product name swaps on a timer, not on the
fade tween's `onComplete`. Animation callbacks need frames, so a throttled
tab would otherwise sit showing the wrong product.

### Scroll

The hero pins for a finite distance — one step of `0.8vh` per product — so the
composition holds still while scroll progress selects a product, then releases
and the page continues. Scroll only _selects_; it calls the same `goTo`, so it
is not a separate animation path and not a scroll trap. Under reduced motion
the hero is never pinned at all.

### Layering

This is what creates the depth, and it is fragile — see the note in
`globals.css`:

```
layer 0   hero background statement   (DOM, below the canvas)
layer 10  products                    (the shared WebGL canvas)
layer 20  copy, controls, indicator   (DOM, above the canvas)
layer 30  header
```

Neither `#site-content` nor `<main>` may create a stacking context, or the
statement cannot sit behind the products. **Every section added later must
set `z-index: var(--layer-content)` itself** (the `.layer-content` class),
otherwise it renders behind the canvas.

### Products are data

`src/data/products.ts` is the whole catalogue. Components receive a `Product`
and render what it holds — there is no per-product branching anywhere, in the
DOM or in the scene. `ProductVisual` picks its renderer from the data:

| the product has | it renders                                   |
| --------------- | -------------------------------------------- |
| `model`         | the GLB, lit by the scene                    |
| `packshot`      | an unlit billboard of the photograph         |
| neither         | the can silhouette, as an obscured dark form |

Pack shots are photographs, so they render **unlit**: scene lights would
double-expose them and shift the packaging colour. The product theme is
carried by the atmosphere around the product instead — the glow behind it and
the reflection beneath it.

Adding a product, or upgrading one from silhouette to real artwork, is a data
change only.

---

## Assets

| Asset           | Status                                                                           |
| --------------- | -------------------------------------------------------------------------------- |
| Logo            | **Real.** The brand's own horizontal lockup.                                     |
| Markhor Green   | **Real.** Isolated from the brand's official 3-can render (532×1425).            |
| Markhor King    | **Missing.** No artwork exists on any Markhor channel — renders as a silhouette. |
| Third product   | Unannounced by design — silhouette.                                              |
| GLB models      | None. The renderer path exists and is unused.                                    |
| HDR environment | None.                                                                            |

Nothing has been fabricated, recoloured or redesigned. `can-silhouette.png` is
the alpha mask of the real can, used only as an unlit form.

---

## Future CMS strategy

Not integrated yet, but the seam exists. Components receive data through props;
pages read through one interface:

```ts
// src/lib/cms/types.ts
interface ContentSource {
  getProducts(): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
  // ...
}
```

Every method is async even though the local implementation is synchronous —
call sites are already written for a network source. Adding
`wordpress-source.ts` against the WP REST or WPGraphQL endpoint and switching
one line in `lib/cms/index.ts` is the entire migration. No component changes.

Today's content lives in typed files under `src/data/`, populated **only** with
content verified on the live site during the Phase 1 audit. Unknown values are
`null`, never invented.

`lib/cms/legacy-routes.ts` maps the current WordPress URLs to the new routes so
existing search equity can be redirected at cut-over.

### SEO

Builds are **noindex by default**. Indexing turns on only when
`NEXT_PUBLIC_SITE_ENV=production`, so the approval preview cannot compete with
the live WordPress site in search. See `.env.example`.

---

## Asset conventions

See `public/README.md`. No brand assets have been added — folders only.
Use `next/image` for DOM imagery; **never** for WebGL textures.
