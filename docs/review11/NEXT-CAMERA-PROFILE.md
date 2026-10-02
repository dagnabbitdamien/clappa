# Physical prompts and two-camera implementation path

The goal is a viewer's comparison of an action on the main stream with the corresponding phone views. Choose prompts that connect those observations. A photograph of a real room does little to interrogate an altered face if the face never appears in the phone view.

## Prompt families

| Family | Example | Purpose and constraint |
| --- | --- | --- |
| Face occlusion | Cover your left eye with your left hand | Connect hand, face and occlusion boundaries across the main stream and selfie. Hold through both photos. New Test10 prompt. |
| Expression | Hold a wink for both photos | Simple visible action; limited evidence by itself. New Test10 prompt. |
| Viewpoint | Turn your face slightly to one side | Compare contours and appearance from different cameras. New Test10 prompt. |
| Person and setup | Show yourself and your setup together | Proposed concurrent front/rear normal frames, linked to the same challenge. Needs the multi-view proof profile below. |
| Shared object | Hold an object beside your face, then show its other side | Potentially stronger correspondence, but requires more time and a revised capture sequence. Do not silently add to the current two-photo/ten-second flow. |

Future accessibility profiles must be declared before the beacon commitment. Do not ask a person who cannot wink or use a particular hand to perform that action, and do not silently replace a failed challenge. Record a skipped/failed response explicitly. The current test build does not yet have capability/accessibility-based challenge families; that is a required UX step before broad release of these prompts.

## What the experiment actually implements

`DualCameraActivity` asks CameraX for a supported combination containing front and rear cameras, binds each to a separate Preview + ImageAnalysis group, and requests the next delivered frame from each. It saves full analysis-resolution JPEGs and timing metadata, not a screenshot of a composited preview. Preview mirroring does not alter saved frame coordinates. Acquisition failure and excessive delivery skew produce no accepted pair. These are unsigned diagnostic samples, separate from ordinary proofs.

Two live streams do not imply synchronized sensor exposures. Arrival times include buffering and processing. The experiment records raw sensor timestamps and app delivery times separately and labels exposure synchronization unestablished. Before promotion, verify timestamp timebases, reject buffered frames predating the challenge, measure exposure skew and camera warm-up latency, and require successful runtime stream configuration rather than relying on the phone model name.

## Portable signed profile

Use an array of individual image records with explicit view roles (`front`, `rear`), phase (`normal`, `illuminated`), exact original/derivative hashes, illumination method, reported exposure timestamp/timebase and receipt timing. Use a shared capture-group ID and record measured skew plus its clock basis. Never merge the two views into one JPEG as the only evidence.

Keep normal/illuminated evidence for each selected view. A likely implementation is concurrent front/rear normal sampling followed by controlled illumination captures; do not call the entire four-image sequence simultaneous. If a device cannot deliver the chosen profile, report it unavailable before the precommitment. An explicitly named sequential two-view profile is a different challenge, never a silent downgrade. Measure four-image QR payload, display duration and recovery before enabling it.

Android uses runtime concurrent-camera discovery and binding. On iPhone use AVFoundation's `AVCaptureMultiCamSession`, check `isMultiCamSupported`, select supported device/format combinations, and respect hardware/system-pressure budgets. Use separate video outputs and synchronized timestamp analysis where supported. Standard single-camera challenges remain the baseline on both platforms. CameraX APIs and Android nanosecond values must not leak into the portable schema.

References: [CameraX concurrent configuration](https://developer.android.com/reference/androidx/camera/lifecycle/ProcessCameraProvider), [Apple multi-camera session](https://developer.apple.com/documentation/avfoundation/avcapturemulticamsession), [Apple multi-camera capture presentation](https://developer.apple.com/videos/play/wwdc2019/249/).

## Release gate

The implementation agent owns hardware-capability probes, timebase/skew tests, recovery and lifecycle checks, native layout evidence, QR recovery measurements and attack evaluation. Do not turn those into a homework assignment for the owner. A successful emulator fallback screen is not evidence that simultaneous capture works on the S22 Ultra or any iPhone.
