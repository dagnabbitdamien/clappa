# CLAPPA: critical product, security and design review

16 September 2026 · Test8 source and native evidence · Recommendations, not a new build

## 1. Verdict

**CLAPPA's intended standard is valid: give a human viewer a fresh challenge and linked evidence from two cameras, so they can judge whether the response and the depicted scene agree.** The purpose of the cryptography is to preserve those relationships and make substitution detectable. The viewer should need to understand the action and the pictures, not cryptographic internals or model performance statistics.

This is a plausible, testable way to make convincing fabrication harder. It is not established that the current challenge set makes fabrication impractical for most ordinary attackers. That is the engineering question to answer by testing cross-camera consistency, timely completion and human perception together. Fast single-stream generation alone neither disproves nor validates the design.

The previous version of this review wrongly treated speculative early wording as an advocated numerical product claim, then recommended a provenance-centred replacement for the actual goal. That attribution and recommendation are withdrawn. **Continue developing the human-interpretable challenge system.** Use the cryptographic findings below to protect that evidence, not to turn the product into a cryptography console.

This review inspected source, the actual Test8 Android screenshots, and OBS output evidence. It includes a reproduced QR identity-binding defect and a calculation of the entrance curve. It is a first-party engineering review, not an independent security audit. No production code, APK or plugin has been changed by this review.

## 2. Does this still help against fast AI?

**Yes: active, human-interpretable challenge-response is a sound direction.** Its advantage comes from forcing a deception to remain coherent through an unexpected action and a second view. Merely showing two plausible pictures is weaker than showing the same person, object and event from two perspectives at a recognisable moment.

### Evidence for the principle, and the current counterpressure

GOTCHA, accepted at IEEE Euro S&P 2024, studied challenges that expose human-visible failures in real-time face manipulation. Its human evaluation supports the principle of helping people judge a response rather than asking them to trust an opaque detector. The study used older generation pipelines and instructed, screened participants; it is not validation of untrained viewers, current diffusion models or CLAPPA's two-camera design. [GOTCHA paper and human evaluation](https://arxiv.org/html/2210.06186v3)

