# Test8 visual revision

Owner's 14 September feedback supersedes the Test7 bar geometry. Keep the Test7 interaction, camera, identity and QR motion rules.

- A real slate has two jaws. Here both are 32 logical units high, with 80-unit stripe pitch and 40-unit dark width. The fixed lower pattern is the upper pattern reflected around y=32. Closed sticks form chevrons. A seven-unit contact shadow falls onto the fixed jaw.
- Pivot is (14,16), centered in the upper stick. The plate is flush at x=0 and reaches y=64, the bottom of the fixed stick. Lower screws at (11,52) and (33,52). Only the upper jaw rotates. Android and OBS use the same construction.
- Photographic reference inspected: [CineStore Aye Max-Hinge](https://www.cinestore.co.uk/products/aye-max-hinge). Reference informs joint depth and paired-stick proportions; owner-requested opposed chevrons determine the paint pattern.
- Phone slate is a bounded warm charcoal rectangle, inset 10 dp horizontally and 6 dp vertically from the safe area, with a restrained bevel and shadow. Portrait height follows the active controls; landscape fills available safe height. Mascot remains anchored to the phone's bottom edge. The conventional gear has solid teeth and a central bore.
- OBS source is now **872×480**, with board at (100,40), size 772×440. The increased height makes room for both jaws without shrinking QR modules. On a 1920×1080 scene, use position (1040,592), scale 1, for eight-pixel bottom/right clearance. Updating an existing source requires repositioning it; do not silently edit a user's scene.
- Photo paper (56,80,355,292); original-image aperture (65,89,337,246), with exactly shared A/B alignment. Caption repeats the challenge. QR remains 292 square, centered at (594,230), with its four-module quiet zone and five-unit mounting rim. No transport changes.
- Footer has reserved space below both media mounts. Digital date/time begins (236,401), scale .72, then GMT and the wordmark. All text has explicit pixel sizing. Crown remains bottom left. The tail has a broad brush silhouette, a hidden root, an outside-left curl, and a return behind the slate; its front section fits below/left of the paper.
- Keep approved quick OBS entrance/exit timing, 2.7-degree maximum residual bar lift, photo attachment and QR motion freeze. New source height changes travel distance, not duration.
- Audio retains the approved real clapper strike. Test8 uses 120 or approximately 135 BPM (125/111 ms sixteenth notes). The recipe is CLAPPA-RIFF-v2; signed protocol 0.3 remains unchanged. Review samples use the same notes at both tempos for a fair comparison.

Evidence must come from the actual built Compose UI and native OBS source. Preserve previous review evidence separately; don't relabel old screenshots as new build evidence.
