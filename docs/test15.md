# Test15 — possum menus and audience invitations

2026-10-02. Android version 0.3.0-test15 / code 20. Update the APK and OBS plugin together. This is a prerelease, with no changes to the signed proof profiles or approved streamer clapboard geometry.

## Presentation

The Streamer and Viewer cards now feature approved whole possum sprites instead of the eye and clapper icons. Orange accents, charcoal cards and the italic tagline are retained. Viewer guidance and successful verification also show the possum. The Twitch invitation uses the approved waving pose, concise copy and an orange acceptance action. Whole character bounds are preserved.

## Twitch chat

Open Twitch audience challenges in the OBS dock, enter a channel, then choose Connect with Twitch. The plugin uses Twitch's device authorization flow with the registered public client and only `chat:read`. A browser opens to Twitch's activation page. Cancel/disconnect invalidates pending callbacks and clears memory credentials. Existing advanced token entry remains optional. No client secret, chat-send permission, backend, persisted access token or refresh token is introduced.

Three distinct Twitch user IDs sending 🎬 within 15 seconds produce one invitation, with a two-minute cooldown. The paired phone vibrates and asks whether to accept. Only acceptance starts the ordinary beacon-derived challenge. Busy requests are discarded; chat cannot choose a prompt or start the camera. Identity linking and chat authorization remain separate.

Implementation follows [Twitch device authorization documentation](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#device-code-grant-flow). Twitch's device-code endpoint accepted this application's public client and issued the documented code/interval/expiry. Full live user consent and live multi-viewer delivery remain unverified; local injected chat requests are explicitly test fixtures.

## Validation

83 JavaScript protocol/verifier tests and 35 Android unit tests pass. Native chat tests cover distinct users, duplicate messages, spam, expiry, room isolation and cooldown. OAuth checks cover activation-host restrictions, token injection/bounds and canceled callbacks. Actual Android portrait/landscape screenshots and local capture/seal results are retained in the local review folder. Physical haptic sensation and S22 illumination are not emulator assertions.

The Test15 local emulator + isolated OBS run completed with EXACT ORIGINAL VERIFIED: 85 signed events, two fresh-beacon challenges, one additional photo and 6,558 matched recording packets. The additional-photo offer did not reopen. The invitation was injected through a review-only entry into the production phone handler; it did not initiate a challenge until acceptance. No live Twitch audience was simulated as verified traffic.
