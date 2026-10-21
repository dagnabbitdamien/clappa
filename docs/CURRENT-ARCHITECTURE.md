# Current source architecture

This is the maintenance map for the current Android/Windows source. [Test20's notes](test20.md) cover the expanded challenge catalogue; [Test19](test19.md) describes proof-display and finishing changes, and [Test18](test18.md) covers saved pairing and network recovery. Earlier numbered documents are historical review records, and later signed profiles supersede older behavior. Build and release availability are recorded separately from source changes.

`HomeActivity` provides mode selection. `ViewerActivity`, `QrCollector`, `ProofSchema` and `ViewerProof` implement bounded native QR collection and verification. `TwitchSignInActivity`, `TwitchCallback` and `TwitchIdentity` implement optional external-browser OIDC; Session snapshots linked evidence and signs a per-photo binding. OBS `twitch-identity.h` independently verifies the issuer before rendering an account badge, and `protocol/twitch-identity.mjs` is the portable binding/issuer verifier. Complete live Twitch account authorization and a live audience trigger remain unconfirmed; implementation and fixture results should not be read as completed live-service validation.

## Product flow and ownership

| Concern | Source of truth | Responsibility |
| --- | --- | --- |
| Phone interaction | `android/.../MainActivity.kt` | Measured native screens, camera launch, display state and receiving OBS messages. An action becoming available must reflect session state, not an independent timer. |
| Signed phone transcript | `android/.../Session.kt` | One ordered signed event chain, camera references, deadlines, commitments and final seal. UI success follows OBS acknowledgment; local signing alone is not receipt. |
| Local transport | `android/.../LocalLink.kt`, `obs-plugin/src/native-service.cpp` | Certificate-pinned HTTPS and ordered polling. No separate companion application. Do not blindly retry a signed submission after uncertain receipt. |
| Beacon and choices | `protocol/quicknet.mjs`, native/Android Quicknet implementations | Verify the designated three-second pulse; reproduce all challenge, phrase and illumination choices from committed context. |
| Prompt catalogue | `protocol/prompts.json`, `protocol/challenge-set-v3.json`, `tools/generate-prompts.mjs` | Keep prompt IDs, human instructions and generated Android/OBS tables aligned. New arms use v3's 32 selfie prompts; historical v1/v2 mappings stay immutable. |
| Capture | `MainActivity.kt`, `DualCaptureActivity.kt` | Required concurrent front/rear capture: each camera takes a normal and an illuminated photo, producing four originals. Hardware support is checked before starting a session. Sensor times and delivery times are different measurements. |
| OBS lifecycle | `obs-plugin/src/plugin.cpp` | Output packet collection, dock, recording control and rendered proof animation. Ending a proof recording must not stop a live broadcast. |
| Human browsing | `obs-plugin/src/session-summary.h` | Unsigned folder summaries and index. Rebuild the whole index at state changes or when Browse is pressed, not at every recording-duration tick. |
| Proof verification | `verifier/proof.mjs`, `verifier/recording.mjs`, `protocol/media-chain.mjs` | Validate signatures, ordering, image hashes, packet archives and the exact original recording. A readable summary is never verification evidence. |
| Mascot presentation | `ClappaBoard.kt`, current complete sprites | Preserve safe edges, complete anatomy, separate controls and instruction placement. New JavaScript artwork is a review proposal until explicitly adopted. |

## Current signed profiles

- Base protocol `0.3`: JCS, P-256 ES256-P1363, exact original image hashes and event chaining.
- `CLAPPA-RESPONSE-v1`: ten-second first-response deadline, with signed timing reports.
- `CLAPPA-QUICKNET-v1`: authenticated future Quicknet pulse, deterministic public derivation and media commitment. Completed QR includes the context; no separate pre-capture stream popup.
- `CLAPPA-CHOICES-v3`: 32 selfie prompts for current dual-camera challenges, three front-flash colours and 2,560 sound riffs. The mapping is committed before the pulse. Versions 1 and 2 remain supported for historical proofs without reinterpreting their prompt pools.
- `CLAPPA-SESSION-v2`: one optional additional photo within thirty seconds; missed attempts remain visible but do not terminate recording; automatic seal when recording closes with the connected phone. Photo B/group interval is three seconds.
- `CLAPPA-DUAL-v1`: front/rear normal and illuminated groups, four immutable JPEGs. Concurrent delivery is not asserted to mean simultaneous exposure.
- QR transport v3: fixed-grid Cauchy erasure coding, any k of 2k frames. Evidence carries hashes and signatures, not thumbnail pixels; legacy v2 verification remains supported.

Reference details: [session and dual-camera policy](review12/SESSION-POLICY.md), [exact QR contents](review12/QR-PAYLOAD.md), [media binding](review9/MEDIA-PROFILE.md).

## Changes that must stay separate

Chat requests are untrusted invitations outside the signed proof protocol. They may notify the phone; only accepting a request starts the ordinary beacon-derived challenge. Chat text cannot choose a prompt, flash colour or musical phrase. No chat response is published automatically.

Presentation experiments must not replace approved production artwork silently. Native app captures are distinct from browser previews. Display-only summaries never change or rename signed proof files.

Release packaging should copy the current protocol/verifier sources, verify the APK identity/version and record hashes for the actual APK/DLL. Historical test output must not be relabelled as a fresh run. Build notes must distinguish local fixtures, emulator camera flow and live-service tests.

## Known boundaries

Windows OBS and Android are the built targets. The protocol can describe iPhone multi-camera evidence, but an iPhone app is not implemented. Pairing survives consecutive recordings in the same OBS instance; Test18 persists pairing across OBS restarts and refreshes LAN addressing. Exact hashes check the original recording, not platform-transcoded pixels. The local unsigned summaries and presence of a seal file make no authenticity claim on their own.
