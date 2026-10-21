# Mascot library v3 — review 21c

Reference: `docs/mockups/approved-09-isolated.png`. Artwork remains subject to owner review.

This library uses two newly generated assets: a three-pose reference and an explicitly exploded parts sheet. The parts sheet contains complete independent torso, head, ears, three bent-arm poses, relaxed other arm, seated brush tail and hooked brush tail. No parts are extracted from the assembled pose reference. No body-texture samples are pasted into arms.

`build.mjs` removes the border-connected neutral checker background and separates the already-isolated pieces. It records each source rectangle and destination bounds. `rig.json` records parent and pivot coordinates. `source/puppet.svg` is the assembled layered SVG, containing embedded raster paper art and explicit overlap masks; it is not a wholly vector-painted illustration. `dist/atlas.png` and `atlas.json` contain the current separate pieces. Pins appear only in the review diagram, never the atlas.

Nose-touch and thumbs-up use the naturally bent arm. They blend between authored whole-arm drawings with restrained lift/squash. They do not use the rejected long-arm inverse-kinematic solver. This avoids a wrist flipping across a rotation boundary; it is not a claim of continuous skeletal deformation between poses.

Build from the repository root:

1. Run `assets/mascot-v3/build.mjs` with Node.
2. Run `assets/mascot-v3/export-review.mjs` with Node.

Current motion evaluator and browser renderer are in `docs/mockups/21-motion/`. Current sampled clips are `dist/clips.json`. Native APK and OBS plugin are unchanged by this design review.

## Current composition

- OBS: crown/ears at lower left; broad hooked brush tail hugs the left edge; CLAPPA at lower right. This supersedes the earlier opposite-corner instruction.
- Photo and full QR square remain attached during entry/exit. QR mount moves 25 units right and 9 down. Photo moves 38 right and 9 down to make space for the left tail.
- Bar entrance lift: 2.7°. Exit: unchanged 240 ms.
- Phone: bubble and Capture slide/fade over 200 ms. Mascot remains clipped to the actual bottom screen edge.
- Error: red exclamation and surprised blink. Success: chest-level thumbs-up plus existing nod.

The QR frames and camera photo remain illustrative. This review does not test stream transcoding or cryptographic recovery.
