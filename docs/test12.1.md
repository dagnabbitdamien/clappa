# CLAPPA Test12.1

Install the APK over the current app. Close OBS, then run Install OBS plugin.cmd. No protocol or camera-mode change.

- Stable Add a photo button, with a separate smooth countdown bar.
- Frame-driven capture countdown, using the actual deadline.
- OBS exit: damped hinge lag; the free tip keeps descending without an upward kick.
- Settings describe identities without development history. A device-bound export limitation is explained only when Export private backup is requested. Existing identities are preserved.
- OBS dock shows the proof path, Open proof folder, and Browse recordings and proofs.
- Sessions.html provides a readable index. New sessions get SESSION.txt and session-info.json with local/UTC start, elapsed OBS duration, recording path, photo folder and final-seal presence. Summaries are unsigned navigation aids; seal presence is not verification. Older folders appear with their creation date and available links, without invented durations.

Default proof location: your user folder/CLAPPA/sessions/<session id>/proof. Photos: proof/images.

Checked: Android and Windows plugin builds, 18 Android unit tests, four native portrait/landscape countdown recordings (12 samples/second), and actual OBS exit plus session-summary creation after recording stop. The OBS motion check replays previous evidence and intentionally has no final seal. Camera/protocol checks from Test12 remain documented there; they were not rerun for this presentation-only patch.
