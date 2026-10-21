# Test14.1 — clearer menus and everyday challenges

2026-10-01. Install the APK and OBS plugin together: new challenges use the versioned CLAPPA-CHOICES-v2 mapping. Existing v1 evidence remains verifiable. No changes to the approved streamer board, mascot sprites, cadence, capture deadline or QR geometry.

## Changes

- Two-camera capture defaults on where concurrent front/rear capture with rear illumination is supported. An explicit saved preference is respected. Unsupported phones retain single-camera capture.
- New challenges avoid requiring objects, a particular room or a view of the recording camera. The new pool has eleven selfie actions and six simple directional rear-camera prompts. The normal two-camera selfie prompt is “Show yourself and your setup!”; the other actions use the same wording on phone and OBS.
- Streamer and Viewer have native illustrated icons, charcoal cards and one orange accent. The italic tagline is “No cap! Clap!”. Landscape puts the mode cards side by side.
- Viewer shows a human-readable beacon age, the challenge and clapper playback. Public-key and timing details are expandable. The age is descriptive, with no arbitrary 90-second verdict. Account verification still fails closed.

## Validation

- 83 JavaScript tests pass, including historical proofs and v2 mapping rejection.
- Android unit checks include 300 cross-language v2 choice vectors and relative-time boundaries.
- Native OBS validates both v1 and v2 real-beacon fixtures and rejects altered signatures.
- Native Android decoded all eight QR frames of a v2 nose-cover challenge and rejected three malformed/altered proofs.
- Actual native portrait and landscape menu screenshots are included in the review. The existing four-image capture pipeline is unchanged; hardware dual capture was not repeated for this revision. Live Twitch authorization remains unverified.

## Compatibility

Use the updated plugin and verifier with the new APK. Earlier versions deliberately reject unknown mappings. Old proof files are neither rewritten nor reinterpreted. The cryptographic seed includes the signed mapping, so the choice pool cannot be switched after commitment.
