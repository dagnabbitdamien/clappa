**Test19:** QR hold is 180ms with full 2k redundancy; OBS renders one static photo board plus QR-only layers. Recent acknowledged challenges allow Stop & seal for 30 seconds under existing SESSION-v2 semantics, without inventing an end challenge. See docs/test19.md (../docs from protocol).

**Test17.1 (2026-10-02):** New QR uses CLAPPA3 systematic Cauchy erasure coding (any k of 2k frames); preserve legacy verification. No change to signed envelopes, hash-only photos or Twitch first-token/later-reference policy. Frame hold remains 240ms. Windows Twitch issuer keys use authenticated WinHTTP independently of Qt TLS; never trust phone-supplied issuer keys. See docs/review17.1/TRANSPORT.md (../docs from protocol).

# CLAPPA — Full Product & Technical Design Specification

**Test14 (2026-10-01):** Native Streamer/Viewer modes and optional Twitch OIDC account evidence are specified in [the identity extension](docs/review14/TWITCH-IDENTITY.md) and [build notes](docs/test14.md). Viewer scans validate schema, signatures, public-beacon derivation and timing; visual concurrence remains a human judgment. A nonce binds Twitch's full signed token to the CLAPPA public key, and a separate phone signature binds that evidence to each photo event. First QR carries issuer evidence, later QRs reference it. No JPEG pixels, Twitch access tokens or client secrets are added to QR. Twitch sign-in is an explicitly requested optional third-party identity link, not a CLAPPA account requirement. Live account authorization remains unverified in this test build.

**Test12 owner update (2026-09-16):** New sessions use `CLAPPA-SESSION-v2`: missed challenges are signed and reported without terminating the recording, stopping OBS automatically seals with the connected phone, extra-photo offers last 30 seconds and Photo B has a signed three-second window. Optional `CLAPPA-DUAL-v1` binds four front/rear normal/illuminated photos. Only completed proofs pop up on stream; waiting for the beacon stays on the phone. New identities support explicit password-protected private backup export, while existing non-exportable keys remain unchanged. See docs/review12/SESSION-POLICY.md and docs/review12/QR-PAYLOAD.md. This supersedes conflicting older failure, consent, timing, dual-camera and identity-export instructions.


**Test11 owner update (2026-09-16):** Native challenges now use authenticated three-second Quicknet pulses, the permitted NIST alternative. All choices bind to a signed pre-pulse OBS commitment. New QR carries signatures, beacon evidence and both photo hashes, without unreadable 64-pixel JPEGs; original photos remain local and visible. This supersedes historical local-random selection and mandatory embedded-thumbnail instructions. See docs/review11/FRESHNESS-PROFILE.md and docs/test11.md.


**Status:** v0.3 build specification  

**Historical Test10 update (superseded by Test11 above):** `docs/test10.md` and `docs/review10/TIMING-PROFILE.md` specify the signed ten-second local response policy, larger phone guide, additional selfie actions and separate unsigned dual-camera experiment. Offline NIST verification and cross-language deterministic-choice reference code have been added, but the required native beacon-bound challenge/QR flow remains unfinished. This update supersedes historical descriptions of implemented timing and the limited selfie prompt set; it does not relax the owner's beacon requirement. See `docs/review10/NEXT-CAMERA-PROFILE.md` for Android/iPhone capability gates and the proposed multi-view profile.

**2026-09-14 Test8 visual update:** Two matched 32-unit jaws, opposing chevrons, a full-height three-screw plate, bounded phone slate and revised OBS media/footer layout are specified in `docs/review8/CONTRACT.md`. The native OBS source is now 872×480; retain scale 1 and reposition the source after updating. Audio selects 120 or approximately 135 BPM under `docs/cadence-v2.md`. State behavior and signed profile remain unchanged.

