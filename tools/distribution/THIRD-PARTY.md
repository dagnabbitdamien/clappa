# Native build dependencies

These are upstream dependencies, not a license selection for CLAPPA.

- cpp-httplib: revision `278c2979e8c68468960c3073e28e1c51b098d6a4`, upstream reports 0.56.0; Mbed TLS backend.
- nlohmann/json: v3.12.0, single header.
- Nayuki QR-Code-generator: v1.8.0, C++ source and header.
- Mbed TLS 3.6.4 and zlib: static libraries from the official OBS dependencies bundle, `windows-deps-2025-07-11-x64.zip`. SHA-256: `c8c642c1070dc31ce9a0f1e4cef5bb992f4bff4882255788b5da12129e85caa7`.

Upstream notices are in `licenses/` and source headers. Qt is supplied by OBS. No Node.js runtime, child helper process, or separate companion is used by the plugin.

Set `NATIVE_DEPS` to the extracted OBS dependency bundle when configuring CMake. Run `node obs-plugin/generate-schema.mjs` after changing the protocol schema; Node is a developer tool only for this generation step and the independent verifier.

Test12 includes blst v0.3.16 (Apache-2.0) and noble-curves/hashes (MIT); included dependency licenses apply. Bouncy Castle Java 1.79 (MIT-style license included) supports portable PKCS#12 backups.
