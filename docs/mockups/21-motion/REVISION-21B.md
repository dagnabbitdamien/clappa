# Motion revision 21b

This updates the browser review, not installed Android or OBS binaries.

- OBS photo and QR are mounted from the first frame through the last exit frame. The photo flexes by at most half a degree around its tape attachment.
- Entrance travels from below the stream, settles by 420 ms, and lifts the clapper bar at most 1.4 degrees. Exit clears the frame in 240 ms.
- QR frames stay mounted, preload before playback, and change opacity without removing image nodes. Mounting hardware stays outside the QR image and quiet zone.
- Three-screw hinge plate replaces the single pivot decoration. Phone bar motion is clipped by the physical screen boundary. One visual clap is independent of the sound cadence.
- Phone guide is clipped at the actual bottom screen edge. The interior mascot ledge is removed. The status divider stops before the mascot.
- Ear silhouettes exclude cheek fragments; the head has backing behind the ear roots. Blinks cover only the eye regions while the head remains mounted.
- Forelimb pieces use independent rounded silhouettes rather than body-image crops. The elbow uses the forward reach branch. Success adds an alternate paw silhouette.
- Camera preview fills the phone with a small CLAPPA mark, narrow top trim, and shutter. It is a demonstration image, not camera access.

Validation: `revision-checks.json` samples the entry/exit visibility and angle bounds at 240 Hz. `revision-contact.png` shows rendered entry, settled proof, rub, success, blink and capture poses. Browser checks cover the live layout and portrait edge placement. These checks do not establish aesthetic approval, stream QR recoverability, or native performance.

The original #09 remains the visual reference. The repaired artwork is still a reconstruction, not newly approved artwork. Earlier videos, atlas and motion-pack downloads predate this revision and are removed from the review's links; do not use them as current assets. Current loose sprites, `puppet-data.js`, and sampled `dist/clips.json` contain the repairs. Run `build.mjs` then `repair-parts.mjs` to reproduce the current loose sprites.
