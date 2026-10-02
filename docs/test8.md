# Test8 — paired clapper sticks and slate layout

## Install

1. Install `CLAPPA-0.3.0-test8.apk` over the existing app, retaining its data and signing identity.
2. Close OBS, run **Install OBS plugin.cmd**, and reopen OBS. No companion program is required.
3. **Reposition the existing CLAPPA proof source.** It is now 872×480, fifty pixels taller. Keep scale 1 on a 1920×1080 canvas. In Transform → Edit Transform, use a top-left alignment, position X=1040 / Y=592 and no bounding-box scaling for eight-pixel clearance at the right/bottom. On another canvas, position it wholly inside the lower-right corner without shrinking it.
4. Open **Docks → CLAPPA**, scan the current pairing code if prompted, then use the phone's **Start recording → Tap to clap! → Capture** flow.
5. Finish with **End session → final challenge → Stop & seal → Sign final seal**. Run **Verify latest recording.cmd** from the kit.

## What changed

- Both native targets now have two chunky 32-unit sticks. Opposed diagonal stripes meet as chevrons; the lower stick stays fixed under a contact shadow. The three-screw plate reaches the lower stick's base, with its pivot centered in the upper stick.
- The phone controls sit on a slightly raised rectangular charcoal slate inside Android's safe area. The settings control now uses a conventional solid gear. Enlarged-text landscape spacing leaves a gap between controls and the guide bubble.
- The OBS board is taller to retain full QR module size while making room for both sticks and a separate footer. Date, time, GMT and branding no longer share the media mounts' space. Photo A/B retain exactly aligned apertures. The brush-tail silhouette is broader, with an outside-left curl and hidden root.
- The approved real clapper strike now uses 120 or approximately 135 BPM; the preview compares the same notes at both speeds. Cadence remains signed under protocol 0.3. See `docs/cadence-v2.md`.
- Testing exposed an intermittent TLS failure. The bundled TLS build has no threading abstraction, so the native service now confines TLS processing to one worker and closes each HTTP response to prevent idle connections monopolizing it. Certificate pinning, TLS 1.3 and authentication remain enforced. No failed request is silently retried or re-signed.

## Review and verification

`docs/review8/index.html` shows actual native Android and OBS captures, motion recordings and compiled Android audio samples. The separate review APK uses the same production Compose component; the delivered APK excludes the review activities. Test results and limits are linked from that page.

- Ten Android unit tests passed; twelve native state/orientation captures and nine enlarged-text/cutout/navigation captures were inspected.
- The final app completed capture, transfer and final seal: EXACT ORIGINAL VERIFIED, with 1182/1208 ms selfie-pair gaps.
- The final OBS plugin independently sealed two successive recordings with the same pairing. Every QR frame decoded with identical boundaries; flash crossfade and motion-freeze checks passed.
- Forty-eight TLS 1.3 requests from six simultaneous clients passed certificate-pin and authentication checks.
- Local re-encodes recovered both eleven-chunk photo events at 1080p, 720p, 480p and 720p plus 0.6-sigma blur. 360p failed.

The retained Test7 functionality includes saved pairing, remote recording start, two-photo camera capture, exact proof hashes, signing identity import, the fixed QR grid, Photo B fading to A, and QR freezes during entrance/exit. Test7's broader recovery and negative-signature evidence remains available in `docs/test7.md`; it is not relabeled as a new Test8 test.

## Limits

Emulator camera tests validate sequencing and transfer, not physical RGB light reflected from a face or real rear LED illumination. The digital timestamp is Photo A's signed save-completion timestamp, not a sensor exposure timestamp. Local video re-encoding is not a Twitch/YouTube certification. All QR chunks are required; transport uses repeated chunks, not fountain coding. Independent packet-archive matching against the muxed recording remains unfinished. Windows OBS and Android are the packaged targets.

No cap! Clap!!
