# Asset conventions

Folders only — no brand assets have been added. Nothing here was fabricated,
downloaded or generated; the real files come from the brand team.

```
brand/logo/          Markhor wordmark and lockups (SVG preferred, PNG fallback)
brand/symbols/       Markhor head mark, icons
products/green/      Markhor Green — images/ (packshots) and textures/ (can art)
products/king/       Markhor King  — images/ and textures/
models/              GLB product models
environment/         HDR / EXR environment maps
textures/            Shared, non-product textures
videos/              Background and story video
fonts/               Licensed brand font files (see src/app/fonts.ts)
og/                  Open Graph share images
```

## Rules

- **Models** ship as `.glb`, Meshopt-compressed. Draco only if Meshopt is not
  enough; KTX2 for textures once the models carry real can artwork.
- **Images** for the DOM go through `next/image` (AVIF/WebP are configured in
  `next.config.ts`). Images used as **WebGL textures must not** — load those
  with three's loaders, since `next/image` rewrites URLs and adds DOM markup.
- **Environment maps** are compressed `.hdr`; keep them under ~2 MB.
- **Video** is lazy: never autoplay a large file before it is in view.
- Name files by what they are, lowercase and hyphenated: `markhor-green-can.glb`,
  not `Asset-5@2x.webp`.