**2026-09-14 Test7 review:** The owner's test6 report invalidated its visual/flow acceptance. The current state/layout authority is `docs/review7/CONTRACT.md`; actual native review evidence and test limits are in `docs/review7/` and `docs/test7.md`. One primary action per state, saved pairing, a real remote recording action, consistent safe areas, whole-sprite guidance and synchronized CameraX screen flash replace the rejected behavior. Signed events remain protocol 0.3; compact QR transport is now version 2, with a backward-compatible decoder.
**Primary target:** Android + native OBS Studio plugin  
**Architecture:** local-first; no CLAPPA backend/accounts  
**Primary verification artifact:** original OBS recording + plain proof directory  
**Branding:** CLAPPA, with a cute animated **brush-tail possum** mascot

**Current owner authorization:** MVP implementation is authorized in phase order, with the owner subsequently authorizing work below the original 75% remaining floor to fix pairing and remove the companion. Mascot #9, paper-cut shapes, in `docs/mockups/09-brushtail-character-sheet.png` is the approved visual direction. This supersedes the historical documentation-only pause below.

**Owner clarification (2026-09-12):** Samsung Galaxy S22 Ultra is the first Android test device. Windows is the first OBS development/test platform; Windows, macOS, and Linux are the intended plugin targets. See `docs/platform-notes.md`.

**Presentation workflow:** Before UI implementation or finished artwork, create and review alternative mockups for startup, the main tappable clapboard, verification, and the OBS proof tile. Follow `docs/design-mockup-brief.md`. Implementation is authorized; mascot #9 is approved.

---

## 1. Product in one paragraph

CLAPPA is a playful proof-of-reality and media-provenance system for video. A phone app looks like a stylized clapboard. The streamer holds it on camera and taps it; the clapboard animates and plays a distinctive challenge rhythm made of several possible clack beats and rests. A cute brush-tail possum then gives the user a random photo challenge such as **“Take a picture to your left.”** The phone captures a **two-photo burst**: one normal image and one illuminated image taken immediately afterward. Ordinary prompts use rear LED flash; front-camera selfies use red, green or blue screen flash. The phone signs the resulting proof event and sends it locally to OBS. OBS renders a cute proof tile into the video showing the ordinary photo for humans and an animated QR payload carrying the compact cryptographic proof. At the end, OBS hashes the exact final recording file and the phone signs a final seal.

---

## 2. Product thesis

CLAPPA is **not an AI detector**.

It does not ask:

> “Does this video statistically look synthetic?”

It instead tries to make a valid fraudulent video satisfy a growing collection of authenticated constraints.

The evidence may include:

- an exact hash of the original recorded media;
- an authenticated event chain;
- random challenges;
- a recorded challenge cadence;
- full-resolution phone photos;
- compact canonical proof photos;
- a second flash-illuminated photo;
- visible challenge/proof tiles embedded into the main video;
- timestamps and OBS timeline positions;
- optional user-selected claim photos;
- optional viewer-requested challenges.

A verifier should be able to establish:

> **This exact original recording belongs to this signed proof session, and this session contains these exact independently captured challenge-response observations.**

A verifier must **not** claim:

> “Cryptography proves every depicted event is semantically true.”

---

## 3. Core product principles

### 3.1 Local first

The MVP must work with:

- one Android phone;
- one computer running OBS Studio;
- a local network between them.

CLAPPA must not require:

- a CLAPPA account;
- a CLAPPA server;
- hosted storage;
- analytics;
- subscriptions.

Third-party integrations such as Twitch chat may require the streamer to authorize those services locally.

### 3.2 Human-readable + machine-readable

Every challenge proof should make sense to humans **and** machines.

Owner clarification, 16 September 2026: the central product goal is human judgment of a fresh challenge response and its cross-camera coherence. A viewer compares the ongoing stream with the displayed original challenge photo and decides whether the action was fairly completed and the scenes agree. Cryptography binds that evidence so it cannot be quietly substituted or rearranged. The engineering objective is to make coordinated fabrication within the response window impractical for the intended attacker classes; evaluate that objective with current tools and ordinary viewers. Do not replace this goal with an identity-only product, an automated AI verdict, or repeated rebuttals of numerical confidence claims the owner did not advocate. Engineering analysis of timing and attacker resources belongs behind the simple viewing experience.

