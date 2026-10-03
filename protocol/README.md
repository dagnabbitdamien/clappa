**Test19:** QR hold is 180ms with full 2k redundancy; OBS renders one static photo board plus QR-only layers. Recent acknowledged challenges allow Stop & seal for 30 seconds under existing SESSION-v2 semantics, without inventing an end challenge. See docs/test19.md (../docs from protocol).

**Test17.1 (2026-10-02):** New QR uses CLAPPA3 systematic Cauchy erasure coding (any k of 2k frames); preserve legacy verification. No change to signed envelopes, hash-only photos or Twitch first-token/later-reference policy. Frame hold remains 240ms. Windows Twitch issuer keys use authenticated WinHTTP independently of Qt TLS; never trust phone-supplied issuer keys. See docs/review17.1/TRANSPORT.md (../docs from protocol).

# CLAPPA protocol notes

**Test14 optional identity extension:** See [CLAPPA-TWITCH-OIDC-v1 / CLAPPA-TWITCH-BINDING-v1](../docs/review14/TWITCH-IDENTITY.md). QR envelopes may contain `identity` alongside the unchanged event/context/key/photos fields. Validate its separately signed phone binding and digest, then independently verify Twitch's RS256 token and phone-bound nonce before attributing the account. First tile has full evidence, later tiles a digest reference. `decodeTransport` checks bindings but does not fetch Twitch keys or claim issuer verification; `verifyTwitchEvidence` requires caller-provisioned trusted issuer keys. Native viewer performs that HTTPS trust step explicitly. The bundle CLI validates archived phone bindings and reports that Twitch issuer verification was not performed offline. `tools/generate-protocol.mjs` now also emits Android's bundled proof schema.

**Test12 owner update (2026-09-16):** New sessions use `CLAPPA-SESSION-v2`: missed challenges are signed and reported without terminating the recording, stopping OBS automatically seals with the connected phone, extra-photo offers last 30 seconds and Photo B has a signed three-second window. Optional `CLAPPA-DUAL-v1` binds four front/rear normal/illuminated photos. Only completed proofs pop up on stream; waiting for the beacon stays on the phone. New identities support explicit password-protected private backup export, while existing non-exportable keys remain unchanged. See ../docs/review12/SESSION-POLICY.md and ../docs/review12/QR-PAYLOAD.md. This supersedes conflicting older failure, consent, timing, dual-camera and identity-export instructions.


**Test11 owner update (2026-09-16):** Native challenges now use authenticated three-second Quicknet pulses, the permitted NIST alternative. All choices bind to a signed pre-pulse OBS commitment. New QR carries signatures, beacon evidence and both photo hashes, without unreadable 64-pixel JPEGs; original photos remain local and visible. This supersedes historical local-random selection and mandatory embedded-thumbnail instructions. See ../docs/review11/FRESHNESS-PROFILE.md and ../docs/test11.md.


**Required design correction, 2026-09-16:** The owner requires beacon-derived, publicly reproducible challenge/cadence/illumination selection, exact preceding OBS commitment binding, a 10-second response countdown and verifiable NIST context inside the QR. Local random selection in profile 0.3 is an implementation gap, not the intended design. Read [the correction and next-profile requirements](../docs/reviews/2026-09-16-owner-protocol-correction.md). Test9 does not yet implement them.

## Implemented profile 0.3

### Test12 continuity and multi-view extension

Read [the signed session/multi-view/identity rules](../docs/review12/SESSION-POLICY.md) and [exact QR contents](../docs/review12/QR-PAYLOAD.md). New profile fields are optional for historical records and mandatory when their extension is selected. Shared deterministic dual evidence is in `test-vectors/quicknet/dual.json`; `dual-view.mjs` validates camera-role and timing consistency. Full verification checks all four original files.

### Test11 authenticated freshness extension

New sessions activate `CLAPPA-QUICKNET-v1`: future-round arm, OBS acknowledgment, local threshold-signature verification, deterministic prompt/cadence/pitch/illumination, and hash-only QR context. See [the current normative extension](../docs/review11/FRESHNESS-PROFILE.md). This supersedes the historical implementation-status notes below. Musical pitch intervals may be signed negative safe integers; timestamps/counts remain non-negative. Native and verifier fixtures are under `test-vectors/quicknet/`.

### Test10 timed-response extension

New sessions sign `response_profile: "CLAPPA-RESPONSE-v1"`; all their challenges require `response_window_ms: 10000`. Capture events carry monotonic `response_ms` and `pair_ms`, checked alongside their existing wall-clock completion reports. New front-camera prompt IDs are `selfie_cover_left`, `selfie_cover_right`, `selfie_wink` and `selfie_turn`, using the same RGB Photo B as `selfie`. Ordinary rear-camera prompts retain LED Photo B. See [timing semantics](../docs/review10/TIMING-PROFILE.md). Old 0.3 bundles remain readable; old APKs/plugins/verifiers do not understand this extension and must be updated together. Regenerate both schema files with `node tools/generate-protocol.mjs`.

