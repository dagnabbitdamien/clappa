# Test17 — consistent native menus and useful camera previews

Android 0.3.0-test17, version code 26. Update over the existing APK; the signing certificate is unchanged. The OBS plugin is the unchanged Test16.2 binary.

## Changes
- One shared top-anchored, edge-to-edge 16 dp accent and consistently aligned 32 sp wordmark for Home, Viewer, Settings and Twitch.
- Explicit outlined Home/Back/Done navigation. One Viewer scan action; consistent “Scan a proof” wording. Approved binoculars illustration follows the instruction and adapts to landscape.
- Viewer camera surface is clipped to its preview, preventing it from covering branding or controls.
- Streamer wordmark uses the same size and horizontal gutter. Its working clapperboard retains the physical jaws, hinge and motion.
- Front camera / Rear camera labels. Two large equally allocated preview panes: stacked in portrait, side by side in landscape. Compact shutter/back/status row. Preview fill uses a centred crop; saved evidence photos remain uncropped.

## Validation
Debug and isolated review APKs compile successfully. Native emulator screenshots cover Home, Viewer empty and verified states, Twitch, and the production dual-camera layout in portrait and landscape. Scan/cancel/Home navigation and the actual streamer screen were exercised. Settings also checked with 1.3× text and three-button navigation. Viewer decoded eight actual QR frames, verified the challenge and rejected three altered proofs.

Dual-camera screenshots contain clearly labelled layout placeholders, not real concurrent sensor feeds. Physical S22 Ultra concurrent capture was not available for this revision. No new end-to-end recording/sealing or live Twitch authorization claim is made. The previous recording-flow result remains Test16; this release changes presentation, not protocol or OBS QR geometry.

See review17/DESIGN-REVIEW.md for design rationale and review17/index.html for native screenshots.

Review harness note: the older ReviewTwitchActivity authentication fixture failed its time-dependent “future” expectation as the clock advanced; it was not used as current authentication evidence. Twitch layout screenshots were collected through the real Home → Streamer → Settings → Manage Twitch account route.