Humans see:

- the clapboard ceremony;
- the audible clack rhythm;
- the possum prompt;
- the visible high-quality challenge photo.

Machines get:

- signed event data;
- event chain linkage;
- hashes;
- cadence bits;
- flash colour;
- compact proof images;
- QR payload recovery.

### 3.3 Random challenge first, optional claim photo second

Every proof interaction starts with a **mandatory random challenge**.

After a successful random challenge, the app offers a brief **Verify something else?** button so the user can optionally capture a claim photo of whatever they want authenticated.

The optional claim photo must never replace the random challenge.

### 3.4 Conservative claims

CLAPPA may claim:

> This recording is cryptographically bound to a signed sequence of challenge-response observations captured during the same session.

CLAPPA must not claim:

> This mathematically proves the physical truth of every depicted event.

### 3.5 Future-proof honesty

If perfect, cheap, real-time world simulation eventually becomes commonplace, CLAPPA's physical anti-synthesis advantage degrades.

In that future, CLAPPA still remains useful as:

- a provenance system;
- an authorization/signing system;
- an original-file integrity system;
- a timing/witnessing system when external witnesses exist.

The spec and product copy must say this plainly.

---

## 4. Threat model

### 4.1 Primary attacker

Assume an attacker:

- does not possess the legitimate phone signing key;
- may possess advanced image/video generation tools;
- may attempt actor replacement, face replacement, splicing, scene replacement, or full synthesis;
- may attempt to replay genuine proof graphics;
- may attempt to build a fake video around genuine challenge observations;
- may attempt to control both the main stream and the phone imaging pipeline with coordinated filtering.

### 4.2 Important distinction

Cryptography can make it hard to lie about **what data was signed**.

Cryptography cannot by itself make it hard for the signed data to be **synthetic before signing**.

This is a core conceptual limit and should be documented to avoid confused design goals.

### 4.3 Perfect-world-model limit

If an attacker eventually has cheap, perfect, real-time world simulation able to answer arbitrary challenge requests indistinguishably from physical reality, CLAPPA no longer reliably distinguishes:

- real physical scene, versus
- perfect interactive synthetic scene.

At that point, CLAPPA's physical challenge layer loses most of its anti-AI discriminating power.

The remaining value is:

- identity/authorization;
- timing;
- exact-file integrity;
- externally witnessed provenance.

### 4.4 Coordinated filter limit

If an attacker can run the same appearance-manipulation filter over:

- the main OBS feed, and
- the phone challenge captures before signing,

then the two views may remain mutually consistent even though both are manipulated.

CLAPPA is therefore strongest when the attacker **cannot cheaply control every authenticated observation source in the same way**.

### 4.5 Out of scope

The MVP does not claim to resist:

- a compromised phone with private-key extraction;
- a maliciously modified CLAPPA app;
- a fully compromised OS fabricating all camera input;
- hardware sensor emulation;
- arbitrary nation-state compromise of every witness and the user's signing identity.

---

## 5. UX modes

### 5.1 Bookend mode

Start challenge + end challenge + final seal.

Useful as low-friction ceremony and provenance.

### 5.2 Manual verify mode

During a recording, the user presses **Verify**.

Each Verify triggers:

1. patterned clack cadence;
2. random challenge;
3. two-photo burst;
4. visible proof tile;
5. optional claim-photo window.

### 5.3 Chat-requested mode

If enabled, sufficient `🎬` messages from unique Twitch users trigger a challenge request.

Chat requests **that scrutiny happen**. CLAPPA still chooses the actual random challenge.

### 5.4 Future automatic challenge mode

