# Browser and controller compatibility

## Delivered verification boundary

Chromium **144.0.7559.96** was exercised with the exact standalone release, real rendering and events, genuine multi-touch through CDP, and standard/nonstandard Gamepad API fixtures. Sizes include desktop, small landscape, and Android-sized portrait. Gamepad objects are injected test data, **not a hardware Logitech test**.

The managed environment blocks browser URL navigation. The standalone release is therefore loaded through bounded parser writes. Browser-storage persistence is explicitly simulated in round-trip tests; denied storage is tested separately. The local HTTP/launcher tests do serve and verify actual bytes over loopback, but that is not a hosted browser navigation test.

Firefox and WebKit could not be installed in this environment because browser download DNS failed. They are **not locally verified**. The GitHub Actions browser matrix is prepared to run real hosted multi-file checks in all three engines after publishing. CI results must be read after the jobs actually run. Desktop Safari is not identical to Playwright WebKit, and neither represents a physical iPhone or Android phone.

## Intended browser targets and fallbacks

Current Chrome, Edge and Samsung Internet on supported Android/desktop devices are intended Chromium-family targets. Current Firefox and Safari are additional intended targets, not guaranteed hardware combinations. The game requires JavaScript, Canvas 2D, WebP image decoding, pointer events and ordinary MP3 support. Fullscreen, physical gamepads and touch vibration are optional enhancements.

- **Gamepad**: feature detection plus guarded `navigator.getGamepads()` polling. Sparse pad arrays, disconnect/reconnect, multiple pads, API exceptions, nonstandard mapping and missing API are handled. Touch and keyboard remain available.
- **Page context**: open the direct HTTPS site or localhost. A gamepad may not be exposed until its button is pressed with the page focused. Embedded previews can restrict access.
- **Autoplay**: use a genuine tap/click/key to enable sound. A gamepad can drive the game, but its polled button state is not assumed to satisfy every browser's audio activation policy. Missing Web Audio disables sample playback without blocking gameplay; ordinary music playback still attempts after activation.
- **Fullscreen**: standard and legacy WebKit entry/exit are guarded. Unsupported or denied fullscreen shows a message rather than stopping the game.
- **Storage**: malformed, blocked or unavailable storage does not stop play. Saves are local to the browser and origin; controller mappings use a separate key.
- **Focus**: background/blur and active-pad loss clear held input and pause play. Return controls to neutral before resuming control; no automatic attacking on reconnect.
- **Menus**: keyboard focus, gamepad navigation, native selects/ranges, scrollable portrait settings, `vh`/`dvh` fallback and safe-area insets are retained/supported. Touch controls do not disappear because a controller connects.

## Physical test checklist

On the actual Logitech pad and target browser: connect it to the operating system; enable Controller; press a button; confirm the detected ID/mapping. Test centered sticks, gradual walk/run, both depth directions, face buttons, jump+attack, guard+dodge, Review, pause/resume, menu back, disconnect and reconnect. For a nonstandard layout, run the mapping wizard and reload to verify that the saved profile returns. Switch hardware input mode only when your exact model provides that switch. Pairing/USB adapters and operating-system driver support are outside the game's browser API.

## Technical references

- https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API
- https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getGamepads
- https://developer.mozilla.org/en-US/docs/Web/API/Gamepad/mapping
- https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
- https://playwright.dev/python/docs/browsers
