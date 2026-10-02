# Test7 — native app flow and OBS proof review

## Install

1. Install `output/test-kit-v7/CLAPPA-0.3.0-test7.apk` over the existing app. Keep its data and signing identity.
2. Close OBS, run **Install OBS plugin.cmd** from that folder, and reopen OBS. No companion is needed. The installer backs up the old DLL and retains the local-subnet pairing firewall rule.
3. Open **Docks → CLAPPA**. Pair once using the phone's **Pair with OBS** button. A new OBS process has a new pairing certificate; scan its current code if requested. Closing the dock only hides the controls; it does not remove your scene's proof source.
4. On the phone, **Start recording** now starts the actual OBS recording. Then **Tap to clap! → Capture → shutter**. The recording must be active and have a fresh media checkpoint before clapping is enabled.
5. Finish with **End session → final challenge → Stop & seal → Sign final seal**. Pairing stays connected afterward; **Start another recording** begins a new independent session.
6. Run **Verify latest recording.cmd** from the kit. The kit includes its verifier; this helper uses installed Node or the existing Codex Node runtime. It is not an extra app needed while recording.

Manual plugin destination, if OBS is installed elsewhere: its `obs-plugins/64bit/clappa.dll`. Keep the source at its default 872×430 size on a 1920×1080 canvas for the measured QR profile; shrinking it changes the recovery conditions.

## What changed

- One primary action per state; one Settings gear; a passive green connection dot. Connection management and signing identity are separate settings sections. Restart/reconnect and an interrupted recording have explicit recovery actions.
- Native Compose layouts respect status bars, cutouts and navigation bars in both orientations. Charcoal gutters match the board. Clocks have their own ruled band. The mascot is hidden when idle and rises from the bottom for prompts, with a speech pointer anchored to its muzzle. Capture stays above the animal. Whole poses use a short compression/bounce; errors use concise speech plus separate readable detail.
- Android and OBS share the three-screw bracket shape and production-sans wordmark. The phone clap includes a snap, impact jolt and settle. Camera has the wordmark, stripe, back arrow and a conventional circular shutter.
- A real CC0 clapperboard strike replaces the beep. Six or seven sample-timed hits follow a four-beat phrase with a bounded pentatonic contour. The recipe is reproducible from signed identity/session/challenge/time inputs; see `docs/cadence-v1.md`. A short phrase can repeat.
- The OBS caption repeats the phone's prompt. Its GMT timestamp is more legible and fixed to Photo A's signed save-completion time. Photo B is attached from entry and fades over A for both camera types; the original photographs are used for display. The compact signed derivatives are separate QR evidence. The complete photo fits the aperture, with charcoal letterboxing where needed.
- The QR uses a fixed version-12 grid, medium error correction, four-module quiet zone and 240 ms holds. It starts advancing only after 500 ms settling and freezes 100 ms before the 240 ms exit. Transport v2 removes repeated verbose envelope text; both compact photos and the signed capture event remain in the payload. Decoder still accepts v1.
- The tail has an explicit continuous silhouette and opaque paper texture; board occlusion supplies the depth instead of white-matte PNG edges or rectangular erasure.

## Identity

Phone **Settings → Import identity (.p12)** accepts a password-protected P-256 PKCS#12 file. Retain the source file as your portable backup. Default generated keys remain supported but cannot be exported by this feature. OBS can restrict pairing to a public fingerprint or `public-key.json`; never import a private key into OBS. There is no account login. See `docs/portable-identity.md` for supported formats and boundaries.

## Recorded evidence

The review page at `docs/review7/index.html` contains actual native Android screenshots, actual OBS recording excerpts, audio rendered by the Android engine, before/after comparison and machine-readable test results. Layout fixtures use the production Compose component in a separate, unshipped review APK. The real MainActivity camera/transfer/signing flow is tested separately.

- Ten Android JVM tests and 26 protocol/verifier tests passed.
- Twelve native state/orientation captures, plus nine captures at 130% text with three-button navigation and a simulated cutout across portrait and both landscape directions.
- Real MainActivity on an Android 15 emulator completed two selfie photo pairs, transfer, final seal and exact recording verification. Measured save-completion gaps were 1206 and 1190 ms, within the unchanged 1500 ms front-camera limit.
- Native OBS integration independently sealed two recordings using the same pairing. Wrong public identity and a tampered signature were rejected. Timing tests passed for QR motion freezes and the B→A crossfade.
- Restarting the Android app during recording produced an explicit incomplete state; reconnect used saved pairing and the phone successfully stopped that incomplete recording. It did not produce a false seal.
- Local x264 probes of the actual emulator-photo recording recovered both full QR events (11 and 12 chunks) at 1080p, 720p and 480p, and at 720p with a 0.6-sigma blur. **360p failed.** The older v1 profile failed at 720p in the equivalent fixture probe. Details: `docs/review7/qr-camera-results.json` and `qr-fixture-results.json`.

## Boundaries of this evidence

These are emulator and isolated native OBS tests; the emulator does not simulate physical screen light reflected from a face or a real rear LED illuminating a room. CameraX's actual ScreenFlash lifecycle now keeps RGB illumination active through Photo B; the app rejects an unprepared or late flash. Automatic camera processing and ambient light can affect how strongly the colour appears. No artificial tint is added to a photograph.

The snapshot timestamp records the photo-save callback, not a sensor exposure timestamp. Local x264 tests are not a Twitch/YouTube platform round trip or a universal readability guarantee. All QR chunks are needed; there is no fountain coding. Larger payloads lengthen the stationary display to provide repeated cycles. QR recovery authenticates the capture event and compact images, not the complete recording by itself.

The final exact-file seal and packet-chain archives verify, but independent extraction/matching of archived packets against the muxed recording remains unfinished. No claim of mathematically proving physical reality is made. Windows OBS and Android are the tested targets; macOS/Linux builds are not included.