StreamDiffusionV2 reports a first frame within 0.5 seconds and approximately 58–65 FPS on four H100s for its reported configurations. That demonstrates fast generation, not success at maintaining a specific identity, scene geometry, unexpected physical interaction and independently captured second view simultaneously. Citing FPS as if it settles the CLAPPA question would be a category error. [MLSys 2026 paper abstract](https://proceedings.mlsys.org/paper_files/paper/2026/hash/698cfaf72a208aef2e78bcac55b74328-Abstract-Conference.html)

There is also research closer to the actual threat: the May 2026 RealCam preprint reports interactive novel-view synthesis, including 0.72-second first-frame latency for a 5B variant on an H20. That makes it unsafe to assume alternate viewpoints are automatically out of reach. It does not demonstrate an end-to-end CLAPPA attack, faithful flash response or imperceptible identity preservation under arbitrary challenges. [RealCam, experiments and limitations](https://arxiv.org/html/2605.06051v1)

My assessment is that **coupled, unexpected constraints are still worth exploiting**, but their useful margin must be measured against current attacks. The engineering team measures latency and attack cost; the audience should simply be able to see what was asked, what happened, and whether the views agree.

### What makes a challenge useful to a viewer

- **Shared subject:** both cameras show something the viewer can recognise as the same face, hand, object or part of the room. A ceiling photograph does little to test a face substitution if neither the ceiling nor the face bridges the two views.
- **Shared action:** an interaction in the main camera explains the photo: the same hand holds the same object, a face is seen from another angle, or an object partly obscures the same face. This couples identity, geometry and timing instead of letting the attacker satisfy unrelated tasks independently.
- **Fresh choice:** the attacker should not be able to select the easiest prompt or privately repeat attempts until one works. Which mechanism is necessary depends on whether the attack controls only the stream, or also the phone and challenge generation.
- **Visible continuity:** show the prompt at issuance and keep the main action available through capture. Preserve a short surrounding clip for later comparison. The clap/flash can help locate the moment, subject to measured audio, capture and stream offsets.
- **Enough detail and time:** the original photo should be large enough, and displayed long enough, to compare. Offer pause/replay, the nearby main-camera frames and A/B comparison in the local reviewer. The default broadcast remains simple.

Candidate challenge families to test include a selfie from a prompted angle while the main camera continues to show the person, an open hand next to the face, or a photo of the same distinctive object just shown in the main camera. These are hypotheses, not newly approved mandatory tasks. Choose a small set after checking comfort, camera handling, privacy and whether the relevant features really appear in both views. Avoid asking a viewer to compare perspectives with no identifiable overlap.

The two flash states add another possible constraint, but their contribution must be observable. A viewer might compare changed shadows or highlights with the depicted event; they cannot be expected to estimate illumination physics. Human-visible flash comparison and machine-verifiable image binding have complementary roles. The 64-pixel compact QR pictures are transport derivatives: **the larger displayed original is the primary human comparison surface**. The design should protect its size and legibility.

### Attacker models that actually test this goal

| Attacker | How CLAPPA could help | What must be tested |
| --- | --- | --- |
| Prerecorded footage, unable to prepare the upcoming challenge | A new response visibly tied to the ongoing scene makes replay harder | Old-session replay, prompt selection and hidden retries |
| Face swap or scene edit on the main feed; genuine phone capture | An overlapping second view can expose the altered feature | Use challenges that actually include that feature; an unrelated room photo is a weak test |
| Live actor with coordinated edits on both feeds | The attacker must keep identity, contact, occlusion and viewpoint consistent | Current consumer-accessible tools, the same edit in both feeds, ordinary stream compression |
| Entire synthetic scene or prepared 3D world | Unexpected interactions and identifiable detail can constrain fabrication | Both views may come from one shared scene representation; do not assume their difficulties multiply independently |
| Producer modifying phone software and selecting all evidence | The integrity layer preserves the chosen evidence, but local prompts alone cannot compel fairness | Fresh challenge issued outside that producer's control, visible issuance and bounded response; no requirement for a CLAPPA-operated backend |
| Someone rebroadcasts someone else's authentic challenge | Visual coherence can survive a relay intact | Distinguish coherent footage, its origin and its freshness; do not count all three as the same test |

These are test cases, not claims that every listed attack already succeeds. Nor does the existence of one weak challenge refute the whole design: it identifies where the challenge does not constrain the deception. The relevant question is what remains feasible after the attacker has to satisfy a well-chosen, overlapping challenge.

“Non-nation-state” is too broad to be the sole resource boundary. A capable individual can use custom software, prepared scene assets or rented compute. Define trials by available tools, compute, preparation time, knowledge of prompts and control of the phone. Do not require the viewer to understand those categories; they belong in evaluation and engineering documentation.

### Timing should support the comparison

Measure the time from an unpredictable instruction reaching the attacker to the bound response. FPS is not that time. A constant broadcast delay applied to both the instruction and response does **not** shorten the response interval. The problems to test are private early knowledge, producer-controlled timelines, selective buffering and replacing one view. The earlier review's broad statement about broadcast delay obscured this distinction.

Human aiming takes time too. Choose deadlines from observed legitimate completion times, including accessibility needs, then measure whether attackers can deliver convincing coupled evidence inside them. The system can enforce and preserve this quietly; users should not need to calculate timing budgets. For an adversarial producer controlling the phone, a viewer-issued unpredictable choice or another external source is a possible mechanism, not a reason to require an identity ceremony or a hosted service for every ordinary clap.

### The next experiment

Run a small comparison before another broad visual rebuild: ordinary stream alone; today's stream plus challenge photo; and two or three deliberately overlapping challenge families. Include genuine responses and consenting staged attacks from the table, then ask ordinary viewers two simple things: **Was the requested action completed? Do the photograph and the ongoing scene agree?** Record what features they used and allow “I can't tell.”

Run untrained viewers first; test a brief example separately rather than screening out poor performers and calling the result ordinary-viewer performance. Include realistic viewing size, lighting, perspective differences and compression so genuine mismatches are not mistaken for fabrication. Measure attack success and preparation cost internally. A valid outcome is learning that one challenge family helps while another adds little.

**Can the intended standard be achieved?** The mechanism is credible, and related research supports human-readable challenge-response. **Has the requested practical barrier been achieved here?** Not yet demonstrated: the current prompts often fail to force the relevant overlap, and the necessary current-model, coordinated-attack and viewer tests have not been run. The next work should strengthen and test that mechanism, keeping human judgment at the centre.

## 3. Cryptographic design: sound parts and missing links

The implementation has several good foundations: standard P-256 signatures and SHA-256, explicit algorithm tags, canonical signed records, low-S signature checks, chained events, hashes of both photographs, pinned encrypted local transport, and a final signature covering the exact recording hash. The private signing key stays on the phone. Failed or absent final seals do not become a complete verified session.

These are worth preserving. Replacing them with a Merkle tree or adding a blockchain would not solve the trust and freshness problems. Canonicalisation still needs a shared cross-language corpus and hostile-input tests, especially before adding arbitrary names or new numeric fields. Canonical byte agreement is the point of JCS. [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785.html)

### Priority findings

| ID / priority | Finding and evidence | Required next step |
| --- | --- | --- |
| C1 · High | **QR claimed identity is not bound to its actual verifying key.** An isolated test signed a valid photo event with a fresh test key but put an unrelated fingerprint in the event. QR encode/decode accepted it. Full-bundle verification does check this equality. | Require event key ID to equal the fingerprint of the actual signing key on every path; reject before presenting identity; add negative vectors shared across implementations. |
| C2 · High | **The signed packet archive and final recording are verified separately.** The verifier checks the packet chain and the exact recording hash, but does not independently match the archived packets to the recording's demuxed media. The phone signs the hash supplied by OBS. | Define a bounded supported container/codec profile; match packet contents, tracks, ordering and timestamps under documented mux transformations. Reject mismatches. Keep the OBS/phone trust assumption explicit. |
| C3 · High | **No independently established live deadline.** The verifier bounds the A-to-B gap but not issuance-to-A; times are producer supplied. Phone save-completion time is displayed with millisecond precision as a snapshot time. | Separate wall-clock labels, monotonic response durations and external receipt times. Use sensor timing where available, with uncertainty. Add response policy and an optional independently witnessed nonce/receipt protocol. |
| C4 · High | **Standalone QR lacks the signed challenge-issued record.** It carries the captured event, key and compact photos. The actual prompt, cadence and flash method are in another record. | Carry and verify the matching issued record, session context and required linkage. Budget the added bytes; do not silently exceed dwell time. Label incomplete context honestly. |
| C5 · High · implementation shortfall | **The standalone QR path does not complete the required verification against preceding media.** The design already requires a continuously evolving hash of every selected OBS output packet. That chain and periodic phone signatures exist. The QR carries a captured event with an indirect event-chain commitment, but omits the checkpoint context needed to resolve it, and its decoder does not accept media to recompute and compare the committed prefix. | Complete the specified binding: a signed, resolvable output ID, exact packet boundary and cumulative head in each proof; verification against the actual media through that boundary. A transplanted proof must fail on different preceding media. Also verify that the tile actually appears in the intended output. |
| C6 · Medium | **Long-session limits conflict with ordinary streaming.** Checkpoints arrive roughly once per second; the verifier rejects more than 10,000 events. Around 2.8 hours reaches that ceiling, sooner with other events. Packet archives also duplicate encoded output data. | Establish a supported session-duration/storage budget; stream manifest verification with limits enforced before allocation; test multi-hour recordings, disk exhaustion and interruptions. |

C1 does not forge a signature or defeat the complete-file verifier. It is an identity-confusion defect in the standalone transport path and would be dangerous if a viewer interface trusted the event's claimed fingerprint. The reproduction uses only a disposable test key. Results are in `audit-evidence.json`.

C2 does not mean sealed recordings can be changed undetectably: their signed exact hashes still catch later edits. It means the verifier cannot yet establish that the independently authenticated archive is the media inside that sealed file. Even after that linkage is implemented, a producer controlling the whole input/signing process can commit generated content. Integrity and physical truth remain different.

**Correction to the original C5 wording:** copying a QR graphic is not the same as successfully verifying that proof against different footage. The owner's requested construction is sound for exact committed media: each output packet advances a cumulative hash; the phone signs a checkpoint; a proof binds to that checkpoint. Altering covered bytes changes the recomputed head and must fail comparison with the authentic signed head. Recomputing unsigned hashes cannot repair that mismatch. The problem is incomplete implementation of that requirement, not a fundamental inability of the proposed construction to bind a proof to preceding footage.

Source trace: `plugin.cpp` advances `OutputChain.head` for every captured encoded audio/video packet. `Session.checkpoint()` signs output snapshots, and `issue()` includes them in the signed challenge. The captured event's `prev` indirectly commits those earlier records. `NativeService::tile()` exports only the captured event, key and compact images; `decodeTransport()` validates those but neither resolves the preceding checkpoint chain nor compares video. Full-bundle verification resolves events and checks the archive, then separately checks the sealed file hash. Finish C4/C5 together with C2 so the viewer's actual media is checked against the correct signed prefix.

One engineering boundary remains: a platform transcode legitimately changes encoded bytes. Exact-prefix verification applies to the committed output, not automatically to a re-encoded Twitch/YouTube copy. Preserve the exact proof guarantee and specify separately what can be checked from a transcoded viewing copy. Recovering an original commitment from its QR is not the same operation as reproducing that commitment from changed bytes.

The causal loop should be described precisely: a signed event refers to prior output checkpoints; its overlay enters subsequent output packets; later signed checkpoints commit those packets. A frame cannot contain its own already-finalised cryptographic commitment. A missing overlay must be detected through output checks, not assumed from the existence of a source object.

### Freshness without a CLAPPA backend

A candidate stronger mode can use a viewer or independent witness to issue an unpredictable nonce and record receipt of a bound response. Specify session, creator identity, nonce, response deadline, issue/receipt records and replay handling. The witness is then a stated trust dependency. A hostile or colluding witness is not an independent time authority.

An unpredictable public beacon can give a lower time bound after its value is published, assuming the beacon behaved as expected. Historical public values do not prove a response was prompt; a separate timely receipt is still needed for an upper bound. Keep the ordinary offline provenance mode available and label it accurately. Do not quietly introduce a hosted service or claim a local digital clock is a freshness oracle.

### QR transport and claims

The current transport repeats numbered chunks; it is **not fountain coding**. All distinct chunks are needed. Test8 uses a fixed version-12 QR: 65 modules plus four quiet modules on each side, at four source pixels per module, producing the 292-pixel square. Preserve that quiet zone. Reduce decorative framing before reducing the scanning margin.

Current dwell grows with payload: 11 chunks imply roughly 5.9 seconds before exit, while the maximum 41 chunks approach 20.3 seconds. Adding the missing challenge context therefore has a visible product cost. Establish a payload budget and measured recovery target before adopting parity/fountain coding, a lower-density profile, or a longer panel. Do not compensate by shrinking modules or speeding playback without testing.

The existing local re-encodes recovered 2/2 events at 1080p, 720p and 480p, and 2/2 at 720p with the tested blur; 360p recovered 0/2. These are two small events and local x264 tests, not a Twitch/YouTube guarantee. Test actual platform round trips, scene scale, motion backgrounds, bitrate, viewing distance and camera capture. QR payloads are public, machine-readable evidence; they are not encrypted secrets.

## 4. Pairing and identity: redesign the explanation and the sequence

The current dock exposes implementation terms before explaining the user's task. “New pairing code,” “trusted phone identity,” a 64-character fingerprint, and JSON import form a cryptography control panel. Renaming them without separating their purposes would retain the confusion.

Use three concepts consistently:

- **Connect your phone:** let this phone talk to this OBS installation over the local network. The pairing QR is a connection invitation, not a public identity.
- **Your signing identity:** lets viewers recognise proofs made with the same secret key. A display name is a label, not verified ownership of that name.
- **Identity backup:** lets someone restore a portable identity. Its password protects the backup file; a password alone does not recreate or publicly identify a key.

Suggested first connection: OBS shows “Connect your phone” with one QR and “In CLAPPA, choose Connect to OBS and scan this code. Keep both devices on the same network.” The phone shows the computer name and asks to connect. OBS then shows a passive connected state and “Manage connection.” Returning creators should reconnect without rescanning after an ordinary OBS restart; the present process regenerates its connection credentials on startup, so that requires implementation, not just better copy.

| Current control | Proposed surface and explanation |
| --- | --- |
| New pairing code | Under Manage connection: **Connect a different phone…** Explain that this replaces the connection invitation, not the creator identity or old proofs. Separate a harmless “Show connection code” action from a destructive reset. |
| Trusted phone identity (public key only) | Under optional identity verification: **Recognise this creator**. “Compare their public identity with one you already trust.” |
| Optional SHA-256 public-key fingerprint | Advanced: **Identity fingerprint**. “A public identifier you can compare. It is safe to share; it is not a password.” Group characters and provide copy/scan. |
| Use fingerprint | **Require this identity**. State precisely that this restricts which signing identity may connect; it does not verify a real-world name. |
| Import public-key.json | **Import public identity…** Accept the existing record; explain that it contains no signing secret. Never invite private-key import on OBS. |
| Phone PKCS#12 import | **Restore signing identity…** Then “Choose your identity backup” and “Backup password.” Keep format details in help. |

After a successful pairing, offer to remember that exact identity for this OBS installation, with a clear change warning on replacement. Recognition on the creator's own computer does not establish trust for viewers: viewers need the creator's public identity through a channel they already trust, or a previously saved identity.

The default Android-keystore identity is currently device-bound and cannot simply be exported. A portable identity needs a deliberate phone-only creation/restore and encrypted-backup design, with its different extraction/recovery risks explained. Never promise “Back up identity” for a non-exportable key. Never derive a signing key directly from an ordinary password. Recovery, loss and rotation must be understandable before we call identity portable.

## 5. Product flow: creator, OBS and viewer

### Phone

| State | Primary action | Explanation / secondary action |
| --- | --- | --- |
| Not connected | Connect to OBS | One instruction; identity restore is optional setup, not a requirement |
| Connected, not recording | Start recording | Actually starts recording; green connection status stays passive |
| Recording, ready | Tap to clap! | “Recording · ready for a challenge”; End recording is secondary |
| Prompt received | Open camera | Large prompt and guide together; avoid two different controls both called Capture |
| Camera | Concentric shutter | Same prompt, subtle brand, safe-area back control; explain two photos and flash before first use |
| Sending | Progress/status | Prevent duplicate capture; preserve recoverable evidence on failure |
| Photo received by OBS | Optional Add another photo | Distinguish “received” from “visibly included and recovered”; keep the six-second optional offer from moving other controls |
| Finishing | Finish and save proof | Explain final challenge, output closure and final signature as stages of one task |
| Complete | View / share proof files | State what was saved and which checks completed |
| Interrupted | Reconnect / finish incomplete recording | Preserve pairing and evidence; explain why an incomplete session cannot claim a final seal |

The six-second claim feature currently requires capture within that interval, although network delivery, opening the camera and aiming consume it. Test actual completion rates. A more usable future rule is a six-second **offer to begin**, followed by a separate bounded capture deadline. That changes the signed protocol rule and requires new versioned vectors; it must not be disguised as a UI-only fix.

### OBS

Default dock: connection, recording/proof status, last challenge and “Open proof folder.” Pairing and advanced identity controls appear when needed. Add a source-placement check and a clearly labelled test preview. Closing the dock must leave the native service running, as users expect; explain once that the dock is a control panel and the source is the on-stream display.

Two source-level hazards need fixing before wider testing. Starting streaming after recording currently marks the recording chain incomplete. A stop command currently stops the recording and also the stream if tracked. The UI must not let “finish proof” unexpectedly end a broadcast. Model recording and broadcasting as distinct lifecycles with explicit consequences. Test both start orders, either output stopping, scene switching, multiple sources, repeated sessions and reconnects.

Large final-file hashing currently runs synchronously in the service tick path. Move it to bounded background work with visible progress, then measure OBS responsiveness and dropped frames on realistic files. Rendering/PNG loading also deserves profiling; no performance failure is inferred solely from those code paths.

### Viewer: the most important missing interface

A CLI and animated data QR are not an ordinary viewer experience. A normal phone scanner will not open a useful website from the custom chunk payload. If viewers need a special decoder, say so and provide a discoverable local verifier with “Open video” and “Open proof folder.” A future live decoder can show collection progress and missing context without requiring a CLAPPA account or uploading private footage.

Design explicitly for someone watching on their only phone: they cannot point that same phone's camera at its own display. Importing a short clip or sharing it to a verifier is more plausible; one screenshot will generally miss chunks. At a 360-pixel-wide displayed player, a 1920-pixel source's four-pixel QR modules become only 0.75 display pixels. A camera scan of that display is not a reliable default. Decoding the underlying video file avoids that particular display reduction, but not platform transcoding losses. Make evidence collection convenient before adding any “scan to verify” promise.

Show separate answers: **Signature valid / Creator recognised or unknown / Challenge context complete or missing / Freshness witnessed or unestablished / Original recording matches or unavailable**. Explain each in one sentence. Do not collapse these into “Real,” “Human,” or “Not AI.” “EXACT ORIGINAL VERIFIED” may remain a precise technical result; the everyday explanation should be “This file matches the recording approved by this signing identity.”

Opening a transcoded clip should not be presented as cryptographic corruption merely because it is not byte-identical. Explain that an original-file check requires the original, while any recovered photo evidence has a narrower meaning. Invalid signatures, missing proof and unrecognised identity are three different outcomes.

## 6. Visual design: evidence first, personality second

### OBS panel

The paired sticks, restrained hinge, fixed QR position and full-photo transition are worth keeping. The composition still allocates attention poorly. A large high-contrast QR, thick stripe header, timestamp, mounting hardware, paper frame and fragmented mascot all compete with the actual photograph. The artificial tail silhouette and detached ear tips do not deliver the charm of the approved whole character.

At native scale, the source's bounding box already occupies about 20% of a 1080p frame. Its size and several-second dwell are a meaningful interruption. The next pass should gain useful photo area within that footprint, rather than enlarge the whole panel. Test it over representative busy streams and at the size viewers actually watch; do not evaluate only an isolated enlarged preview.

**Remove the mascot from OBS for the next layout trial.** Keep it on the phone where it can actually guide someone. Do not spend another iteration disguising a cropped texture as a tail. One small eucalyptus leaf could be tested later, but zero ornament is the useful baseline; it cannot obscure photo, QR, caption, time or brand.

The existing 872×480 source contains a 337×246 photo aperture: about 20% of its bounding area before letterboxing. A 9:16 portrait image uses only about 8% of the source. Most of the 100-pixel left reserve exists for the tail. Recovering that reserve permits a proposed **492×292 photo aperture while keeping the QR at 292×292**. That is 73% more aperture area; a contained portrait photo becomes about 19% taller, or 41% larger in image area, because height remains its constraint. Never stretch or crop evidence to manufacture a larger-looking photo.

The accompanying wireframe preserves source dimensions, matched sticks, a fixed QR mount and the full image. It uses a shared prompt row below the media and an unobstructed time/brand footer. It is a layout hypothesis, not approved artwork or evidence of an implemented change. Test landscape, portrait, square and very dark photos; 4:3 and 9:16 media need deliberate contain behaviour.

Keep the digital snapshot time requested by the owner, but give it a single quiet, readable row. Use human-readable accessibility text and document whether it means sensor exposure or file-save completion. Millisecond digits are not millisecond accuracy. Retain the wordmark without making it compete with the prompt. Maintain full-resolution display photos, identical A/B bounds, B fading over continuously mounted A, and a prompt that repeats the signed instruction.

### Entrance motion

The source's primary rise lasts 250 ms, followed by a small settle to 360 ms. Its cubic ease-out traverses approximately **35% of the total distance in the first 33 ms**. That explains why it can feel like a blink despite having a nonzero duration. This is a calculation from the current curve, not a measured dropped-frame diagnosis.

Trial a 300–317 ms primary rise: around 50–67 ms longer, equivalent to another 1.5–2 frames at 30 FPS. Redistribute the travel with a short acceleration and a controlled deceleration instead of arriving almost immediately. At 60 FPS the same added time spans 3–4 frames. Use time-based motion. Keep a tiny residual hinge lift and the existing fast 240 ms exit. The report includes a 310 ms smooth acceleration/deceleration study; it is not a physically validated final animation.

Photo and QR stay attached from the first visible frame to the last. QR advancement starts only after both the board and jaw settle, and stops before exit. Preserve the present 500 ms entry guard and 100 ms pre-exit freeze unless a tested replacement is stricter. Inspect actual rendered 30/60 FPS frames at OBS load, not just a browser animation.

### Phone and camera

The native Test8 screens visibly respect system surfaces and have clearer primary controls than earlier builds. The current portrait challenge still separates the action near the top from the instruction and character far below, leaving a large empty interval. Landscape is more coherent because prompt, character and control share a scan path. Portrait needs a composed vertical sequence: brand/status, compact slate clock band, prompt and action as a group, with the guide emerging from the bottom safe edge beside that group. Reduce empty distance without reviving face/button overlap.

Keep the same production-sans wordmark and matched-stick construction in both products. Reduce clock dominance during a challenge; the task should outrank decorative timecode. Use a restrained neutral charcoal palette, one consistent spacing scale, and measured content regions. The paper-textured mascot is the expressive accent; the rest should be precise and quiet. Whole-pose changes with small squash/settle are sufficient. No return to anatomical PNG slicing.

The camera has improved: restrained branding and familiar shutter treatment are appropriate. Review its prompt, flash explanation and capture progress on the real device with both cameras. A pleasant emulator camera view is not evidence that LED or screen illumination is correctly exposed on a Galaxy S22 Ultra.

## 7. Accessibility, privacy and understandable confidence

Native safe areas and 48 dp controls are necessary foundations, not complete accessibility acceptance. Review TalkBack reading order, semantic button names, status announcements, keyboard/switch navigation, 200% text, long translated prompts and all system-navigation modes. Custom-drawn clocks need meaningful semantics; do not announce every millisecond update. Android's semantics system is what exposes custom UI meaning to assistive technology. [Android Compose semantics](https://developer.android.com/develop/ui/compose/accessibility/semantics)

Use WCAG contrast, colour-independent meaning, timing and flashing guidance as design checks, without calling a native app automatically WCAG-certified. Measure the visual flash and animated QR rather than assuming either is safe or unsafe based on frame rate alone. [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

Offer reduced decorative motion and visual/haptic equivalents for sound cues. Do not silently remove an evidentiary flash while still claiming the same protocol completed. Provide a clearly labelled alternative challenge profile if needed, and sign that choice. Test mobility-limited users; random directions are not universally easy.

Before first capture, explain that the two images become public proof on stream, including the flashed image in machine-readable form. Room photos can expose addresses, other people and private possessions. Let users choose an allowed challenge profile before a session, and provide a visible refusal path that records the outcome. Do not allow silent rerolls to masquerade as the first successful challenge.

The musical phrase now has a real clapper sound, constrained rhythm and pitched notes; retain the approved 120/approximately 135 BPM versions. It creates recognition and enjoyment. It is not a secret password, a guaranteed-unique phrase or an independent high-entropy authentication channel. Make this distinction in documentation without cluttering the capture flow.

## 8. Implementation roadmap and acceptance gates

| Order | Work package | Done when |
| --- | --- | --- |
| 1 | Protect the evidence and run a focused challenge trial | C1 fails closed; no accidental stream stop; both output-start orders have tested behaviour. Specify and test the required C2/C4/C5 media-to-proof binding before calling it complete. Alongside that work, compare today's prompts with a few overlapping two-camera challenges and identify what ordinary viewers can actually judge. |
| 2 | Coherent connection and finishing flows | One default connection action; persistent device trust across ordinary restarts; clear phone replacement; identity restore explained; disconnects and repeated sessions preserve evidence and never produce false completion. |
| 3 | Small design implementation pass | OBS mascot removed, larger uncropped photo, unchanged QR geometry, readable footer; trial 310 ms rise reviewed at 30/60 FPS; portrait prompt and action brought together; native screenshots and recordings prove parity. |
| 4 | Viewer evidence interface and complete QR context | A nontechnical viewer opens evidence, sees A/B and the signed prompt, and can distinguish unknown identity, missing original, incomplete context and invalid proof; collection status is understandable. |
| 5 | Complete media binding and operational hardening | Supported muxed media is independently matched to packet commitments; wrong-file/archive substitution, omissions and ordering fail; multi-hour sessions and bounded background hashing pass; actual-output proof visibility is checked. |
| 6 | Harden the challenge families that the study supports | Measure coordinated manipulation and novel-view generation against the selected tasks; establish usable response bounds. Add external challenge issuance where the attacker controls local selection. Record which attacks remain feasible and retire ineffective challenges. |

Begin the human-coherence experiment with package 1, not after every cryptographic feature is complete. Packages 2–3 make the action and its evidence easier to use. Packages 4–5 make inspection and evidence binding reliable. Package 6 builds on measured challenge results. Protocol changes require DESIGN_SPEC, protocol documentation, schemas, cross-language vectors and verifier updates together. Supersede conflicting older UI-flow notes so later implementations do not revive obsolete rules.

Run a small formative study with 5–8 people who did not build CLAPPA: connect, make a challenge, compare the photo with the main-camera scene, understand the flash transition, finish without ending a broadcast unexpectedly, and locate proof. Record hesitation and the visual correspondences people notice or miss. This sample discovers usability problems; a separate larger study must assess attack resistance. If viewers cannot tell what the challenge is testing or cannot see the corresponding detail, fix the challenge and presentation.

Do not build an account system, hosted proof store, blockchain, AI detector, heavier mascot rig or more decorative grids to address these issues. Preserve native Android/OBS, local encrypted communication, phone-only private keys, ordinary proof files and conservative claims.

## 9. Evidence and limits

Source anchors: `verifier/proof.mjs:32–73` (chain, timing, identity and final file); `protocol/transport.mjs:5–41` (standalone payload and key omission); `protocol/media-chain.mjs:17` (archive verification); `android/app/src/main/java/org/clappa/app/Session.kt:49–68` (derivatives, timing, seal input); `MainActivity.kt:104,139` (claim countdown and save-time timestamp); `ClappaBoard.kt:128–169` (mascot/clock layout); `obs-plugin/src/plugin.cpp:102–145` (output lifecycle, motion, dock); `native-service.cpp:102–155` (QR generation, render counter and final hash); `board-art.h:35–78` (tail, aperture, footer); `tile-timing.h` (motion guards).

Baseline evidence: `docs/review8/validation.json`, `qr-camera-results.json`, native portrait/landscape PNGs and OBS recordings. Those existing tests include 10 Android unit tests, 12 ordinary native screens, 9 enlarged-text/cutout/navigation screens, an emulator capture-to-seal flow, two successive native recording sessions and local QR recovery. They do not cover live synthesis attacks, physical flash fidelity, full accessibility acceptance or streaming-platform certification. The new audit reproduces only C1 and calculates layout/motion values. No current AI model was run against CLAPPA during this review.

The deliverable is a set of recommendations and review studies. The existing APK and OBS plugin remain Test8.