`nist-beacon.mjs` checks a provisioned certificate pin, pulse signature, output digest and optional designated pulse. `challenge-derivation.mjs` and Kotlin `ChallengeChoices` define a matching future mapping with 32 shared vectors. The NIST module remains an archived reference; the deterministic mapping is now activated by Quicknet in Test11. NIST's historical `Version 2.0` wire encoding uses 32-bit length prefixes/external status and appends the raw signature for output hashing; the later draft's `2.0` format differs. The archived chain-1 fixture verifies against the real NIST certificate. Current retrieval failure and the trust bootstrap are documented under review10. The seed helper requires an already authenticated fixed commitment and verified pulse; it does not itself prove when that commitment was published.

**Identity and presentation (signed event profile unchanged):** The phone can import a P-256 PKCS#12 private-key/certificate identity into Android Keystore before pairing. Existing device-generated keys remain supported; the imported source file is the owner's portable backup. OBS can restrict pairing to a public key fingerprint and never imports the private key. Both signing paths still produce ES256-P1363 records. The on-stream Photo B overlay fades to Photo A without changing either signed image. QR sequences use a fixed version-12 grid and four-module quiet zone, 240 ms frame holds after 500 ms settling, and a 100 ms freeze before a 240 ms exit. Timing is a rendering policy, not proof of scan recovery after arbitrary transcoding.

**Camera-aware illumination:** `challenge-issued` now requires signed `camera` and `flash`. `rear` requires `led` and a non-selfie prompt; `front` requires `selfie` and red/green/blue. Rear photo timestamps allow up to 3000 ms, front up to 1500 ms. Schema and native validation reject inconsistent combinations. Re-generated deterministic vectors use 0.3. Older 0.2 bundles are unsupported by this current verifier and require the previous verifier. See `../docs/test4.md`.

**Media implementation:** Native OBS packet capture, periodic phone signatures and terminal heads are implemented and integration-tested. Test9 also compares actual original H.264/AAC Matroska packets with the archive and verifies detached QR media prefixes. See `../docs/review9/MEDIA-PROFILE.md`. Beacon-derived challenges are activated in Test11 through the signed Quicknet extension.

`schema.json` is generated by `node protocol/schema.mjs`. Runtime validation uses the same definitions. Events are `{payload,signature}`. Canonical UTF-8 payload bytes use RFC 8785 JCS; duplicate keys, non-finite numbers and unpaired surrogates are rejected. Protocol numeric fields are safe integers; timestamps/counts are non-negative, while signed musical pitch intervals may be negative. Strings are not Unicode-normalized.

Signing algorithm **ES256-P1363**: ECDSA P-256 with SHA-256, a 64-byte big-endian `r || s` signature, base64url without padding. Require low-S (`s <= n/2`) to avoid signature malleability. Android uses non-exportable Android Keystore EC keys; its DER signatures are converted to P1363 and normalized. Public keys use DER SubjectPublicKeyInfo, base64url; key ID is SHA-256 of those DER bytes. No private key is transferred. Test vectors use a public, fixed test scalar with RFC 6979 deterministic signing via pinned noble-curves.

Every event carries protocol/algorithm/key/session IDs, sequence, timestamp, previous signed-envelope JCS hash, type, and data. Sequence starts at zero. `session-start` fixes the recording ID. `challenge-issued` signs challenge ID, prompt ID, phase (start/verify/end), cadence, beat duration, camera, illumination and OBS commitment. `challenge-captured` links that ID and binds original/proof derivatives of both photos, and both capture timestamps. A signed failure remains visible and makes the session incomplete. `claim` immediately follows a successful random response and must have been captured within six seconds. `session-end` follows successful start and end challenges. Final seal binds exact event count, final signed-envelope hash, recording ID and final exact media size/hash.

OBS commitment contains a recording ID, elapsed time and per-output packet counts, byte counts and hash-chain heads. Session-start fixes output descriptors; periodic output-checkpoint events and the final seal bind their evolving and terminal states. Packet archives are checked independently from the final exact recording hash. Local transport is certificate-pinned HTTPS (https-poll-v1) implemented inside the OBS plugin; signed objects are unchanged. Timestamps and flash timing are signed reports, not externally witnessed facts. The camera-specific upper bound between photo timestamps is a profile acceptance limit, not a guarantee of camera/illumination timing.

Proof derivatives are JPEG bytes made once on capture, then hashed and transported unchanged. Verifiers never re-encode photos. Filenames are constrained relative paths below `images/`; folder escape via symlinks is rejected. Missing images are invalid evidence. Missing final seal is incomplete. File renaming does not change exact-byte verification.

`transport.mjs` transports a signed photo event, public key, and both compact proof JPEGs (one for a claim). Canonical JSON is raw-DEFLATE compressed and capped at 8192 bytes. The capture event links the issued challenge by ID; the full prompt/cadence record and session chain are in the proof folder. QR recovery alone does not verify the full session, displayed prompt or final recording seal. Never mutate signed images to fit the budget.

### Compact QR transport v2 (Test7)

Each text frame is `CLAPPA2:` followed by RFC 9285 Base45. Decode that body as:

