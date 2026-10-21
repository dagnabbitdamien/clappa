# CLAPPA Twitch identity extension v1

## Issuer evidence

`{profile:"CLAPPA-TWITCH-OIDC-v1", client_id, salt, id_token}`. `salt` is 32 random bytes represented as 64 lowercase hex characters. The OIDC nonce is the lowercase hexadecimal SHA-256 of UTF-8 `CLAPPA-TWITCH-OIDC-v1`, a zero byte, the CLAPPA key ID, a zero byte, and salt.

OIDC implicit response type `id_token`, scope `openid`, explicitly requested `preferred_username`; no access token, secret or email. `preferred_username` is Twitch's signed display name, while `sub` is the stable account ID. The token must retain all its original bytes for verification. It is intentionally public evidence, never usable as a Twitch API bearer access token in CLAPPA.

Verify canonical base64url, exactly three JWT components, RS256, an unambiguous key ID, issuer `https://id.twitch.tv/oauth2`, exact registered audience/client and authorized-party value, nonce, account/name fields and integer authentication/expiry times. Reject token-supplied key URLs, embedded keys and critical-header extensions. Trust RSA keys only from `https://id.twitch.tv/oauth2/keys` over authenticated HTTPS (or an independently trusted archive for offline tools), never a QR-supplied JWKS. Login additionally requires an unexpired token. Historical verification reports authentication time even after expiration; it does not assert present account control. Unknown/rotated issuer keys produce an unverified identity result.

## Event binding

`identity.binding` is an ordinary CLAPPA ES256-P1363 low-S signature over a JCS payload with exactly these fields:

```
profile: CLAPPA-TWITCH-BINDING-v1
algorithm: ES256-P1363
key_id: phone key ID
session_id: current session
event_sha256: SHA-256(JCS(signed photo event))
identity_sha256: SHA-256(JCS(issuer evidence object))
```

The first completed tile for an identity/session carries `{binding,evidence}`. Subsequent tiles carry `{binding}`. Validate the phone signature and event/session linkage before resolving the evidence digest. Verify the issuer evidence and key-bound nonce before displaying a checked account. Reference-only proofs cannot establish an account name without the corresponding verified full evidence. Never trust a caller-supplied display name instead.

Original files and signed protocol 0.3 events are unchanged. This is an optional, separately signed transport/archive extension. Removing the extension removes the account assertion; it does not make an otherwise sound anonymous proof identify the account. Disk archives retain full evidence per event under `identities/`, separate from `media-proofs/`.

## Network and UI

The phone starts a ten-minute IPv4 loopback listener on port 3000 before opening Twitch in the external browser. The exact registered redirect is `http://localhost:3000`. The callback page removes the fragment from browser history and submits it to the local app; Host, Origin, lengths and single-use state are checked. No LAN listener, hosted callback or global cleartext-network exception is added. If that port is occupied, sign-in fails explicitly. Leaving the sign-in activity closes the listener.

Native viewer mode validates the same bundled generated schema, verifies the phone signatures and BLS beacon, recomputes every challenge choice, validates media-context consistency and response timing, then verifies optional Twitch evidence separately. A QR alone does not verify actual media packet bytes, establish a public precommitment witness or prove a physical scene. Viewers use the displayed evidence for their own visual comparison.

## References

- https://dev.twitch.tv/docs/authentication/getting-tokens-oidc/
- https://dev.twitch.tv/docs/api/get-started/
- https://brand.twitch.com/