Architecture should allow optional future automatic random challenge scheduling, but this is not required in the first working build.

---

## 6. User flow

### 6.1 Pairing

1. User opens CLAPPA dock in OBS.
2. Clicks **Pair phone**.
3. OBS displays pairing QR.
4. Android app scans it.
5. Phone connects directly to the native OBS plugin using certificate-pinned HTTPS (https-poll-v1). No companion program is required.
6. Both sides display a pairing confirmation.
7. Session becomes connected.

### 6.2 Start flow

1. User starts recording and/or streaming in OBS.
2. User holds phone in view of main camera.
3. Phone shows large clapboard UI and session code.
4. User taps the clapboard.
5. Phone plays a challenge cadence consisting of several clack opportunities with some beats active and some silent.
6. The cadence is audible in-stream and recorded in the signed event.
7. Possum displays the random challenge.
8. Phone captures:
   - **Photo A**: normal image.
   - **Photo B**: immediately after, using rear LED flash or front-camera RGB screen flash according to the signed prompt.
9. Phone signs event data.
10. OBS shows proof tile containing Photo A, QR sequence, and challenge metadata.
11. Session becomes ACTIVE.

### 6.3 Claim-photo flow

After the random challenge succeeds:

- show **Verify something else?**
- visible for ~6 seconds
- if pressed:
  - capture one optional claim photo
  - sign and link it to the immediately preceding random challenge
  - show a claim-photo proof tile

### 6.4 End flow

1. User taps **End session**.
2. App tells user to hold clapboard on camera and tap.
3. Tap produces final cadence.
4. Final random challenge occurs.
5. Two-photo burst captured.
6. Final proof tile shown.
7. OBS recording stops.
8. Plugin computes exact final recording hash.
9. Phone signs FINAL_SEAL.
10. Proof folder is written.

If finalization fails, session is **INCOMPLETE**.

---

## 7. Visual identity

**Current owner direction:** Whole-sprite poses replace the rejected anatomical puppet. Keep the approved paper-textured character and use compression/bounce to mask pose changes. On the phone, hide the mascot when idle; show a large guide emerging from the bottom edge with a speech pointer attached to its muzzle. In OBS, only the crown/ears and curling tail peek around the lower-left board edge. The original Photo B briefly overlays A, then fades away. Transport uses repeated numbered chunks, not fountain coding; local transcode results do not certify Twitch/YouTube delivery.

**Owner-approved cute tagline:** “No cap! Clap!!” Keep this exact wording, capitalization and punctuation. It is playful branding, not a claim that CLAPPA guarantees a video's physical truth. Use sparingly so capture and verification screens stay uncluttered.

### 7.1 Mascot

Use a **brush-tail possum**, slightly animated, cute, vector-styled, using simple tweening rather than expensive frame-by-frame animation.

Personality:

- cheeky;
- friendly;
- streamer-friendly;
- concise;
- not infantilizing.

### 7.2 Phone look

The phone main screen should look like a stylized clapboard:

- vector art;
- fun and funky;
- bold readable shapes;
- good on camera;
- clear interactive tap target.

The screen should feel like holding an old-school physical clapperboard, inspired by early iPhone novelty apps that made the whole phone appear to become an object. The board occupies the majority of the screen, with a prominent hinged top bearing diagonal black-and-white stripes and a readable label/display panel on its face. Preserve this object-like presentation using vector art and light tweening.

Owner correction, 2026-09-16: NIST beacon freshness is a required protocol input, not optional decoration. Challenge, musical phrase and illumination must be deterministic functions of verified beacon data and the authenticated preceding OBS commitment/session context. Display “NIST freshness beacon” and its verified time; distinguish this from local/GMT clocks and phone-reported capture times. Include verifiable beacon and derivation evidence in QR transport. The intended challenge response window is 10 seconds. See [the protocol correction](docs/reviews/2026-09-16-owner-protocol-correction.md) for input commitment, freshness semantics and implementation status. Test9 is not an implementation of this required profile.

