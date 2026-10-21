# Test20 - expanded photo challenges

## Source changes

New challenges use **`CLAPPA-CHOICES-v3`** with **32 selfie prompts**, including distinct left/right thumbs-up, peace signs, head tilts and other hand gestures. Current sessions continue to capture both phone cameras, each without and with illumination: four original photos per challenge.

The prompt pool, phone instructions, OBS instructions and deterministic verification mapping are updated together. Full catalogue and combination details are in [challenge derivation](challenge-prompts.md). There are **245,760** prompt/colour/riff combinations per challenge and **60,397,977,600** ordered start/end pairs.

`CLAPPA-CHOICES-v1` and `CLAPPA-CHOICES-v2` retain their existing prompt order, seed derivation and verification rules. The new mapping is fixed in the signed arm before the future Quicknet pulse. Old proofs are not rewritten or reinterpreted.

The change does not alter the ten-second response window, full dual-camera capture, normal/flash groups, sound-riff construction, QR transport, signed event chain or final recording seal.

## Installation and compatibility

Install the Test20 APK and matching OBS kit together once published. Test19 downloads contain the earlier prompt pool and do not acquire new challenges through a README or source update. Current source builds must use a verifier that recognizes `CLAPPA-CHOICES-v3`; older builds deliberately reject unknown mappings.

## Validation and packaging

Checks completed on 2026-10-21:

- Node verifier: **89/89 tests passed**.
- Android: **38 unit tests passed**, with no failures or errors; APK assembly passed.
- Native OBS: **677 cross-language choice vectors passed**: 32 v1, 300 v2 and 345 v3. Authenticated v1/v2/v3 fixtures and mutation-rejection checks passed.
- The full Windows OBS DLL was rebuilt successfully.
- The release harness verified Android version **`0.3.0-test20`**, version code **30**, package **`org.clappa.app`** and continuity with the existing APK signer.

The freshly built APK and DLL were packaged locally. No physical-device or live-stream test was performed for this update, and Test20 has not been uploaded to GitHub Releases.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `CLAPPA-0.3.0-test20.apk` | 45,651,670 | `7c3ff2fc41b92c78cf4289e768a22f31342d4f7de488e043319d4feca90c4b5b` |
| `clappa.dll` | 2,088,960 | `3e8b8f977be4d12de27f67c3b79f6ba7c028cde758940794a03e381728329485` |
