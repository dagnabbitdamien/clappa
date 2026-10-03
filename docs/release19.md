Quicker proof preparation and shorter QR overlays. OBS now renders the photo board once instead of re-encoding it for every QR frame; a local 26-frame benchmark fell from 2.60s to 0.52s with identical pixels. QR hold is 180ms, preserving all recovery frames. First Twitch proof is still larger because it carries the signed account evidence.

Stop & seal is available alongside Add a photo for 30 seconds after an acknowledged successful challenge, without another challenge. Update both the Android APK and OBS plugin. Saved Test18 pairing is preserved.

Local 1080p/720p QR recovery and 37 Android unit tests passed. Physical phone/network throughput was not measured. See docs/test19.md for details.
