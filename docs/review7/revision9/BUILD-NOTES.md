# CLAPPA Test9

This build implements the first set of changes from the critical review. The review page contains actual native screenshots, captured motion, measurements and downloads. No manual test assignment is required.

## Install

1. Install `CLAPPA-0.3.0-test9.apk` over the existing Android app. Package and signing certificate are unchanged.
2. Close your regular OBS installation, run `Install OBS plugin.cmd` from the extracted kit, then reopen OBS.
3. Open the CLAPPA dock to connect the phone. The plugin runs inside OBS; no companion program is needed. The source remains 872 × 480, so existing placement can be retained.

The kit's local verifier uses Node.js and ffprobe. Both are available on this development computer. ffprobe is discovered in `C:\Program Files\ffmpeg\bin`, on PATH, or through `CLAPPA_FFPROBE`. These runtimes are not bundled.

## Changes

- Every new photo proof carries its signed challenge and a separate phone-signed cumulative media boundary. Both compact photos remain in the QR payload.
- Verification compares actual H.264/AAC Matroska recording packets with the signed packet archive. QR prefix verification reports exactly how many preceding packets match.
- A valid signature with a falsely claimed key identity is rejected. Stored detached proofs are checked against the full event transcript.
- OBS photo area is larger, the rejected mascot is removed, caption/time/brand are separated, and entrance motion takes 310 ms plus a short settle. QR movement guards remain intact.
- Identity setup explains the purpose of a public identity code and a private backup in ordinary language.
- Finishing a recording ends that session's stream commitment without stopping the broadcast. Two successive recording sessions during one local stream have been checked.

## Verification performed here

- 33 protocol/verifier checks and 10 Android unit tests passed.
- Native Android emulator captured both two-photo challenges, transferred them to OBS and signed the final recording. All 3,714 recorded packets matched; both detached media proofs verified. Photo save-completion gaps were 1,213 and 1,175 ms.
- Both QR prefixes verified against the original, and were rejected against a version with changed scene content.
- Two native recording sessions reused the same pairing while a loopback RTMP broadcast remained live.
- Every generated native QR frame decoded with fixed version and boundaries; flash/normal display and motion guards passed.
- Both 14-frame camera payloads recovered after local x264 re-encoding at 1080p/CRF23, 720p/CRF23, 480p/CRF28, and 720p/CRF23 with 0.6-sigma blur. The tile occupied 872 × 480 within a 1920 × 1080 frame before scaling. At 360p/CRF28, neither full payload recovered.
- Captured twelve native state/orientation screens, nine 130%-text/navigation/cutout screens, and native motion. These are emulator results; physical phone illumination and platform round trips were not measured.

## Current limits

Exact media matching currently supports H.264/AAC Matroska recordings. A platform transcode can transport the signed proof but cannot reproduce original packet hashes. Exact independent comparison needs the original and its proof folder. The profile's explicit terminal encoder-drain handling is documented in `MEDIA-PROFILE.md`.

Start streaming before the proof recording. Starting a stream during an active proof recording still invalidates that session rather than silently omitting the new output. Dynamic output membership is not implemented. Restart/re-pair recovery, long-session storage, a friendly viewer verifier and current AI attack measurements need further work.

The phone's portrait action and guide are still too separated. Compact landscape layouts can require scrolling to reach the temporary extra-photo action. This build does not claim the remaining layout polish is finished.
