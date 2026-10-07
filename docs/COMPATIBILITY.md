# Browser and controller compatibility

## Delivered verification boundary

The v7 correction was exercised locally with Playwright 1.57.0 in Chromium **143.0.7499.4**, Firefox **144.0.2**, and WebKit **26.0**. Actual multi-file authoring source was served by an HTTP server inside each test process and opened in the browser. This includes genuine origin-local storage and reloads. The baseline reviewed v6 tree was tested independently before correction and passed its original source and offline suites. Chromium uses an explicitly selected matching Chrome for Testing headless-shell binary in this workspace; Firefox and WebKit use Playwright’s installed engines.

| Browser / source edition | Controller | Campaign / saves | Loading gates | Staging / portraits / layout |
|---|---:|---:|---:|---:|
| Chromium | 39 passed | 31 passed | 16 passed | 26 passed |
| Firefox | 39 passed | 31 passed | 16 passed | 26 passed |
| WebKit | 39 passed | 31 passed | 16 passed | 26 passed |

Each engine completed both Jay and unlocked Franklin routes using normal combat inputs: all seven stages, 71 knockouts, no retries, and the machine followed by Duke. Separate scene tests watch the entire rebuilt opening in normal browser time with keyboard and touch, verify all approved lines, delayed Marty reveal, real cast screen origins, Jay’s launch, six portrait identities, Franklin’s ally dialogue, and fixed landscape/portrait bounds. Deliberately stalled HTTP image requests verify that every gallery entrance stays blocked until dependencies decode while options remain usable. Repeated failed Continue downloads remain retryable and preserve the final-phase checkpoint. The completed-v4 save scenario resumes the newly required physical Duke fight; schema 5 Continue preserves the pending final phase without duplicating him or rescuing Marty early.

The controller checks use injected standard and nonstandard Gamepad API objects and the real browser event loop. They cover radial movement, D-pad, combat, remapping, menus, scene advance/pause/skip, held-input suppression, disconnect/reconnect, and focus handling. They are **not a physical Logitech hardware test**. Polling assertions wait for actual pad readiness and observed state changes. The tap helper observes state with driver-side reads so hiding a focused native field cannot starve the browser-owned assertion timer; the device label is checked through the selected option's text because native select text extraction differs among engines.

Browser tests use Playwright’s installed engine by default. Set `CRITIC_CHROMIUM` explicitly when testing a custom Chromium executable. There is no automatic system-binary fallback. Browser availability and test-runner startup are reported separately from game assertions.

The campaign driver runs both Jay and unlocked Franklin through all seven stages with normal movement and combat inputs, including the projection circuits, final broadcast encounter, and physical Duke confrontation. It accelerates the engine's fixed updates through the actual app event handlers. It does not edit positions, health, enemies, score, or story flags during either route. It invokes the real stage-clear transition without waiting for celebration delays. Explicit legacy-save and unlocked-profile fixtures are identified in the report. Separate real keyboard and touch events verify story input, gameplay input, and mobile layouts.

The exact rebuilt offline edition passed **31 campaign/save checks**, **34 mobile/rendering/touch checks**, **19 soundtrack/presentation checks**, **8 optional-API fallback checks**, and **3 denied-storage checks** in Chromium. It uses bounded parser writes; that harness explicitly emulates storage and restores serialized fixture values when recreating the page. The tested file is 99,553,793 bytes, SHA256 `241ff96b2f5eef28fdd4b5f88eb5d72d49f0bfce7125ab7ac3f6423fb7b350fe`. Its final results are recorded in [Validation](VALIDATION.md). Multi-touch is delivered through CDP, including independent movement/jump/attack ownership and cancellation. All cutscene art and portrait dependencies decode in each tested source engine. See [Validation](VALIDATION.md) and the generated test reports for exact coverage.

These results do not represent physical Android, a physical gamepad, desktop Safari, or iPhone testing. Playwright WebKit is a compatibility engine, not a claim of testing every Safari or Apple hardware configuration. The v7 public GitHub Pages game separately passed 96 Chromium browser checks and 140 HTTPS asset checks. Jay and Franklin each finished all seven stages with 71 knockouts and no retries. Review and merged-main CI passed core, Chromium, Firefox and WebKit jobs; the Pages deployment succeeded. See [release verification](VALIDATION.md#public-release-verification) for exact runs and the cold-network test-driver correction.

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
