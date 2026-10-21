# Platform notes

These notes are informative, not normative.

## Owner's target devices (2026-09-12)

- First Android test device: **Samsung Galaxy S22 Ultra**.
- First OBS development and test platform: **Windows**, matching the owner's computer.
- Intended native OBS plugin support: **Windows, macOS, and Linux**.

Keep shared plugin behaviour portable and isolate platform-specific integration. Each operating system still needs its own build, packaging, and testing before support can be claimed. Windows-first validation does not change the cross-platform goal. Android remains the first phone platform; iOS is outside the MVP.

## OBS

The plugin should rely on public OBS APIs for:

- frontend lifecycle hooks;
- recording path retrieval;
- dock UI;
- rendering the proof tile source.

## Twitch

Twitch chat triggering can remain serverless from CLAPPA's perspective by using the broadcaster's local authorization and WebSocket/EventSub-style flow.

## Zoom / calls

CLAPPA can be used indirectly in Zoom or similar tools via OBS virtual camera. In that mode, recipients may simply view proof moments live without ever receiving the local proof folder.

## Self-contained proof direction

A long-term design direction is:
- challenge evidence embedded visibly via QR in the video;
- exact final seal attached as a trailer or sidecar.

That would make the recording more self-contained, even if the project still saves a local proof directory for convenience.
