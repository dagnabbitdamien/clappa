# Owner review — 13 September 2026

## Scope and selection

Produce only two initial proposal grids: three app/OBS directions and a typography/material grid. Owner selects before full mockups, production puppet assets or animation implementation. Preserve approved mascot #9 in `mockups/09-brushtail-character-sheet.png`. These grids are illustrative, not APK screenshots or functional QR codes.

## Presentation requirements

- Read original-resolution Photo A for the human-facing print, rendered at the actual useful output resolution. Do not substitute the tiny byte-exact proof derivative carried by QR. Maximize photo space, slim down the unused striped header and center the composition.
- Optionally show original Photo B for about 300 ms, then original normal Photo A for the overwhelming majority of the display. This is presentation only; both remain separately signed and transported. Check physical-device A/B ordering and whether camera preflash influences A before claiming the owner's flash-image report is resolved.
- QR outer box, module grid, quiet zone and location must remain constant throughout an event. Use a fixed QR version/error-correction profile for all chunks; keep crisp integer modules. No texture or animation over QR. Begin transport after entrance settles; count required display time after settling.
- Replace CLAPPA CHECK numbers with brief human challenge wording. Current QR transport does not include the signed challenge-issued event; extending it is a separate protocol change.
- Small tail tip at bottom left of OBS board, ear tips at bottom right beneath it. Idle phone shows only crown/ears; possum rises to give instructions.
- Match paper-cut mascot with very subtle grain and layered edges, clean shapes and legible controls. Hinge opens then clacks shut with a short impact bounce. OBS board swings into place before QR transport begins.
- Future separate head, muzzle, ears, torso, paws and bushy tail layers with named pivots; lightweight rotation/translation tweens for ear twitch, nose scratch, peeking and exit. Avoid rigidly animating a single raster head. Provide reduced-motion behaviour.
- Logo larger than Tap to clap. Exact optional tagline: No cap! Clap!!
- Musical timing refinement is deferred until a better clapper recording is chosen. Candidate: Joseph SARDIN, BigSoundBank sound 1011, seven clapperboard strikes, CC0 per https://bigsoundbank.com/clapperboard-s1011.html (checked 2026-09-13). Not yet auditioned or bundled. Current playback already places all hits into one sample-timed PCM buffer, but creates a new AudioTrack per cadence and uses a short synthetic tone. Trim and normalize one clean recorded strike, retain sample-timed placement, and investigate device startup attenuation with preloading; retain signed cadence/slot duration.

## What the current build actually does

`native-service.cpp` reads photo_a.original for display (not photo_b or photo_a.proof), auto-orients it and downsamples it to a cropped 260 x 210 region inside a 640 x 300 tile. Thus the display uses the correct source path but limits its detail. Flash-image appearance remains a device observation to investigate.

QR uses MEDIUM error correction as the minimum (the encoder may boost it), 400-byte compressed-data chunks in JSON/base64url envelopes, CRC32 per chunk and SHA-256 for the compressed payload. Requested update interval is 120 ms, quantized by the 50 ms polling timer, generally about 150 ms. Duration is max(4500 ms, chunk count * 240 ms), which does not guarantee two full passes at that effective rate for maximum payloads. No fountain/outer erasure coding is implemented. Every distinct chunk must arrive at least once. Repetition can replace a missed appearance, not a permanently unreadable chunk.

Each reconstructed transport contains the phone public key, one signed challenge-captured event, and exact compact JPEG bytes for BOTH normal A and flash B (one image for optional claim). That signed event includes challenge ID, capture timestamps, original and derivative file sizes/hashes, session/key IDs, sequence and previous event hash. It does NOT carry original-resolution JPEGs, the full event chain, final seal, or the preceding challenge-issued event containing prompt, camera/flash and cadence. Those are in the local proof folder. QR-only recovery verifies the recovered signed photo event and compact image hashes, not a complete session or an independently trusted identity.

## Local degradation evidence

Reproduce with `node obs-plugin/qr-transcode-audit.mjs` after the native integration test. Results: `output/qr-transcode-audit/results.json`.

| Local x264 second encode | Complete events recovered |
|---|---:|
| 1280 x 720, CRF 23 | 2/2 |
| 854 x 480, CRF 28 | 0/2 |
| 640 x 360, CRF 28 | 2/2 |
| 1280 x 720, CRF 23, Gaussian sigma 0.6 | 2/2 |

This is a synthetic recording with tiny 8 x 8 fixture photos and two chunks per event. It is not a full-payload test or a Twitch/YouTube round trip. Non-monotonic outcomes demonstrate sensitivity to resampling alignment. Do not call the current transport transcoding-safe. QR Reed–Solomon redundancy corrects limited codeword errors; it cannot guarantee recovery when scaling/blur destroys the module grid. See https://www.qrcode.com/en/about/error_correction.html.

Before a platform-readiness claim: fixed-size rendering, real textured photos up to the payload cap, larger-module/chunk-size tradeoffs, guaranteed repeated cycles, explicit outer erasure coding if adopted, dropped-frame probes, placement/scaling matrix, and recovery from actual platform-produced renditions. A signed failed recovery must never be presented as complete evidence.

