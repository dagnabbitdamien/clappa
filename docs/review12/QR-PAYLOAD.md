# What the Test12 QR contains

Each completed challenge transports one compressed, signed JSON evidence package, divided across fixed-size QR frames. A frame is not a separate photograph or a separate challenge.

| JSON entry | Contents |
| --- | --- |
| `key` | P-256 public signing key, algorithm/protocol labels and SHA-256 identity code. No private key. |
| `context.armed` | Signed challenge ID, phase, camera/multi-view profile, designated future Quicknet round, exact preceding OBS packet-chain commitments, event-chain predecessor and local timestamp. |
| `context.challenge` | Signed prompt ID, six/seven-note cadence, pitches, tempo, camera/illumination, response limits, same OBS commitment, hash of the arm, Quicknet round/time/chain and complete BLS beacon signature. |
| `event` | Signed response: original A/B SHA-256 hashes, byte counts and local filenames; legacy local derivative references; capture timestamps, response latency and A-to-B gap. In dual mode, rear normal/illuminated references plus both cameras' timing/dimensions are included. |
| `context.proof` | Phone-signed association between that event, its challenge, session/recording identity and exact OBS output descriptors and packet-chain heads. |
| `photos` | Empty array for the current hashes-only profile. No JPEG pixels are embedded. |

An optional additional-photo popup carries its own signed photograph reference, with the preceding challenge/arm context and corresponding media-prefix signature. It does not repeat the previous capture event's A/B image references.

Every signed event includes protocol, algorithm, public identity, session ID, sequence number, previous signed-event hash and reported timestamp. The package is readable evidence, not encrypted secret data. Phone-to-OBS transport is encrypted separately.

The original photographs remain in the local proof folder and are displayed on stream. The four-image dual composite is presentation only: the four original files have separate hashes. No original photo can be reconstructed from a hash. The old 64-pixel derivative JPEGs remain local compatibility artifacts, with references in the signature; they no longer consume QR image bandwidth.

The QR does **not** contain the complete video, all previous event records, the final recording seal, a password, or a private signing key. Its hashes commit to preceding media/transcript state. Checking exact surrounding footage requires the original recording and proof material. Later packet checkpoints and the final seal bind the displayed overlay into the exact original recording; the earlier prefix cannot recursively include its own future QR pixels.

## Transport and recovery

Canonical JSON is raw-DEFLATE compressed. The transport uses `CLAPPA2:` plus Base45, a whole-package SHA-256 digest, chunk index/count and CRC32. Each chunk carries at most 200 compressed bytes; the package limit is 8192 bytes. All chunks are required. At least two cycles are displayed. This is repeated chunk transport with QR error correction, **not fountain coding**.

Every code uses version 12, medium error correction, 65×65 data/modules plus a four-module quiet zone on each edge. The total 73×73 grid occupies 292×292 logical pixels: four pixels per module at source scale 1. Frames change at 240 ms intervals only while the board is stationary, after its settling period and before exit.

Actual Test12 ordinary/extra-photo proofs recovered in 9–10 frames each. A native four-image fixture measured 2206 compressed bytes / 12 frames. Exact sizes vary with signed data, key, timing and compression; the review reports include measured values for the camera run.

Local re-encoding of the ordinary camera recording recovered all three packages at 1080p, 720p and 480p, and in a 720p sample with Gaussian blur sigma 0.6. It recovered none at 360p. Tests used a source at 872×480, scale 1, within a 1920×1080 scene; H.264 CRF23 at 1080p/720p and CRF28 at 480p/360p. The decoder cropped the known QR region. These are measured local results, not guarantees for Twitch, YouTube or an arbitrarily scaled source.
