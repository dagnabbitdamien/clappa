**Test18:** Persist OBS pairing across restarts; explicit Pair a different phone rotates it. LAN discovery is an untrusted address hint and never replaces TLS pinning. Do not show the worried mascot for normal connection setup. See docs/test18.md.

**Test17.1 (2026-10-02):** New QR uses CLAPPA3 systematic Cauchy erasure coding (any k of 2k frames); preserve legacy verification. No change to signed envelopes, hash-only photos or Twitch first-token/later-reference policy. Frame hold remains 240ms. Windows Twitch issuer keys use authenticated WinHTTP independently of Qt TLS; never trust phone-supplied issuer keys. See docs/review17.1/TRANSPORT.md (../docs from protocol).

**Test17 (2026-10-02):** Home, Viewer, Settings and Twitch share MenuLayout: full-width top accent, fixed header rhythm, 32 sp wordmark, 20 dp safe content gutters, explicit outlined return navigation. Do not centre headers with body content. Viewer uses one Scan a proof action and the approved binoculars illustration, compact in landscape. Dual capture uses window orientation and equal preview halves labelled Front camera / Rear camera; preview crop never changes saved evidence. See docs/review17/DESIGN-REVIEW.md and docs/test17.md.

**Test15.1:** The only tagline is No cap! Clap! Do not invent promotional slogans. Streamer/viewer use new whole menu sprites with distinct presenting/binocular poses. Existing challenge sprites unchanged. See docs/test15.1.md.

**Test15 (2026-10-02):** Menus/viewer/chat invitation use approved whole possum sprites. OBS chat supports read-only Twitch device authorization, with tokens in memory only and cancellation guards. Preserve 3-viewer/15-second voting, two-minute cooldown and explicit phone acceptance. Live authorization remains unverified. See docs/test15.md.

**Test14.1 (2026-10-01):** New challenges use versioned CLAPPA-CHOICES-v2; preserve v1 verification. Two-camera capture defaults on for capable devices without an explicit preference. New menus use orange accents, mode icons and expandable proof details. See docs/test14.1.md.

# AGENTS.md — CLAPPA Repository Instructions

**Test16.2 refinement:** Menu accent is now a 16dp mirrored arrow band (two 8dp rows). OBS hinge uses native geometry and round screws at its shorter height, never nonuniform scaling. This supersedes the single-row 8dp accent below.

**Test16.1 refinement:** Ordinary phone menus use only an 8dp diagonal stripe accent, no hinge or metal plate. Reserve the complete skeuomorphic board for capture. OBS jaws/hinge are 20% shorter; enlarged photo region preserves aspect ratio. Keep QR geometry unchanged. This supersedes Test16's full menu-jaw headers.

**Test16 presentation contract:** Shared charcoal surfaces, mirrored black/white clapper jaws and orange accents apply to home, viewer, settings and OBS dock menus. Streamer settings are full-screen and scrollable; Viewer mode belongs on the home menu. Use distinct headings and outlined controls, with text explaining recording-locked camera settings instead of a disabled switch. OBS public identity is selectable/copyable in Settings, never appended to status prose. Every photo is an independent aspect-preserving taped print; do not reintroduce a framed landscape composite around multiple photos. Source dimensions remain stable. See docs/test16.md.

**Test14 (2026-10-01):** Streamer/Viewer modes and optional Twitch OIDC evidence now exist. Preserve the nonce binding to the phone key, separately signed per-photo identity binding, first full token/later digest-reference QR policy, and explicit unverified state when issuer evidence or trusted Twitch keys are missing. Never publish an access token or client secret. Callback is exactly `http://localhost:3000`, a short-lived phone loopback listener; old custom-scheme redirect advice was incorrect. Native viewer uses the generated shared schema and real signature/beacon verification. Live account authorization is not yet confirmed. See `docs/test14.md` and `docs/review14/TWITCH-IDENTITY.md`; do not relabel fixture signatures as real Twitch authorization.

**Test13.1 (2026-09-22):** The Android guide now uses approved whole sprites 03 (challenge), 11 (success), 08 (error); all eleven approved assets are bundled, pose 2 excluded. Preserve measured non-overlapping guide/bubble/control regions and whole-sprite transitions. No anatomical slicing or rejected JavaScript character. OBS DLL/proof profiles are unchanged. See [native build notes](docs/test13.1.md).

