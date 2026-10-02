# CLAPPA Test10

This is a new Android/OBS test build with timed capture, additional physical-action prompts, a revised phone layout, and a separate two-camera experiment. Install the APK over the previous version and update the OBS DLL from the kit with OBS closed. No companion application is required. The OBS source remains 872 × 480.

## Installed changes

- A signed ten-second response policy begins when the challenge is issued, including audio and camera opening. The countdown remains visible in the camera header. Photo A must finish saving within the window; Photo B must follow within 1.5 seconds for selfies or 3 seconds for rear LED captures. The phone checks monotonic elapsed time, OBS rejects invalid signed timing, and the local verifier checks both ordinary bundles and detached QR responses.
- Missing the window records a signed timeout and leaves the recording incomplete. A timer alone is not independent evidence of an upper time bound: these are signed local reports, not the completed NIST freshness profile.
- New front-camera prompts ask for a covered left/right eye, a held wink, or a slight turn of the face. Both normal and RGB-illuminated photos remain required. Left/right refers to the person's own body, not the mirrored preview. These prompts add visible actions; they do not establish a measured resistance to current synthesis systems.
- Portrait uses one bounded slate with a larger whole-sprite guide. The temporary extra-photo offer occupies the primary action position instead of being pushed underneath several other buttons in compact landscape. Safe drawing insets and 48 dp controls remain.
- Settings includes **Try two cameras · experimental** when no recording is active. It requests a supported front/rear combination and attempts concurrent preview plus frame analysis. It saves separate JPEG samples locally, reports frame delivery separation, and refuses pairs delivered more than 120 ms apart. It does not claim simultaneous exposure, use flash, sign the samples, or send them to OBS. An unsupported device keeps ordinary challenges available.

## Beacon work: implemented reference code, not activated in this APK

The repository now contains an offline NIST signature/output verifier and a deterministic mapping for prompts, camera, colour, complete rhythm, tempo and pitches. Thirty-two shared vectors compare the JavaScript mapping with Kotlin. The input hash includes the fixed committed context and verified pulse output, and excludes variable ECDSA signature bytes.

An archived NIST pulse (chain 1, pulse 1,000,000) verifies with its separately provisioned certificate pin. During this review the current NIST endpoint returned a pulse with a 512-byte signature but a referenced 2048-bit TLS certificate. That response is rejected. This is an observed retrieval/verification failure, not a claim about the cause or the entire beacon service. The retained report identifies the exact pulse and certificate. No historical pulse is substituted as fresh.

The native precommitment/arming flow, authenticated current beacon delivery, public observation of the precommitment, QR packaging and full verifier integration remain unfinished. The installable build still uses the existing local challenge selection. Do not describe Test10 as beacon-backed, or label its phone-reported photo time as a NIST time.

## Validation and evidence

See the review page and adjacent JSON reports for the actual native flow, deadline rejection, standard/enlarged-text screens, QR transcode results and build hashes. Camera checks use the local Android emulator; physical flash effects and simultaneous S22/iPhone exposure have not been measured. The two-camera experiment is capability-gated and is not a completed dual-camera proof feature. No iOS binary is included.

The kit includes the native plugin, APK and local verifier. Verification still needs Node.js and ffprobe, installed on this development computer but not bundled. Exact original-media comparison currently supports H.264/AAC Matroska. Platform-transcoded video can carry the QR evidence; it cannot reproduce the original encoded packet hashes.
