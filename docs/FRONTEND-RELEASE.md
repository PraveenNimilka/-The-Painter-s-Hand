# Frontend release — 12 October 2026

## Change impact and rollback

The old `index.html` studio entry is retained as `studio.html`, with identical control IDs, defaults, canvases and `src/ui/app.js` initialization. The new index is the requested exhibition landing page. Direct studio consumers are the browser tests, which now navigate to `studio.html`; assertions remain intact. No compiler, renderer, model, training script or checkpoint changes are authorized for this release.

Normal Vite hosting has three entries: index, studio and research. The landing script references the studio through a deferred import only for the offline file. Standalone packaging reads the single canonical studio document into an initially hidden view and embeds all code/assets; `#studio` initializes the original UI once. Navigation then reuses that instance. Worker URL handling remains the existing tested classic Blob mechanism in the file package. Hosted links use relative paths to preserve subdirectory deployments.

Coupled files: the three HTML entries, scoped presentation styles, landing interaction script, Vite/build packaging configuration, and browser-test entry navigation. The original UI lifecycle is enclosed in an idempotent `mountStudio()` entry because Rollup's single-file build evaluates dynamic-import side effects eagerly. Hosted studio pages still mount automatically; the file mounts on entry and never duplicates listeners. Required checks: production build, original core tests, six Soft hashes, studio worker/fallback integration, all six modes, exports, new frontend tests and direct-file zero-network tests. Model hashes and original painting source are checked against their baseline.

Recoverable baseline: `D:/Projects/.painters-hand-frontend-20261012` contains the original entry, UI, scripts, package and test files, plus original desktop/mobile screenshots. The earlier cleanup baseline and immutable source archive remain available. Risk is primarily routing/offline packaging and visual control layout, covered by direct-browser checks. No algorithm change is intended.

## Build and deployment

Run `npm ci`, then `npm run dev` for local work. `npm run build` writes the hosted application to `dist/`. The landing entry is `index.html`, the working studio is `studio.html`, and the methods page is `research.html`. Assets and links are relative, with no localhost URLs in the shipped application. Vercel is configured to run the build and serve `dist`; no account, server or training job is needed. Deploying or publishing was not performed by this frontend task.

There is no production domain yet. All three pages and the Vercel preview header use `noindex,nofollow`; robots disallows crawling. No canonical URL or sitemap domain is invented. Once the real public HTTPS address is chosen, set `SITE_URL` when building and remove the preview-only `X-Robots-Tag` rule from `vercel.json`. The build then writes correct canonical/OG URLs, sitemap and robots. Open Graph reuses the actual supplied sunset at `public/artwork/evening-light.png`, avoiding a duplicate social-image asset. No ratings, reviews or invented structured-data claims are added.

`npm run standalone` writes `release/The-Painters-Hand.html`. Open that file locally: it starts at the exhibition, `#studio` opens the real studio, and `#research` opens methods. The file includes all weights and therefore remains large; it mounts one studio instance on entry. No HTTP requests are required for images, fonts, inference or the classic Blob worker. The hosted landing defers the large application/model chunk. The font is self-hosted Bodoni Moda under the included SIL OFL licence.

## Scope and limits

Generated landscape/muse assets are decorative. The three gallery works are exact supplied exports, with Dürer colour captions from the supplied concept; their engine/checkpoint/strategy metadata is unknown. Gallery thumbnails are lossless. Full PNGs remain available in the viewer. No animated bitmap painting reveal is used.

The supplied concept contained no existing layered SVG; the release derives a restrained eight-second paper-cut arm pivot from its static muse. The body and cuff remain fixed, with reduced-motion, visibility, offscreen and explicit pause controls. Physical phone testing, public image/subject marketing rights confirmation and real-world throttled performance are still outside this local verification. Existing model quality limitations and failed experimental gates remain unchanged.

## Verification

- All 58 core Node tests pass. All six original Soft study drawing hashes match.
- Existing six-mode Recommended browser checks pass. Defaults remain Studio for five combinations and Academy for Dürer pencil; photograph background remains enabled.
- Original interaction assertions pass: upload, settings cancellation, manual face correction, overlays/comparison, playback/seek/replay/finish/speed, PNG/SVG/JSON downloads, worker fallback and touch emulation.
- Visual runtime checks pass for six modes, thirteen manual tools, cancellation, native export dimensions and exact action replay. Four strategy controls and export attribution pass.
- Production desktop1440×1000, mobile390×844, narrow320×740 and tablet768×1024 checks pass. Images decode, gallery Escape restores focus, missing thumbnails retain the full viewer, routes work and no horizontal overflow or asset/page errors were observed.
- Direct-file tests confirm deferred UI mounting, one retained studio/player through navigation, actual classic Blob worker execution, recorded-mark playback, all gallery assets and zero HTTP requests. The original standalone learned/faithful and six-mode Academy tests also pass.
- All 147 protected model/checkpoint/optimizer/spec assets retain identical SHA-256 hashes. Painting source matches the pre-frontend baseline; only the previously documented cleanup changes remain against the older source archive.

The build's initial landing scripts total about7.1KB, with the52.8MB studio chunk deferred. One unthrottled local Chrome sample measured FCP312ms and1.84MB initial resource transfer; this is a local sample, not a mobile-network prediction or a Lighthouse score. Exact final measurements are in `release/frontend/frontend.json`. Full snapshots and rest/maximum hand positions are included beside it.

Observed packaging failures were corrected, rather than treated as passes: Rollup eager initialization, the nested worker URL expression causing silent fallback, and omitted offline studio styles. The builder now rejects an unconverted module worker constructor. The final file was checked again with actual worker-route assertions.