**Test13 (2026-09-22):** Work resumed explicitly. Preserve one additional photo per response, consume its offer on local commitment, and announce receipt only on its matching OBS acknowledgment. Twitch chat may only invite; user acceptance starts the normal beacon-derived challenge. See [build notes](docs/test13.md), [architecture](docs/CURRENT-ARCHITECTURE.md) and [mascot selection](docs/review13/mascot/APPROVAL.md). The JavaScript mascot was rejected; poses 1 and 3–12 of the subsequent sheet are approved, pose 2 rejected, with no new artwork shipped in Test13.

**Owner work pause (2026-09-16):** Until 2026-09-19 at 19:47 Australia/Sydney, record new feedback only in `docs/DEFERRED-NOTES.md`. Do not implement changes, run investigations/tests, or rebuild the project during this period unless the owner explicitly overrides this pause. The deadline is not a request for automatic resumption.

**Test12.1 interaction rules:** Countdown progress uses the monotonic deadline and frame updates; changing countdown text must not replay a button entrance. Product copy describes current capabilities without development-history language. Session browsing metadata is an unsigned convenience aid, separate from signed proof; never equate a present seal file with successful verification. Keep original session IDs and proof filenames stable.

**Test12 owner update (2026-09-16):** New sessions use `CLAPPA-SESSION-v2`: missed challenges are signed and reported without terminating the recording, stopping OBS automatically seals with the connected phone, extra-photo offers last 30 seconds and Photo B has a signed three-second window. Optional `CLAPPA-DUAL-v1` binds four front/rear normal/illuminated photos. Only completed proofs pop up on stream; waiting for the beacon stays on the phone. New identities support explicit password-protected private backup export, while existing non-exportable keys remain unchanged. See docs/review12/SESSION-POLICY.md and docs/review12/QR-PAYLOAD.md. This supersedes conflicting older failure, consent, timing, dual-camera and identity-export instructions.


**Test11 owner update (2026-09-16):** Native challenges now use authenticated three-second Quicknet pulses, the permitted NIST alternative. All choices bind to a signed pre-pulse OBS commitment. New QR carries signatures, beacon evidence and both photo hashes, without unreadable 64-pixel JPEGs; original photos remain local and visible. This supersedes historical local-random selection and mandatory embedded-thumbnail instructions. See docs/review11/FRESHNESS-PROFILE.md and docs/test11.md.


This file is **normative** for AI coding agents working in this repository.

**Owner update (2026-09-13), superseding older blanket RGB-flash requirements below:** Ordinary challenges use rear camera, Photo A flash off and Photo B LED flash on. Only selfie challenges use front camera with RGB screen flash for Photo B. Sign camera and flash method in protocol 0.3. Musical constrained-random cadences and pairing recovery are required; see docs/test4.md.

Read in this order before changing code:

1. `README.md`
2. `DESIGN_SPEC.md`
3. `protocol/README.md`
4. relevant docs under `docs/`

---

## 1. Mission

Build CLAPPA as four cooperating pieces:

1. native Android app;
2. native OBS Studio plugin;
3. shared/versioned proof protocol;
4. local verifier.

The core loop is:

```text
phone clap
→ audible clack cadence
→ random challenge
→ two-photo capture
→ signed event
→ local transfer to OBS
→ visible proof tile in video
→ event bound into session
→ final exact recording hash
→ phone-signed final seal
```

Preserve this loop.

---

## 2. Hard constraints

### MUST

- Android first.
- Native Android: Kotlin + Jetpack Compose unless a blocker is documented.
- Native OBS plugin.
- Local encrypted phone ↔ OBS communication.
- No CLAPPA-operated backend.
- No CLAPPA account system.
- No telemetry by default.
- Cute **brush-tail possum** mascot.
- Main phone screen resembles a stylized vector-art clapboard.
- Use light tweened animation, not heavy animation pipelines.
- Tapping the clapboard triggers a distinctive **clack cadence**, not just one click.
- The cadence pattern is part of the signed event.
- Every random challenge captures **two photos**:
  - Photo A normal
  - Photo B immediately after: rear LED flash for ordinary prompts, front-camera RGB screen flash for selfies
