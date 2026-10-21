# Test17: one application, consistent screen structure

## Findings and changes

The old home screen centred its entire content, including the brand. Viewer, Settings and Twitch used independent padding, type sizes and stripe widths. This made navigation feel like entering different products. A reusable MenuLayout now owns the full-width top accent, safe areas, 32 sp wordmark, 20 dp content gutters, fixed minimum header height, screen title and outlined return action. Header placement no longer depends on the amount of body content. The stripe is decoration and may extend beneath a side cutout; controls remain within safe drawing insets.

Home's only choices are Streamer and Viewer. Its approved whole-character artwork belongs to those choice cards. Viewer has one instruction followed by the binoculars pose, one primary Scan a proof action and an explicit Home navigation button. The pose is an illustration, not a speaking guide; no speech treatment implies otherwise. After verification, the signed challenge remains the main information and technical details remain expandable. Scanning retains a camera preview, progress and a cancel action. The native live-camera review exposed a surface drawing outside that preview; Viewer now uses the composited CameraX preview and explicitly clips its bounds. Landscape scanning places instructions beside the camera so the preview retains useful height instead of becoming a horizontal slit.

The working streamer screen remains a physical clapperboard: its full jaws and hinge are functional, unlike the compact decorative accent on menus. Its wordmark now uses the same size and left alignment. Do not paste the full physical hinge into each menu to simulate consistency.

Two-camera capture previously chose horizontal versus vertical arrangement from the remaining preview area's dimensions. This could put two panes side by side in a portrait window. It now follows window orientation, with equal-height stacked panes in portrait and equal-width panes in landscape. Front camera and Rear camera describe the lenses without inventing a relationship to the prompt. Controls share a compact bottom row, giving more room to the previews. CameraX fills each preview with a centred crop; stored evidence still uses the uncropped sensor-derived images. The native fixture renders the production layout with labelled placeholders; it is not a dual-camera capture test.

## Acceptance

Compare actual native screenshots across Home, Viewer, Settings and Twitch: same stripe edges, wordmark size/gutter, and header baseline. Check portrait, landscape and enlarged text. Keep navigation and primary actions visually distinguishable. Check that both camera regions have equal allocation, labels stay inside them, and shutter/back controls remain outside system bars. Protocol, illumination, capture deadlines, original image files and QR geometry are unchanged by this revision.
