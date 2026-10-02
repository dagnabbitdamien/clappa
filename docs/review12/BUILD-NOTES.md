# CLAPPA Test12

Install the new APK over the existing phone app. Close OBS and use **Install OBS plugin.cmd** from the kit to update the native plugin. Update both together. No companion app or account is needed. The 872×480 source size and scene placement are unchanged.

Changes:

- One stream popup after capture. The phone alone shows **Waiting for fresh timing beacon…**.
- Optional signed **Use both cameras** mode in Settings: front/rear normal views, followed by front RGB and rear LED-torch views. All four images are saved, hashed and represented in the QR; OBS shows both views.
- Stopping a recording automatically signs it while the phone is connected. No separate Sign/Decline prompt.
- Missed/cancelled challenges remain recorded but allow the session to continue. Verification distinguishes integrity from completed visual challenges.
- Thirty seconds for an optional additional photo; three seconds between normal and illuminated groups/photos, including selfies.
- Smoother OBS text, stronger exit hinge lag and subtle dark cells behind digital clock digits.
- Clear public-identity sharing and password-protected private-key export/import. Existing non-exportable identities are preserved; creating a new portable one is an explicit choice that changes the public code.
- More tolerant idle reconnect handling; consecutive recordings retain the current pairing. Restarting OBS or generating a new code still requires the current pairing QR.

The [review page](index.html) contains native Android screenshots, actual OBS recordings and engineering results. [Exact QR contents](QR-PAYLOAD.md) and [protocol/identity details](SESSION-POLICY.md) explain the changes.

This is a Windows/Android test build. Emulator checks exercise the application and camera pipeline, not physical S22 flash illumination. The iPhone port is not implemented. Local transcode results do not certify delivery through streaming platforms.

Original photographs, recording and proof folder remain local. **Verify latest recording.cmd** uses the included verifier (requires a local Node runtime). A valid final seal verifies exact recording integrity; the result also lists missed challenges and completed-response counts. It does not declare a photograph genuine or a visual challenge passed.