- Photo A is the normal visible proof photo shown to viewers.
- Photo B is stored, hashed, signed, and carried in machine-readable proof. Show B briefly on top of A, then fade B away; A remains underneath throughout.
- After every successful random challenge, offer **Verify something else?** for ~6 seconds.
- Claim photo is optional and must follow a random challenge.
- OBS proof tile visibly shows Photo A.
- OBS proof tile includes machine-readable proof transport.
- Save ordinary JSON + JPEG files in a local proof folder.
- Final exact recording hash must be signed after OBS closes the recording.
- Produce deterministic test vectors.
- Fail closed.

### MUST NOT

- Add blockchain.
- Add cloud DB/services.
- Add signup/login.
- Add hosted proof storage.
- Add analytics.
- Add automatic AI/deepfake classifier to the MVP.
- Require special trusted camera hardware.
- Claim the proof mathematically guarantees the video is physically real.
- Pretend a perfect future world model would not degrade the anti-synthesis value.
- Treat historical public randomness as a full freshness proof.
- Hide failed or skipped challenge state.
- Add a license without explicit owner approval.

---

## 3. Security model discipline

Agents must preserve the following distinction:

- **Cryptography protects integrity, authorization, and transcript authenticity.**
- **Physical challenge-response increases the practical difficulty of synthesizing compliant media.**
- **If perfect cheap real-time world simulation exists, the physical anti-AI advantage largely disappears.**
- **CLAPPA still remains useful then as provenance/integrity/timing/authorization.**

Do not write code or docs that blur those statements.

---

## 4. Security invariants

### 4.1 Signing key stays on the phone

OBS never gets the long-term private signing key.

### 4.2 Event chain is append-only

Changing, deleting, inserting, or reordering signed events must be detectable.

### 4.3 Both photos are immutable

Both Photo A and Photo B have exact hashes in the signed record.

### 4.4 Final recording is immutable after sealing

After OBS closes the file:
- hash exact bytes
- get final signature
- changing one byte later must fail exact verification

### 4.5 Random before claim

Claim-photo capture can never replace the random challenge step.

### 4.6 Fail closed

No final signature = no verified session.

---

## 5. Protocol rules

### 5.1 Signed event contents must now include

Where relevant:
- challenge ID
- cadence pattern
- flash colour
- Photo A hashes
- Photo B hashes
- OBS commitment state
- timestamps
- previous-event hash
- signature algorithm
- signature

### 5.2 Canonicalization

Use JCS / RFC 8785 canonical JSON for signed objects.

### 5.3 Signatures

Protocol must be algorithm-tagged.

The first implementation may use Ed25519 or another documented algorithm if that is a better Android-key-storage fit. Whatever is chosen must be explicit, tested, and versioned.

### 5.4 Randomness

Owner correction (2026-09-16) supersedes local random selection of challenge outputs. The challenge, complete musical phrase and illumination must be reproducibly derived from a verified NIST beacon pulse and the authenticated, exact preceding OBS media commitment and session context. No independent phone rerolls. Use OS CSPRNG for keys, session identifiers and other cryptographic setup, not as a substitute for the required public derivation. Freeze all selection inputs and the target future pulse before its release; document how that ordering is externally observable, rather than trusting a local timestamp. See `docs/reviews/2026-09-16-owner-protocol-correction.md`.

The intended interaction has a 10-second response countdown. The public freshness label is the verified NIST beacon time, not phone-reported image-save time. QR transport must carry the independently verifiable beacon/derivation context. Camera hardware attestation is not an acceptance requirement: viewers judge concurrence of the stream, action and supplied images. Test9 has not implemented this beacon profile; do not describe that implementation gap as the owner's intended design.

---

## 6. UI requirements

### Native layout and review discipline (owner review, 2026-09-14)

