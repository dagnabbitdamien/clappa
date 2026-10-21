# CLAPPA Test19 preview

CLAPPA pairs an Android phone with OBS to put fresh photo challenges and checkable evidence on your stream.

## Downloads

- **[Android app](https://github.com/dagnabbitdamien/clappa/releases/download/test19/CLAPPA-0.3.0-test19.apk)** — Android 9 or newer.
- **[Windows OBS kit](https://github.com/dagnabbitdamien/clappa/releases/download/test19/CLAPPA-test19-kit.zip)** — plugin, installer and verification tools.
- [OBS plugin DLL](https://github.com/dagnabbitdamien/clappa/releases/download/test19/clappa.dll) — for manual installation.
- [SHA-256 checksums](https://github.com/dagnabbitdamien/clappa/releases/download/test19/SHA256SUMS.txt).

Install the APK on your phone. On Windows, extract the kit, close OBS and run **Install OBS plugin.cmd**. Open **Docks → CLAPPA**, pair the phone and add the proof-tile source to your scene. No separate companion program is needed.

Update the Android app and OBS plugin together. Saved pairing from Test18 is preserved.

## What's improved

- **Quicker proof display.** OBS prepares the photo board once, then updates its QR layer, reducing repeated image work.
- **Shorter QR overlays.** QR frames advance every 180 ms while retaining the full recovery sequence.
- **Easier finishing.** For 30 seconds after OBS acknowledges a successful challenge, **Stop & seal** is available alongside **Add a photo**, without asking for another challenge.

Stopping the proof recording does not stop an OBS broadcast. Original photos, signed evidence and final recording verification are unchanged.

## Preview notes

This build targets Android and 64-bit Windows OBS. There is no iPhone app yet. Local QR recovery at 1080p/720p, Android unit tests and the local capture-to-seal flow were checked; physical phone/network throughput and arbitrary streaming-platform delivery were not established. Complete live Twitch account authorization and audience-trigger testing remain unconfirmed.

CLAPPA provides evidence for viewers to inspect. It is not an automatic AI detector or a guarantee that a scene is physically real.

[Quick start and challenge examples](https://github.com/dagnabbitdamien/clappa#readme) · [Detailed validation notes](https://github.com/dagnabbitdamien/clappa/blob/main/docs/test19.md)
