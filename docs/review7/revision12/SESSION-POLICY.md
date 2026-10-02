# Test12: recording continuity, portable identity and dual views

This extension is normative for new Test12 sessions. Protocol remains 0.3 with explicitly signed profiles. Update Android, OBS and the verifier together. Earlier bundles retain their original policy; no old signature or outcome is rewritten.

## Continuing after a missed attempt

New session-start signs `session_policy: CLAPPA-SESSION-v2` and `claim_window_ms: 30000`. Challenge-issued signs `pair_window_ms: 3000` alongside the existing ten-second first-photo window. Front RGB and rear LED Photo B now both have three seconds after Photo A. The timing is a signed local report, not an independent exposure attestation.

A timeout, cancellation or camera error appends `challenge-failed`, clears that pending attempt and allows another challenge in the same recording. Failure remains visible on the phone, in the dock and in the verifier's `missed_challenges` list. A failed start/end attempt resolves that position without claiming it was completed successfully. `bookends.start_resolved/end_resolved` mean resolved attempts; `timed_responses` counts actual accepted responses. No new stream popup is shown for a failed attempt.

Stopping an active CLAPPA recording in OBS automatically asks the connected phone to resolve any pending attempt as cancelled, append session-end and sign the exact closed recording and terminal packet heads. The phone's Stop & seal action also signs automatically. There is no separate Decline decision. A recording stopped without opening/completing either bookend can still have an exact integrity seal; the verifier reports the missing bookends and zero responses explicitly. Integrity verification is not a pass/fail judgment of what the photographs depict.

Invalid signatures, broken chains, missing signed files, incomplete packet coverage or a missing final signature still fail verification. This policy relaxes challenge completion, not integrity. Legacy sessions retain their former strict interpretation.

The optional extra photo may be captured within thirty seconds of the accepted random response event. Upload no longer consumes most of a six-second offer. The accepted random challenge must still precede it; one extra photo is allowed. A late optional photograph is declined without terminating the recording.

## One stream popup

The phone says **Waiting for fresh timing beacon…** while waiting for the designated Quicknet pulse. OBS validates and acknowledges the signed arm locally but no longer displays the separate `CLAPPA-ARM1` marker. The completed proof QR already includes the signed arm, issue, response and beacon evidence; it does not need a second copy of those fields.

This changes witnessing: the completed QR authenticates the arm's contents, but is not independent evidence that an audience observed that commitment before the pulse. A dishonest signer can backdate a self-signed arm. Quicknet still supplies its authenticated not-before bound; independent observation of the response/live stream remains relevant to preparation time. Do not retain Test11's claim that the app publishes a visible pre-pulse marker.

## Dual-camera profile

`CLAPPA-DUAL-v1` is an optional recording mode selected in Settings before recording. It is signed in session-start, challenge-armed and challenge-issued, so it cannot be added or removed after observing the pulse. It uses camera family `front-only` for the existing deterministic selfie/action selection. The signed arm includes the mode in the seed input. `protocol/dual-prompts.json` defines the matching person-and-setup instructions on both platforms.

Every accepted dual response has four separate original JPEGs:

| Field | View and illumination |
| --- | --- |
| `photo_a` | Front, normal |
| `photo_b` | Front, beacon-selected red/green/blue screen illumination |
| `dual.rear_a` | Rear, normal |
| `dual.rear_b` | Rear, LED torch illumination |

The rear method is explicitly signed as `rear_flash: torch`. Concurrent analysis streams use continuous torch illumination for that short group, not a falsely labelled synchronized still-camera flash. Ordinary rear-only challenges retain CameraX's LED still flash.

The native phone opens concurrent front/rear Preview + ImageAnalysis use cases. The target analysis size is 1280×720 before rotation; the device negotiates actual dimensions, which are signed. These are camera-stream samples, not the camera's maximum-resolution still mode. Each saved image is upright, JPEG quality 92, and retains the negotiated resolution. Files are individually hashed and never replaced with the side-by-side display composite.

Normal samples are acquired first. The app then commits the RGB screen change, raises screen brightness, waits for rear torch activation, allows 150 ms illumination settling and discards the first two analysis frames on each stream before accepting the illuminated samples. The latest completion in the normal group must fit the ten-second response window. The latest illuminated completion must be within three seconds of that normal group. Each group's front/rear delivery gap must be at most 120 ms. Rear torch and screen brightness are restored on completion, cancellation and failure.

