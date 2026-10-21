# CLAPPA design mockup brief

## Latest owner correction

**APPROVED MASCOT DIRECTION:** Owner selected **#9 (paper-cut shapes)** from `mockups/09-brushtail-character-sheet.png`: "perfect and the style is a great match". Use this character and paper-cut vector style for app and OBS. Stop broad mascot exploration. Implementation is now authorized toward MVP with at least 75% account usage remaining (stop at 77% as a buffer).

Mascot detail target is between options A and C. Use sourced species anatomy in prompts; see `mockups/brushtail-anatomy-brief.md`. The owner rejected generic mouse-like features and requests identifiable Australian brushtail shapes while retaining cartoon style.

Current requested deliverable: exactly three views, portrait phone, landscape phone, and a roughly phone-proportioned OBS popup for the lower-right stream corner. The possum must be a stylized friendly cartoon of the specific Australian animal, never photorealistic or chibi. OBS popup contains an animated QR area and a Polaroid taped at its top to the board; tape must attach the photo rather than immobilize the clapper. See `mockups/06-portrait-landscape-obs.png`. Generated phone frames remain illustrative; actual implementation must use measured device viewport dimensions. This revision is awaiting owner review.

Latest refinement supersedes earlier mascot/styling experiments: use an actual Australian common brushtail anatomy reference, with adult proportions rather than chibi features. When idle only the crown and ears peek above the lower screen edge; the possum emerges to give instructions in a small speech bubble beside Capture. Keep top clapper, subtle background texture, Tap to clap, local time, OBS connection and a small settings gear. Remove Photo A / Flash / Photo B explanations from normal UI. Screen proportions must match a landscape phone, not a stretched banner. Remove tape for now; any future tape belongs on the stationary board and must never bridge the moving clapper. Latest mockup: `mockups/05-brushtail-peek-ui.png` (not approved).

Superseding clarification: **90% cute, 10% ugly**, mostly clean, neat vector art for a usable phone application. A little masking tape on one board corner is welcome; distressed textures and art-book presentation are not. Keep landscape, brown eyes and dark bushy tail. Prior scruffy/grumpy directions overcorrected and were rejected. See `mockups/04-clean-phone-ui.png` for the new focused ready/challenge layout; it is not approved, and the generated fur still needs simplification into flat vector shapes.

The owner rejected the first mockup sheet. Default to landscape for the clapperboard app. The mascot must be an ugly-cute Australian brushtail possum with brown eyes and a dark bushy tail, not a round-faced plush mouse-like character. Multiple new options were authorized and generated; see `mockups/revision-2.md`. This supersedes earlier pauses on mockup generation; implementation remains unstarted.

Owner direction recorded 2026-09-12. This brief records future design work; no mockups or implementation are authorized by the current documentation-only request.

## Overall feeling

Cute, playful, and recognizably an old-school clapperboard. The reference is the early iPhone novelty-app experience: an app made the whole phone feel like a physical object, such as a glass of beer. CLAPPA should make the phone feel like a clapperboard as soon as it opens.

The board should take up the majority of the screen, rather than appearing as a small illustration above a conventional button. Use bold diagonal black-and-white stripes on its hinged top, an expressive but readable board face, and a large tappable board surface. Keep the existing vector-art and light-tweening requirements.

A cute **brush-tail possum** pops up in front of the board to give short, friendly instructions. Keep it distinct from other possum species and readable at small sizes.

## Required mockup exploration

Before UI implementation or finished graphic assets, present multiple visual propositions for each of these surfaces:

1. **Startup/opening screen:** the first impression, the board appearing, and the possum introduction. Keep entry into the clapboard interaction quick.
2. **Main tappable clapboard:** a board filling most of the screen, striped hinge, readable face panel, connection/session state, and clear tap affordance. Show open and closed poses.
3. **Verification screen:** possum instructions, random challenge, two-photo capture progression, success, and the roughly six-second **Verify something else?** prompt. Include a clear failed/skipped state.
4. **OBS popup:** matching clapperboard shape, animated QR area on one side, and the verification photo popping up as a Polaroid-style print. Show the possum in front giving a brief cue.

Explore two or three coherent directions across these surfaces, for example a classic cinema board, a softly rounded toy-like board, and a bolder cartoon board. These are candidate directions to compare, not approved designs. Include portrait and landscape main-board compositions for the Galaxy S22 Ultra before choosing orientation behaviour.