The OBS popup shares the phone's charcoal clapperboard, wordmark and three-screw bracket geometry. The original photo occupies a Polaroid aperture on the left and a large fixed square QR occupies the right. The caption repeats the exact phone prompt. The intended freshness footer identifies the verified NIST pulse and its time. Until that profile is implemented, do not relabel Test9's phone-reported timestamp as NIST evidence. Test9 removes the rejected OBS mascot and reserves separate footer space.

### 7.3 Animation

Use modest tweened motion for:

- clapboard open/close;
- possum popping in/out;
- pointer gestures;
- success state;
- proof sent state.

### 7.4 Sound

Test8 uses a real CC0 clapperboard strike in a single sample-timed buffer. A four-beat phrase at 120 or approximately 135 BPM has sixteen sixteenth-note slots: four anchored quarter beats plus two or three selected offbeats, producing six or seven hits. A bounded pentatonic contour resolves to the original pitch. `CLAPPA-RIFF-v2` derives its seed from the session ID, public identity fingerprint, fresh random challenge ID and signed issue timestamp. Cadence and slot duration are signed; pitches are reproducible from those same signed inputs. Repeated phrases can occur: this finite musical vocabulary is not a unique identifier or high-grade authentication. See `docs/cadence-v2.md` and the audio credits.

Each challenge event should have a short **cadence sequence** composed of active clack beats and rests.

Example conceptual pattern:

`1 0 0 0 1 1 0`

where:
- `1` = audible clack beat,
- `0` = silent beat opportunity/rest.

This cadence is:

- audible to viewers;
- embedded in the stream;
- recorded in the proof event;
- intended as a bit more physical structure than a single click.

The MVP does **not** need this to carry large amounts of entropy; it is a helpful audible/temporal proof component and brand ritual.

---

## 8. Challenge set

A small prompt set is acceptable for MVP.

The number of prompt types is not primarily a cryptographic issue; it is a **scene-coverage and attack-cost issue**.

A minimal challenge family may include:

- left
- right
- up
- down
- front
- back

Recommended additions:

- photograph the recording camera
- photograph the main subject from another angle
- photograph the setup/room

The initial repository challenge set may remain small and grow later.

---

## 9. Two-photo burst model

**Current protocol 0.3 requirement:** Rear camera for all random prompts except selfie: Photo A flash off, Photo B LED flash on. Selfie uses the front camera with normal Photo A and RGB screen-flash Photo B. Both camera and illumination are signed. This replaces the earlier screen-flash-for-every-challenge design throughout this document. See `docs/test4.md`.

### 9.1 Random challenge capture

Each random challenge captures two photos.

#### Photo A — ordinary photo
- normal capture
- shown to viewers in the proof tile
- stored in full resolution locally
- canonical proof derivative included in QR stream

#### Photo B — illuminated photo
- taken immediately after Photo A
- rear camera uses its LED flash; only a front-camera selfie uses a red, green or blue full-screen flash
- second photo captures the scene under that illumination
- shown briefly over Photo A in the OBS tile, then faded away without changing either signed photo
- stored locally
- hashed and signed
- compact canonical derivative included in machine-readable proof payload

### 9.2 Why this is useful

The second image introduces a small extra perturbation while keeping the UX simple:

- very cheap to implement;
- still visually cute;
- adds another scene-dependent observation;
- helps machine verification and human spot-checks later.

This is not assumed to defeat a perfect future world model. It is a practical attack-cost increase against weaker systems.

### 9.3 Claim photo

The optional claim-photo step stays a **single user-chosen photo** unless later experimentation justifies a more complicated claim-photo protocol.

---

## 10. OBS proof tile

### 10.1 Visible contents

The proof tile should include:

- original Photo B briefly fading to original Photo A in one fixed aperture
- exact challenge prompt, or an explicit additional-photo label for a claim
- large animated QR in a fixed mount with a four-module quiet zone
- readable digital snapshot GMT time, with the date secondary
- CLAPPA wordmark, subtle crown/ears and curling brush tail

