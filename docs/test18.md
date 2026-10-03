# Test18 — saved connections and network recovery

## What was wrong

The installed OBS pairing code advertised a former VPN address (10.148.151.138) while the computer's current Ethernet address was 192.168.1.4. The address picker used interface enumeration order and never refreshed automatically. Separately, every OBS restart generated a different TLS certificate and bearer token, invalidating the phone's saved connection. The pairing image was also downsampled with smoothing to 220 pixels, and an ordinary unavailable connection used the worried challenge-error mascot.

## Changes

- OBS saves its TLS certificate, TLS private key, bearer token and accepted phone public identity in `connection.secret`, outside session proof directories. Windows encrypts it with current-user DPAPI. Other builds use an owner-only file. The phone's signing private key never leaves the phone.
- Restarting OBS preserves the pairing. Choosing **Pair a different phone** explicitly replaces the connection credentials and revokes the old code. Updating from pre-Test18 requires one scan because those builds did not retain their credentials.
- Automatic address selection prefers active Ethernet/Wi-Fi and excludes common tunnel/virtual adapters. It refreshes every two seconds. Advanced manual address selection remains available.
- When the saved address is unreachable, the phone sends bounded LAN discovery datagrams. They carry a nonce and public certificate fingerprint, never the bearer token. Replies are routing hints only: the original TLS pin and authorization remain mandatory. Successful discovery updates the saved address.
- Each Android connection attempt owns its client, URL, cursor and failure state; cancelled attempts cannot replace the active connection. Signed submissions are not blindly replayed.
- Ordinary startup/connection failures do not display the worried possum. The action is **Connect to OBS**. One bounded automatic retry precedes a useful network message rather than an endless spinner.
- The pairing QR is rendered at integer module size without smoothing. The phone scans only QR codes, handles camera row/pixel strides, distinguishes unrelated codes and confirms a read while connecting.

## Network boundary

A VPN/firewall that blocks LAN access can still prevent connection. CLAPPA does not disable VPNs, alter their routing, add public listeners, or bypass the user's VPN policy. LAN discovery also depends on broadcast being allowed. Automatic approval review rejected an additional installer UDP firewall rule; the installer and system firewall settings were left unchanged. No physical phone/VPN matrix has been exercised; emulator and native results are recorded below.

## Validation

Initial pairing, reopening the phone, and restarting isolated OBS all passed without rescanning after the first pairing. Certificate fingerprint and token remained unchanged. The native discovery responder matched the saved fingerprint and nonce; pinned HTTPS accepted the saved credentials. Native portrait/landscape connected views were captured. Offline startup showed Connect to OBS with no worried mascot. Full camera/transfer/seal flow returned EXACT ORIGINAL VERIFIED: 111 signed events, 8572 matched media packets, two timed beacon challenges, one additional photo and three detached media proofs. A concurrent UI inspection interrupted the test controller; it resumed and sealed the same recording successfully. Incorrect bearer tokens were rejected; discovery ignored the wrong fingerprint; the rendered pairing QR decoded. The Windows stored connection did not contain plaintext key material.
