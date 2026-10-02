# Test6 — safe areas, clear actions and motion-protected QR

## Install and check

1. Install `output/test-kit-v6/CLAPPA-0.3.0-test6.apk` over the previous app. Keep its data.
2. Close OBS, run the kit's **Install OBS plugin.cmd**, then reopen OBS.
3. Use **Pair / reconnect phone** in the OBS dock. On the phone, either **Pair with OBS** button or **Settings / Pair** opens pairing.
4. Pair, then **start recording in OBS**. Pairing establishes a connection; recording creates the signed session. Before recording, the phone explicitly explains this prerequisite. Once ready, **Tap to clap!** is a centered, filled button.
5. Check portrait and both landscape rotations, including Samsung's camera cutout, status bar and navigation controls. Check the camera's Back/Capture buttons too. Follow a challenge; the guide and instruction have separate measured areas.
6. Check that the OBS photo first shows the flash image, then fades to the normal image. The QR remains fixed through entrance, cycles while stationary and freezes before exit. Its grid and border stay the same throughout the sequence. The GMT snapshot timestamp remains fixed to Photo A's signed save-completion timestamp.
7. Complete **End session → capture → Stop & seal**, approve the seal and run **Verify latest recording.cmd**.

## Portable identity

Before pairing, phone settings can import a P-256 `.p12`/PKCS#12 file containing one private key and its matching certificate. Enter its file password. Keep the original file as your portable backup. The imported key is stored in Android Keystore and signs future sessions; the previous generated identity is retained. There is no account or username/password login. Existing device-generated keys cannot be exported by this feature. Other algorithms and raw private-key formats are not supported by protocol 0.3.

OBS supports **Use fingerprint** and **Import public-key.json**, using a public key record from an existing proof folder. Stop recording and click **Pair / reconnect phone** before changing the restriction. An empty fingerprint leaves key selection unrestricted within the authenticated pairing. A nonempty fingerprint must match the connecting phone. Never import a private key into OBS.

## Implementation and verification

- Android system bars/cutouts: one safeDrawing inset container around the board and camera. The intentional RGB illumination layer remains full window. Guidance: [Android window insets](https://developer.android.com/develop/ui/compose/system/insets) and [display cutouts](https://developer.android.com/develop/ui/compose/system/cutouts).
- Measured Compose rows/columns replace scaled browser coordinates. Buttons use minimum 48 dp targets, neutral slate colors and visible labels. The clocks sit between two rules. Compact landscape actions and pairing content can scroll.
- Whole-sprite mirroring now uses the image's own center/bottom transform rather than translating the sprite outside the viewport.
- QR frames share one version per payload, exact integer module pixels and a fixed mount. Native timing tests cover entrance/exit freezes and bounded flash opacity. Each frame holds for 240 ms; the stationary display allows at least two complete cycles, so larger proofs can take longer than four seconds.
- The native integration harness uses different synthetic A/B images, verifies the initial flash and final normal preview, decodes every QR frame and compares grid/boundary positions, then verifies the final sealed recording.
- Portable-key JVM tests cover a valid portable identity, repeat-import public-key consistency, signing/verification, wrong password, corrupt file and rejection of P-384. Test fixtures contain public test-only private keys and must never be used for real sessions.

**Unverified:** no Android device was attached during this build. S22 Ultra native visual layout, enlarged font settings, camera operation and Android Keystore import on that device still need a physical test. Compilation and JVM tests do not establish native visual acceptance. This remains a test build, not a claim of universal transcode recovery or production readiness.

## Recorded results

Test6: six Android JVM tests and 23 protocol/verifier tests passed. Native timing tests passed. Isolated OBS displayed distinct flash/normal images, every QR frame decoded with identical grid/boundaries, and the sealed eight-event recording returned EXACT ORIGINAL VERIFIED. A separate native negative test rejected a phone whose key differed from the configured fingerprint. APK signing certificate matches test5 for an in-place upgrade.
