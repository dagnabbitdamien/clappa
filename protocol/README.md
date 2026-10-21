# CLAPPA protocol reference

This is the implementation map for CLAPPA's signed evidence format. For installation and the viewing experience, start with the [main README](../README.md). For component boundaries, see the [current architecture](../docs/CURRENT-ARCHITECTURE.md).

The base protocol is **0.3**, with explicit signed profiles for freshness, response timing, session policy and dual-camera capture. Current sessions require both phone cameras. QR transport has its own version: **CLAPPA3** is the current encoder. A transport version does not change the signatures inside it.

## Current profiles

| Profile | Current behavior | Implementation and detail |
| --- | --- | --- |
| `CLAPPA-QUICKNET-v1` | An acknowledged arm fixes the preceding OBS media commitment and a future three-second Quicknet round. The verified pulse determines the challenge. | [Beacon validation](quicknet.mjs), [freshness profile](../docs/review11/FRESHNESS-PROFILE.md), [current witnessing policy](../docs/review12/SESSION-POLICY.md#one-stream-popup) |
| `CLAPPA-CHOICES-v3` | Versioned, reproducible selection of prompt, illumination, rhythm, pitches and tempo. Current dual-camera sessions select from 32 selfie prompts; each response captures both cameras. | [Choice mapping](challenge-derivation.mjs), [prompt catalogue](challenge-set-v3.json), [Android mapping](../android/app/src/main/java/org/clappa/app/ChallengeChoices.kt), [shared vectors](../test-vectors/choices-v3.json) |
| `CLAPPA-RESPONSE-v1` with `CLAPPA-SESSION-v2` | Completed Photo A within ten seconds of issue; Photo B within three seconds of A. Wall-clock and monotonic reports must agree within 250 ms. Missed attempts are recorded without terminating the recording. | [Timing validator](response-window.mjs), [current session policy](../docs/review12/SESSION-POLICY.md) |
| `CLAPPA-DUAL-v1` | Front and rear normal/illuminated groups: four separately hashed originals per challenge. Uses the selfie prompt pool, RGB screen illumination and rear torch. Delivery skew is bounded; simultaneous exposure is not asserted. | [Dual validator](dual-view.mjs), [dual instructions](dual-prompts.json), [capture policy](../docs/review12/SESSION-POLICY.md#dual-camera-profile) |
| `CLAPPA-MEDIA-PROOF-v1` | Detached proof binds a photo event and its challenge to signed OBS output descriptors and packet-chain boundaries. | [Context validation](evidence.mjs), [packet chains](media-chain.mjs), [media profile](../docs/review9/MEDIA-PROFILE.md) |
| `CLAPPA-TWITCH-OIDC-v1` / `CLAPPA-TWITCH-BINDING-v1` (optional) | Twitch issuer evidence is bound to the phone key, then separately bound to each photo event. Issuer verification requires independently trusted Twitch keys. | [Identity verifier](twitch-identity.mjs), [identity profile](../docs/review14/TWITCH-IDENTITY.md) |

New challenge arms explicitly select `CLAPPA-CHOICES-v3`; never infer a mapping from the prompt or reinterpret historical proofs with the newest table. Versions 1 and 2 retain their original prompt order and selection rules for verification. The signed mapping is fixed before the Quicknet pulse, so adding prompts cannot change an existing proof's challenge. See the [challenge catalogue and derivation notes](../docs/challenge-prompts.md). The [NIST module](nist-beacon.mjs) is an archived reference, not the current beacon or an automatic fallback.

## Signed objects and identity

Events are `{payload, signature}`. Sign canonical UTF-8 payload bytes using **RFC 8785 JCS**. Reject duplicate JSON keys, non-finite numbers and unpaired Unicode surrogates; strings are not Unicode-normalized. Protocol numbers are safe integers; timestamps and counts are non-negative, while musical pitch intervals can be negative. See [canonicalization](../verifier/canonical.mjs) and the [schema source](schema.mjs).

The algorithm is **ES256-P1363**: ECDSA P-256 with SHA-256, a 64-byte big-endian `r || s` signature, base64url without padding. Require low-S signatures (`s <= n/2`). A public identity contains the DER SubjectPublicKeyInfo encoded as base64url; its `key_id` is the SHA-256 of those DER bytes. The private key is never included in a proof or sent to OBS.

Each event fixes the protocol, algorithm, key/session IDs, sequence, reported timestamp, previous signed-envelope JCS hash, type and data. Sequence begins at zero. The session fixes its recording ID, output descriptors and selected policy profiles. Challenge issue and response records bind the choices, OBS commitment, timing reports and exact image hashes. The final seal binds the event count, transcript head, terminal output commitments and exact recording size/hash.

Phone-to-OBS delivery uses certificate-pinned HTTPS with pairing authentication; this transport is separate from evidence signatures. See [native pairing](../docs/native-pairing.md). Public identity sharing and password-protected private backups are separate operations; see [identity management](../docs/portable-identity.md).

## Freshness, continuity and verification scope

The phone and verifier authenticate the designated Quicknet pulse and recompute the choices from the signed arm and pulse randomness. This supplies an authenticated **not-before** bound. Camera timestamps, response timing and illumination timing remain signed local reports.

The completed stream popup includes the arm, issue, response and beacon evidence. There is no separate visible pre-pulse marker. A self-signed arm alone does not prove that an audience observed it before the pulse; live or external observation remains relevant to preparation time. See the [current witnessing policy](../docs/review12/SESSION-POLICY.md#one-stream-popup).

Under `CLAPPA-SESSION-v2`, missed or cancelled attempts remain visible in verification results. A valid final integrity seal does not require successful start/end challenges; the verifier reports resolved bookends and actual timed responses separately. An optional extra photo has a thirty-second offer. Closing the recording with the connected phone resolves pending work and signs the final evidence. The app's recent-challenge **Stop & seal** shortcut is described in [current build notes](../docs/test19.md#stop-and-seal).

Full-bundle verification checks the event chain, exact original image files, media packet archive, signed checkpoints and final exact recording. Missing signed files or invalid signatures fail verification; a missing final seal is incomplete. Original image paths are confined to the proof folder, including checks against symlink escapes. Renaming a recording does not change its byte hash; platform transcoding does.

Cryptography binds evidence for human comparison. It does not establish that the pictured scene is physically real or provide an automatic AI verdict. A valid signature establishes the supplied key's involvement; a separately obtained fingerprint is needed to attribute that key to someone.

## QR contents and transport

Current `hashes-v1` envelopes contain:

- `key`: public signing key and identity code.
- `event`: signed capture or optional-photo record, with exact image references and hashes.
- `context`: signed arm, issued challenge with beacon evidence, and media-prefix proof.
- `photos: []`: no embedded JPEG pixels.
- Optional `identity`: a signed Twitch binding, with full issuer evidence on the first tile and a digest reference on later tiles.

Original photographs stay in the local proof folder. The four-view display is a presentation composite; each original retains its own hash. A QR cannot reconstruct an image from its hash. It also does not carry the whole event transcript, complete recording or final seal.

[Transport encoding and validation](transport.mjs) canonicalizes the envelope and applies raw DEFLATE, with an **8192-byte compressed limit** and bounded decompression. `CLAPPA3:` frames use Base45 and systematic Cauchy erasure coding: **any k distinct valid frames out of 2k** recover one compressed envelope. This is a bounded erasure code, not an unbounded fountain stream.

Each decoded frame is 238 bytes:

| Bytes | Field |
| --- | --- |
| 0-31 | SHA-256 of compressed envelope |
| 32-33 | Row index, unsigned big-endian |
| 34-35 | Source count k, unsigned big-endian |
| 36-37 | Exact compressed length, unsigned big-endian |
| 38-41 | Shard CRC32, unsigned big-endian |
| 42-237 | 196-byte shard |

Receivers reject conflicting duplicates, mixed metadata, invalid lengths/counts/indices and CRC failures. Recovery must pass the complete SHA-256 check, bounded decompression, schema and signature checks. Duplicate frames do not add recovery information.

See the [wire framing and field arithmetic](../docs/review17.1/TRANSPORT.md) and [erasure implementation](erasure.mjs). The current display holds each QR for **180 ms**, uses the full 2k sequence, freezes during transitions and keeps integer QR modules; [current display policy](../docs/test19.md#shorter-display) supersedes the older 240 ms examples. Local recovery measurements are not guarantees for arbitrary source scaling or streaming platforms.

The JavaScript verifier retains v1/v2 transport decoding, and Android retains v2 decoding. Legacy records keep their original signed policies. Older review documents and test fixtures describe those historical behaviors; they are not current product defaults.

## Twitch trust and detached proofs

`decodeTransport` validates the phone binding and structural media context. It does **not** authenticate the Twitch issuer or compare actual recording packet bytes. Reference-only identity proofs require the corresponding full issuer evidence.

Use `verifyTwitchEvidence` with independently trusted issuer keys. Native account verification obtains Twitch keys over authenticated HTTPS; never trust a QR-supplied issuer key or a caller-supplied display name. The bundle CLI checks archived phone bindings and explicitly reports that Twitch issuer verification was not performed offline. Historical token verification reports authentication time, not current account control. See the [identity profile](../docs/review14/TWITCH-IDENTITY.md).

A detached QR proof can bind the preceding media prefix when supplied the original recording and matching archive. That prefix cannot recursively contain the future popup's own pixels; later checkpoints and the final seal bind the popup into the exact original. See the [detached verifier](../verifier/qr-proof.mjs) and [media profile](../docs/review9/MEDIA-PROFILE.md).

## Tools and checks

From the repository root, with Node.js 22+ and dependencies installed:

```sh
pnpm test
node verifier/cli.mjs PROOF_FOLDER ORIGINAL_RECORDING
node verifier/cli.mjs PROOF_FOLDER ORIGINAL_RECORDING --trust-key SHA256
node verifier/qr-cli.mjs decoded-frames.json PROOF_FOLDER ORIGINAL_RECORDING
```

The bundle CLI exits with 0 for exact original verified, 2 for incomplete session, 3 for verified transcript with media mismatch, 4 for invalid proof, 5 for unsupported version and 64 for usage errors. Without `--trust-key`, it authenticates the bundle's key without independently establishing its owner.

[Schema definitions](schema.mjs) are the source for generated [JSON schema](schema.json), Android and OBS copies. After an intentional schema change, run `node tools/generate-protocol.mjs`. `node test-vectors/generate.mjs` regenerates deterministic fixtures; the sample `test-vectors/recording.bin` is synthetic test data, not a demo recording. Passing fixture tests does not establish complete device or live-service readiness.
