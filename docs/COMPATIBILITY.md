# Browser and controller compatibility

## Current v8 verification

The actual multi-file v8 source was served over local HTTP and exercised in **Chromium 141.0.7390.37**, **Firefox 146.0.1** and **WebKit 26.0**. Each engine passed 152 source cases, including four final same-frame archive display checks. The rebuilt offline edition also has separate Chromium campaign, controller, gameplay, touch/rendering, soundtrack, storage and fallback coverage. Four final offline archive cases, three strict source-embedding checks and seventeen rerun exact launcher/payload cases cover the last display-only change. The final native-audio follow-up and refreshed fingerprints are described below and in [VALIDATION.md](VALIDATION.md).

| Source engine | Controller | Campaign/saves | Bulk loading/facing | Scenes/portraits/layout | V8 gameplay | Final archive facing |
|---|---:|---:|---:|---:|---:|---:|
| Chromium | 39 | 31 | 29 | 26 | 23 | 4 |
| Firefox | 39 | 31 | 29 | 26 | 23 | 4 |
| WebKit | 39 | 31 | 29 | 26 | 23 | 4 |

All listed cases passed. Both Jay and unlocked Franklin complete seven-stage normal-input routes in each source engine with 75 knockouts, three machine waves and zero retries. The offline routes also complete with zero retries; dynamic summons give Jay 75 knockouts and Franklin 76. Machine defeat precedes Duke, Duke precedes rescue, and scene transitions record no loading waits. Explicit save fixtures separately cover old-schema migration, Continue, stage checkpoints and the Stage 4 unlock rule.

Bulk startup prepares all current runtime pages and portrait expressions plus scene/environment images and audio bytes before destinations become usable. Stalled and failed-file scenarios verify title/options access, all entry gates, accurate progress and recoverable Retry. Cached scenes and gallery banks produce no later HTTP requests. This intentionally trades a larger upfront load for scene continuity; these tests are not an Android/network loading benchmark.

The source scene suites use actual keyboard/touch interactions and normal-time opening playback. They verify exact approved lines, delayed Marty reveal, actual cast screen origins, Jay's launch, seven portrait identities, Franklin's ally role and stable portrait/landscape anchors. Feature fixtures cover the projection booths, eyes, reels, heavy collisions and new boss entrances; normal campaign runs independently verify complete progression.

The controller suites inject standard/nonstandard Gamepad API objects into the real browser loop. They cover analog radial movement, D-pad, combat, manual mapping, menus, scene input, held-input suppression, disconnect/reconnect and focus handling. They do not constitute physical Logitech testing. Actual CDP multi-touch checks verify simultaneous move/jump/attack and independent release/cancel behavior in Chromium mobile-sized viewports.

Source HTTP tests use genuine browser-origin storage. The standalone harness uses bounded parser writes and explicitly emulated storage. Local Linux launcher tests serve exact payload responses on localhost:8788; upgrade tests start with the preserved exact v7 launcher and check backups plus existing installation/save fixtures. Physical Android/Termux remains untested.

## Native WebKit follow-up

Repeated Start/Skip/Pause/Title transitions exposed an intermittent native WebKit audio stall after the earlier passing suite. Pause now leaves the silent context running while pausing music and stopping active cues; concurrent unlock requests share one in-flight native resume. The initial pause-only repair's incomplete Franklin opening rerun is retained as diagnosis, with no pass credit.

The final repair passes **31/31 loading/facing/native-audio cases in each engine (93 total)**, including actual native pause silence and shared resume, with zero page errors. A clean unwrapped WebKit campaign recheck passes **31/31**, completing both seven-stage routes with 75 knockouts, three waves and zero retries. Current-source Chromium audio/presentation passes **19/19** with actual decoding, playback, crossfades, pause/resume and mute. The refreshed offline bytes pass three embedding, seven real-HTTP launcher and ten upgrade checks. These focused confirmations are reported separately from the earlier 845-case scope. Public v8 verification remains pending.
## Audio verification boundary

Chromium exercises real decoded MP3 playback, overlapping crossfades, all thirteen cues, mute and pause. Firefox headless's AudioContext remained suspended; its passing tests verify cached bytes and safe deferred decoding, not actual Firefox audible playback. WebKit decodes cues, and the environment has no audible output device. Gesture activation remains required when enforced by a browser. Gamepad polling alone is not assumed to satisfy autoplay policy.

## Intended targets and fallbacks

Chromium-family desktop/mobile browsers, Firefox and Safari-compatible behavior remain targets. JavaScript, Canvas 2D, WebP decoding, pointer events and MP3 support are required. Fullscreen, physical gamepads and touch vibration are optional.

- Gamepad: guarded feature detection and polling handle missing APIs, sparse arrays, exceptions, reconnects and nonstandard mappings; touch/keyboard remain available.
- Fullscreen: standard and legacy WebKit requests are guarded; denied/unsupported entry displays a message.
- Storage: malformed, denied or unavailable storage does not block play. Saves and controller mappings remain tied to browser/origin; Pages and localhost are distinct.
- Focus: blur/background and active-pad loss clear controls and pause play. Inputs must return to neutral before resumed control.
- Menus: native keyboard focus and fields, controller navigation, portrait scrolling, safe-area insets and viewport-height fallback remain available.

Browser tests use installed Playwright engines. `CRITIC_CHROMIUM` explicitly selects a custom Chromium executable; no automatic system-binary fallback is assumed. Runner availability and startup failures are distinguished from game assertions.

## Remaining verification

The v8 public HTTPS build has not yet been verified in this local receipt. Public deployment evidence is added after reviewed release. Neither local automation nor a previous v7 deployment establishes current Pages success.

Physical Android, Termux on Android, Logitech hardware, iPhone and desktop Safari are untested. WebKit coverage does not certify every Safari or Apple device. On actual hardware, verify gradual walk/run, depth movement, simultaneous touch or controller actions, remapping persistence, scene input, audio activation, disconnect/reconnect and focus loss. See [KNOWN-LIMITATIONS.md](KNOWN-LIMITATIONS.md).