- Consume Android `WindowInsets.safeDrawing` around all interactive screens, including camera controls. Support status bars, gesture/three-button navigation and display cutouts in both orientations. Only decorative backgrounds and the intentional RGB illumination layer may extend behind system surfaces.
- Use measured Compose layouts for text, controls and mascot placement. Do not place an entire application by scaling browser coordinates. Keep minimum 48 dp touch targets and readable font scaling; use scrolling when compact windows cannot fit controls.
- Pairing, waiting for an OBS recording, ready, busy, failed and sealed states must have distinct visible explanations. Never present a silently disabled “Tap to clap” action as a ready state. Pairing prompts must be actionable buttons.
- Use complete mascot sprites. Mirroring must preserve their bounds. Reserve separate measured regions for the mascot, instruction bubble and capture control; inspect the native result, not only the browser prototype.
- Layout acceptance requires native portrait/landscape review with system bars and cutouts. If device/emulator verification is unavailable, label the deliverable a test build and explicitly report the unverified checks; compilation is not visual QA.
- OBS QR frames use one grid version and fixed quiet-zone geometry per sequence. The source freezes the QR throughout entrance and before/through exit; frame advancement starts only after settling. Test every generated QR frame for recovery.
- Photo A remains mounted underneath Photo B. Briefly show B and fade it out over A using identical image bounds, never an empty transition frame.
- Portable private identities are imported on the phone only, before pairing/session start. OBS may import public identity records or fingerprints. Never move a signing key into OBS, silently replace an active session identity, or log imported key material/passwords.
- Treat `docs/review7/CONTRACT.md` as the current layout/state contract. One primary action per state; a button must perform the action it names. Connected status is a passive green dot. Settings and connection management are distinct. Preserve pairing between recordings.
- Idle phone mascot is hidden. During a prompt, use a large whole sprite rising from the bottom safe edge. A speech pointer must follow the sprite's muzzle under its exact transform. Never cut anatomical parts from a flattened sprite. Keep the body, bubble and action button from overlapping.
- Use the same three-screw hinge geometry and wordmark on Android and OBS. Inset gutters match the charcoal board. Camera has a branded accent, back arrow and concentric-circle shutter.
- A browser mockup is not APK evidence. Capture the native app after its content has appeared, verify portrait/landscape and enlarged text/navigation modes, and exercise the real camera/transfer/seal flow separately from layout fixtures. Never report a splash-screen capture as a UI check.
- Run local transcode/recovery tests when QR geometry or transport changes. Report resolution, source scale, payload, successes and failures. Never generalize a local test into a Twitch/YouTube guarantee.

### Android

Must provide:
- clapboard main screen
- brush-tail possum guide
- challenge display
- clack cadence playback
- two-photo challenge capture
- 6-second claim-photo prompt
- pairing UI
- session-active UI

### OBS

Must provide:
- dock
- pairing display
- proof tile source
- proof-tile QR rendering
- session state indicators
- output-path visibility
- optional Twitch trigger controls

---

## 7. Audio cadence requirement

A challenge event needs a short audible sequence made from beat slots that may or may not contain a clack.

Example model:

`1 0 0 0 1 1 0`

Interpretation:
- `1` = clapboard clack sound
- `0` = scheduled silent rest

Requirements:
- encoded in signed event
- played during challenge initiation
- short enough not to annoy users
- branded and recognizable
- not treated as high-grade cryptographic entropy by itself

---

## 8. Two-photo challenge rules

For each random challenge:

1. show prompt
2. capture Photo A
3. use rear LED flash, or an actual red/green/blue screen flash for a selfie
4. capture Photo B immediately
5. sign both images in one event or tightly linked adjacent events
6. briefly show Photo B over Photo A in the proof tile, then fade to A
7. include compact canonical derivatives of both photos in machine-readable proof

Keep implementation simple.

Do not overcomplicate this into a full video-burst system in the first build.

---

## 9. Practical QR transport assumptions

Design conservatively.

A 4-second tile in a small-ish lower-right region should initially target roughly:

- 2–4 KB minimum net recoverable payload
- 4–8 KB normal target

Therefore prioritize sending:
- event metadata
- signatures
- compact canonical Photo A
- compact canonical Photo B

Do not assume large video bursts, rich audio, or huge IMU traces fit reliably in the first version.

---

## 10. Build order

### Phase A — protocol and verifier
1. schemas
2. canonical event definition
3. include cadence + flash colour + two-image fields
4. deterministic test vectors
5. verifier CLI

### Phase B — Android single-event capture
6. clapboard UI
7. possum placeholder/vector
8. clack cadence
9. challenge selection
10. Photo A capture
11. Photo B flash-colour capture
12. local signing

### Phase C — OBS integration
13. plugin skeleton
14. pairing
15. receive signed event
16. proof tile rendering
17. QR payload generation

