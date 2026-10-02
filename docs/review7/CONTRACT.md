# Test7 design and behavior contract

This is the current design authority for this revision. It supersedes conflicting historical screenshots and instructions; the owner's latest review remains authoritative. Keep the approved #09 whole-sprite design, charcoal slate, production-sans wordmark and restrained paper texture.

## State → purpose → action

| State | Main action | Other visible information | Mascot |
| --- | --- | --- | --- |
| Not paired | Pair with OBS → scanner | One short setup hint; passive disconnected indicator | Hidden |
| Connecting | Progress; no duplicate tap action | Connecting to saved computer | Hidden |
| Paired, no recording | Start recording → actually start OBS recording | Green connection dot | Hidden |
| Recording ready | Tap to clap → signed challenge + recorded musical riff | Recording status | Hidden |
| Challenge | Capture → camera | Exact prompt, speech tail anchored to muzzle | Large, rises from bottom screen edge |
| Camera | Concentric-circle shutter → A then illuminated B | Same CLAPPA wordmark, back arrow, prompt | Hidden |
| Sent | Optional claim within original six-second window | Actual delivery state | Brief success pose |
| Ending | End challenge, stop, confirm seal | Honest signing progress | No false success |
| Sealed | Start another recording | Still paired; recording sealed | Brief acknowledgement, then hidden |
| Connection lost | Reconnect using saved pairing; rescan only if OBS replaced it | Inline recovery explanation | Attentive only while explaining error |
| Session incomplete | Start another recording once OBS is stopped | Keep incomplete proof; never claim sealed | Short error bubble; detailed explanation beside the action |

Settings is one small, square gear control. It opens **Settings**, with separate connection and signing-identity sections. The green connection indicator is not a button. Scanning a new computer's QR is a deliberate connection-management action, not the default view when already paired.

## Layout and motion

- The app background and inset gutters share #24231f. Respect all system bars, cutouts and keyboard insets. No decorative interior horizon masquerading as the phone edge.
- Use a consistent spacing scale (8/12/16/24 dp), at least 48 dp touch targets, an optical gap between the header controls and clock rules, and one primary button per state. Clock digits are high-contrast and thick enough to read.
- Portrait guide is roughly 80–84% of the usable screen width, anchored beyond the bottom safe edge with only its lower body cropped; a portion of the tail may continue off the right edge. Landscape uses the right portion, at a similar apparent head size. Bubble body never covers the animal. Pointer endpoint follows the current whole-sprite mouth landmark through the same transform.
- The clapper strip and three-screw plate share geometry with OBS: plate (0,0) to (40,49), pivot (13,14), fixed screws (10,40)/(29,40). A short snap has an impact jolt and damped settle; use the approved motion keys. Whole-sprite pose swaps use the approved compression/bounce, never anatomical slices.
- Camera uses the same italic bold wordmark and tiny striped accent. Back is an arrow; Capture is a conventional shutter. Screen flash is synchronized through CameraX's ScreenFlash lifecycle and stays active through Photo B capture.

## OBS

- Preserve the approved board proportions and entrance/exit. Photo and QR are attached before entry and stay attached through exit.
- Reduce surplus QR padding while retaining the required four-module quiet zone. Use a fixed grid and render at enough native resolution for integer modules. Test actual OBS source screenshots and a recording, not only generated PNGs.
- Caption repeats the same mapped challenge prompt as Android. A claim is explicitly labeled as a claim. No “Snapshot captured” filler.
- Snapshot GMT time must be readable at the intended stream size: bold digital numerals, sensible grouping, date secondary to time, no hairline all-in-one microtext.
- Render the tail from explicit clean geometry with a dark paper surface, no white matte fringe. Root emerges inside the lower-left edge; curl passes outside the left edge; return disappears behind the board. Inspect layer boundaries.
- Original Photo B overlays original A for rear and selfie challenges alike, then fades away. Do not tint an unflashed photograph as a substitute. Both exact compact photos remain signed and carried in QR.
- QR advancement starts only after settle and freezes before exit. Repeated cycles cover every chunk.

## Audio and proof

Use a trimmed real CC0 clapperboard strike, not the synthetic beep. Render the phrase into one sample-timed buffer with a short lead-in to avoid clipping the first attack. Select six or seven hits on a constrained rhythmic grid; use a pentatonic pitch contour with a resolved final note. Derive the musical choices reproducibly from the already-random signed challenge ID plus identity, session and signed issue time; keep cadence/slot data signed and document the derivation. No claim that a short audible riff provides high-grade authentication.

## Evidence gate

Before packaging: programmatic design mockups; native Android screenshots of each key state in portrait/landscape and navigation modes; continuous motion samples; actual OBS screenshot and full QR recovery; sequential recording/reconnect tests; rear/selfie A/B path tests. Document simulator-only limits without asking the owner to repeat already-provided feedback.
