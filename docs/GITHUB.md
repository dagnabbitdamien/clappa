# Developer setup

Looking to use CLAPPA? Start with the [main README](../README.md) and [download the Test19 preview](https://github.com/dagnabbitdamien/clappa/releases/tag/test19). You do not need to build the source or install Node.js to use the phone app and OBS plugin.

## Current build

The current source and local build are **Test20**: Android version `0.3.0-test20`, version code `30`. The expanded challenge catalogue and completed checks are described in [Test20's build notes](test20.md). The published preview remains **Test19** until a new release is uploaded. CLAPPA targets **Android 9 or later** and the native **64-bit Windows OBS plugin**. macOS, Linux and iOS builds are not supplied. Source changes do not update an already downloaded APK or plugin; a new release must include matching builds of both.

The release provides `CLAPPA-0.3.0-test19.apk` and the Windows plugin kit containing `clappa.dll` and **Install OBS plugin.cmd**. Install both parts from the same release. Read [Test19's validation notes](test19.md) for the scope of the preview; complete live Twitch authorization and an audience-triggered challenge remain unconfirmed.

## Protocol and verifier

Use Node.js 22 or later and pnpm. From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm test
```

See [protocol and verification](../protocol/README.md) for the evidence format and [the architecture map](CURRENT-ARCHITECTURE.md) for implementation entry points.

## Android

The existing build environment uses JDK 21, Gradle 9.1, Android SDK 36 and Kotlin/Compose. Open `android/` in Android Studio or configure those toolchains locally. Machine-specific SDK paths and signing keys are excluded.

The app's minimum Android API is 28. The installable package is `org.clappa.app`; the separate review build adds `.review`. A build signed with your own debug key cannot update an installation signed by a different key. Back up the phone's CLAPPA identity before uninstalling an existing app.

## Native OBS plugin

Build `obs-plugin/` with CMake, Qt 6, matching OBS headers/import libraries and the native dependencies listed in [THIRD-PARTY.md](../tools/distribution/THIRD-PARTY.md). The CMake settings `OBS_SOURCE`, `OBS_IMPORT_DIR` and `NATIVE_DEPS` point to those local dependencies. The Windows release installer expects OBS under `Program Files\obs-studio`.

The plugin uses OBS's encoded-packet callback API. Build against the target OBS version and validate that version; a complete compatibility matrix is not yet available. No companion process or Node.js runtime is required by the installed plugin.

## Generated files and packaging

- `node tools/generate-protocol.mjs` updates the shared schema.
- `node tools/generate-prompts.mjs` updates Android and OBS prompt labels from `protocol/prompts.json` and `protocol/dual-prompts.json`. `protocol/challenge-set-v3.json` fixes the ordered current prompt pool; the corresponding native tables are checked against shared choice vectors. Preserve the v1/v2 mappings and their historical vectors; new challenges use `CLAPPA-CHOICES-v3`.
- `node tools/choice-vectors-v3.mjs` regenerates the v3 cross-language choice vectors. Keep historical v1/v2 vectors unchanged.
- `tools/package-release.mjs` packages existing build outputs and checks the APK's version, package identity and signer. It is a local release harness, with machine-specific tool paths, rather than a portable build command.

For a Test20 release, set the Android source version to the matching `-test20` version, build the updated APK and OBS plugin, then run `node tools/package-release.mjs test20`. The harness rejects an APK whose package, version or signer differs from the source and records SHA-256 hashes for the actual APK and DLL. Record fresh validation in `docs/test20.md`; retain the earlier release's notes and artifacts as historical records.

APKs, plugin binaries and checksums belong in [GitHub Releases](https://github.com/dagnabbitdamien/clappa/releases), outside the source tree. Local signing identities, credentials, proof photos, recordings, SDKs and build caches are excluded. The deterministic test-vector keys are public test fixtures; the Twitch client ID is public application configuration.

## Documentation and licenses

Use the [documentation index](README.md) to find current references. Earlier test reports and review notes are historical records; their local links and commands may refer to the original development machine.

No project license has been selected. Publishing the source does not grant an open-source license. Retain the applicable third-party notices, including the vendored blst license and asset/audio attributions.

