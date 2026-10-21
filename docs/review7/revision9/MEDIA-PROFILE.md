# Test9: recording binding and readable evidence

The viewer's job is to compare the random challenge, its two phone photographs, and the scene on the other camera. CLAPPA binds these pieces together. Engineering validation belongs to the implementation, not to the owner.

## What is implemented

Each capture and claim now has a detached, phone-signed `CLAPPA-MEDIA-PROOF-v1` record. Its payload binds the exact signed response, the exact signed challenge, session and recording IDs, signing identity, output descriptors, and cumulative packet count/byte count/hash for each output. The QR carries this record and the signed challenge alongside both compact photo derivatives. Full photos remain in the local proof folder. Context is also saved in `media-proofs/` on phone and OBS.

The signed boundary is an explicit packet count. It covers the entire preceding packet chain up to that checkpoint, including earlier proof overlays. The checkpoint cannot cover its own future display; subsequent checkpoints and the final seal cover those later packets. The phone requires a checkpoint received within three seconds before signing the response context. This is a receipt-age bound, not a claim that the checkpoint reaches the shutter instant.

The QR decoder checks that the signature's actual public key agrees with the claimed identity. Altered challenges, responses and media heads are rejected. Legacy QR records remain decodable, but have no verified media prefix.

## Exact recording comparison

The implemented container profile is OBS H.264/AAC in Matroska. The verifier uses local ffprobe to compare each recorded packet against the signed archive: track, order, payload bytes, presentation time, available decoding time and keyframe flag. H.264 Annex-B start codes become length prefixes in Matroska; this reversible packaging change is accounted for. Timestamp rounding is limited to Matroska's one-millisecond precision. Other codec/container profiles fail closed pending implementation.

OBS invokes encoded-packet callbacks for a small terminal drain that its muxer discards after its stop timestamp (see OBS 31.1.1 `obs-ffmpeg-mux.c`, stop handling). After validating the final phone signature and exact whole-file hash, full-recording verification permits at most eight such trailing callbacks within 100 ms of the last recorded packet, and reports their count explicitly. Every packet actually in the file must match. Unsealed QR-prefix verification permits no missing prefix packets and no drain allowance.

`verifier/qr-cli.mjs` verifies recovered QR text frames against the original recording and its packet archive. It returns the precise covered packet count. The stream output's archive is chain-checked too, but comparison to a separately saved stream container is not implemented in this profile.

## Boundaries and remaining work

- Exact verification requires the original recording and proof folder. Re-encoded platform video cannot reproduce the original packet hashes. QR recovery from it still carries the signed challenge, photos and commitment; it does not itself establish exact footage binding.
- There is no embedded remote storage or resolver. Distributing an original recording and its proof folder remains necessary for independent exact comparison.
- Broader container/codec mapping, independent public freshness witnessing, friendly viewer import/verification and dynamic output membership remain follow-up work. Stream-first operation was verified with two consecutive sealed recording sessions while a loopback RTMP broadcast stayed live. Starting streaming during an existing proof recording still invalidates that session.
- This revision does not claim to measure current AI attackers' success rate. The practical two-camera challenge mechanism remains the product goal. A modern attack benchmark is implementation work, not a request for the owner to run a study.

## Visual changes

OBS remains 872 × 480. The photo aperture increases from 337 × 246 to 492 × 292; aspect ratio is preserved rather than cropping the evidence. QR stays 292 × 292 with fixed four-module quiet zones and integer modules. The rejected OBS mascot is removed. Caption and timestamp each have their own footer row. The entrance uses a 310 ms smooth rise and settles by 420 ms; QR advancement remains frozen until 500 ms and before/through exit. Native Android retains the approved board and mascot layout; identity-backup wording is clearer. No new Android layout parity claim is inferred from the OBS changes.
