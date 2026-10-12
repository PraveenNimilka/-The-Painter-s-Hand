# Landing character and layout

The illustration is decorative brand artwork, separate from the actual stroke
engine. The former static character is not cut up or reused.

Two matching components were generated with the built-in image generation tool
and encoded as WebP while preserving alpha:

- `src/assets/atelier/muse-body-v3.webp`: original character's face, torso, sleeve and palette, with continuous cloth painted behind the moving arm.
- `src/assets/atelier/muse-arm-cuff-v4.webp`: continuous ivory sleeve cuff, forearm, hand and brush, independently painted from the original reference and stationary body.

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

Forearm and cuff: Use the original `muse.webp` as the character reference and
`muse-body-v3.webp` as the cloth/skin color reference. Newly paint only the raised
forearm, original gripping hand and slender diagonal brush, plus a generous ivory
linen cuff around the elbow. The cuff must surround the skin anatomically and
overlap the stationary sleeve with soft irregular painted folds. No exposed
rounded elbow nub, straight cut across skin, flat edge, disconnected limb or red
diagonal strip. Forearm rises up-right, matching the original pose. Square
framing, complete cuff and brush with transparent margins. No torso, face,
palette, shawl, background, glow or haze. Generate an independent continuous
component instead of extracting reference pixels.

On phones the title, illustration and actions occupy separate document-flow
rows. Desktop heading, scenic background and centered character placement remain
as before. `muse.svg.template` combines the two generated components without any
straight foreground clip or cut across the elbow. No parts are extracted from
the former static image. The desktop fade is sized to the visible hero container
so it finishes before the portrait is cropped; the phone layout has its own fade.
