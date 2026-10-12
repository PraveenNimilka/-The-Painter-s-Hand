# Landing character and layout

The illustration is decorative brand artwork, separate from the actual stroke
engine. The former static character is not cut up or reused.

Two matching components were generated with the built-in image generation tool
and encoded as WebP while preserving alpha:

- `src/assets/atelier/muse-body-v3.webp`: original character's face, torso, sleeve and palette, with continuous cloth painted behind the moving arm.
- `src/assets/atelier/muse-arm-v3.webp`: matching forearm, hand and brush, independently painted from the original reference.

CSS articulates the forearm from the original sleeve on a 6.5-second loop. The torso
stays stationary. Motion automatically suspends offscreen or in a hidden tab and
respects the system's reduced-motion preference. No landing play/pause buttons.

## Prompt set

Body: Use `muse.webp` as the identity-preserving edit target. Preserve the exact
original face, hair, expression, head tilt, clothing, palette, pose and scale.
Keep a registered 1024 × 1536 canvas. Omit only the raised bare painting forearm,
hand and brush, and repaint the ivory/red cloth behind them as a continuous body
layer. Keep the sleeve/cuff overlap at the original elbow (434, 916). Transparent
background, no new person, repositioning or changed outfit.

Forearm: Independently paint only a forearm, hand and held brush matching
`muse.webp` in skin, lighting, pose, scale and classical oil brushwork. Register
to the same 1024 × 1536 canvas: elbow (434, 916), wrist approximately (580, 754),
hand (690, 680), brush from (466, 784) to (855, 535). Preserve negative space
elsewhere; no torso, sleeve, head, palette or scenery. Generate this independent
component rather than cutting original image pixels.

On phones the title, illustration and actions occupy separate document-flow
rows. Desktop heading, scenic background and centered character placement remain
as before. `muse.svg.template` combines the two generated components; a small
foreground overlap of the newly painted sleeve hides the arm's rounded rig root.
No parts are extracted from the former static image. A CSS fade affects only the
decorative lower dress.
