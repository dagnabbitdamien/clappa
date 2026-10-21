# One additional photo per completed response

22 September 2026. Implements the deferred Test12.1 report without changing the signed protocol or its 30-second allowance.

## Cause

The camera callback set the visible counter to zero, but its coroutine continued recalculating that counter every 100 ms until the original deadline. The additional-photo button therefore reappeared. The session already rejected later photos after the first successful claim, so those apparent extra opportunities did not create additional accepted claim events or OBS popups. The callback also said “sent” before the OBS receipt arrived, and ignored receipts for claim events.

## Corrected behavior

- Submitting the extra photograph cancels its counter producer and clears both the visible seconds and monotonic deadline. The action becomes Sending proof, with no second capture opportunity.
- Only the matching claim event sequence acknowledged by OBS produces “Additional photo received by OBS!” and returns to the next recording action. Old, unrelated and duplicate receipts cannot reopen the offer.
- A committed local claim consumes its one-photo allowance before any retry can occur, even when queueing transport throws. An uncertain network receipt never authorizes another signed claim.
- Camera/capture failure before local event commitment can return to the original offer only while it remains valid; the failure is explained in a dialog. It never starts a new 30-second window.
- Additional capture itself is bounded by the remainder of the original offer. A new challenge invalidates the preceding offer.
- No transport auto-retry, new event schema, unlimited-photo allowance or signature relaxation was added.

## Validation

`AdditionalPhotoOfferTest` covers seven cases: matching response receipt, timer-era checks after consumption, lost receipt, exact one-time claim receipt, original deadline boundary, invalidation by the next challenge, and a fresh allowance for the next successful response. The full `:app:testDebugUnitTest` task passed: 27 tests, zero failures/errors, including these seven regressions and the two chat-request gate tests. Main Android Kotlin also compiled successfully. This is state/compilation verification; it does not claim a new native camera-to-OBS integration recording.

Relevant source: `MainActivity.kt`, `Session.kt`, `AdditionalPhotoOffer.kt`.
