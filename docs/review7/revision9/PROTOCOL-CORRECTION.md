# Required beacon-bound challenge design — owner correction

The owner clarified that the application must make challenge selection publicly reproducible from cryptographic context. Earlier implementation and review incorrectly treated independently random phone selection as the intended design and treated NIST as optional decoration. This document supersedes those descriptions. It records requirements, not completed functionality.

## Required construction

1. Authenticate a commitment containing protocol/mapping version, public signing identity, session/output IDs, exact cumulative OBS packet boundaries and hashes, previous transcript commitment, challenge index, allowed challenge profile, and the designated future NIST pulse. Freeze all selection inputs before that pulse becomes available. The seed must not gain any producer-selectable input afterwards.
2. Verify the authentic NIST pulse, its signed fields, designated identity/index and release time against trusted NIST verification material. A stale/substituted pulse or unverifiable beacon must not pass as fresh. No silent fallback to local randomness.
3. Derive a seed from a domain-separated canonical encoding of that fixed authenticated context and the verified pulse output. Expand separate labelled sub-seeds for prompt, camera mode, full rhythm/tempo/pitches and illumination. Specify deterministic, unbiased mappings and musical rules. Verification recomputes every choice. Do not use fresh signature randomness, a locally chosen timestamp, a new nonce or a freely chosen frame after pulse release as a way to reroll the result.
4. Begin the visible 10-second countdown when the verified challenge is issued. Bind the issue, capture/response and expiry policy in the next versioned profile. Precisely specify the first-photo deadline and subsequent A/B completion interval; do not substitute today's A/B gap check for the full response window. Late, skipped or failed responses remain visible.
5. Bind supplied images and the response to that challenge and the continuing media chain. Viewers compare the action and pictures. Hardware camera attestation is not required, and sensor provenance must not become a replacement product goal.
6. Carry the verified pulse evidence, authenticated derivation inputs, mapping version, resulting choices and signed response in the recoverable QR payload. Certificate/trust-anchor handling must be explicit. Measure the added payload and recovery duration before changing QR geometry. Show “NIST freshness beacon” and the pulse's verified time. Keep local clock and capture-report semantics separate.

## Security and timing details that must be solved in implementation

NIST's documented generic construction commits the procedure before the chosen future pulse, then hashes that statement with the pulse output to derive deterministic choices. This prevents adapting inputs after seeing the random value. Merely signing a local statement does not prove when outsiders first saw it. Specify how the prior commitment/target pulse is observed on the live stream or independently witnessed. Do not claim this is solved by a producer-controlled timestamp.

The documented NIST v2 cadence is one pulse per 60 seconds, not nanosecond updates. Continuous OBS hashing is separate from beacon cadence. Design the arming/precommitment interaction around that cadence while preserving a 10-second response interaction; do not quietly choose an already-known pulse to avoid waiting. Test service availability and define fail-closed behaviour.

With an unpredictable, authentic beacon, the completed beacon-dependent transcript could not feasibly have been assembled before pulse release under the stated beacon trust assumptions. This is a lower bound on that transcript's construction, not an independently proven exposure time for every image. Timely visible receipt on the live stream provides the other part of the viewer's timing judgment. Replay/offline verification must report what timing evidence it actually has.

For fixed committed inputs, exactly one response specification is valid. Different inputs can map to the same finite prompt or colour; changed footage must still invalidate the old signed media proof even when that happens. The anti-synthesis question remains whether the visible prescribed action and supplied views concur within the observed window.

## Implementation status

Test9 implements cumulative media binding but not NIST verification, deterministic beacon-based choices or a challenge-to-capture deadline. The existing APK/DLL and review evidence are unchanged by this correction. Do not mark the next profile implemented until Android, OBS, schemas, verifier, deterministic cross-language vectors, deadline/expiry checks, QR recovery and native flow have been updated and verified by the implementation agent.

Primary references: [NIST application construction](https://csrc.nist.gov/Projects/interoperable-randomness-beacons/apps), [NIST v2 beacon](https://csrc.nist.gov/projects/interoperable-randomness-beacons/beacon-20), [NISTIR 8213 draft](https://csrc.nist.gov/pubs/ir/8213/ipd).