Photo B is not normally shown to viewers in the tile.

### 10.2 Tile size and duration

Target:
- lower-right or lower-third-right area
- around 4 seconds visible
- not too intrusive
- still big enough for QR recovery and human legibility

### 10.3 In-video proof

The authoritative proof may eventually become **mostly self-contained in the video**, with the local sidecar primarily preserving:

- original full-resolution photos;
- proof folder convenience;
- final exact-file seal if not yet stored as a trailer or container extension.

The current MVP still saves a proof folder.

---

## 11. Machine-readable transport

### 11.1 Practical payload budget

Design conservatively for a lossy transcoded stream and smallish QR area.

For a 4-second visible tile, realistic engineering targets are:

- **minimum/worst-case:** ~2–4 KB net recoverable proof payload
- **normal target:** ~4–8 KB net recoverable proof payload
- **stretch target:** ~10–15 KB in favourable conditions

Do **not** assume QR's theoretical maximum is usable in a small stream corner.

### 11.2 Consequence

A compact proof event can comfortably include:

- event metadata;
- hashes;
- signature;
- cadence pattern;
- flash colour;
- compact canonical proof images.

Large video bursts should **not** be assumed for v0.1/v0.2 transport.

The new recommended compact proof artifact is:

- canonical Photo A
- canonical Photo B
- signed event metadata

This is a better fit than trying to embed a full multi-frame burst immediately.

### 11.3 Animated QR structure

Use an animated sequence of QR chunks.

Transport v2 uses the ASCII prefix `CLAPPA2:` and Base45-encoded binary data: 32-byte whole-payload SHA-256, two-byte index, two-byte count, four-byte CRC32 and up to 200 payload bytes. Integers are big-endian. The signed payload carries session/event identity. Native QR uses fixed version 12, medium error correction and four-module quiet zones. The source renders four logical pixels per module at its default 872×480 size. See `protocol/README.md` for wire details and compatibility.

Add repeated cycles and redundancy; later versions may add outer erasure coding.

---

## 12. Cryptography

**Portable identity:** Phone Settings imports a password-protected P-256 PKCS#12 private identity into Android Keystore. The owner retains the source file as the portable backup; a device-generated non-exportable key is still supported but cannot be exported by this feature. OBS can restrict pairing to a public fingerprint and never receives the private key. There is no CLAPPA account or Twitch-password signing. See `docs/portable-identity.md`. Time/identity-linked musical derivation is documented in `docs/cadence-v1.md`.

### 12.1 Algorithms

Implemented v0.3 profile: ES256-P1363 (P-256/SHA-256), low-S signatures, DER SPKI public keys, JCS payloads and signed-envelope hash chain. See `protocol/README.md` and `protocol/schema.json`. Android signing keys remain non-exportable in Android Keystore. Native encoded-packet capture, periodic phone checkpoints and terminal output heads are implemented. See docs/native-pairing.md for tested scope and remaining packet-to-container matching limits.

Preferred baseline:
- SHA-256
- canonical JSON (JCS / RFC 8785)
- algorithm-tagged signatures

Implementation may use Ed25519 or a documented alternative if Android key handling makes another choice more practical. The protocol must identify the algorithm explicitly.

### 12.2 Event chain

**Required companion media chain:** the event chain is not sufficient by itself. Every selected OBS encoded audio/video output must have a continuous packet hash chain, with periodic phone-signed checkpoints and terminal heads bound into the final seal. The packets containing visible proof tiles are covered by subsequent checkpoints. See `docs/media-commitment.md` for causal ordering, output scope, failure handling and verification requirements. The initial empty-prefix implementation is a development placeholder only, not an acceptable MVP commitment.

