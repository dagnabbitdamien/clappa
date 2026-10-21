# Test4: camera-aware flash, musical cadence, pairing recovery, visible proof tile

Update both the APK (`0.3.0-test4`) and native OBS plugin from `output/test-kit-v4`. The APK uses the same signing certificate and preserves the existing phone key. Do not uninstall the app. Protocol 0.3 explicitly signs camera choice and illumination; older protocol 0.2 bundles need their previous verifier and are not silently interpreted as 0.3.

## Changes

- Shutdown hotfix (13 September 2026): guarded Qt dock pointers replace raw pointers, and cleanup runs at the OBS exit event before frontend teardown. The reported `Crash 2026-09-13 11-52-59.txt` showed Qt access through CLAPPA during module unload, consistent with the dock-owned timer already being destroyed. Rebuilt DLL is included in the test4 folder; rerun its plugin installer. The APK is unchanged. A normal main-window exit was verified in isolated portable OBS 32.2.1 with the tile source loaded: shutdown completed through context destruction and the process exited. The reported installation uses OBS 32.2.2 and still needs the user's retry.
- The dock keeps its QR visible and adds **Pair / reconnect phone**. After stopping any recording/stream, this starts a fresh pairing without restarting OBS. It rotates the connection token and certificate, clears only runtime session state, and retains all existing proof files. The phone resets its runtime session when explicitly pairing again. Closing the dock only hides it.
- Ordinary random challenges use the rear camera: Photo A with flash forced off, Photo B with the camera's white LED flash forced on. A rear flash unit is required; camera setup fails closed if unavailable.
- A randomly selected **Take a selfie** challenge uses the front camera: Photo A normally, Photo B while the screen displays random red, green or blue at full brightness. Optional claim photos use the rear camera without flash.
- Signed `camera` and `flash` fields must agree with the prompt. Rear LED capture allows at most 3000 ms between reported photo-save timestamps; front RGB keeps the existing 1500 ms bound. These are software acceptance limits, not independent exposure measurements.
- Clacks follow one 4/4 bar on an eighth-note grid, at randomly selected 100, 120 or 150 BPM. Beats 1 and 3 anchor the phrase, at least one backbeat is present, offbeats may be selected, three-hit rolls are excluded, and the phrase ends with a rest. Pattern and tempo cannot immediately repeat. The OS CSPRNG selects from valid choices; both the bits and slot duration are signed. No password/time-derived cadence is claimed.
- The blank tile was caused by nesting an effect loop inside the render callback supplied by OBS. The source now binds its texture to the supplied effect and draws once. QR modules are larger, and the label is readable against the Polaroid border.

## Verified

Actual OBS source pixels and a frame extracted from its recording show the tile. Automated recovery decoded both signed challenge events and all four compact photos from the recorded QR sequence. The independent verifier returned **EXACT ORIGINAL VERIFIED**. Protocol tests reject incompatible camera/flash/prompt combinations; Android tests check cadence rules and the flash-frame wait. Physical S22 Ultra LED/front-camera flash behaviour still requires device testing.

QR proof is signed public data, not encrypted data. The phone-to-OBS connection is encrypted. The full packet-archive-to-container matching limitation described in native-pairing.md still applies.

## Quick retry

1. Stop recording and close OBS once to install the new plugin. Install the new APK over the existing app.
2. Open OBS, scan its QR, and start a fresh recording. Keep your existing CLAPPA proof tile source.
3. Complete a challenge: expect rear flash for ordinary prompts, screen colour for a selfie. Watch for the photo/QR tile.
4. After a failure, stop recording, click **Pair / reconnect phone** in the dock and scan the new QR. No OBS restart is needed for subsequent pairing recovery.
