# CLAPPA-RIFF-v1

UTF-8 inputs joined with NUL bytes: `CLAPPA-RIFF-v1`, session ID, public key fingerprint, challenge ID, decimal signed issue timestamp in milliseconds. SHA-256 produces 32 seed bytes. The challenge ID comes from the OS CSPRNG; public time alone is not unpredictable. All inputs are in the signed challenge envelope/session identity.

There are sixteen sixteenth-note slots. Slots 0, 4, 8, 12 always sound. Sort offbeats 2, 6, 10, 14 by their corresponding unsigned seed bytes (stable ascending order); take `2 + seed[0] mod 2`. Slot duration is 125 ms when seed[1] is even, otherwise 150 ms: 120 or 100 quarter-note BPM. This gives six or seven hits in a 4/4 bar.

Pitch vocabulary in semitones is [-5, -3, 0, 2, 4, 7]. Start at index 2. For non-final hits after the first, move by `(seed[i+16] mod 3)-1`, clamped to indices 0–5. The final hit returns to 0 semitones. The renderer linearly resamples a real clapperboard strike and mixes all hits into one 44.1 kHz PCM buffer with a 60 ms lead-in. The visual clapper snaps once with a short rebound; it is not forced to hit every audio beat.

Cadence bits and slot duration remain explicit signed fields under protocol 0.3. Pitches are a reproducible Test7 rendering convention, not a new required schema field; old valid cadences remain valid. A finite musical phrase can repeat and carries little entropy. It is not a secure audible identity token or a unique challenge identifier.

`CadenceTest` checks musical constraints over 1,000 seeds, reproducibility, identity/challenge/time dependence and sample-timed onset placement. `tools/RiffPreview.java` renders review WAVs using the compiled Android implementation. Strike credits and edits are in `assets/audio/README.md`.
