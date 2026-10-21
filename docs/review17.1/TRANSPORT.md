# CLAPPA transport v3

V3 adds systematic Cauchy Reed–Solomon erasure recovery. This is a bounded erasure code, not an unbounded fountain stream. Any k distinct valid frames out of 2k recover the compressed proof. Duplicate frames do not count. The native OBS producer, Kotlin collector and JavaScript verifier share the same field arithmetic and row construction. V1/v2 remain readable by the local verifier; Android preserves its v2 decoder.

Compress the unchanged canonical proof envelope with raw DEFLATE, max 8192 bytes. Split into k=ceil(length/196) zero-padded 196-byte source shards (1 <= k <= 42). Arithmetic is GF(256), polynomial 0x11d. Rows 0..k-1 are identity. For parity row i >= k, coefficient j is inverse((i-k) XOR (k+j)). Transmit rows 0..2k-1. Gaussian elimination recovers the source; trim padding to the exact signed-transport length before SHA-256 verification and bounded decompression. Proof signature, beacon, media and identity verification remain mandatory after recovery.

A frame is CLAPPA3: followed by RFC 9285 Base45 of 238 bytes: digest[32], row index u16 BE, source count u16 BE, compressed length u16 BE, shard CRC32 u32 BE, shard[196]. Receivers reject out-of-range lengths/counts/indices, mixed metadata, conflicting duplicates and CRC failures. CRC protects each shard; the full SHA-256 checks reconstruction. No photos, access tokens or new claims are added. Bad camera reads retain previously collected valid frames. A failed final digest discards the invalid assembly.

QR grid stays version 12/M with four-module quiet zones and integer modules. Hold remains 240 ms. Freeze during entrance/exit is unchanged. Each display fits the full 2k sequence plus settling margin, instead of requiring repetition of every uncoded source chunk. First Twitch proof still includes issuer evidence; subsequent proofs carry its digest and the separately signed event binding.

## Validation

JavaScript: parity-only and alternating loss recover; 150 deterministic random half-loss selections across payload lengths up to 8192 recover; incomplete/corrupt/mixed frames reject. C++ output matches JavaScript vectors byte-for-byte. Native Android decodes only eight parity QR images from a sixteen-frame sequence, recovers and verifies the proof, and rejects three mutated proofs. Invalid intervening reads do not erase assembly.

Local H.264 CRF23/yuv420p/30fps: 872x480 board in a 1920x1080 frame, QR at native 292px and downscaled with the frame to 720p. At 240ms/code, all 26 first-identity frames were decoded; discarding half of them still recovered using 13. This is a local transcode measurement, not a Twitch/YouTube or physical-phone guarantee.