Show key animation poses or a simple storyboard alongside still mockups: board clack, possum entrance, photo reveal, and dismissal. Review the alternatives with the owner before selecting a direction and producing finished artwork or UI.

## Board display concept

Explore a small text/display panel on the board showing a live timecode-style value. The owner suggested a live NIST-related time/public-randomness value as a cute visible detail. The exact service, value, refresh behaviour, and label are open design decisions for later investigation.

For mockups, use clearly labelled illustrative values. Do not represent public data as a secret signing key, verified identity, or proof of real-time freshness. Keep public randomness distinct from the phone's private signing key, which stays on the phone. An optional external display must not become a dependency of the local MVP; show a useful local display when it is unavailable. Historical public randomness alone is not a full freshness proof.

## OBS composition and proof behaviour

- Photo A is the visible Polaroid-style verification image.
- Photo B remains stored, hashed, signed, and carried in machine-readable proof; it is not normally displayed.
- Reserve an unobstructed QR area with sufficient surrounding space. The possum, photo border, striped hinge, and animations must not cover it.
- Keep the QR area stable while the QR payload changes; animate the decorative elements around it.
- Show brief challenge and signed-status information without implying that the recording already has its final seal.
- Design for the existing roughly four-second tile duration and conservative proof payload budget. Mockup appearance does not establish QR recoverability; that needs later recording tests.

## Review criteria

Compare whether each proposition looks immediately like a clapperboard, feels cute, is easy to tap, and remains readable on camera. Check possum placement, photo visibility, QR space, and clear incomplete/error states. Preserve the signed cadence, two-photo challenge, random-before-claim rule, and final-seal flow in every direction.

The next action remains waiting for the owner to request work. Once requested, generate the mockups as an explicit design step before committing to presentation assets.
# Tagline note — owner approved

**Current mascot strategy (planning only):** Follow [mascot-construction-plan.md](mascot-construction-plan.md) for the next authorized construction pass. The owner accepts the broad revision19 UI but wants the mascot emerging from an interface edge with its lower body occluded, or visibly grounded with a small shadow and optional single leaf in a seated portrait treatment. This supersedes floating full-body placement and the previous generated-atlas process. Build real layered artwork first, then derive sprite sheets and exploded diagrams from it. Existing generated puppet breakdowns remain withdrawn. No assets or animations are being produced in this planning pass.

## Owner selection — charcoal paper and next typography pass

Owner initially preferred A1/A2/A3 from `mockups/10-app-obs-style-grid.png` for their dark clapboard palette, then clarified that this is a starting point, not approval of the charcoal-paper design. The mascot is too prominent, foliage must go, and the composition needs a more formal, trustworthy tool layout. Keep restrained texture and warmth, the connection indicator and settings icon. The OBS popup composition was positively received. Explore multiple design languages in a new grid before locking the design. Any speech bubble must visibly originate from the single guiding possum; an adjacent plain instruction panel is also an option. Idle mascot stays mostly hidden. Typography is still undecided.

Explore two logo lettering families: (1) authentic chalk or white slate-marker handwriting; (2) restrained semibold, slightly italic sans-serif resembling practical film-production lettering, businesslike with a little cinematic energy. In both, the striped hinged clapper spans the full width above the wordmark and combines with the lettering as one logo. Omit possum motifs from this logo exploration. Preserve the approved possum separately as the app guide. One numbered comparison grid before selecting final typography.

**Latest typography selection:** Owner likes the production sans family in `mockups/12-charcoal-logo-grid.png`, prefers S1 or S3, and also accepts S2. S4 is too angular. This supersedes the earlier chalk-versus-sans exploration. Use S1/S3 as the basis when refining a selected layout; the broader language grid was already generating when this preference arrived, so any marker variant in that grid is a layout/material comparison only.

**Next layout refinement:** Owner prefers the formal character of 02/06 in grid 13, with the simpler spacing and fewer rules of 01. Remove unnecessary grid lines and panels. During capture instructions the possum must visibly rise and act as the speaker, with ear/tail tweening; a speech bubble is unnecessary. OBS tail must be more visibly curled, lower and closer to the right-side possum, with anatomy plausibly connected behind the board instead of separate head/tail fragments at opposite ends. Broad photo-plus-QR composition is acceptable, but next proposals must vary actual phone and OBS composition, framing and silhouette rather than repeat one layout with different labels. Production sans remains selected.

