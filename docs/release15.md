A warmer CLAPPA preview with the approved paper possum on the mode cards, viewer screens and audience-request dialog.

- OBS now offers **Connect with Twitch** browser authorization for read-only chat.
- Three different viewers sending 🎬 within 15 seconds buzz the paired phone and invite a challenge; the streamer chooses whether to accept. Two-minute cooldown.
- Existing deterministic challenges, proof format, two-camera capture and sealing are retained.

## Downloads

Install **CLAPPA-0.3.0-test15.apk** on Android. Use **CLAPPA-test15-kit.zip** on Windows for the OBS plugin, installer and verifier. Update both together. The separate DLL is provided for manual installation. Hashes are in SHA256SUMS.txt.

## Checked and still pending

83 protocol/verifier tests and 35 Android unit tests pass, plus native chat and OAuth boundary checks. A local emulator-to-OBS session completed with EXACT ORIGINAL VERIFIED, two fresh challenges and one additional photo. Native menu screens were inspected in portrait and landscape.

Twitch accepted the registered client and issued a device authorization code. Full live consent and a real audience-to-phone trigger remain unverified. The local invitation test uses a clearly identified test fixture. This is a **prerelease**, not a guarantee of production readiness. Android + Windows OBS only; no iOS build yet.

No private recording, proof-photo archive, signing key or Twitch access token is included.
