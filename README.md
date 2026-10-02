# CLAPPA

**Latest test build: Test14.1.** Clearer menus, everyday prompts and dual-camera defaults; [latest notes](docs/test14.1.md). Test14 introduced: Native Streamer/Viewer modes, animated-QR verification and replay, and optional Twitch OIDC evidence bound to the phone key and photo event. [Build notes](docs/test14.md) · [Review](docs/review14/index.html) · `output/CLAPPA-test14-kit.zip`. Update both APK and OBS DLL. Live Twitch authorization remains unverified; see the build notes for measured checks and limits. Approved Test13.1 whole-sprite artwork is unchanged.

**Test12 owner update (2026-09-16):** New sessions use `CLAPPA-SESSION-v2`: missed challenges are signed and reported without terminating the recording, stopping OBS automatically seals with the connected phone, extra-photo offers last 30 seconds and Photo B has a signed three-second window. Optional `CLAPPA-DUAL-v1` binds four front/rear normal/illuminated photos. Only completed proofs pop up on stream; waiting for the beacon stays on the phone. New identities support explicit password-protected private backup export, while existing non-exportable keys remain unchanged. See docs/review12/SESSION-POLICY.md and docs/review12/QR-PAYLOAD.md. This supersedes conflicting older failure, consent, timing, dual-camera and identity-export instructions.


**Test11 owner update (2026-09-16):** Native challenges now use authenticated three-second Quicknet pulses, the permitted NIST alternative. All choices bind to a signed pre-pulse OBS commitment. New QR carries signatures, beacon evidence and both photo hashes, without unreadable 64-pixel JPEGs; original photos remain local and visible. This supersedes historical local-random selection and mandatory embedded-thumbnail instructions. See docs/review11/FRESHNESS-PROFILE.md and docs/test11.md.


**CLAPPA** is a local-first challenge-response proof system for video.

It consists of:

- a native Android phone app;
- a native OBS Studio plugin;
- a small, documented proof/provenance format; and
- a local verifier.

The phone behaves like a playful cryptographic clapboard. Tap it, hear a patterned **clack-clack** sequence, and a cute **brush-tail possum** gives you a photo challenge. The phone captures a small two-photo burst, signs the evidence, and sends it to OBS. OBS shows a cute proof tile in-stream, binds the proof event to the recording session, and later helps finalize the original recording.

The system is designed to work without a CLAPPA account, cloud backend, proof server, database, or hosted media service.

## What CLAPPA is trying to establish

CLAPPA does **not** claim that cryptography can mathematically prove that the semantic content of arbitrary video is true.

Instead, it creates evidence that:

> The exact sealed original OBS recording is bound to a signed sequence of challenge-response observations captured during the same session.

The practical anti-synthetic value comes from combining:

- exact cryptographic integrity of the original OBS recording;
- unpredictable photo challenges;
- independent observations from the phone camera;
- visible proof moments embedded into the video;
- an audible challenge cadence that is also recorded in the proof transcript; and
- optional external contemporaneous witnessing when a livestream/platform integration exists.

## Recent design direction

The current spec now assumes:

- **Android first**
- **native OBS plugin**
- **brush-tail possum mascot**
- **vector-art clapboard UI**
- **audible clack pattern per challenge**
- **two-photo challenge capture**
  - one ordinary photo
  - one second photo captured with the rear LED, or a red/green/blue screen flash for a front-camera selfie
- **first photo shown to viewers**
- **second photo briefly shown over the first, then faded away; both are included cryptographically**
- **animated QR proof transport**
- **final exact original-file seal**
- **plain JSON + JPEG proof folders**
- **optional Twitch chat trigger using `🎬`**
- **no CLAPPA servers/accounts**

## Important limits

- CLAPPA is strongest while AI still struggles to maintain a coherent, interrogable world under unpredictable challenge-response conditions.
- If cheap, perfect, real-time world simulation becomes commonplace, CLAPPA's **anti-physical-fakery** advantage degrades.
- In that future, CLAPPA still remains useful as a **provenance/integrity/timing/authorization** system.
- A fully offline local proof does not, by itself, impose a hard real-time deadline on an attacker.
- A public randomness beacon gives a **not-before** bound; without an external witness it does not give a **not-after** bound.
- Platform-transcoded copies will not normally have the same byte hash as the original recording.

## Repository layout

```text
/
├── AGENTS.md
├── README.md
├── DESIGN_SPEC.md
├── android/
├── obs-plugin/
├── protocol/
├── verifier/
├── test-vectors/
└── docs/
```

Read `DESIGN_SPEC.md` before implementation and `AGENTS.md` before changing code.

## Current Windows test build

Current version: Test14.1. See [build notes](docs/test14.1.md) and [repository setup](docs/GITHUB.md). Build downloads and private/local review evidence are not stored in this source repository. Update the Android app and OBS plugin together.

## License

Not chosen yet. **Do not add a license without the repository owner's explicit decision.**



