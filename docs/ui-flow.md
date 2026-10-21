# UI flow sketch

These early text sketches describe states, not the final visual composition. The owner's updated presentation direction and required mockup stage are in `design-mockup-brief.md`: a nearly full-screen old-school clapperboard, diagonal black-and-white stripes, a possum guide, and a matching OBS clapperboard with a Polaroid-style Photo A and animated QR.

## Idle

```text
┌───────────────────────────────┐
│           C L A P P A         │
│    / / / / / / / / / / /      │
│  ┌─────────────────────────┐  │
│  │      TAP TO CLAP 🎬     │  │
│  └─────────────────────────┘  │
│      brush-tail possum         │
│      OBS: Connected            │
└───────────────────────────────┘
```

## Challenge cadence

Conceptual example:

```text
1 0 0 0 1 1 0
```

- `1` = audible clack
- `0` = silent rest beat

This pattern is recorded in the proof transcript.

## Challenge screen

```text
┌───────────────────────────────┐
│         REALITY CHECK         │
│                               │
│      [ cute possum ]          │
│                               │
│    "Take a picture left!"     │
│                               │
│       [ OPEN CAMERA ]         │
└───────────────────────────────┘
```

## Two-photo burst

```text
Photo A  → normal picture
Photo B  → immediate second picture
           while screen flashes
           RED or GREEN or BLUE
```

Only Photo A is normally shown in the stream popup.

## After success

```text
┌───────────────────────────────┐
│              ✓                │
│      CHECK COMPLETE           │
│                               │
│ [ VERIFY SOMETHING ELSE ]     │
│            0:06               │
└───────────────────────────────┘
```

## OBS tile

```text
┌────────────────────────────────────┐
│ 🎬 CLAPPA CHECK #12           ✓    │
│ RANDOM: LEFT                       │
│ CADENCE: 1000110   FLASH: RED      │
│ ┌───────────────────────────────┐  │
│ │        visible Photo A        │  │
│ └───────────────────────────────┘  │
│ possum         [ animated QR ]     │
│                       SIGNED        │
└────────────────────────────────────┘
```