`dual.normal` and `dual.illuminated` each sign front/rear delivery milliseconds, per-camera sensor timestamps in microseconds and dimensions. Sensor timestamps must increase within each camera; the two cameras' sensor clocks are not assumed interchangeable. Delivery timestamps use one device monotonic clock. The signed `pair_ms` must match the interval between group completion times. `exposure_synchronization` is always `not-established`: concurrent delivery is not a guarantee of simultaneous exposure.

Phone capability discovery requires an advertised front/rear concurrent combination and rear illumination. Actual binding/torch failures produce a recorded missed attempt. If a previously selected dual mode is unavailable, the app asks the user to turn it off explicitly before starting from the phone; it never silently labels single-camera evidence as dual.

OBS shows the two normal views side by side in the existing photo mount. The two illuminated views are mounted over them and fade together to normal views. The challenge caption matches the phone. All four hashes and timing reports travel in the same QR. QR animation remains stationary and its geometry does not change.

The schema uses camera roles, monotonic delivery times and sensor-local timestamps rather than Android camera IDs. An iPhone implementation can map AVFoundation MultiCam outputs to it, but must separately discover supported combinations, torch control and resource limits. No iPhone implementation or device certification is claimed. References: [CameraX concurrent binding](https://developer.android.com/reference/androidx/camera/lifecycle/ProcessCameraProvider), [CameraX torch completion](https://developer.android.com/reference/androidx/camera/core/CameraControl#enableTorch(boolean)), [Apple MultiCam](https://developer.apple.com/documentation/avfoundation/avcapturemulticamsession).

## Portable identity

Fresh installations create a portable P-256 signing identity. Actual event signing still uses the imported Android Keystore key. A separate PKCS#8/certificate copy is encrypted with a device-bound Android Keystore AES-256-GCM key; identity alias is authenticated as associated data. It is stored only in app-private preferences. Android automatic backup is disabled.

**Export private backup** writes a standard password-protected `.p12` file through Android's file picker. A password of at least twelve characters is required and confirmed. The private bag uses AES-256-CBC with PBKDF2-HMAC-SHA-256 at 600,000 iterations; a SHA-256 PKCS#12 MAC at 600,000 iterations authenticates the package. Bouncy Castle 1.79 implements this format. Buffers holding raw private encodings or passwords are cleared where the application controls them. The file must stay private; OBS never receives it.

Import validates one P-256 private key, its matching public certificate and a signing probe before activating it. Imported identities also retain an encrypted export copy. Importing or creating a different identity is disabled during an active recording/session and explicitly disconnects the prior pairing. Prior recordings keep their original identity.

Existing non-exportable Android-generated keys cannot be extracted retroactively. Updating the app preserves them. The UI explains that limitation and offers an explicit new portable identity, warning that its public code changes. It never silently replaces the old identity. Owners who originally imported a key may re-import their original backup to enable export.

**Copy code for my profile** copies the public SHA-256 identity code. **Save public identity file** writes public P-256 SPKI plus its code. Both are safe to publish. These are separate actions from private backup, and do not automatically claim Twitch account ownership. The UI explains how to put the public code in a profile controlled by its owner.

## Rendering and connection

The 3× native board image is smoothly reduced once before animation. This avoids nearest-neighbour text reduction while retaining the QR's exact four-pixel modules at the 872×480 source size. Footer text is larger. Each digital digit has a roughly 15% darker cell. The exit retains its quick 240 ms drop with a small upward hinge lag (maximum about 2.6°). QR updates begin after 500 ms settling and freeze before/through exit.

Idle transient polling failures are retried before reporting disconnection. After a genuine idle disconnect the app attempts the saved connection up to three times. Signed POST submissions are not blindly retried because receipt may be ambiguous. Same-OBS consecutive recordings and reopening the idle phone app retain pairing. An OBS restart or **New pairing code** still replaces the ephemeral TLS pairing: the app identifies that case and directs scanning the current code. This revision does not claim persistent pairing across OBS restarts.
