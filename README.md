# The Painter’s Hand — research edition 0.6.0

**Banana Hacks:** [Project write-up (under 500 words)](docs/BANANA-HACKS-SUBMISSION.md).

**Studio refinement, 12 October 2026:** the studio now shares the exhibition’s painted scenery, muted teal, parchment controls and antique-gold canvas frame. Decorative motion has explicit pause and reduced-motion support. The gallery contains six actual exports/studies, including pencil, with filters and recorded provenance. See [studio refinement and verification](docs/STUDIO-REDESIGN.md) and [gallery provenance](docs/GALLERY-STUDIES.json).

**Frontend release, 12 October 2026:** the application now opens as a classical exhibition, with a separate working [studio](studio.html) and [research page](research.html). Models, painting algorithms and Recommended defaults remain preserved. Read [build/deployment, verification and limitations](docs/FRONTEND-RELEASE.md). `npm run build` produces the Vercel-ready `dist` folder; `npm run standalone` produces a self-contained landing/studio/research file. Browser checks: `npm run test:frontend` and `npm run test:frontend-offline`.

The frontend source ZIP contains the runnable application, bundled models, build source, browser tests and UI evidence. Historical training corpora, full experiment evidence and training-dependent core fixtures remain in the earlier full source handoff and local repository. Use that handoff for training reproduction and all corpus-dependent tests. The hosted ZIP contains the compiled `dist/` application. Both preserve the selected model; no new training occurred.

**Hierarchical study · experimental** adds a GPU-trained region planner above the learned mark worker, with a persistent high-resolution simulation canvas and calibrated thin-mark opacity. The new corpus contains **2,368 downloaded CC0 CMA images plus two preserved Met drawings**: strict labels are **Dürer 228 / Rembrandt 101 / Leonardo 2**, with 2,039 general exercises. It does not contain thousands of genuine paintings per master.

Three completed candidates add **7,168 episodes / 917,504 mark decisions**. The bundled selected hierarchy retains a **2,560-episode manager** and **110,752-episode worker lineage**; it has seen all 1,917 museum training sources. All 58 core tests pass and selected CUDA/JavaScript math agrees. All 1,464 locked simulator and actual Canvas cases still fail the declared fidelity gate; no complete image matches every pixel. Final calibration worsens mean locked Canvas RGB error by 0.297%, so this is an experimental architecture and bug-fix release, not an accepted quality upgrade. Recommended hand keeps its accepted routes. Reconstruction and authored Artist interpretation are separate tasks; historical creativity and physical materials remain unproven.

Read [hierarchical architecture and full provenance](docs/HIERARCHICAL-RL.md), [historical materials evidence](docs/HIERARCHICAL-ARTIST-EVIDENCE.md), and [the measured research report](training/atelier-hierarchy/report.html). Check with `npm run test:hierarchy`, `npm run test:hierarchy-parity`, `npm run test:hierarchy-canvas`, and `npm run test:hierarchy-standalone`. Photograph background stays enabled by default; Pencil drawing, existing policies and ordered vector exports remain available.

## Preserved research edition 0.5

**Detail study · experimental** is now available under **Refine the study**. This iteration completed **10,240 additional GPU episodes / 2,621,440 decisions**. The bundled actor retains the 8,192-episode refinement, giving a **108,192-episode lineage**; the later 2,048-episode continuation was rejected. Corrected digital sampling and authored detail safeguards accompany actual learned mark selection and bounded geometry. The three colour modes lower focal error by 28–33% on known held-out portrait regressions, but pencil and same-pipeline overall-error tradeoffs prevent promotion. **Recommended hand keeps all accepted 0.4 defaults.** No lossless detail, authentic creativity or physical paint perfection is claimed.

Read [refinement architecture, training, all mode results and limits](docs/DETAIL-REFINEMENT.md), inspect [actual rendered regressions](training/atelier-detail/runs/calibrated-2k/canvas-test-selected/gallery.html), or open [the self-contained offline studio](release/The-Painters-Hand.html). New checks: `npm run test:detail`, `npm run test:detail-parity`, `npm run test:detail-standalone`. Photograph background stays on by default; painting, Pencil drawing, older policies and real path exports remain available.

## Accepted research edition 0.4

Photograph background is **on by default**. Choose **Pencil drawing** or Painting in the minimal limestone/bronze studio. Under **Refine the study → Expressive study**, the new custom GPU-trained policy learns mark selection plus bounded width, length, direction, curvature, opacity and pressure. Its 11,922-parameter actor uses 64 local/context features and three artist heads. Continuous observed contours and distributed form shading finish pencil drawings; digital pigment pairs blend in linear sRGB and remain recorded in drawing JSON.

The completed RTX 4060 run contains **100,000 episodes × 128 actions = 12.8 million training decisions**. It used all **2,279 distinct training sources** from a frozen 2,892-source corpus. The historical corpus contains 16 works; most additional references are mixed NASA photographs, scientific imagery and illustrations. On 192 locked simulator cases, the actual exported policy lowers structured appearance loss by **72.3%** against its initial weights. This is an appearance proxy, not identity, beauty or historical authenticity. Actual Canvas comparisons are mixed. The default Recommended hand uses the new policy for Dürer pencil and preserves Studio for the other five modes; the full Expressive study is selectable for review. Longer training is not assumed to improve art.

