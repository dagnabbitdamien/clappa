> Rejected by the owner on 22 September 2026. Retained as an experiment only. Use the approved whole-sprite direction in [APPROVAL.md](APPROVAL.md) and [the sprite review](sprites.html).

# JavaScript paper possum — new proposal, 22 September 2026

This is an isolated visual prototype. It does not replace approved production assets or change the APK. The owner explicitly requested a fresh JavaScript construction and articulated animations, superseding the previous whole-sprite-only direction for this experiment.

## Artwork source

`possum.js` contains complete closed paths drawn from scratch, not traced bitmap fragments. Canvas clips a deterministic procedural paper material to each part. Seed90305 generates fine flecks and short fibers once; the material travels in each part's local coordinates, so it does not shimmer. There is no image generation, matte extraction, background eraser, white fringe or overlapping neighboring sprite cell. The only bitmap is the approved09 reference shown for comparison.

Observed reference design: tall tapered ears, a long projecting muzzle, small pink nose, modest brown eyes, taupe outer paper, warm cream cheek/chest, and a broad charcoal brush tail. No outline stroke around anatomy, clothes, origami fold lines or human grin. The new drawing is an interpretation; artistic equivalence is for the owner to judge.

The320-unit drawing records head pivot188,124; ear roots158,67 and207,59; shoulders145,147 and208,155; two arm lengths34/33; tail root145,260; muzzle233,112. Arms use a bounded two-link reach with consistent elbow bend direction and overlapping complete sleeves. No joint exposes a transparent hole. Each blink compresses only the eye; the complete head and cheek stay intact. The thumbs-up uses an alternate complete paw contour, not an inverted wrist. The camera prop is introduced between two reaching paws, without fake light flashes.

## State and animation contract

| State | Motion | Use |
|---|---|---|
| Ready | Hidden in the app | Do not add a floating idle head. |
| Guide |420ms rise, very small settle, trailing ears | Actual screen bottom clips the lower body. Prompt/control stay outside character bounds. |
| Wait | One blink/ear twitch, then still | No perpetual motion distracting from instructions. |
| Receipt | Small nod plus outward paw/thumb gesture | Means received, never “human confirmed.” |
| Camera cue | Both paws hold a camera prop | Intro only; withdraw when real camera opens. |
| Error | Tiny recoil, blink, coral exclamation | Text/action carries the error, not colour alone. |
| Withdraw |230ms below screen edge | Interruptible; no capture delay. |

All clips are pure functions of elapsed time. UI timers and cryptographic selections must remain separate. Reduced motion resolves directly to a readable pose. Cosmetic motion stops in background tabs. Responsive review supports small portrait or wide landscape; seated mode has an actual contact shadow and one small eucalyptus leaf instead of an empty void.

## Next integration step

Select the drawing before shipping. If approved, either port these same paths/transforms into Compose Canvas, or render a small transparent whole-pose atlas using this source and use existing native sprite transitions. A WebView is not required. Keep native measured safe-area layouts and large touch targets. The current OBS design no longer includes a mascot: do not reinsert it merely because this prototype exists. No cryptographic or camera behavior changes here.

Review screenshots and any limitations are recorded in `visual-review.md` after local rendering.
