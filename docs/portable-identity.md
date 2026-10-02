# Portable signing identity — current implementation

The owner wants a portable, user-controlled signing identity without a CLAPPA account or hosted service. Setup should explain the identity in familiar terms and allow a user to bring their own supported private key. A user-visible name, public key fingerprint, and password-protected recovery/export workflow are the proposed presentation. A self-chosen name alone cannot establish unique ownership of that name.

Phone Settings imports one P-256 private key and matching certificate from a password-protected PKCS#12 (`.p12`) file into Android Keystore. Keep the original file and password as the portable backup. Import is disabled during a recording/session. The default device-generated key remains non-exportable; this feature does not export it. OBS accepts only a public key/fingerprint. Its TLS certificate is a separate connection credential, not the phone's long-term signing identity.

## Boundaries and future extensions

- The app currently creates a default identity or imports an existing `.p12`, and shows its public fingerprint. Optional display names and an in-app encrypted-backup creator remain future work.
- Support an explicit, documented key format/algorithm; current verifier/native OBS accepts P-256 only. Unsupported key types must produce an understandable rejection rather than silently generate a different identity.
- Use a password to protect an encrypted private-key backup, not username plus password as the sole source of private-key entropy. Record KDF/cipher parameters in a versioned format and test restoration and incorrect passwords.
- Keep the signing key on the phone during use. Import into protected device storage where supported; key-export/recovery design must explicitly account for the current non-exportable Android Keystore model. No private keys belong in OBS, QR codes, logs, or public proof.
- Treat a Twitch account association as a separate identity attestation. Twitch's documented OAuth authenticates access to Twitch APIs; its access token is not a user-owned arbitrary-media signing key. Do not reuse a Twitch password or OAuth token as a CLAPPA signing secret. See https://dev.twitch.tv/docs/authentication . Twitch integration still follows the end-to-end core milestone.

## Cadence clarification

Test7 derives its six/seven-hit pitched clapper phrase from the signed session ID, public identity fingerprint, fresh random challenge ID and issue timestamp. See [cadence-v1.md](cadence-v1.md) for the implemented recipe and tests. No password or private key is used as an audible secret.

A short audible pattern is not high-grade authentication or standalone freshness proof; the musical vocabulary can repeat. Historical/public time alone is not unpredictable and does not establish a live deadline. Protocol 0.3 retains explicit cadence/slot fields and accepts older valid patterns; Test7 pitch selection is a rendering convention rather than a new schema requirement.
