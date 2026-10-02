# Repository contents

This repository contains CLAPPA source, bundled application artwork/audio, protocol documentation and synthetic test vectors. The latest test build is Test14.1; read `test14.1.md` and `test14.md` for current behavior and limitations. Live Twitch account authorization remains unverified.

Local phone identities, signing keystores, SDKs, dependency caches, captured photos, recordings, session bundles, generated review pages and packaged builds are excluded. Historical review links may refer to excluded local artifacts. APKs and OBS plugin binaries should be distributed as GitHub Release attachments, not committed to source history.

The keys in deterministic test-vector generators are deliberately public test keys. Never use them as a real signing identity. The configured Twitch client ID is public application configuration, not a client secret.

No project license has been selected. Retain existing third-party license notices, including the vendored blst license and audio attribution. Do not assume that publishing the repository grants an open-source license.

## Development entry points

- Install Node.js 22 or later and pnpm; run `pnpm install --frozen-lockfile`, then `pnpm test` at the repository root.
- Android uses JDK 21, Gradle 9.1, Android SDK 36 and Kotlin/Compose. Open `android/` in Android Studio or configure those tools locally. SDK paths and signing keystores are intentionally not included. A locally generated debug key will not update an APK signed by another developer.
- Native OBS uses CMake, Qt 6, matching OBS headers/import libraries and its native dependencies. See `obs-plugin/CMakeLists.txt` and existing Windows build notes. Machine-specific `.tools/` paths used by review harnesses require local setup.
- `node tools/generate-protocol.mjs` updates the shared schema; `node tools/generate-prompts.mjs` updates prompt labels. Preserve existing versioned choice mappings.

This is a development snapshot, not a turnkey cross-platform release. Historical automation scripts may reference the original local review environment.