Each event includes:
- protocol version
- session ID
- sequence number
- previous event hash
- timestamps
- event type
- challenge data
- cadence pattern
- flash colour where relevant
- image hashes
- OBS commitment state where relevant
- signature algorithm
- signature

### 12.3 Final seal

After recording closes:
- hash exact original file
- sign final seal
- store seal locally and/or later in a trailer/container extension

---

## 13. Media commitment

### 13.1 Running session commitment

This means actual continuous encoded output coverage, including all video/audio packets and the rendered proof tiles. It is not merely a timestamp, recording ID or chain of challenge metadata. Stream and recording outputs have separate chains when both are used. Target phone checkpoint signing once per second and around each challenge; finalization must cover the final tile and tail packets. See `docs/media-commitment.md`. Editing is detectable against signed checkpoints; this is not a guarantee of physical reality or externally witnessed live timing.

OBS maintains a progressive commitment over the evolving recorded session.

This helps bind proof events to their place in the session.

### 13.2 Final exact-file commitment

After the recording closes, hash the exact file bytes and have the phone sign them.

This is what lets a verifier say:

> **EXACT ORIGINAL VERIFIED**

### 13.3 Self-contained future

A later architecture may append a final CLAPPA trailer or 2-second closing card + trailer so the proof becomes effectively self-contained in one file.

This is a future refinement, not required for the first end-to-end build.

---

## 14. Twitch integration

### 14.1 Trigger

Default trigger: `🎬`

Suggested defaults:
- 5 unique users
- 15-second window
- 60-second cooldown

### 14.2 Security meaning

Chat requests **when** a check should happen.

Chat does not supply trusted randomness or cryptographic validity.

### 14.3 Privacy

Do not store full chat logs by default.

---

## 15. Zoom / virtual camera use

CLAPPA may be useful in Zoom/job-interview contexts through OBS virtual camera mode.

In that mode:
- the other party may simply see proof moments live;
- they may not retain the local proof bundle;
- if the meeting is recorded, the QR-visible proof may be recoverable later.

This is a valid secondary use case and should be noted in docs, but not allowed to overcomplicate the first build.

---

## 16. Nation-state / extreme adversary note

CLAPPA should document that distributed randomness/timestamp witnesses can harden timing claims, but no ordinary-phone protocol survives an adversary who controls:

- every relevant witness;
- the user's signing identity;
- and a perfect simulation pipeline.

This is a limitation note, not an implementation goal.

---

## 17. Local proof directory

Example:

```text
2026-09-10_Clappa_Test.mkv
clappa-proof/
├── session.json
├── public-key.json
├── final-seal.json
├── events/
│   ├── 000001-session-created.json
│   ├── 000002-start-clap.json
│   ├── 000003-random-challenge-issued.json
│   ├── 000004-random-two-photo-accepted.json
│   └── ...
├── images/
│   ├── 000004-photoA-original.jpg
│   ├── 000004-photoA-proof.jpg
│   ├── 000004-photoB-original.jpg
│   ├── 000004-photoB-proof.jpg
│   └── ...
└── logs/
    └── diagnostic.log
```

---

## 18. Verifier outputs

The verifier should distinguish clearly between:

- `EXACT ORIGINAL VERIFIED`
- `PROOF TRANSCRIPT VERIFIED, MEDIA MISMATCH`
- `INCOMPLETE SESSION`
- `INVALID PROOF`
- `UNSUPPORTED VERSION`

It may later additionally report:

- `IN-VIDEO PROOF RECOVERABLE`
- `IN-VIDEO PROOF INCOMPLETE`

---

## 19. Viewer-facing language

Good language:
- **Capture proof available**
- **Exact original verified**
- **Physical capture evidence**
- **Signed challenge photos**
- **Live challenge check**

Avoid:
- **AI-proof**
- **guaranteed real**
- **99.9999% real**
- **unhackable**
- **mathematically proven true**

If AI eventually reaches the perfect-world-model failure condition, future CLAPPA copy may shift more toward:
- provenance
- signed live production
- interactive origin
- integrity

