# CLAPPA-RESPONSE-v1

This is an explicit extension of signed event protocol 0.3. Old events remain readable; old verifiers/native plugins reject the new fields. Update the APK and plugin together.

New `session-start.data.response_profile` is `CLAPPA-RESPONSE-v1`. Every challenge in that session must carry `response_window_ms: 10000`. A challenge cannot drop that policy midway through a session. A new capture carries non-negative integer `response_ms` (issue to Photo A save completion) and `pair_ms` (Photo A to Photo B save completion), measured from a monotonic clock. Existing `a_at` and `b_at` are still phone-reported wall-clock save-completion times, not sensor exposure timestamps.

Validation requires first completion in [0,10000] ms, then a pair gap in [0,1500] ms for front/RGB or [0,3000] ms for rear/LED. Wall-clock intervals must also satisfy those windows and differ from the monotonic reports by no more than 250 ms. Out-of-window, backwards or contradictory reports fail. Camera save completion is a conservative implementation boundary that includes processing latency; later sensor-timestamp support must be separately versioned rather than changing its meaning.

The app expiry timer uses elapsed real time, remains active across camera opening and backgrounding, and emits `challenge-failed`/`timeout`. Local wall-clock adjustment cannot grant extra time. Once Photo A is completed on time, the second-photo budget is separate; its completion may occur after the first-photo countdown reaches zero. The verifier reports legacy unbounded sessions distinctly from timed sessions.

Neither the monotonic report nor the OBS checks independently proves a producer's wall-clock history. The mandatory NIST design, observed precommitment/receipt and human comparison remain necessary parts of the intended protocol. These fields strengthen implementation consistency and reject late honest-app captures; they are not a replacement for that design.