### Phase D — multi-event session
18. Verify button
19. claim-photo window
20. event chaining
21. recording lifecycle
22. final file hashing
23. final seal

### Phase E — extras
24. Twitch `🎬`
25. UI polish
26. demo packaging

Do not start Twitch before end-to-end core proof works.

---

## 11. Documentation requirements

If you change the protocol, update:
- `DESIGN_SPEC.md`
- `protocol/README.md`
- relevant schema/test vector docs
- verifier expectations

If you change the product claim, ensure it stays conservative and truthful.

---

## 12. Release-readiness checklist

Before calling v0.2 demo-ready:
- [ ] clapboard UI exists
- [ ] possum exists, at least placeholder vector
- [ ] challenge cadence plays
- [ ] cadence is signed
- [ ] Photo A captured
- [ ] Photo B captured under the signed rear-LED or selfie-RGB illumination
- [ ] both image hashes verify
- [ ] proof tile shows Photo A
- [ ] QR payload carries both compact proof images
- [ ] claim-photo button works
- [ ] recording final hash is signed
- [ ] verifier can distinguish valid/incomplete/mismatch
- [ ] documentation states the perfect-world-model limitation

---

## 13. Definition of done for the first true demo

A user can:
1. install app and plugin,
2. pair them,
3. start a recording,
4. clap on camera,
5. hear the cadence,
6. receive a possum challenge,
7. capture Photo A and Photo B,
8. see a cute proof tile in OBS,
9. optionally take a claim photo,
10. end the session,
11. receive recording + proof folder,
12. run verifier,
13. get `EXACT ORIGINAL VERIFIED`.

Until that works, avoid scope creep.


## Current visual construction (Test8)

Follow `docs/review8/CONTRACT.md`. Both targets have a moving upper jaw and a fixed lower jaw with mirrored chevrons, contact shadow and a plate flush with both left edge and lower-jaw base. Preserve the shared pivot/screw coordinates. Render and inspect actual native screens before claiming layout parity. OBS source is now 872×480: reserve footer space and keep QR integer modules; document repositioning instead of silently modifying an existing user scene.

## Test9 review implementation

The owner does not want to run engineering checks or recruit testers. Agents own automated/native validation and must report actual results and unfinished work. See `docs/review9/MEDIA-PROFILE.md` and `docs/test9.md`. OBS now uses the wider photo layout without its rejected mascot; Android retains its whole-sprite guide. Preserve signed QR challenge/media context, verify actual recording packets, and never call `obs_frontend_streaming_stop` when finishing a proof recording. Recording completion stops the session's stream monitor, not the broadcast. Stream-first operation is verified; dynamic output membership remains unfinished. Do not equate decoding a QR with verifying its media prefix.

## Human judgment objective (owner clarification, 2026-09-16)

The central goal is to bind a fresh challenge, its photos and the ongoing stream so an ordinary viewer can judge whether the response was fair and the two camera views are coherent. Practical resistance to coordinated fabrication is the design target; evaluate relevant attacker resources, visual overlap, response timing and human judgment together. Single-stream generation FPS alone does not settle this question. Preserve the cryptographic invariants as support for this evidence. Do not recast the project as identity-only provenance or treat old speculative wording as an advocated numerical AI-detection claim. See DESIGN_SPEC section 3.2 and the corrected critical review.

## Test10 implementation discipline

Read `docs/test10.md`, `docs/review10/TIMING-PROFILE.md` and `docs/review10/NEXT-CAMERA-PROFILE.md`. Keep the signed ten-second policy enforced in Android, native OBS, detached QR validation and the bundle verifier. Countdown starts at issuance, not after audio/camera setup. Do not mislabel phone-reported completion times as sensor exposure or NIST time. Separate UI screenshot collection from timed flow checks so the harness does not consume the response window.

The dual-camera experiment is unsigned, local-only, capability-gated and does not establish simultaneous exposure. Preserve those labels until a full portable multi-view proof profile and illumination/timing/QR checks exist. There is no iOS build yet. Maintain the shared JavaScript/Kotlin choice vectors for the future beacon profile; their presence does not mean the native app uses that profile. Current NIST certificate/signature mismatch evidence is retained in review10; do not bypass verification or substitute a historical pulse as fresh.



