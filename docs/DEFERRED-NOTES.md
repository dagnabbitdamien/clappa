# Deferred work notes

Owner requested notes only until **19 September 2026, 7:47 p.m. Australia/Sydney** to conserve usage. Do not implement or rebuild before then without an explicit override. No automatic work is scheduled.

## 2026-09-16 — Additional-photo action remains after use

User report on Test12.1:
- After sending an additional photo, the Add a photo button remains available.
- Further photographs can be taken, but they do not appear in the OBS overlay.
- Whether those later attempts are transmitted, saved or signed is unknown; no investigation performed during the pause.

Requested behavior:
- Keep the one-additional-photo limit per completed challenge.
- Once that additional photo is successfully submitted, remove the offer/button and its timer, returning to the appropriate next action.
- Prevent repeated submissions while the first is pending. If submission fails, show the actual failure state and allow a retry only when valid.

When work resumes: trace the offer state through capture, send, acknowledgment and rejection; check that later attempts cannot silently appear actionable and that one accepted additional photo yields one signed event and one OBS popup. Do not broaden the protocol to unlimited additional photos.

Status: implemented on 22 September 2026 after the owner explicitly resumed work. See [the cause, fix and regression results](review13/ADDITIONAL-PHOTO.md). Native end-to-end review of this revision remains separate from the passing unit tests.
