# Native two-camera execution

Two real concurrent CameraX captures completed through the production app, OBS and verifier on the emulator. Both views used normal and illuminated groups, for eight original JPEGs across two challenges.

- Front original size: 768×1024.
- Rear original size: 1392×1856.
- Normal-to-illuminated group completion: 592 / 604 ms.
- Front/rear frame-delivery gaps: 89 / 70 / 82 / 78 ms.
- Two photo QR packages: 2275 and 2290 compressed bytes, 12 frames each.
- Final recording: EXACT ORIGINAL VERIFIED; 4506 encoded packets matched.

The emulator's synthetic camera scene is intentionally visible in the screenshots. Screen colour and LED-torch API calls completed, but virtual cameras do not establish physical reflected illumination or simultaneous exposure on the S22. iPhone is not built. The separate native fixture is labelled synthetic and exercises signed evidence rejection/recovery.