| Bytes | Meaning |
| --- | --- |
| 0–31 | SHA-256 of the complete compressed payload |
| 32–33 | Zero-based chunk index, unsigned big-endian |
| 34–35 | Chunk count, unsigned big-endian (1–41) |
| 36–39 | CRC32 of this chunk, unsigned big-endian |
| 40 onward | 1–200 compressed payload bytes |

All chunks are required; equal duplicates may be discarded. Reject conflicting duplicates, mixed digests/versions/counts, bad CRC, missing chunks, inflation overflow, bad signatures or image hash mismatch. This is repeated chunking, **not fountain coding**. Native QR uses fixed version 12, medium error correction and four-module quiet zones: four logical pixels/module at the default 872×480 source size. Repeat at least two cycles while stationary; maximum payload can extend the display to roughly 20 seconds. There is no fixed four-second maximum for every payload.

The v1 JSON/base64url envelope (400-byte chunks) remains decodable. New encoders default to v2. Signed schemas remain protocol 0.3. Transport tests cover both versions, malformed input and RFC Base45 vectors. Local degradation results are in `docs/review7/`; they do not certify platform delivery.

Run `node --test verifier/test/*.test.mjs`, `node test-vectors/generate.mjs`, and `node verifier/cli.mjs test-vectors/valid test-vectors/recording.bin`. CLI exits: 0 exact, 2 incomplete, 3 media mismatch, 4 invalid, 5 unsupported, 64 usage. Optional `--trust-key HEX` checks an independently obtained key fingerprint. Without it, output authenticates the bundle's key, not a person's identity. No network is used by verification.

The vector `recording.bin` is synthetic test bytes, not a demo recording. Passing these tests does not establish end-to-end MVP readiness.

This directory becomes the normative protocol definition.

The updated protocol direction now includes:

- signed event chains;
- explicit algorithm-tagged signatures;
- challenge cadence metadata;
- flash-colour metadata;
- **two-photo random challenge events**:
  - Photo A (ordinary)
  - Photo B (rear LED flash, or selfie RGB screen flash)
- final exact-file sealing;
- animated QR transport of compact canonical proof artifacts.

The verifier must be able to validate a proof without depending on Android or OBS implementation details.

## Recommended first protocol artifacts

- event schema
- final-seal schema
- canonicalization rules
- public-key representation rules
- signature representation rules
- challenge-set file
- QR transport envelope
- test vectors



## Windows TLS execution (Test8)

## Detached media context (Test9)

Protocol 0.3 event signatures and transport-v2 framing remain compatible. New capture/claim transports add `context: {challenge, proof}`. `proof.payload` uses profile `CLAPPA-MEDIA-PROOF-v1` and algorithm `ES256-P1363`, binding `key_id`, `session_id`, `recording_id`, `event_sha256`, `challenge_sha256`, `at`, `outputs` and `descriptors`. All are covered by the phone signature using the same canonical JSON rules. The `media-proof` definition in `schema.mjs` specifies the exact shape. Context is saved alongside the event under `media-proofs/<event-sequence>.json`.

`validateMediaContext` verifies both signatures, identities, challenge association, exact event hashes, output coverage and monotonic boundaries. Full-bundle verification checks any present detached context against its event transcript and recomputes its media heads. Missing legacy context is reported by the detached-proof count; it does not qualify for standalone prefix verification. `qr-cli.mjs` additionally compares recovered QR context to the original recording through the signed boundary. Unsupported containers/codecs fail closed.

See [the complete profile and container mapping](../docs/review9/MEDIA-PROFILE.md). Regression cases in `verifier/test/evidence.test.mjs` reuse the public deterministic fixture key and cover changed challenges, response transplantation, false key IDs, mutated heads and Annex-B normalisation. The existing deterministic 0.3 vectors remain byte-identical. Real native recording comparison, changed-scene rejection and QR recovery are recorded under `docs/review9/`.

### TLS execution detail

The bundled Mbed TLS 3.6.4 build lacks `MBEDTLS_THREADING_C`. The native HTTP server uses a single TLS worker, bounded queue and one request per connection, preventing simultaneous access to its shared TLS/PSA state. TLS 1.3, certificate pinning and bearer authentication remain enforced. Legacy non-PSA signature verification uses a separate context; enabling `MBEDTLS_USE_PSA_CRYPTO` or parallel TLS later requires a properly threaded Mbed TLS build. See [Mbed TLS threading requirements](https://mbed-tls.readthedocs.io/en/latest/kb/development/thread-safety-and-multi-threading/).

## CLAPPA-CHOICES-v2

Test14.1 arms new challenges with v2. The mapping value is part of the signed pre-pulse commitment and seed. Never infer a mapping from a prompt or use the newest table for historical evidence. V1 is unchanged; validators accept both versions and reject unknown versions. V2 ordered pool is defined in `challenge-derivation.mjs` and mirrored in native implementations. `test-vectors/choices-v2.json` contains 300 vectors spanning all camera profiles. `test-vectors/quicknet/challenge-v2.json` binds the mapping to an authenticated pulse. The QR payload remains hashes-only.
