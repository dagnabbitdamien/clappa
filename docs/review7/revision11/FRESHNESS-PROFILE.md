# Test11 — authenticated freshness and interpretable evidence

This document supersedes Test10's unfinished native beacon status. New sessions use `CLAPPA-QUICKNET-v1` with `CLAPPA-RESPONSE-v1`. Protocol remains 0.3 with explicit extensions; update Android, OBS and verifier together.

## Beacon choice

Quicknet is drand's public threshold BLS beacon, with a three-second period. This is the owner's permitted alternative to NIST, not a relabelling of it. A current NIST response could not be authenticated against its advertised certificate during development; the archived NIST verifier remains available but is not a production fallback. An Internet clock with millisecond precision is not an unpredictable signed randomness source.

The Quicknet chain, public key, genesis and period are pinned in `protocol/quicknet.mjs`, `shared/beacon/quicknet.c` and Android `Quicknet.kt`. No key received from a relay replaces that pin. Verify the G1 signature over SHA-256 of the round's eight-byte big-endian representation, using the RFC9380 DST `BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_`. Randomness is SHA-256 of the verified signature. Native code uses blst; the independent Node verifier uses noble-curves. Reject bad encoding, subgroup, infinity, round, chain, timestamp or signature. Relays only transport signed data.

Sources: [Quicknet introduction](https://docs.drand.love/blog/2023/10/16/quicknet-is-live/), [drand specification](https://docs.drand.love/docs/specification/), [HTTP API](https://docs.drand.love/developer/http-api/), [blst](https://github.com/supranational/blst).

## Fixed inputs, then fresh output

1. Session-start signs output descriptors, response policy, beacon profile and camera capability family. `front-rear` supports all prompts; `front-only` and `rear-only` select only their applicable prompts. A rear challenge requires an LED-capable camera.
2. The phone signs a `challenge-armed` event containing its challenge ID, phase, camera family, mapping version, exact preceding OBS packet-chain heads and designated future Quicknet round. Ordinary event linkage fixes the earlier transcript too.
3. OBS validates the arm, shows its hash and target round in a stationary `CLAPPA-ARM1` marker, and acknowledges that exact sequence. The phone must receive acknowledgment before the pulse. Inputs cannot be locally rerolled within the session. A failed arm makes the session incomplete.
4. The phone fetches that exact pulse after its publication time and verifies it locally. Unavailable, invalid or late evidence stops the challenge; there is no local-randomness fallback.
5. Seed bytes are SHA-256 of UTF-8 `CLAPPA-QUICKNET-SEED-v1`, NUL, JCS of the armed event **payload**, NUL, and the verified pulse randomness. Signature bytes are deliberately excluded from selection so signing nonce variation cannot select a different prompt.
6. `CLAPPA-CHOICES-v1` deterministically derives the prompt, camera, illumination, six/seven-note cadence, pitches and tempo. Phone, OBS and verifier recompute them. Musical intervals are signed integers; non-negative time/count constraints remain schema-enforced.
7. The issue must occur within ten seconds of the pulse; the first photograph must occur within ten seconds of issue. Monotonic and wall-clock capture reports must agree within 250 ms. Photo B follows A within 1.5 seconds for front RGB or 3 seconds for rear LED. Both original files are signed by exact hash.
8. QR context carries signed arm, signed issue, signed capture, signed media-prefix context, public identity and the full beacon signature. Packet checkpoints continue during beacon waiting. Final sealing still covers the exact original recording and terminal packet heads.

## What is independently established

The beacon authenticates the round and its scheduled time under the Quicknet threshold-security assumption. The complete beacon-dependent challenge transcript could not be prepared before its randomness became available. The footer therefore says **No earlier than**, with GMT time and date. This does not certify the camera exposure time or establish a latest completion time by itself.

The signed arm alone is not independent evidence that someone published it before the pulse: a malicious signer can construct/backdate a transcript later. The live arm marker gives a viewer/witness something to observe before publication. Independent observation of that commitment and the response is necessary to constrain an attacker's preparation window. Local OBS rejects late arms, but a dishonest operator can replace their software. This distinction must stay visible in technical verification results.

Hashing the media prefix preceding the overlay cannot include that overlay recursively. Later packet checkpoints and the final seal bind the overlay's pixels in the exact original. Detached QR verification can bind the preceding prefix when supplied that original; decoding QR from a transcoded copy does not establish exact integrity of every surrounding pixel. The product remains a human comparison of fresh challenge response with ongoing footage, supported by authenticated evidence.

## QR images: deliberately removed from the new profile

The previous encoder fixed width at **64 pixels**, JPEG quality 35: typically 64×85 for portrait or 64×36 for 16:9 landscape. It did not encode a 46-pixel photo, but those actual sizes are still inadequate for judging a wink, hand placement, face identity or subtle illumination. No recognition study establishes them as useful. We therefore do not spend QR bandwidth on them.

New issues sign `qr_profile: hashes-v1`; QR payloads have `photos: []`. Both original hashes and legacy derivative hashes remain in the signed photo references. Full original JPEGs remain in the local proof folder and are used for the visible Photo B-over-A presentation. The small derivatives remain only as local backwards-compatible artifacts. Extracting a new QR yields evidence and hashes, **not viewable photos**. The supplied original files can be checked against those hashes. Earlier QR formats with embedded photos remain readable.

No full-resolution photo can be reconstructed from its hash. If future viewers need independently extractable photos without a proof folder, establish a useful minimum visual resolution with representative human comparisons, then measure payload and recovery at the intended source size. Do not shrink until a budget fits and call the result useful.

## Camera scope and follow-up

Production challenges still capture one camera's A/B pair: rear LED or front RGB. Both are displayed, flashed B first over the continuously mounted normal A. Choosing a secret subset of a few possible frames offers no established extra protection once the public seed is known and removes information a viewer could compare; it is not added.

The separate concurrent front/rear sample from Test10 remains experimental and unsigned. Its two images and measured delivery skew are examples, not proof of simultaneous exposure. Four-image illuminated dual capture needs a new signed profile, capability checks and timing/illumination validation on actual Android and iPhone hardware. Android concurrent-camera support does not imply concurrent flash support; iOS requires its own MultiCam and resource/illumination checks. Unsupported devices must decline the mode or explicitly use the single-camera profile, never silently claim dual capture.

Photos remain upright and retain their aspect ratio. Automatic sideways rotation or a portrait-shaped OBS source is not implemented in this build; preserving intelligibility takes priority over filling the rectangle.

## Native dependency provenance

blst v0.3.16 is vendored from the official release archive (SHA-256 `1efb2d121f636d51c2673a8fb6b71911e9679c0a4a09c4ce2abb3fd6090d0b89`). Its Apache-2.0 license applies to that dependency only. No project license has been chosen. JNI builds target arm64-v8a and x86_64 with 16 KB page alignment. Windows uses the same C verification wrapper. Apple/macOS builds have not been produced.
