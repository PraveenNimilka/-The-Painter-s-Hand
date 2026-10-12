# Codex engineering instructions — ATELIER

You are improving a real stroke-based portrait rendering engine. Do not replace it with an image-filter reveal or fake playback of a pre-generated bitmap. Actual drawing commands are the primary output.

## Mission
Produce convincing likeness, natural graphite strokes and deliberate artist-specific mark-making for Leonardo, Dürer and Rembrandt modes, on mobile and desktop.

## Immediate priorities
1. Separate the single HTML source into `src/vision/`, `src/strokes/`, `src/render/`, and `src/ui/` without regressions.
2. Add subject isolation and face landmarks. Prefer optional local browser inference, with a robust algorithm-only fallback. Don't ship private model weights or add undocumented hosted API calls.
3. Replace broad crisscross hatching with region-aware shading, locally oriented strokes, and light-tone preservation. Make backgrounds optional.
4. Contours: use multiscale edges, thresholding, smoothing and path chaining. Preserve eye, nose, lips and silhouette details.
5. Renderer: incremental pencil-tip-following playback, pressure variation, opacity buildup, pause/seek/replay, speed, SVG/PNG/JSON export.
6. Distinct modes: Leonardo soft tonal construction, Dürer engraved structure/hatching, Rembrandt decisive chiaroscuro.
7. Add benchmark cases and verify portrait likeness, blank-background behavior and interactive frame rate, on Chrome desktop and Android.

## Acceptance criteria
- All marks are generated from photograph features or semantic understanding, not a traced copy of a hidden final stylized raster.
- No blanket diagonal lattice across bright faces/backgrounds.
- Users can upload photos and export actual path data.
- Styles yield visible, measurable differences in stroke shape, direction, opacity and ordering.
- App works offline with baseline processing and is responsive on a phone.
- Describe honestly which features are procedural and which use pretrained ML.
- Follow incremental, testable commits; do not claim photorealistic quality without comparison images.
