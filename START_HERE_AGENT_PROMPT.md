# Start-here prompt for a coding agent

Latest owner authorization supersedes the historical pause below: build the MVP in phase order, conserving usage and stopping with at least 75% remaining (77% buffer). Mascot #9 in `docs/mockups/09-brushtail-character-sheet.png` is approved. Do not interpret earlier documentation-only restrictions as current.

You are implementing CLAPPA.

Read in full before coding:

1. `AGENTS.md`
2. `README.md`
3. `DESIGN_SPEC.md`

When the owner authorizes implementation, begin with **Milestone / Phase A only**. The current owner instruction (2026-09-12) is to update documentation and wait; do not treat this file as authorization to begin implementation or generate mockups.

Before UI implementation or finished artwork, generate alternative mockups and review them with the owner as described in `docs/design-mockup-brief.md`. This is a presentation prerequisite, not a change to the protocol-first implementation order.

## Phase A goals

Build the protocol skeleton and verifier for the **updated** design.

That means the protocol must already account for:

- a challenge cadence pattern;
- a random flash colour (`red`, `green`, or `blue`);
- two proof photos per random challenge (Photo A + Photo B);
- explicit algorithm-tagged signatures;
- event chaining;
- a final exact-file seal object.

## Deliverables for the first pass

1. repo/build skeleton
2. event schema(s)
3. canonical JSON/signature rules
4. one signer/verifier path
5. deterministic valid test vectors
6. deterministic invalid test vectors
7. minimal verifier CLI
8. CI or test runner instructions

## Non-goals for this first pass

Do **not** start:

- Twitch
- polished art
- advanced OBS media plumbing
- cloud features
- video bursts
- audio embedding beyond cadence metadata
- fancy QR optimization

## At the end of Phase A, report

- files created/changed
- build/test commands
- signature algorithm choice and why
- any assumptions needing owner review
- exact next milestone
