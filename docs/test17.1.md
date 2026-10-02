# Test17.1 — Twitch badges and resilient QR scanning

Install both the Android APK (0.3.0-test17.1, code 27) and OBS DLL. Old Android builds cannot scan the new CLAPPA3 sequence; the new app also reads existing CLAPPA2 recordings.

## Twitch

The owner's OBS logs showed no functional Qt TLS backend. Signed Twitch evidence was present in saved proofs, but OBS could not fetch issuer keys and correctly withheld its checkmark. Windows issuer-key retrieval now uses Windows HTTPS certificate/hostname verification independently of Qt TLS plugins. Other platforms retain Qt HTTPS. Retrieval runs off-thread, prefetches at startup, and keeps linked proof events in order while key retrieval finishes.

The owner's actual saved Twitch evidence verified against live Twitch signing keys with the native implementation. The rendered proof footer displays the Twitch icon, username and green check, without the word verified. It is included on ordinary, additional-photo and dual-view boards and remains visible during the flashed-to-normal transition. Original signed JPEG bytes are never watermarked or rewritten. A Twitch account linked after recording starts is now read for subsequent photo evidence instead of being cached as absent for that whole recording. No checkmark is granted to unverified evidence.

Twitch chat's separate Qt networking is not changed by this badge fix.

## QR recovery

New proofs use bounded erasure coding: any half of the transmitted distinct frames recover the payload. This replaces the previous all-chunks-required transport. Bad reads no longer clear the scanner's progress. Frame timing stays at the existing 240 ms; no slower chunky cadence. Photos remain hash-only in QR.

85 verifier tests passed. C++/JavaScript frames match, 150 random half-loss cases passed, native Android recovered from 8 of 16 frames and rejected 3 altered proofs. Local 1080p and 720p transcodes recovered from 13 of 26 first-identity frames at 240ms/code. Ten native Twitch fixture cases also passed; these are separate from the successful real-issuer evidence check.

See review17.1/TRANSPORT.md for byte layout and test conditions. A physical screen-to-phone scan remains unmeasured in this revision.

Full isolated OBS/emulator flow: EXACT ORIGINAL VERIFIED, 83 signed events, 6897 matched media packets, two timed beacon challenges, one additional photo, three detached media proofs. The additional-photo offer did not reopen. The actual native OBS output recovered from 10 of 20 CLAPPA3 frames. This recording fixture had no Twitch identity attached; the real Twitch evidence verification/render check is separate.
