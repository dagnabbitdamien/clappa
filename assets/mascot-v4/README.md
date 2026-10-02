# Whole-character sprites — review 22

The owner replaced the articulated-puppet direction with whole-sprite animation. Do not resume cutting heads, ears, arms or paws into animation parts.

Six complete generated poses live in `sprites/`: rest, blink, nose scratch, proud thumbs-up, startled recoil and inviting guide. The original sheet is retained. The build separates only the six whole cells and removes the neutral background; it does not cut anatomy. Every sprite uses the same 313.5-square presentation canvas and a common lower-body bounce anchor.

The character switches drawings at the compressed point, 75 ms into a 310 ms squash/stretch bounce. Exactly one intact sprite is visible. There is no arm solve, component rotation or crossfade between transparent body fragments. The model sheet remains subject to the owner's visual review.

The accepted OBS crown is flattened into one static image. Its placement stays fixed. The broad tail is rendered behind the board at x=-57, y=267, width=115, height=151: the outside curl and lower root remain visible, while the board occludes its inner return. The photo moved 16 units left. QR and logo coordinates, entrance timing and exit timing are preserved.

The phone now shows live LOCAL and GMT clocks in drawn seven-segment digits: `YYYY:MM:DD HH:MM:SS:mmm`. They use the computer clock and continue updating when animation playback is paused. They are illustrative UI clocks, not authenticated NIST/protocol timestamps. The hinge plate has three slotted fixings and a beveled metal face.

Rebuild from repository root with Node:

1. `assets/mascot-v4-build.mjs`
2. `assets/mascot-v4-review.mjs`

Current browser files: `docs/mockups/21-motion/`. The historical URL remains stable; its badge identifies Whole sprites 22. Native APK and OBS plugin binaries have not changed.

Revision 22b: the build now runs mascot-v4-isolate.mjs, identifying six complete connected silhouettes across the entire source sheet instead of assuming uniform grid cells. It cleans neutral edge contamination, preserves small enclosed eye highlights, and exports exactly 512 x 512 with clear padding. isolation.json records measured bounds. Bubble boxes are reserved outside the character canvas; their pointer follows a per-pose muzzle landmark. Capture text uses the button center and centered text anchors. Local/GMT clocks are smaller and more tightly stacked. Tail has separate rear/root occlusion masks and cannot appear below board y=390. Bracket reaches y=0 and x=0; bar and upper screw share pivot (13,14), the center of the 28-unit bar; two lower screws stay at (10,40) and (29,40). Instructions end with exclamation marks. This remains a browser design prototype, not a native APK screenshot.

Tail correction: remove the feathered turn mask. Tail now uses the unchanged bitmap at x=-75, y=263, size 115x151. Draw it behind the board, then repeat only the root in front (x>=0, y>=337), clipped at the board bottom y=390. At this placement the layer split crosses transparent pixels, not the tail; source pixels x>=203, y=207..217 were checked to have zero alpha. The curved middle lies wholly outside the board; the returning tip is occluded by the board's real left edge. Do not restore the earlier fade mask or x=-46 placement.
