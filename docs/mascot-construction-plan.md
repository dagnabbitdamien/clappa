CURRENT OWNER DIRECTION — review 22: Whole-character sprites replace all articulated puppet animation. See assets/mascot-v4/README.md. Switch intact expressive poses at a squash/stretch bounce; do not splice anatomy. OBS QR/logo positions and board motion are approved. Photo nudged left 16 units. Brush tail now extends outside and returns behind the board. Live local/GMT seven-segment clocks are required. This supersedes all contrary historical rig instructions below.

Latest owner-directed revision: review 21c uses the new v3 character library. See assets/mascot-v3/README.md. The owner explicitly requested multiple pose references and a separate exploded sheet; those now replace the patched v2 body/arm artwork. OBS ears/crown and hooked brush tail now share the LEFT side, with branding at bottom-right. The actual phone screen edge is the mascot occluder, never an interior rule. These directions supersede conflicting historical staging/generation instructions below.

# CLAPPA mascot construction plan

Status: planning only, 13 September 2026. No new artwork, rig, animation, APK or plugin is produced by this plan. This is the handoff for the next construction pass at a lower reasoning effort.

Execution update: the first hand-drawn reconstruction was rejected. The current asset/motion prototype is [review 21](mockups/21-motion/index.html), backed by `assets/mascot-v2/`. It uses a new imagegen master referenced only to #09, real-alpha articulated layers, a measured concealed OBS layout, a spring/hinge board entrance and nine motion scenarios. Sprite/atlas and motion checks are recorded in that review. Artwork approval and native APK/plugin integration are not claimed. The instructions below remain the design intent; this update supersedes their historical instruction to wait before starting construction.

## 1. The decision

Build a small layered paper puppet around the actual interface composition. Use one primary guide construction, with resting and nose-rub arm configurations, and one concealed crouching construction for OBS. Reuse the face, ears, palette and texture treatment. Do not commission three unrelated illustrations and attempt to cut them into matching rigs afterward.

The editable source will be explicit closed vector shapes, named layers, measured attachment points and pose data. Rasterize those layers into transparent sprites for the native apps. The assembled render, individual sprites, exploded diagram and packed atlas must all come from this one source. Image generation may help with a narrowly defined artistic correction or paper material; it is not the source of joint coordinates, topology or atlas layout.

This is new layered artwork following #09, not literal pixel fragments from the low-resolution reference. It also is not a new character design. The creative drawing stage is not inherently deterministic; once its shapes and material are fixed, the build and animation evaluation must be reproducible.

## 2. Character and style lock

