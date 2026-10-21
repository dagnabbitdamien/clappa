# Challenge catalogue and derivation

Current full dual-camera challenges use **32 selfie prompts**. The catalogue includes facial expressions, left/right head movements and explicit left/right hand gestures: thumbs-up, peace signs, open palms, fists, raised fingers, pointing and touching the face. Every challenge captures both phone cameras, with a normal and an illuminated photo from each.

The [main README](../README.md#prompts) lists the instructions. Their exact wording comes from [`protocol/prompts.json`](../protocol/prompts.json); [`protocol/challenge-set-v3.json`](../protocol/challenge-set-v3.json) fixes the ordered v3 prompt IDs. [`protocol/dual-prompts.json`](../protocol/dual-prompts.json) supplies the full-camera instructions shown on the phone and OBS.

## How a challenge is selected

The signed arm fixes the choice mapping and the preceding OBS media commitment before the designated Quicknet pulse. Once that pulse is verified, the phone derives the prompt, front-flash colour and sound riff from its randomness and the committed context. OBS and the verifier independently reproduce those choices.

For example, a left-hand peace-sign prompt means holding that gesture for the normal and flash photos. The front screen supplies the chosen red, green or blue illumination; the rear camera records the filming setup with its white LED. The four original image files and the OBS packet-chain checkpoint are bound into the signed response. Choosing a more specific gesture changes the requested response, not the capture deadline, camera requirements or evidence format.

## Combinations

| Choice | Possibilities |
| --- | ---: |
| Selfie prompt | 32 |
| Front-flash colour | 3 |
| Sound riff | 2,560 |
| One challenge | **245,760** |
| Ordered start and end challenges | **60,397,977,600** |

One challenge has `32 × 3 × 2,560 = 245,760` combinations. A start/end pair has `245,760 × 245,760 = 60,397,977,600`. The sound and illumination derivation are unchanged from v2; the expanded prompt pool is the reason for the new mapping version.

## Verification compatibility

New arms select **`CLAPPA-CHOICES-v3`**. The signed mapping determines the prompt pool used to reproduce a challenge; it cannot be switched after commitment. Versions 1 and 2 keep their original ordered IDs and choice rules. A v2 proof therefore remains an eleven-selfie-prompt proof when opened by the new verifier.

Update the phone, OBS plugin and verifier together before producing v3 evidence. Older builds reject an unknown mapping instead of interpreting it as v2. Existing proof files do not need conversion.

Implementation: [portable derivation](../protocol/challenge-derivation.mjs), [Android choices](../android/app/src/main/java/org/clappa/app/ChallengeChoices.kt), [prompt generation](../tools/generate-prompts.mjs), [v3 test vectors](../test-vectors/choices-v3.json), [signed v3 dual-camera fixture](../test-vectors/quicknet/challenge-v3.json).