Open [release/The-Painters-Hand.html](release/The-Painters-Hand.html) directly in Chrome, or run `npm run dev`. The trained policies are bundled and inference is offline. Read [Academy architecture](docs/ACADEMY-ARCHITECTURE.md), [completed training and comparisons](docs/ACADEMY-TRAINING.md), and [GPU reproduction/resume](training/atelier-gpu/README.md). Checks: `npm test`, `npm run test:academy`, `npm run test:academy-parity`, `npm run test:soft`, `npm run test:standalone`. [Full Canvas galleries](training/atelier-gpu/runs/ppo-100k/canvas-validation/gallery.html) include regressions. PNG exports progress; SVG and drawing JSON export the complete ordered paths. No completed stylized bitmap is revealed behind the pointer.

Artist intent, location proposals, automatic tool kits and finishing contours remain authored. This is a custom neural mark policy with learned bounded geometry, not a universal painter or an exact physical model of historical materials. The original models are preserved, with the previous release/source saved under `training/atelier-gpu/baseline-0.3.1/`.

The isolated continuation completed **120,000 cumulative episodes / 15.36 million decisions**. It lowered Dürer pencil Canvas intent error by 3.9% against the accepted model but worsened focal error by 10.7%. The declared gate rejected it; the release retains the 100,000-episode weights. [Continuation evidence and rendered comparisons](docs/ACADEMY-CONTINUATION.md).

## Preserved research edition 0.3.1

The measurements below describe the earlier frozen run with photograph background removed. They do not establish quality for the current background default or the Academy policy.

A private offline drawing studio with a new four-stage artist planner, a separately trained custom RL mark selector, continuous tapered materials and a minimal limestone/bronze interface. Upload a photograph and choose an interpretation inspired by Leonardo, Dürer or Rembrandt. Real ordered drawing paths produce the artwork and playback.

The **Artist study** engine uses 48 features, 48 hidden units and three artist heads (2,496 learned parameters per policy). The extended experiments completed 15,000 episodes and 2,688,000 new RL decisions with real photographs, artwork exercises and synthetic subjects. Twenty NASA portrait people are split 12 train / 4 validation / 4 test; eight additional Met works expand the whole-artwork corpus. Subject-mask preparation was corrected to match the default app. Its planner changes values, palette, edge hierarchy and ground. Macro planning remains authored; historical authenticity and personal creativity are not established.

Full-render validation selected the extended policy for **Leonardo colour and Dürer colour**, retaining the previous Studio policy for the other modes. On four held-out people × six modes at 5,480 actions, those frozen default choices reduce mean intent loss by **2.1%** and focal error by **0.3%**. The changed colour modes improve intent loss by **12.0% / 14.9%** respectively. These are appearance proxies, not identity, beauty or authentic-style scores. The aligned refinement did not earn a new checkpoint; the retained neural weights came from first-stage episode 5,400. More episodes alone did not improve every mode.

Open `release/The-Painters-Hand.html` directly in Chrome. For development: `npm ci`, `npm run dev`. Read [Studio architecture](docs/STUDIO-ARCHITECTURE.md), [artist research](docs/ARTIST-RESEARCH.md), and [extended training/evidence](docs/EXTENDED-RL.md). Inspect [all held-out rendered comparisons](training/studio/runs/aligned-3000-256/canvas-test/gallery.html), including regressions. Checks: `npm test`, `npm run test:studio`, `npm run test:soft`, `npm run test:standalone`. Local aligned refinement: `npm run train:long`; exact recovery: `npm run train:resume`. These produce an isolated candidate; promotion requires the documented validation and locked-render checks.

The full **Extended RL** policy remains experimental and **Previous Studio** remains selectable under “Refine the study,” alongside original **MVP hand** Fine details/Soft study and **Faithful**. Original weights and all six Soft study drawing hashes remain unchanged. The previous 0.2 documentation below describes those preserved engines.

## Preserved MVP 0.2

A private, offline studio that paints a photograph through real vector marks. A locally trained REINFORCE policy chooses among proposed actions using the current canvas. Three artist-inspired kits, graphite and colour, eleven materials, editable pigments, interpretation/fidelity controls, quiet studio backgrounds, playback and PNG/SVG/JSON export are included. Choose Fine details (new adaptive sampling, 1,200-episode policy) or Soft study (preserved original, 720-episode policy). The inherited faithful ATELIER engine remains selectable.

Open **release/The-Painters-Hand.html** directly in Chrome, or run `npm ci && npm run dev` with Node 22.16+. No server, signup, API key or model download is required for the standalone file. Built-in sample and uploaded photos work offline.