Authoritative reference: [isolated approved #09](mockups/approved-09-isolated.png), from [the original character sheet](mockups/09-brushtail-character-sheet.png). #05 is only a possible simplification reference, never a reason to redesign #09. All later generated puppet sheets are unapproved/withdrawn.

Preserve the actual reference proportions and silhouettes: tapered muzzle, small pink nose, brown eyes, tall tapered ears, grey/taupe paper body, cream cheek/chest and very dark bushy tail. Preserve its soft, irregular cut edges and restrained paper grain. Do not add contour lines, furry rendering, folded-paper facets, huge baby eyes, rounded mouse cheeks, a human grin or clothing. Brown eye shape and muzzle length matter more than a generic instruction to make it cute.

Before drawing, record a short model sheet of measured ratios and colour samples from #09: head width/height, muzzle projection, eye spacing, ear roots/tips, head-to-torso ratio and tail silhouette. Use these as comparison landmarks, not invented biological measurements. Inspect on charcoal at intended UI size as well as enlarged. Aim for the existing character's friendly expression; convey happiness mainly with eyes, ears and posture, without adding a detailed mouth.

## 3. Give it a place to stand or emerge from

The phone layout needs a mascot stage, not an empty rectangle holding a full-body image. Keep the charcoal clapboard, logo, white rules, connection indicator and capture control. Integrate the stage with one existing rule or the upper edge of the bottom control area. That edge is a foreground occluder: the animal moves behind it and its legs disappear naturally. A narrow contact shadow at this edge makes the depth legible. Do not draw a literal hole, floating shelf, foliage border or woodland scene.

| Surface/state | Staging and silhouette | What stays clear |
| --- | --- | --- |
| Landscape ready | Crown/ear tips just above the bottom content edge, usually at right. The torso is hidden. | Tap target, time and connection text. |
| Landscape challenge | Upper body rises at right, facing inward toward the adjacent instruction. Crop below the abdomen/hips; a paw may rest over the edge. | Instruction and Capture remain separate, stable tap targets. |
| Portrait challenge | Default to a bottom-right emergence above the action area, with the prompt immediately above/left. Move the prompt and mascot as one composition, not independent floating items. | Capture, settings, system insets and long/localized prompts. |
| Portrait seated alternative | If a visible seated pose composes better, anchor its feet with one small contact shadow. Optionally place one small eucalyptus leaf beside it. | The leaf is a secondary accent, not decoration scattered through the screen. |
| OBS proof tile | Ears/crown inside bottom-right; dark curled tail inside bottom-left. Body and face remain concealed. | Photo A, caption, full QR square and quiet zone. |

Use the bottom-emergence composition first. A side entrance is a fallback for genuinely constrained portrait layouts, not another required rig. The latest request permits a tiny grounding leaf/shadow; it does not reopen the rejected decorative leaves and cartoon scenery. Do not draw both grass tufts and leaves by default.

For OBS, draw a temporary unmasked full silhouette of a low, horizontally crouched animal behind the bottom edge. Its spine, hip and tail root must plausibly connect the two visible corners. Place a curved tail from that hip; do not stretch an upright animal, move its tail independently across the tile, or reveal a second head from the tail crop. If the silhouette cannot fit the corner positions, revise the hidden crouch and the allowed visible scale before polishing. The diagnostic silhouette need not become fully textured shipped artwork when it is always hidden.

In the shipping OBS composition, use intentionally authored tail and ear/crown attachments from that concealed construction. Do not render a whole possum twice and hope two rectangles hide the unwanted anatomy. Clip the entire result to the tile too. Check all intended popup sizes and both ends of every ear/tail movement. Reserve the QR box first; decorative geometry never determines its size.

## 4. Minimal art and rig inventory

Start with these named components, not a large sheet of speculative pieces:

| Component | Construction and attachment |
| --- | --- |
| Torso + hips + fixed hindfeet | Complete cream/grey body behind the arms, with a hidden neck overlap. Fixed hindlegs are sufficient. |
| Head | One complete face/muzzle/nose silhouette. Preserve all facial pixels. Attach at neck, with small lean/nod range. |
| Near and far ears | Each ear is a complete layered shape with a root tab under the head. Rotate independently. |
| Far arm + paw | One rigid limb for resting/steadying; shoulder rotation only initially. |
| Near upper arm | Shoulder to elbow with complete overlap at both joints. No duplicate paw. |
| Near forearm + paw | Elbow to fingertips. A resting hand and a nose-touch hand may be alternative drawings with matching attachment coordinates. |
| Tail | Prefer one continuous curved brush for the first working guide. Add a separately overlapping distal section only if the desired curl movement cannot be achieved cleanly with small root rotation. |
| Blink appearance | Export a complete head-open and head-blink from the same head source, changing only the eye layers. Same canvas and neck origin. No cut holes or independently painted mismatching face. |
| Grounding | Small separate contact shadow; one optional leaf for the seated portrait treatment only. No shadow baked across moving joints. |
| Concealed OBS attachments | Ear/crown and tail shapes placed using the complete hidden-crouch diagnostic. Reuse shapes where the perspective allows; do not force reuse that breaks anatomy. |

Keep the muzzle rigid and preserve the reference expression. Eye states, ear angle and head attitude should supply enough warmth. Do not add finger bones, whisker simulation, independently moving cheek patches, full-body walking or facial deformation for this pass.

Use near/far limb names relative to the drawing, and keep facing direction explicit in each composition. A mirrored instance mirrors the entire skeleton and all anchors together. Never mirror only the head or only its pixels.

## 5. Art construction and generation workflow

1. **Compose before polishing.** Make a simple layer/occlusion diagram for landscape, portrait and OBS using measured reference proportions. Mark the emergence edge, visible body extent, instruction and protected controls/QR. This diagram is an engineering aid, not a new mascot proposal.
2. **Construct one faithful master.** Rebuild #09's visual vocabulary as editable paper shapes on a fixed canvas. Work on the assembled character while drawing each real layer underneath it. New arm configurations are drawn in that shared coordinate system. Do not finish a flattened pose and subsequently guess how to divide it.
3. **Paint hidden areas deliberately.** Extend the torso behind both arms, the neck under the head, ear roots under the head, and full overlapping shoulder/elbow surfaces. These regions must contain the right cream/grey/dark material. Choose overlap from the allowed rotation envelope, then check extreme poses; a nominal margin alone is not proof that it works.
4. **Prove the flat rig.** Before grain, render the intact resting pose, the maximum rise, the ear extremes and the hand-to-nose pose. Inspect the silhouette, draw order and joint covers. Fix the shape construction here, while it is cheap.
5. **Apply material once.** Use a restrained shared paper treatment with fixed seed/texture mapping per part. Texture moves with the paper; it must not shimmer or regenerate each frame. Keep grey, cream and dark paper consistent. Avoid adding a generic dark outline to hide seams. Inspect real-size readability; texture should become almost invisible at small OBS size.
6. **Export from the source.** Produce loose transparent PNGs and rig metadata; reassemble those exported PNGs, not the source paths, and compare. Only after that passes, pack a sprite atlas and generate its exploded/pin diagram programmatically.

Default to direct layered drawing for this construction. Do not repeat the image-generator request for an assembled pose plus an exploded sheet. If artistic fidelity needs an image-model assist, permit one narrowly scoped draft and one targeted correction, with the isolated #09 supplied as the design reference and the current assembled construction as the target. The output is a visual target or a material source until incorporated into the real layered master. It never silently replaces measured geometry. Stop and report a specific unresolved mismatch instead of starting another grid.

For such an assist, use this bounded instruction template:

> Follow input 1 (#09) as the exact character model. Input 2 is the current assembled construction. Correct only [one named contour, proportion or paper-material issue]. Preserve head/body proportions, eye shape/colour, muzzle, ear shape, palette, facing direction, pose and detail elsewhere. Match restrained textured cut-paper shapes with no outlines or added folded facets. Return one clean visual study, not a sprite sheet, exploded diagram or rig. Do not add pins, labels, duplicate body parts, clothing or props.

If a texture is generated, mask it with the authored geometry. If a contour is corrected creatively, update the source shape explicitly, then regenerate its dependent views. Programmatic geometry and export remain the authority.

## 6. Motion vocabulary and product triggers

One guide rig should cover most behaviour. The resting and rubbing arm configurations are two deliberate poses of it; they are not three independently generated animals. Treat timings below as initial choreography to tune at real size, not biological measurements or protocol constants.

| Clip | Initial timing | Required behaviour |
| --- | --- | --- |
| Peek → guide | 350–450 ms | Rise behind the foreground edge, a small vertical settle, ears trailing by a few frames. Prompt is visible immediately; Capture is not held hostage to the entrance. |
| Guide hold | Static with sparse accents | A single blink/ear twitch occasionally, not constant breathing, bobbing or looping distraction. |
| Nose rub | 0.9–1.3 s, once | Head inclines slightly; near paw reaches the nose, makes two tiny rub strokes, then returns. Tail may settle once. Use only during a safe idle pause, not while aiming/capturing. |
| Acknowledgement | 250–450 ms | Small nod, eye softening or one ear flick after an actual success event. No confetti or large grin. |
| Guide → peek | 220–320 ms | Lower behind the same edge; leave only permitted crown/ear tips. |
| OBS accent | One short entrance/ear-tail settle | Concealed anatomy throughout. Finish the entrance before QR transport dwell begins; keep photo and QR stable during delivery. |

Bind a nose target to the head and the paw target to the hand. Check whether the target lies within the two arm lengths before promising the rub. Choose authored key poses or solve two-bone reach during authoring, then export the resulting angles. If the hand cannot reach at correct proportions, adjust the shoulder pose, head lean or the alternate bent-arm drawing; do not lengthen the arm on the fly. Use fixed draw order per pose, and switch occlusion at a planned point if the paw needs to cross in front of the muzzle.

State rules:

- Ready: peek, with very occasional motion while visible.
- Challenge issued: rise and guide beside the real instruction. Do not wait for decorative audio/animation before displaying state.
- Camera aiming and the two-photo capture: withdraw or freeze; no nose rubbing, bobbing, decorative flash or camera obstruction. The actual colour-flash layer remains unobstructed.
- Successful transfer: short acknowledgement, then the optional-claim prompt. Its approximately six-second window is driven by product state and is not restarted or shortened by animation.
- Error/disconnected: quiet attentive pose, readable actionable text; no success gesture.
- Final seal pending: calm waiting. Acknowledgement only after the actual seal succeeds, not merely after a challenge photo was sent.
- Hidden/background/reduced motion: stop discretionary movement. Reduced motion uses clear static poses; no animation is required to understand or complete an action.

Animation is interruptible: capture, errors, dismissal and app lifecycle changes take precedence over a gesture. Cancel stale callbacks so an old success animation cannot overwrite a current error. Idle variation uses a separate cosmetic sequence, never consumes proof randomness and never changes signed challenge values.

The camera-from-pocket idea is a possible later bonus. It requires an explicit camera prop, a gripping-hand alternate and a planned hiding place behind the board. Do not invent clothing or a literal pocket on the possum. For this pass, omit the prop; the rise, rub, ear flick and acknowledgement provide enough personality. Also keep the pitched clapper riff as a separate audio task; any clapper animation must eventually follow actual scheduled sound onsets, not generate its own competing cadence.

## 7. Reproducible asset contract

Suggested future source directory: `assets/mascot/`. It does not exist as a deliverable merely because it is named here.

- `source/guide.svg`: named real layers, including hidden joint material, plus eye/hand alternatives.
- `source/obs-crouch.svg`: coherent concealed-pose placement, visible attachments, optional debug-only body silhouette.
- `rig.json`: schema version, part IDs, parent IDs, local transforms, named joints, draw order, clip masks and pose/skin IDs.
- `clips.json`: durations, easing and keyframes expressed in local coordinates; semantic clip names, no UI copy or cryptographic logic.
- `materials/`: fixed texture input or recorded procedural seed/settings.
- `dist/parts/`, `atlas.png`, `atlas.json`: reproducibly generated transparent sprites and packing metadata.
- `review/`: assembled poses, exploded diagram with removable programmatic pin overlays, unmasked OBS silhouette and real-size interface previews.

Use one documented coordinate convention: pixels on a logical canvas, x right/y down, rotations in degrees with a defined positive direction; convert explicitly for each renderer. Store joints in untrimmed source-local coordinates. The hierarchy computes parent-to-child transforms; a part's raster trim offset is applied only when drawing. Packing must not change pivots or scale. Disable atlas rotation for the first build; include edge extrusion/padding to prevent filtering bleed. Export annotation overlays separately from artwork. Confirm true alpha, not an ivory or checkerboard background.

Keep overlap margins inside sprites and texture stable in part-local coordinates. Define alpha handling for each renderer and inspect over black, white and mid-grey; do not assume all tools use the same premultiplication. Atlas size and resolution follow measured maximum display size. Choose an integer density sufficient for the Galaxy S22 Ultra and the actual OBS source size without upscaling; do not automatically generate huge 4K sheets.

## 8. Validation gates — evidence, not promises

**Appearance gate:** Put the layered master beside original09 at equal head size, including a charcoal-background view. Check the actual face, ears, head/body scale and paper treatment. No replacement animal may be smuggled in under the word “cute.” Show the unclipped full head and silhouette before any UI masking.

**Construction gate:** Every moving surface is a complete layer, every attachment has one parent, and overlapping hidden material survives all declared joint limits. Nose target is reachable, paws are not duplicated, face/head crops include their entire untrimmed bounds, and no animation relies on scaling a limb to close a gap.

**Export gate:** At rest, reassembly of loose exported sprites must match the assembled master under the same renderer. Packed-atlas reassembly must match loose sprites without positional drift. Record any antialias tolerance explicitly and inspect differing pixels; do not accept visible missing face regions as a tolerance issue. The exploded sheet uses those exact assets and metadata.

**Motion gate:** Render a contact sheet sampled through each clip and inspect a continuous playback at actual UI size. Include extremes and interruption transitions. Watch elbow/neck/ear seams, hand–nose contact, draw order, alpha halos and texture shimmer. A rest-only screenshot does not pass animation validation.

**Composition gate:** Check both phone orientations, larger text and the camera/flash states. The animal must emerge from a readable edge or be grounded by a shadow. No floating full-body mascot. OBS debug view shows a connected concealed animal; final view never leaks eyes, muzzle, paws or a second head into either corner. All mascot pixels stay inside the popup, outside the QR/quiet zone and protected photo/caption regions, throughout movement.

**Native gate:** Test on the S22 Ultra and Windows OBS with the real source scaled into a scene. Match sampled transform poses across the browser preview and native renderers. Check lifecycle cancellation, orientation changes, reduced motion, recording load and graceful OBS shutdown. Verify that decorative animation does not alter QR cadence, proof dwell, capture timing or final-seal state. Frame-time and memory measurements determine optimization; browser smoothness alone is not acceptance.

## 9. Native implementation plan after the art passes

The current Android mascot is a Compose Canvas drawing in `android/app/src/main/java/org/clappa/app/MainActivity.kt`. Isolate a mascot renderer/controller from proof/camera logic, loading the exported sprites once and applying the shared hierarchy. Animate from a composition-provided frame clock, cancel with lifecycle, and keep image preparation off the UI thread. The prior missing-MonotonicFrameClock failure must not return through decorative animation.

The native OBS source in `obs-plugin/src/plugin.cpp` currently swaps complete image textures; `obs-plugin/src/native-service.cpp` builds photo/QR tile PNGs. Do not produce another file for every puppet frame. Separate cached proof imagery from decorative sprite drawing. Use the existing native source/render lifecycle for in-memory transforms and cached textures, with graphics-resource lifetime confined to the appropriate context. Keep the native dock; add no browser-source dependency or companion process. Confirm the exact OBS drawing/alpha/thread requirements before implementation rather than assuming the browser renderer maps directly.

Share assets, coordinate conventions and clip data across the browser review, Kotlin and C++; use small platform render adapters. Do not add a skeletal animation framework, external animation service or new runtime dependency unless a concrete limitation is demonstrated. Windows/S22 validation comes first; assets can be portable without claiming macOS/Linux have been tested.

## 10. Execution order and stopping point

1. Read this plan and the isolated reference; preserve the approved UI direction.
2. Produce the staging/occlusion diagram and one assembled, layered guide master.
3. Implement peek/rise plus one ear flick in the review harness. Prove the head, overlaps and actual sprite export before adding gestures.
4. Add the nose-rub arm configuration and validate its reach, contact and return. Add head-blink and acknowledgement without broadening the character design.
5. Build the concealed OBS composition and prove it in an unmasked diagnostic view, then under the real corner masks.
6. Apply final restrained material, export and pack, regenerate all review views from the same assets.
7. Update the existing design dashboard with actual working clips, still comparisons, checks and remaining limitations. Deliver its link with a concise change summary. Clearly distinguish source art, validated sprite exports, and native implementation status.
8. Integrate into Android and OBS only after the asset/motion gates pass; run native checks and report what was actually installed/tested.

At the first construction checkpoint, deliver one trustworthy layered guide and a working rise/ear motion in its real UI position. If fidelity or construction fails, identify that exact failure and fix the source; do not compensate with more generated poses or polished sheets. No subagents or large generation batches are needed. Re-read current usage and honour the user's current quota before the construction run.

### Short handoff to the next construction run

Follow `docs/mascot-construction-plan.md`. First deliver the guide master plus peek/rise and one ear flick, with true exported-sprite reassembly and a complete unclipped head. Preserve isolated09's exact character; author new layered shapes, not fragments of the reference or independent generated atlases. Stage it behind the bottom interface edge with lower body occluded and a small contact shadow. Build atlas and pin diagrams from the real layers/metadata. Keep rejected work withdrawn. Add the nose rub and concealed OBS pose only after the first construction gate passes. Report progress and link the updated dashboard. This planning turn authorizes no asset generation or implementation; wait for the user's next instruction to begin construction.