rather than anti-synthetic physicality.

---

## 20. MVP non-goals

Do not build yet:
- cloud servers
- accounts
- blockchain
- automatic AI detector
- secure signed camera hardware requirement
- large multi-frame burst embedding
- complex audio/IMU embedding in first milestone
- iOS
- C2PA integration
- multiple simultaneous phones
- patent workflow

---

## 21. Suggested milestones

### M0 — protocol skeleton
- repo layout
- event schema
- canonicalization
- signature interface
- challenge-set file
- verifier
- test vectors

### M1 — Android clapboard app basics
- vector clapboard UI
- brush-tail possum placeholder art
- tweened animation
- clack-cadence playback
- local key generation/storage
- challenge selection
- two-photo capture
- local signing

### M2 — OBS plugin skeleton + pairing
- dock
- pairing QR
- encrypted local transport
- session state

### M3 — proof tile and one full event
- receive event
- render Photo A
- render QR animation
- save Photo B and metadata
- record cadence and flash colour

### M4 — multi-event active session
- Verify button
- claim-photo window
- event chaining
- chat-trigger plumbing

### M5 — exact-file final seal
- recording stop hook
- exact file hashing
- final signature
- proof folder writing
- verifier exact-file check

### M6 — polish/demo
- refined possum vector art
- nicer clap animation
- clearer tile styling
- demo project

---

## 22. Acceptance tests

At minimum:
1. event signatures verify
2. event-order tampering fails
3. image-hash tampering fails
4. final recording tampering fails
5. cadence pattern is included and verified
6. flash-colour field is included and verified
7. both Photo A and Photo B hashes verify
8. claim photo must reference preceding random challenge
9. QR payload reconstruction works on local recordings
10. incomplete finalization yields `INCOMPLETE SESSION`

---

## 23. Definition of success

CLAPPA v0.2 is successful when a developer can:

1. install app and plugin;
2. pair them locally;
3. start a recording;
4. hold the clapboard on camera;
5. tap it and hear a patterned clack cadence;
6. receive a possum challenge;
7. capture the two-photo burst;
8. see Photo A and QR proof appear in OBS;
9. optionally capture a claim photo;
10. end with another clap;
11. get original recording + proof folder;
12. run verifier and receive `EXACT ORIGINAL VERIFIED`.

That is enough to prove the architecture is real and worth further iteration.

## Test9 implementation addendum — 2026-09-16

The cumulative OBS media chain is resolved in photo proofs using the detached phone-signed `CLAPPA-MEDIA-PROOF-v1` profile. Each QR includes the signed challenge and binds its exact captured event to output IDs, cumulative hashes and packet boundaries. Later checkpoints cover the displayed proof. The verifier now compares archived committed packets with actual original H.264/AAC Matroska recording packets, with explicit container normalisation and bounded, reported terminal drain handling after full-file signature verification. Details, limitations and next steps are normative in [the media profile](docs/review9/MEDIA-PROFILE.md).

Finishing a proof recording does not end a running broadcast. Source dimensions remain 872 × 480; OBS has a larger photo aperture and dedicated prompt/time footer without its rejected mascot. Native phone visuals remain a separate measured Compose layout. See [Test9 build notes](docs/test9.md) for checks performed by the implementation agent, rather than checks delegated to the owner.



## Test14.1 prompt mapping (2026-10-01)

New challenges use `CLAPPA-CHOICES-v2`, committed before the beacon release. It replaces apparatus-dependent prompts with simple directional photos and expressive selfie actions. `CLAPPA-CHOICES-v1` retains its original order and semantics for verification. Both mappings are implemented in Kotlin, JavaScript and native OBS; new prompt text is generated from `protocol/prompts.json` and `protocol/dual-prompts.json`. Both-camera capture is the default on capable phones unless the person has explicitly chosen otherwise. See `docs/test14.1.md`.
