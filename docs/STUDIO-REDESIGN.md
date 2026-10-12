# Studio and gallery refinement — 12 October 2026

The new request extends the frontend design. A recoverable source/style snapshot is at `D:/Projects/.painters-hand-studio-redesign-20261012`. Existing frontend archives and screenshots remain immutable.

The studio retains its canonical HTML controls, IDs, default settings, player and export surfaces. The presentation now follows the landing exhibition: painted prologue, gold live typography, muted teal workspace, parchment tools and antique-gold framing. The decoration remains outside the paper/canvas layers, so it cannot enter artwork exports.

`src/ui/studio-release.css` is the canonical scoped theme. `studio-presence.js` adds only decorative scenery, explicit pause/reduced-motion/visibility/offscreen controls, and an indicator tied to actual compilation status. It is mounted once by the existing guarded studio initializer. It does not alter images, strokes, geometry, budgets, RNG, workers, policy weights or model inference.

Impact: studio HTML/CSS and UI mount; new gallery assets/captions and gallery interaction; production/offline packaging. Verify original core tests, Recommended routes, controls/playback/export interactions, gallery image/dialog behavior, actual offline worker and mobile overflow. The native app source still works through the project's static browser harness; no Vite-only imports are added to the studio behavior.

Gallery additions must be actual saved tool renders with source rights and exact engine/strategy provenance, recorded in `GALLERY-STUDIES.json`. Decorative generated illustrations remain separate from tool evidence. No new training is authorized or performed.

## Delivered gallery

Six works are available with All studies / Colour / Pencil filters, framed depth on desktop and native swipe scrolling on mobile. Escape closes the full-image viewer and restores focus. The three additional images are untouched saved Canvas outputs: Leonardo colour and Dürer graphite studies of Rembrandt's *Shah Jahan* (5,480 accepted marks each), and a deliberately labelled coarse Rembrandt-mode study of Corot's *Willows and Farmhouse* (1,024 marks). All three used best-of-sixteen material trials, not neural policy inference. The source reproductions are Cleveland Museum of Art CC0 assets. Artist modes and the artists of the reference artworks are distinguished in the viewer and manifest. The original three creator-supplied exports retain their unknown strategy attribution.

## Verification and evidence

`release/studio-redesign/` contains before/after desktop and mobile screenshots, both gallery layouts, production/offline browser reports, runtime evidence and protected-asset checks. Visual review identified inherited light text on the parchment panel; explicit panel text colour corrected it. Both key upload/interpretation labels now pass the targeted 4.5:1 contrast assertions.

- `npm test`: all 58 core tests passed.
- `npm run test:soft`: all six original drawing instruction hashes match.
- `npm run test:recommended`: all six accepted routes and metadata passed.
- Existing `tests/interactions.cjs` assertions passed with evidence redirected outside historical reports: upload/cancellation, guides/face correction, playback/seek/replay/speed, downloads, fallback and touch emulation.
- `npm run test:frontend` and `npm run test:frontend-offline`: all six thumbnails/full original images, filters, focus restoration, desktop/mobile/narrow/tablet layouts, atmosphere pause/offscreen/reduced-motion behavior passed. The direct-file edition generated 64 recorded marks through the real Blob worker, retained one studio/player and made zero HTTP requests.
- `tests/visual-runtime.cjs`: six visual routes, thirteen manual tools, cancellation, 3840×2160 PNG dimensions and exact recorded-action replay passed. This remains a capability check, not proof of detailed learned 4K paintings.
- `tests/visual-strategy-ui.cjs` and controlled main-thread `tests/visual-integration.cjs`: four strategy controls, accurate attribution, upload replacement and restoration to Recommended passed.
- All 147 protected model/checkpoint/optimizer/spec assets match their saved SHA-256 values. The application initializer changes only by importing and mounting the decorative presence behavior.
- Production and standalone builds passed. The existing large model bundle warning remains; the hosted landing does not fetch the policy bundle.

Performance figures in `frontend.json` are a single local, unthrottled Chrome sample, not a public-site score. The gallery adds 383 KB of lossless thumbnails; lazy loading keeps them outside the initial hero priority. Physical phones and public deployment are untested. Existing model quality limitations remain unchanged; no training, promotion or algorithm change was performed.

## Build and recover

Run `npm run dev` to inspect `/studio.html` and the gallery. `npm run build` prepares the Vercel-ready `dist/`; `npm run standalone` writes `release/The-Painters-Hand.html`. The three new full PNGs are embedded in the offline viewer through the existing packager, including their nested `studies/` asset paths. No domain is configured, so previews retain noindex and no invented canonical/sitemap.

New hosted/source archives use the `studio-redesign-20261012` suffix and preserve the earlier archives. Reproduce packaging with `python scripts/package-frontend.py --tag studio-redesign-20261012` after verification; the packager refuses to replace existing archives. Restore the source/style snapshot above to recover the previous frontend, or use the immutable previous frontend source ZIP. Training evidence and checkpoints are preserved throughout.
