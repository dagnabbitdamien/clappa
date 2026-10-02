# CLAPPA test5 — native design build

Install `output/test-kit-v5/CLAPPA-0.3.0-test5.apk` over test4, preserving app data and the signing key. Close OBS and run the kit's **Install OBS plugin.cmd**. The plugin is native and needs no companion app.

The native Android screen now uses the reviewed complete possum sprites with squash/stretch pose changes, a hinged clapper bar, compact local/GMT digital clocks, separate challenge bubble and Capture button, and minimal camera branding. Both portrait and landscape are enabled. Pairing, two-photo capture, signed cadence, claim window and final sealing remain the existing protocol 0.3 flow.

The native OBS source now uses the reviewed charcoal board proportions, Photo A on the left, fixed QR mount and logo on the right, crown and layered tail assets, a three-screw hinge, quick rising entrance and falling exit. Photo and QR remain attached throughout. The bottom GMT readout displays the signed Photo A `a_at` timestamp, or `captured_at` for an optional claim, as `YYYY:MM:DD HH:MM:SS:mmm`. It is fixed to the photo, not the clock during playback. These fields currently record CameraX's file-save callback time; they are not sensor exposure timestamps or independent time attestations.

## Quick test

1. Install both updates. Do not uninstall the phone app or clear its data.
2. Open OBS, then **Docks → CLAPPA → Pair / reconnect phone**, and scan in the phone's settings.
3. Keep the existing proof source. Its native canvas is now 872 × 430 with transparent room for the tail and hinge, so check its scene size and bottom-right position.
4. Start recording. Tap to clap, follow the challenge and capture. Check both phone orientations, the guide/button separation, Photo A, QR and fixed digital timestamp on the OBS board.
5. Use **End session**, capture the closing challenge, **Stop & seal**, then approve the seal. Run **Verify latest recording.cmd**.

## Validation and limits

Android assembly and all three Android unit tests pass. All 23 protocol/verifier tests pass. The native plugin compiles with embedded mascot assets. An isolated OBS instance recorded simulated signed phone events, rendered the new board, and completed a final seal accepted by the independent verifier. This is a simulated-phone integration test, not a physical S22 Ultra camera test.

The browser motion page remains a design prototype; these native implementations are separate and should not be assumed pixel-identical. The OBS photo currently follows the board rigidly rather than having the prototype's additional tape flex. Native phone visual review on the S22 Ultra remains necessary. No new claim of Twitch/YouTube transcode robustness is made by these builds. QR payload format and frame cadence are unchanged.

A QR frame decoded directly from the final native OBS source screenshot. The test5 APK signature matches test4 (certificate SHA-256 1586a024c4444989ee156d90f96ce4bb360b1f0df7de27bd9e6ee93cd3bb2417).
