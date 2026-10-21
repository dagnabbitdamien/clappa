# CLAPPA Test11

Install `CLAPPA-0.3.0-test11.apk` over the existing app, and update the OBS DLL using `Install OBS plugin.cmd` after closing OBS. No companion program or account is required. Keep the 872×480 source at native size where practical; the installer does not reposition your scene.

Changes:
- Authenticated Quicknet freshness every three seconds, with choices fixed by the future pulse and the preceding OBS commitment. Internet access is required when starting a challenge. There is a short visible wait before the ten-second capture window.
- QR carries the signed freshness/transcript/photo hashes rather than uninterpretable 64-pixel JPEGs. Original photos are still saved and shown on stream.
- A shorter, clearer GMT footer explains the beacon's **No earlier than** time. Phone clocks have separate compact date labels.
- OBS entrance starts after image loading and uses a 380 ms rise plus brief settling. QR advances only after settling and freezes for exit.

See [review evidence](index.html) and [protocol, QR and camera details](FRESHNESS-PROFILE.md). This is a Windows/Android test build. The native emulator validates app execution and layout; it does not certify Samsung flash exposure, physical colour illumination, iPhone compatibility or platform transcoding. The separate dual-camera sample remains unsigned and outside production proof.

Original photos and the exact recording remain in the local proof folder. `Verify latest recording.cmd` uses the bundled verifier code (requires a local Node runtime). Verification uses embedded signed beacon evidence and does not need to fetch an Internet pulse. A detached QR supplies a media-prefix proof, not a final recording seal or a photo download.
