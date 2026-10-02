# Native OBS pairing — test2

The owner confirmed that the phone tried `192.168.1.4:17443`; `.14` was a transcription error. Inspection found a listener on `0.0.0.0:17443`, Ethernet using `192.168.1.4`, a Public network profile, and explicit inbound Public rules blocking `node.exe`. OBS itself had inbound Allow rules. The old companion's Node listener was therefore blocked by Windows Firewall.

The replacement is compiled into `clappa.dll`. It creates an ephemeral TLS certificate and random pairing token, renders its own pairing QR, receives and validates signed phone events, saves images, renders proof tiles, requests OBS stop, and checks the phone's final seal. It never starts a helper executable. Node remains an optional developer/independent-verifier tool, not an OBS runtime requirement.

The pairing transport is now `https-poll-v1`: certificate-pinned HTTPS, authenticated POST `/message`, and GET `/poll?after=N` every 250 ms. Responses carry monotonically numbered messages; polling acknowledges previously received messages. Signed proof schema 0.2 is unchanged. The Android and OBS test2 builds must be updated together. HTTP plaintext is not accepted. The TLS private key is temporary and is unrelated to the phone's long-term signing key.

The installer adds one inbound rule for the installed OBS executable, TCP 17443, remote LocalSubnet, Private and Public profiles. It does not disable the firewall, change the network category, open router ports, or unblock Node. An existing explicit block rule for OBS would still take precedence. The dock lets the user choose a local adapter address and reports port-in-use failures.

## Upgrade and pair

1. Close the old companion and close OBS.
2. Run `output/test-kit-v2/Install OBS plugin.cmd` and accept the administrator prompt.
3. Install `CLAPPA-0.2.0-test2.apk` over the existing phone app. The signing certificate matches test1; do not uninstall or clear app data.
4. Open OBS. Open **Docks > CLAPPA**, choose the PC's home-LAN address, and scan the new QR via **Settings / Pair > Scan QR** on the phone.
5. Both sides should report connected. The QR hides after pairing. The dock may be docked into the OBS window or closed; networking and the source continue independently of its visibility. OBS's generic dock-close notice is not a CLAPPA error.
6. Keep your existing **CLAPPA proof tile** source. Start recording, wait two seconds, tap to clap, and capture the two-photo challenge. For the first test, use local x264/AAC MKV recording with Studio Mode off.
7. To finish, use the phone's **End session**, capture the final challenge, then **Stop & seal**, and approve the final signature. The dock reports **Recording sealed**. The independent verifier can then report **EXACT ORIGINAL VERIFIED**.

No companion window or companion download is needed. For another test session in this build, restart OBS and the phone app and pair again. Proof folders remain under `%USERPROFILE%\CLAPPA\sessions`; recordings remain in OBS's configured output folder.

## Validation

- Native plugin loaded in an isolated copy of installed Windows OBS 32.2.1.
- Simulated phone verified the listener certificate fingerprint, paired, supplied signed bookend challenges and two JPEGs each, and signed the final seal.
- Actual OBS x264/AAC output and rendered tiles were recorded. Independent verification of the resulting recording and native packet archive returned **EXACT ORIGINAL VERIFIED**.
- Unauthenticated HTTPS requests and a tampered phone signature were rejected.
- APK build and signature checks pass; test1 and test2 use the same APK signing certificate.
- Full S22 Ultra camera capture/flash timing and QR recovery from a transcoded stream remain device/codec tests. The mascot is still a placeholder.

The final verifier checks the archived encoded packets and the recording's exact file hash separately. Independent extraction/matching of packet commitments from the recording container remains unfinished. This is an experimental integration build, not a completed security product.

The protocol/verifier tests run with `node --test verifier/test/*.test.mjs`. Native integration testing uses `obs-plugin/native-integration-test.mjs` against the isolated portable instance on port 17444, never the user's OBS instance. Add `--reject-bad-signature` for the negative case, restarting the isolated instance between runs. Native dependency versions and notices are in `obs-plugin/vendor/`.
