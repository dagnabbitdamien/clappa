# Mascot and motion prototype 21

Current review: `docs/mockups/21-motion/index.html`. This supersedes the rejected hand-drawn v1 and the old fade/rotate OBS entrance as a motion proposal. It does not update the installed APK/plugin or claim new artwork approval.

The new high-resolution master was generated with isolated approved #09 as the sole character reference. The generator returned an opaque checkerboard despite a transparency request. `build.mjs` explicitly removes the exterior neutral background, then exports measured masked layers with real alpha. Hidden torso regions are filled with sampled paper material beneath the moving arms. The full face remains one complete component; the blink is a complete alternative head, not a missing-face mask.

Source artwork and masks are retained. `source/puppet.svg` reassembles the same exported PNG layers; `rig.json` records the shared bind canvas and parent pivots. This is an editable raster-layer source rather than a claim that the generated master is native vector artwork. Generated pin annotations are not used.

## Motion

- OBS entrance: deterministic 240 Hz spring integration, body deceleration coupled into a gravity/damping hinge model, hard contact with a small restitution and body impulse. Maximum opening 34 degrees. No opacity animation on the board.
- Bar contact occurs around 0.754 s; board and bar are fixed before the illustrative QR starts at 1.35 s.
- Phone: three demonstrated strikes at 0.24, 0.53 and 0.95 s, press response and guide rise. Native playback must instead use signed cadence sound scheduling. No new audio is supplied here.
- Guide entrance, ear/blink, two-stroke nose rub, success, quiet error, capture withdrawal and OBS dismissal.
- Body, head, ears and limbs use nested transforms. Nose rubbing solves the two-segment arm reach without changing limb scale.
- Reduced motion resolves to a static state. Playback stops when the page is hidden and is interruptible through scenario controls.

`dist/clips.json` supplies sampled poses at 60 Hz; `docs/mockups/21-motion/motion.js` is the authoritative motion evaluator, including the board model. `dist/atlas.png` is packed without rotation with transparent separation. Packed crop pixels match loose sprite pixels exactly. Native filtering/mipmap extrusion and resource lifetime still need native implementation checks.

## Checks and limits

See `docs/mockups/21-motion/checks.json`: real alpha, exact atlas/loose agreement, reachable hand/nose contact, nonzero board overshoot, bar lift and contact, stationary QR interval. Motion frame sheets and MP4 previews are review outputs. These checks do not certify anatomy, final art approval, QR decoding through a stream, or native performance.

The OBS corner elements are dedicated tail and ear sprites, not duplicate whole-animal crops. `obs-rig.json` and `source/obs-concealed.svg` define the hidden hip, neck, body silhouette and attachment transforms. Only the exported tail and ear sprites appear in the visible corner masks; the concealed torso is a diagnostic silhouette, not unfinished visible artwork. Native rendering still needs its own validation.

## Rebuild in this repository

Use the repository Node runtime and installed sharp/qrcode dependencies:

1. `node assets/mascot-v2/build.mjs`
2. Copy `dist/puppet-data.js` to `docs/mockups/21-motion/puppet-data.js`.
3. `node assets/mascot-v2/prepare-review.mjs`
4. `node assets/mascot-v2/export-review.mjs`

Then encode each generated 30 fps frame directory with ffmpeg for the review MP4s. Source scripts and dimensions are retained so crops, pin diagrams and animations are reproducible from the fixed master.