**Puppet sample request:** Generate one annotated exploded sprite atlas with one or two assembled poses, separate animatable paper-cut components, clear part IDs and pivot guides. Owner intends programmatic masking/cropping and pin-puppet assembly for Android and OBS. Generated annotations are illustrative until crop bounds, pivots, parent relationships and rest transforms are measured and verified by reassembly; do not claim a generated sheet is already a functioning rig. Keep the approved panel09 animal design, subtle texture and broad overlap at hidden joints.

**Owner rejection of grid14:** All four proposals are rejected. Do not use their mascot or blue-gray palette. Approved mascot remains EXACT panel09: flat angular paper-cut shapes, restrained detail, no added line art or cartoon redesign. Background must be neutral near-black/charcoal, never blue. Retain a FEW useful white slate rules; removing all rules was incorrect. OBS must use side-by-side photo and QR, QR square occupying essentially the full usable height beneath the narrow clapper; reject panoramic-photo-above-tiny-QR arrangements. Idle OBS mascot shows ONLY ear tips/crown and a low curled tail plausibly connected behind the right side—no eyes, muzzle, paws or whole head. A correction must satisfy these constraints before further alternatives. Grid15 puppet sample is also not an approved replacement character design.

**Owner rejection of puppet15:** Explicitly rejected as unfaithful. Mascot target is 90% panel09 and at most10% panel05 if simplification is necessary, never more detailed than09. Owner authorizes physically cropping the reference sheet to isolate09. Use the isolated original artwork, not generated grid14/15 animals, for future sprite work. Preserve light paper texture within simple cut shapes and omit added linework/fur rendering.

**LATEST PLACEMENT CORRECTION — overrides earlier right-side tail interpretations:** Tail curls INSIDE the BOTTOM-LEFT corner. Crown and ear tips peek INSIDE the BOTTOM-RIGHT corner. ALL mascot artwork is clipped to the popup rectangle; nothing projects outside. Preserve plausible concealed body placement through scale and curvature, not by moving the tail to the right. No whole face, eyes, muzzle or paws on the idle OBS popup. The reference is textured cut paper, NOT folded origami, faceted low-poly art or added angular surface shading. Grid16 is rejected too. Stop further speculative generation; use isolated09 as the unchanged visual reference and these exact placement constraints for the next explicitly requested revision.

**Current authorized revision:** Owner now requests app, puppet cutout and OBS mockups with planned, working pin animation rather than disconnected generated pieces. Build from isolated09, define pivots/parents/bind transforms and validate reassembly with shared cutouts. Prototype in `mockups/18-working-review/`.

**Latest clarification — distinct pose drawings required:** Isolated09 is the exact character-design reference, not the literal source to slice into a final sprite pack. Generate two or three genuinely different base poses preserving its proportions, face, cut-paper shapes and texture. Each pose requires its own silhouette and matching overlapping puppet layers, with measured joints after generation. The existing single-pose nine-part rig is only a mechanics experiment and does not satisfy this art requirement. Planned bases: relaxed crouch, upright instruction gesture, forward-leaning paw-to-nose. Use pose-specific art swaps for changes of silhouette/occlusion and joint tweening for small motion within a pose; do not try to stretch one drawing into all three.

**Pitched clapper riff direction:** Owner requests roughly six or seven clapper hits forming a short funky melodic riff, pitching a real clapper sample up/down according to basic musical rules. Future challenge derivation should select rhythm, pitch sequence and tempo unpredictably and bind the exact result into the signed challenge. Proposed bounded pitch palette: a minor-pentatonic set within about one octave, short neighboring steps with occasional thirds/fourths, clear beat anchors, brief rests and a resolved ending. Specify a versioned mapping from fresh challenge entropy to those choices; sign pitches, onset timing/slots, tempo, sample identity and synthesis-profile version. Current implementation has only signed beat slots/tempo and a synthetic tone: pitched riffs are NOT yet implemented. Avoid recent repeats within a session; do not promise global uniqueness in a finite musical space. The audible riff is not a high-entropy identity secret. Retain sample-timed playback and test hardware onset latency separately.

Latest owner direction and transport audit: see [visual-transport-review.md](visual-transport-review.md). Two proposal grids first, then wait for selection before full mockups. This supersedes the historical wait instruction above. A brief flash-photo reveal followed by sustained normal Photo A is now an approved option.

“No cap! Clap!!” is the cute CLAPPA tagline. Preserve the exact spelling and punctuation. Consider it for a splash screen or promotional mockup; keep it optional and out of the way of capture instructions, photo evidence and QR codes. The wording is playful branding, not a security guarantee.
