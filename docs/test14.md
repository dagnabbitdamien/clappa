# Test14 — Twitch account evidence and native viewer

2026-10-01. Test build; live Twitch account authorization has not yet been completed. This replaces Test13.1's APK and Test13's OBS DLL together. Existing pairing and phone identity remain usable.

## What changed

- Launch into Streamer or Viewer mode. Viewer mode needs no account or OBS pairing. Scan a complete animated QR sequence to verify the signed challenge, media commitment, photo hashes and Quicknet signature; read the prompt and beacon age, see the public identity, and replay the exact signed musical phrase.
- Streamer settings include Twitch sign-in. The configured public client ID is `dohpa93i266ysl246z4b82zy9as97r`. The registered redirect must be **exactly `http://localhost:3000`**. The app opens the external browser and briefly listens on the phone's own loopback interface. Finish authorization, then return to CLAPPA. No CLAPPA server, client secret, access token or email scope is required.
- Twitch's complete RS256 ID token is retained as dated account evidence. Its nonce binds it to this phone's CLAPPA public key. A separate phone signature binds that evidence to each photo event. It is snapshotted when a recording session starts.
- OBS checks the token against keys fetched directly from Twitch before displaying the official Twitch icon, account name and a CLAPPA check mark. This is not Twitch's partner badge. If Twitch's key cannot be verified, no account badge appears. Ordinary unlinked sessions do not contact Twitch for identity keys.
- The first completed proof in each session carries the full token; later proofs carry a signed digest reference. Viewer mode keeps up to 32 verified records during its current activity. A late viewer who has not scanned the full evidence sees an explicit request to scan the first proof, never a fabricated account verification.
- Phone and OBS retain the full evidence alongside each applicable event in `proof/identities/NNNNNN.json`. The offline bundle verifier checks those phone bindings when present; it does not silently download issuer keys or claim Twitch ownership was checked offline.

## Exact QR contents

The current envelope contains `event`, `key`, `photos: []`, `context`, and optional `identity`. The context includes the signed pre-beacon arm, issued challenge, Quicknet pulse, deterministic cadence/pitches/illumination, and signed media checkpoint. Both original and derivative photo hashes remain in the signed event. **No JPEG pixels are encoded in current QR sequences.** Originals and legacy small derivatives remain in the local proof folder.

The identity extension is specified in [TWITCH-IDENTITY.md](review14/TWITCH-IDENTITY.md). A token cannot be reduced to just its account ID without breaking Twitch's signature; the first proof contains the original signed token, losslessly compressed with the rest of the QR payload.

## Validation and limits

- 81 JavaScript protocol/verifier tests passed, including Twitch signature, audience, issuer, copied-token and event-binding rejection cases.
- 33 Android unit tests passed, including bounded QR reassembly and the loopback callback's same-origin checks.
- Native OBS issuer verification passed ten synthetic-token cases against an explicitly provisioned test key. Production trusts only the fixed Twitch HTTPS key endpoint.
- Native Android issuer verification also passed all ten cases, plus five strict JSON rejection cases, in the separate review APK. Test keys and test entry points are absent from the installable APK.
- Native Android viewer decoded all eight rendered QR frames from a fixture, verified an authentic archived Quicknet pulse and phone signatures, and rejected signature/beacon/duplicate-key mutations. Portrait and landscape screenshots are in the review folder. These are real native screens, not browser replicas.
- A real emulator camera → encrypted transfer → isolated OBS recording flow produced two fresh responses and one additional photo. The resulting 76-event bundle returned `EXACT ORIGINAL VERIFIED`; 5,585 muxed media packets matched. The automation's final UI dump exited 137, so final success was established from the saved recording and seal rather than claiming a clean final UI assertion.
- A full synthetic account-evidence QR used 12 frames; a later reference used 9. All 12 unique frames recovered at 1080p (source scale 1) and 720p (source scale 2/3), H.264 CRF 23, 30 fps. This local fixture test is **not a Twitch/YouTube transcoding guarantee**.
- Live Twitch login, a real Twitch-signed account token passing through an entire recording, and physical S22 camera scanning of a screen remain unverified. No account check is simulated in the installable APK. No Apple build is included.

The scan verifies the evidence, not the surrounding video's exact bytes. Original photo/recording verification still needs the local bundle. Beacon age is relative to the viewer phone's clock; the 90-second display window is an explained viewing heuristic, not an authentication deadline or a liveness guarantee.

## Install

Install `CLAPPA-0.3.0-test14.apk` over the existing phone app. Close OBS and use the kit's installer for `clappa.dll`, then reopen OBS. To link Twitch, open Streamer → Settings → Twitch identity. Viewer mode is available from the mode-selection screen without linking Twitch.

No video player or bundle-browsing UI has been added.
