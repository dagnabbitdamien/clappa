# Continuous OBS media commitment

Owner clarification (2026-09-12): the MVP must continuously commit the complete selected OBS encoded video/audio output, not merely chain phone events or sign an empty media prefix. The proof tile rendered in that output is part of the media being committed. This is a required core feature.

## Construction

Maintain a separate ordered hash chain for each selected output (recording and streaming may use different encoders). At session creation bind an unpredictable output ID, output role, codec configuration and the session ID. Observe every encoded video/audio packet at the OBS output boundary. Include packet order, track, timestamps/timebase, keyframe status, byte length and exact payload SHA-256. Use domain-separated hashes and a running chain dependent on the previous chain hash. A Merkle tree is not necessary for this first implementation; a sequential chain is simpler.

The phone signs periodic checkpoints (target once per second), as well as checkpoints around every challenge. The checkpoint identifies the exact covered packet count and chain head for each active output. Phone acknowledgment latency is visible. Missing packets, queue overflow, output restart/reconfiguration, missed initial attachment or lost checkpoint continuity makes coverage incomplete. A running hash without a phone signature is not an authenticated checkpoint.

## Tile feedback has a causal delay

1. The phone signs a checkpoint covering media produced so far and the challenge evidence.
2. OBS renders that signed evidence as a photo/QR tile.
3. Encoded packets containing that tile enter the output's hash chain like every other packet.
4. A later phone-signed checkpoint covers those packets, thereby binding the visible tile itself.

A signature cannot contain the hash of the very frame containing that same signature without a circular dependency. Coverage is deliberately one step behind. End flow must let the final tile finish, then stop output, collect its terminal chain state and obtain the final phone signature. A signature displayed in the last visible tile cannot by itself cover its own pixels or all future media.

## What is and is not protected

Editing, deleting, reordering or splicing covered packets must fail comparison with an already signed checkpoint. This does not make editing impossible; it makes it detectable when verifying against authentic signatures. An attacker can cheaply recompute unkeyed hashes, but cannot replace trusted phone signatures without that key. A compromised producer can still sign manipulated input; physical truth is not guaranteed.

Encoded packet coverage includes the composited proof tile only for the output in which it is actually rendered. A source-hidden state or a different canvas/output must not be reported as visibly covered. Audio is included. Network transmission headers, platform receipt and transcoding are separate layers, not implicitly authenticated by the encoder callback. Platform-transcoded copies cannot be compared as exact encoded bytes.

The final SHA-256 of the closed recording remains mandatory: it covers exact container bytes, headers, trailers and final muxer writes, which are not identical to encoder packet bytes. Final seal binds terminal output heads and event count/head as well as the exact recording hash. Verification must distinguish packet-transcript validation from independently matching those packet payloads to media; a sidecar of packet hashes alone does not prove that match. Codec/muxer transformations need a documented extraction/normalization profile before claiming packet-level media recovery.

Signed checkpoints establish authenticated ordering, not a hard external wall-clock deadline. Without an independent contemporaneous witness, a local signed transcript does not prove it was produced live. Public randomness alone supplies no not-after bound.

## OBS integration boundary

OBS 31+ exposes `obs_output_add_packet_callback`, documented as a callback for each compressed packet before sending to the service: https://docs.obsproject.com/reference-outputs . Register before capture starts, attach to every required output and validate actual callback coverage for each supported recording/streaming output type. Do not mutate packet buffers. Confirm ordering relative to other packet-mutating callbacks and account for codec headers/config changes. Keep callback work bounded; copy/ref packets for worker processing and fail closed on lost work.

## Current implementation status

Native encoded-packet capture, periodic phone signing, terminal coverage and exact-file sealing now exist and passed a simulated-phone integration test with actual OBS x264/AAC output. The verifier independently checks archived packets and the recording hash; extracting and matching packets from the recording container remains unfinished. See native-pairing.md for current validation scope. The S22 Ultra camera flow still requires device testing.

Review clarification (2026-09-16): a captured event currently commits prior output checkpoints indirectly through its signed event-chain predecessor. Its standalone QR exports the captured event, public key and compact photos, but not the records needed to resolve that checkpoint, and the QR decoder does not compare supplied media. Complete this required path with signed output identity, exact prefix boundary and cumulative head (directly or with sufficient linkage), then recompute the head from the actual media. Copying a QR to different preceding media must not pass that check. Describing a QR as visually copyable must not be confused with a successfully transferable verified media proof. See C2/C4/C5 in the corrected critical review.

