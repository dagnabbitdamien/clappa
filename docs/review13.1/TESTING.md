# CLAPPA Test13.1 — native mascot update

Status: native Android build and visual review completed.

This Android update bundles all eleven approved whole-character possum assets. The current guide uses three active poses: 03 for a challenge, 11 for success, and 08 for an error. It does not cycle through all eleven. Pose 2 (the raised-eyebrow expression) is excluded. The rejected JavaScript character is not used. Transitions use whole-sprite squash/stretch and movement from the lower safe edge; no anatomical slicing or cutout puppet.

The layout reserves separate measured regions for the guide, speech bubble and controls in portrait and landscape. The delivered native screenshots and motion clip are the visual review evidence; the design sheet alone is not proof of APK layout.

## Installation and compatibility

Android version 0.3.0-test13.1, version code 17. Install over the existing app to retain pairing and signing identity. The Windows OBS DLL is unchanged from Test13; an already-installed Test13 plugin needs no replacement for this art update. The full kit includes that same DLL for convenience.

No challenge, capture, beacon, QR or signed-protocol changes are intended in this visual revision. The one-extra-photo fix and optional Twitch invitations from Test13 remain.

## Validation scope

Fresh Test13.1 validation: debug and review APK builds passed; all 27 Android unit tests passed. Twelve native state screenshots were regenerated with actual orientation/dimension checks after correcting an initial harness rotation error. Nine additional stress screenshots cover 130% text, navigation buttons and a hole cutout across portrait and both landscape directions. Representative portrait/landscape challenge views and contact sheets were inspected. The native motion clip is an Android emulator recording. This is layout/motion validation, not a new capture-to-OBS-to-seal run.

Prior Test13 evidence: 77 protocol/verifier tests and 27 Android unit tests passed. Its actual emulator-to-OBS recording verified 10,205 original packets and three detached media proofs, with the single additional-photo offer staying gone after receipt. Those are Test13 results, not a new Test13.1 capture/transfer/seal run.

Twitch remains an advanced token setup, with no live authentication test. Windows and Android are the built targets; there is no iPhone build. Native review uses an Android emulator and does not establish physical S22 illumination or vibration.

Prior evidence: http://127.0.0.1:17450/revision13/index.html. Artwork decision: docs/review13/mascot/APPROVAL.md in the source repository.