For exact training, scope, evaluation and demo instructions, read **docs/MVP.md**, **docs/TRAINING.md** and **docs/HACKATHON.md**. Source commands: `npm test`, `npm run test:learned`, `npm run test:refactor`, `npm run test:browser`, `npm run standalone`, `npm run test:standalone`. Python dependencies: `python3 -m pip install -r training/requirements.txt`. Reproduce the bundled checkpoint with `python3 training/train.py --episodes 1200 --steps 120 --eval-every 120 --test-seed-start 60011`; reference crops are included.

This is a genuine small RL action selector, not a trained general painting model. High-level composition, palettes, candidate proposals and material approximations are procedural. The studies are experimental and do not establish authentic master-style reproduction.

## Inherited ATELIER 3.0 documentation

The following describes the preserved faithful engine and prior validation. Its old release filenames refer to the earlier project; use The-Painters-Hand.html for this MVP.

Photo-to-pencil and colour drawings built from actual vector paths. The original uploads, three artist choices, playback and PNG/SVG/JSON downloads remain available. No completed stylized bitmap is hidden behind playback.

## Open the app

The release includes `release/ATELIER-3.0.html`. Open it directly in Chrome: all code, styles and the compiler worker are embedded. It works offline, including the original sample portrait. A browser that blocks Blob workers uses the compatibility compiler.

For source development (Node 22.16+):

```sh
npm ci
npm run dev
```

To build a static site: `npm run build`; serve `dist/` with a local static HTTP server. To rebuild the self-contained release: `npm run standalone`.

## Studio controls

Upload or drop a photograph, choose an artist, choose **Graphite** or **Colour**, and adjust detail/shading. Colour fidelity blends our limited artist palette interpretation with the original photograph colours. Background suppression is the default; **Include photograph background** restores the whole image. **Set face region** lets you drag around the face in the source overlay, especially useful for grayscale images, unusual poses, or a missed estimate. **Reset region** restores automatic estimation.

Pause/play, replay, seek with the track or keyboard, change speed, or complete the drawing. **Reference overlay** displays the source photograph explicitly. **Feature guides** display analysis points only. **Before / after** reconstructs the original engine on request; drag its slider to compare. The comparison uses the same photo, fit, detail and artist; the current engine supports the new shading/background controls.

PNG saves the current drawing progress without the pointer or overlays. SVG and JSON save the complete compiled paths, including pressure, colour, material and tool information. JSON now uses `atelier-strokes-v2`; see `docs/ARCHITECTURE.md` for the format.

## What's changed

- `src/vision/`: a shared source transform, multiscale edges with hysteresis, smoothed structure tensors, procedural subject isolation and focal feature estimates.
- `src/strokes/`: connected contour paths, locally oriented and curvature-limited streamlines, tone-dependent layers and three independent artist strategies.
- `src/render/`: tapered pressure, deterministic paper-tooth variation, shared Canvas/SVG primitives, and a pencil tip following the current point along each stroke.
- `src/ui/`: upload lifecycle, settings, source/feature overlays, adjustable face region, comparison and worker cancellation.
- A worker streams real path batches while it compiles later passes. Seek/completion render in bounded chunks so controls stay usable.

Colour painting uses a dense fine-brush foundation, form-following colour modelling and selective observed details. Leonardo adds translucent softened glazes; Dürer adds watercolour-like deposits, fine dry-brush strands and bodycolour details; Rembrandt uses opaque value groups and source-backed textured lights. These are procedural interpretations of specific documented practices, not full reproductions of each artist’s style. See `docs/ARTIST-STUDIES.md` for sources and the exact mapping.

Graphite now adds fine source-value facial deposits, irregular side-of-lead tonal masses and reduces weak skin outlines. Leonardo uses faint observed construction and broad low-opacity form strokes. Dürer uses narrow, firmer engraving and shadow-limited cross-hatching. Rembrandt groups dark forms first, followed by selective contours and dark focal accents.

## Privacy and accuracy

Everything runs locally. No analytics, hosted APIs, remote fonts, model downloads or private weights. Optional **browser FaceDetector** runs only when your browser exposes it. Otherwise skin-color components and local dark features estimate a face and four focal regions. These are heuristic priorities, not reliable anatomical landmarks for every person or pose. They never draw generic eyes or lips: contours and accents come from the photograph.

Background isolation is procedural border-color removal plus a portrait envelope. Complex backgrounds may leave fragments or omit parts of a subject. Include the background or correct the region when needed. Realistic graphite remains a stylized path simulation, not a claim of photorealistic likeness.

## Verify

```sh
npm test
npm run test:refactor
npm run test:browser
npm run standalone
node tests/standalone.cjs
```

Browser tests use installed Playwright Chrome, `ATELIER_CHROME`, or the packaged Linux test browser. For normal desktop setup, `npx playwright install chromium` installs Playwright's browser. Tests serve their own local HTTP origin and reject external requests in the offline case. The preserved refactor snapshot verifies exact equality with the original path output in all three modes.

See `docs/VALIDATION.md`, `tests/results/benchmark.json`, `tests/results/quality.json`, and `tests/results/playback.json`. `docs/COMPARISON.html` contains the before/after gallery. The five fixtures cover white, silhouette, photograph, reduced contrast, and background clutter. Physical Android testing and a diverse portrait panel remain necessary before broad quality claims.
