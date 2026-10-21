# Threat model

## Summary

CLAPPA combines:

- signed transcripts;
- challenge-response capture;
- visible proof;
- exact-file sealing.

That means it has **two different strengths**:

1. **cryptographic integrity/provenance**
2. **practical anti-synthesis difficulty**

Those are not the same thing.

## What cryptography can do well

Cryptography can make it hard to lie about:

- which challenge happened;
- which images were captured;
- which file was finally sealed;
- whether the transcript was changed later;
- whether someone else forged your identity.

## What cryptography cannot do by itself

Cryptography cannot by itself guarantee that the pixels reaching the signer came from a physical scene rather than a synthetic one.

If synthetic content reaches the signer before signing, the signer can honestly authenticate synthetic content.

## Why CLAPPA still helps today

Today, generating a plausible video is easier than maintaining a coherent, challenge-responsive world from multiple views.

CLAPPA tries to exploit that gap.

## Perfect-world-model failure condition

If AI becomes cheap, fast, and good enough to answer arbitrary challenge requests indistinguishably from reality in real time, CLAPPA's physical anti-AI advantage largely disappears.

At that point CLAPPA still remains useful for:

- provenance;
- authorization;
- exact original-file integrity;
- timing with external witnesses.

## Coordinated filter limitation

If an attacker can run the same deception over:
- the main stream, and
- the phone capture pipeline,

then the two views may remain consistent while both are manipulated.

CLAPPA is therefore strongest when the proof capture path remains meaningfully independent from the main manipulated path.

## Nation-state note

Multiple external witnesses can harden timing claims, but no ordinary-phone protocol survives a threat model in which the attacker controls every witness, the user's identity/signing authority, and the whole sensing pipeline.
