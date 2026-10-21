# Twitch audience challenges

This optional listener runs inside the native OBS plugin. It does not require a CLAPPA server or send chat messages. The proof protocol and challenge derivation are unchanged.

## User flow

Open **Twitch audience challenges…** in the CLAPPA dock. Enter your channel and choose **Connect with Twitch**, then approve read-only chat access in the browser. Advanced token setup remains available if needed. Sign in again after restarting OBS. Do not paste a token into a proof folder, profile or recording.

The token is validated at connection and hourly against Twitch's HTTPS validation endpoint. The returned account login is used for the IRC connection. Credentials are held only in process memory; the entry field clears immediately, disconnect forgets the stored token, and OBS exit tears down the connection. Qt/network buffers may retain temporary copies until freed; this is not a promise of forensic RAM erasure. No credentials or chat text are logged or written to proof files. CLAPPA does not inspect OBS's Twitch credentials.

The listener uses authenticated TLS to `irc.chat.twitch.tv:6697` with the official tags/commands capabilities. Twitch recommends EventSub for new general chat applications, but continues to document IRC; the deliberately read-only native listener uses existing Qt Network dependencies and needs no WebSocket runtime or callback server. Only login, capability negotiation, room join and keepalive traffic is sent. There is no chat-send operation.

Three distinct authenticated Twitch user IDs posting 🎬 within fifteen seconds produce one request, with a two-minute cooldown. Multiple emoji or messages from one account count once. Duplicate message IDs, other rooms, shared-chat relays and malformed/oversized messages are ignored. Counts use the monotonic clock. This resists simple spam, not coordinated multiple accounts. The initial defaults are fixed and explained in the dialog.

A request is sent only when the connected phone has an active signed session and no pending challenge. It is an unsigned UI request over the existing authenticated local transport, not evidence and not a challenge-selection input. The phone chooses whether to accept through its ordinary fresh-beacon challenge flow. Chat cannot pick a prompt, initiate a capture or start/stop recording. Busy/unavailable requests are discarded rather than queued to surprise the user later. The cooldown still applies.

Chat is disabled by default. TLS failures, invalid permission, connection errors and timeouts turn it off with a reconnect explanation. It does not silently reconnect indefinitely. Closing the settings dialog keeps an explicitly connected listener running; **Disconnect chat** turns it off.

## Phone integration contract

The normal encrypted `/poll` queue delivers:

```json
{"type":"chat-request","request_id":"unique request ID","source":"twitch","viewers":3,"expires_at":1790000000000,"session_id":"current session ID"}
```

Expiry is sixty seconds after sending. Android must deduplicate `request_id`, reject expired/wrong-session requests and show a single haptic/UI request only while ready. Accept invokes the existing challenge initiation; dismissal only clears the hint. Neither requires a new signed event type. Normal poll acknowledgment handles transport delivery.

## Validation

- Native Windows plugin and `clappa-chat-test` compile successfully.
- Executed C++ tests cover distinct viewers, repeated-user spam, duplicate message IDs, window expiry, cooldown, wrong room, shared-chat relays, missing IDs and oversized input.
- IRC control parsing is separate from viewer text. Regression cases ensure a viewer writing NOTICE, RECONNECT, ROOMSTATE or numeric-command text cannot disconnect the listener or fake a joined state; actual server controls and newline rejection are checked.
- No live Twitch credentials were supplied and no authenticated live Twitch test was run. Native connection/permission behavior requires an authorized Twitch account; this limitation must remain explicit in release notes.
- Android UI and full integrated delivery validation are reported separately in the revision review.

## Sources checked 22 September 2026

- [Twitch IRC connection, capabilities, authentication and parsing](https://dev.twitch.tv/docs/chat/irc)
- [Required token validation](https://dev.twitch.tv/docs/authentication/validate-tokens/)
- [Twitch OAuth token flows](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/)
- [Twitch recommendation of EventSub](https://dev.twitch.tv/docs/chat/)

## Test15 browser authorization (2026-10-02)

The default setup now uses **Connect with Twitch** and Twitch's device authorization flow (`chat:read` only). Enter the channel, authorize in the browser, and wait for the listening status. The manual token workflow above remains under Advanced token setup. There is no client secret or local callback server for chat authorization. Tokens remain in process memory only; reconnect after restarting OBS or authorization expiry. Cancel invalidates in-flight callbacks. Full live authorization is still not confirmed; device-code issuance with the registered client has been checked successfully. See `../test15.md` for measured validation.

