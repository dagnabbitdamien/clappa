# Current source architecture

Test14 adds `HomeActivity` (mode selection), `ViewerActivity`, `QrCollector`, `ProofSchema` and `ViewerProof` (native bounded QR collection and verification). `TwitchSignInActivity`, `TwitchCallback` and `TwitchIdentity` implement optional external-browser OIDC; Session snapshots linked evidence and signs a per-photo binding. OBS `twitch-identity.h` independently verifies the issuer before rendering an account badge. `protocol/twitch-identity.mjs` is the portable binding/issuer verifier. See [Test14](test14.md) for current validation limits; live Twitch authorization is not yet confirmed.

This is the maintenance map for the Android/Windows implementation. Historical Test1–Test12 documents remain review records; later signed profile extensions supersede older behavior. Read the current build's notes for what was actually validated.

## Product flow and ownership

| Concern | Source of truth | Responsibility |
| --- | --- | --- |
| Phone interaction | `android/.../MainActivity.kt` | Measured native screens, camera launch, display state and receiving OBS messages. An action becoming available must reflect session state, not an independent timer. |
| Signed phone transcript | `android/.../Session.kt` | One ordered signed event chain, camera references, deadlines, commitments and final seal. UI success follows OBS acknowledgment; local signing alone is not receipt. |
| Local transport | `android/.../LocalLink.kt`, `obs-plugin/src/native-service.cpp` | Certificate-pinned HTTPS and ordered polling. No separate companion application. Do not blindly retry a signed submission after uncertain receipt. |
| Beacon and choices | `protocol/quicknet.mjs`, native/Android Quicknet implementations | Verify the designated three-second pulse; reproduce all challenge, phrase and illumination choices from committed context. |
| Capture | `MainActivity.kt`, `DualCaptureActivity.kt` | Single-camera normal/illuminated pair, or capability-gated concurrent four-image mode. Sensor times and delivery times are different measurements. |
| OBS lifecycle | `obs-plugin/src/plugin.cpp` | Output packet collection, dock, recording control and rendered proof animation. Ending a proof recording must not stop a live broadcast. |
| Human browsing | `obs-plugin/src/session-summary.h` | Unsigned folder summaries and index. Rebuild the whole index at state changes or when Browse is pressed, not at every recording-duration tick. |
| Proof verification | `verifier/proof.mjs`, `verifier/recording.mjs`, `protocol/media-chain.mjs` | Validate signatures, ordering, image hashes, packet archives and the exact original recording. A readable summary is never verification evidence. |
| Mascot presentation | `ClappaBoard.kt`, current complete sprites | Preserve safe edges, complete anatomy, separate controls and instruction placement. New JavaScript artwork is a review proposal until explicitly adopted. |

## Current signed profiles

- Base protocol `0.3`: JCS, P-256 ES256-P1363, exact original image hashes and event chaining.
- `CLAPPA-RESPONSE-v1`: ten-second first-response deadline, with signed timing reports.
- `CLAPPA-QUICKNET-v1`: authenticated future Quicknet pulse, deterministic public derivation and media commitment. Completed QR includes the context; no separate pre-capture stream popup.
- `CLAPPA-SESSION-v2`: one optional additional photo within thirty seconds; missed attempts remain visible but do not terminate recording; automatic seal when recording closes with the connected phone. Photo B/group interval is three seconds.
- `CLAPPA-DUAL-v1`: front/rear normal and illuminated groups, four immutable JPEGs. Concurrent delivery is not asserted to mean simultaneous exposure.
- QR transport v2: fixed-version, repeated chunks with QR error correction. Current evidence carries hashes and signatures, not thumbnail pixels; it is not fountain coding.

Reference details: [session and dual-camera policy](review12/SESSION-POLICY.md), [exact QR contents](review12/QR-PAYLOAD.md), [media binding](review9/MEDIA-PROFILE.md).

## Changes that must stay separate

Chat requests are untrusted invitations outside the signed proof protocol. They may notify the phone; only accepting a request starts the ordinary beacon-derived challenge. Chat text cannot choose a prompt, flash colour or musical phrase. No chat response is published automatically.

Presentation experiments must not replace approved production artwork silently. Native app captures are distinct from browser previews. Display-only summaries never change or rename signed proof files.

Release packaging should copy the current protocol/verifier sources, verify the APK identity/version and record hashes for the actual APK/DLL. Historical test output must not be relabelled as a fresh run. Build notes must distinguish local fixtures, emulator camera flow and live-service tests.

## Known boundaries

Windows OBS and Android are the built targets. The protocol can describe iPhone multi-camera evidence, but an iPhone app is not implemented. Pairing survives consecutive recordings in the same OBS instance; restarting OBS changes its ephemeral pairing. Exact hashes check the original recording, not platform-transcoded pixels. The local unsigned summaries and presence of a seal file make no authenticity claim on their own.
