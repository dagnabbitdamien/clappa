# CLAPPA Test13

Install the APK over the current app. Close OBS and run **Install OBS plugin.cmd** from the kit. The native app artwork and the signed proof profiles are unchanged. The JavaScript possum proposal was rejected. The subsequent sprite sheet has eleven approved poses (1 and 3–12); pose 2 is rejected. These new sprites are not shipped in this APK.

## Improvements

- One additional photo per completed challenge. The timer is cancelled when submitting; the button cannot reappear after acknowledgment. Success waits for the exact OBS receipt. Uncertain delivery does not permit another signed claim. Camera failures before commitment can retry only within the original offer window.
- Optional **Twitch audience challenges…** button in the OBS dock. Three distinct viewers sending 🎬 within fifteen seconds produce one invitation on the paired phone; two-minute cooldown. The phone buzzes and offers **Take a challenge** / **Not now**. Only acceptance begins the ordinary beacon-derived challenge. Chat never chooses its contents or starts a camera automatically.
- The chat listener is read-only, TLS protected, and keeps its token only in memory. Current setup is advanced: a Twitch user access token with chat:read permission is required. A registered one-click CLAPPA OAuth login is not bundled. No live Twitch account was used in engineering verification.
- Session summaries keep updating, but the entire recording index is rebuilt only when a session changes state or Browse is pressed. This avoids repeatedly scanning every old recording on OBS's UI thread.
- A current architecture map and reusable release packager replace reliance on copying old version-specific packaging scripts. The packager checks the actual APK package/version and signing identity and records current artifact hashes.
- Mascot review: the JavaScript character was rejected. Eleven whole-character sprite proposals were subsequently approved; their extraction, transparency and native animation integration remain future work. Existing native art remains intact.

## Verification performed

- 77 protocol/verifier tests passed.
- 27 Android unit tests passed, including additional-photo ownership/acknowledgment and chat expiry/deduplication/current-session gates.
- Native plugin and C++ chat parser/vote tests passed. Malicious viewer text resembling IRC control messages cannot be treated as server instructions.
- Actual emulator camera → OBS → final seal run passed: two fresh-beacon challenges, one additional photo, three detached media proofs, and 10,205 matched original recording packets. The additional-photo button stayed gone after receipt.
- The nine-frame signed claim QR was recovered from the actual 1080p OBS recording. This is local original-recording recovery, not a streaming-platform guarantee.
- The chat invitation was injected locally through a review-only activity into the production handler. A duplicate was delivered and acceptance started the normal challenge; no challenge was issued before acceptance. This does not substitute for a live Twitch authentication/network test or prove physical vibration on an S22.
- The first integration harness checked popup expiry after spending time inspecting the phone. That assertion was corrected, the active recording was completed/sealed, and the recorded QR itself was decoded to establish the popup actually carried the claim.

Original proof files remain under your user folder/CLAPPA/sessions/<session ID>/proof; photos are in proof/images. Unsigned readable summaries are navigation aids. Use the packaged verifier for exact recording integrity.

Current boundaries: Windows/Android test build, emulator camera rather than physical reflected illumination, no iPhone build, advanced Twitch token setup and no live Twitch authentication check. The approved new mascot artwork has not yet replaced the production sprites.
