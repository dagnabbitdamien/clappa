# Test19 — quicker proof display and recent-challenge finishing

## Transfer and preparation

The phone still transfers original JPEGs and signed JSON over certificate-pinned HTTPS polling. Test18's address discovery is connection setup, not part of each proof upload. No photos were added to QR: it still contains hashes, signatures, beacon/media context and optional Twitch evidence.

OBS previously rendered and PNG-encoded the entire 3× photo board for every QR frame. It now saves the board once and changes only a separate integer-grid QR layer. A 26-frame local benchmark using an emulator photo measured 2601ms before versus 517ms after; the reconstructed final image matched every pixel. This measures render/file preparation, not the owner's phone/network throughput. The first linked proof can additionally wait for issuer keys when they are not ready; authenticated issuer verification remains mandatory.

## Shorter display

QR hold changes from 240ms to 180ms. The full 2k-frame erasure sequence remains; any k distinct valid frames still recover it. Settling remains 500ms, freeze before exit 100ms, exit 240ms. Duration before exit is 500 + max(3000, frameCount×180) + 250 milliseconds, instead of 600 + max(4500, frameCount×240 + 1000). The 26-frame first-Twitch fixture changes from approximately 8.08s to 5.67s including exit; its 18-frame later-reference fixture changes from 6.16s to 4.23s. Actual duration depends on payload size and source loading.

The first Twitch proof remains longer because it carries Twitch's complete signed identity token; later proofs carry a digest reference and per-photo signed binding. Do not omit the full issuer evidence to shorten the initial display.

Local H.264 CRF23/yuv420p/30fps checks at 1080p and 720p recovered all 26 distinct frames at 180ms each, and recovered the proof after discarding half. Source board 872×480 in 1920×1080, QR 292px before downscale. This is not a physical-phone or platform-delivery guarantee.

## Stop and seal

A successful capture opens a 30-second monotonic finish window, usable only after OBS acknowledges receipt. **Stop & seal** appears alongside **Add a photo**. Consuming the additional-photo offer does not consume the finish window. A new challenge or failed challenge clears it. After expiration, the existing final-challenge flow applies. An end challenge already resolved retains its existing finish behavior.

This uses the existing CLAPPA-SESSION-v2 permission to end without a second bookend: no fabricated end challenge, new beacon or altered proof schema. The verifier honestly reports end_resolved:false when only the recent start/mid challenge exists. Recording final bytes and the final seal still verify normally. This stops the proof recording; it does not call OBS's broadcast-stop API.

37 Android unit tests passed, including acknowledgment, stale receipt, expiry boundary and reset checks for the finish window. Native QR freeze/crossfade checks passed. The initial end-to-end run sealed after exactly one challenge: EXACT ORIGINAL VERIFIED, 35 events, 2533 matched media packets, start_resolved:true and end_resolved:false. Actual OBS output contained 20 distinct QR frames; discarding half still recovered the proof, with zero embedded photos. Board preparation in that run was 681ms. The 30-second limit is the app shortcut policy, not a new cryptographic claim: SESSION-v2 already allows ending without another bookend.

Final APK confirmation: the repeated one-challenge flow also returned EXACT ORIGINAL VERIFIED (36 events, 2586 matched packets), with 609ms board preparation. Add a photo and Stop & seal remain separate actions; taking another challenge remains available after the optional-photo offer is consumed.
