# THE CRITIC: COMING ATTRACTIONS / validation

The v8 refinement baseline is reviewed commit `29e97395ee88a63724a32c83a6c019996d09a39c`. The results below are freshly executed v8 checks. Earlier v7 totals, browser versions and public deployment receipts are historical and are not evidence for this release.

## Current local results

The recorded local validation has **845 passing structured cases and zero failures**: 651 curated browser/launcher/asset/parity cases, 171 Node cases and 23 Python cases. The separate grouped cutscene-contract suite also passes and is excluded from that total. Archive checks and exact rebuilt-artifact checks are included in that earlier snapshot. A later intermittent native WebKit audio stall prompted the targeted fix below. Its final 93 loading/facing/native-audio cases, clean WebKit campaign recheck (31), source Chromium audio recheck (19) and refreshed build/payload rechecks (20) all pass. Those overlapping rechecks are reported separately and do not inflate the earlier 845-case scope. Public v8 release verification remains pending.

| Suite / edition | Passed | Failed |
|---|---:|---:|
| Node engine/controller/campaign/v8 cases | 171 | 0 |
| Python source paths/publication contracts | 23 | 0 |
| Semantic source-asset preservation | 14 | 0 |
| Chromium 141.0.7390.37 / actual source HTTP | 152 | 0 |
| Firefox 146.0.1 / actual source HTTP | 152 | 0 |
| WebKit 26.0 / actual source HTTP | 152 | 0 |
| Offline Chromium / campaign and saves | 31 | 0 |
| Offline Chromium / controller | 39 | 0 |
| Offline Chromium / v8 gameplay | 23 | 0 |
| Offline Chromium / mobile, touch, rendering and gallery | 34 | 0 |
| Offline Chromium / soundtrack and presentation | 19 | 0 |
| Offline Chromium / denied storage | 3 | 0 |
| Offline Chromium / optional API fallbacks | 8 | 0 |
| Final offline archive-facing checks | 4 | 0 |
| Strict final embedding parity | 3 | 0 |
| Local Linux launcher | 7 | 0 |
| Exact v7 → v8 launcher upgrade | 10 | 0 |

Each source engine's 152 cases comprise 31 campaign/save, 39 controller, 26 scenes, 23 v8 gameplay, 29 bulk-loading/facing and four final archive-facing cases. Browser versions were actually launched, not merely configured in CI. Portable raw reports and the curated `V8-LOCAL-QA.json` receipt accompany the offline bundle under `evidence/`; this repository's [Validation-Report.json](../Validation-Report.json) summarizes counts, source hashes and exact build fingerprints.

## Campaign and feature evidence

Both normal-input routes complete all seven stages in Chromium, Firefox, WebKit and offline Chromium with zero retries. Source routes record 75 knockouts and three transmitter waves each. Offline Jay records 75 knockouts/two waves and Franklin 76 knockouts/three waves. Variable summon timing legitimately changes totals; the authored ordinary content remains 66 spawns. Every route records no post-machine summons, premature rescue or Duke-before-machine, and no scene loading waits.

The route driver accelerates fixed engine updates through actual application events and cutscene callbacks. It does not modify health, positions, enemies, score or story flags during a route. Collision, rendering, legacy-save and unlocked-profile scenarios are explicit fixtures separate from those playthroughs.

Fresh feature checks cover both players' RUN + HIT into Bear/Hippo, one stun and combo reset without enemy damage, ordinary Shermometer launches, thirteen world-fixed booths, onscreen powered appearances, four-phase shadow eyes, three reel hops, one contact and incoming-side guard after reflection. They cover the screen-origin Cinema Headliner, Spike's door entrance/throw bank, repeated capped transmitter waves, shutdown without extra rewards and the required Duke rescue sequence. Node checks retain accepted HITS/CHAIN definitions, ordinary enemy data and original source performances; asset checks compare decoded pixels, registration and timing with explicit preserved aliases.

Startup checks stall required files, keep title/options usable, gate every gameplay/gallery path, verify all 85 pages and all audio bytes are prepared, then exercise every scene and bank with zero later HTTP asset requests. Corrupt-atlas retry retains successful downloads and a pending Continue save. A new-game checkpoint now enables Continue immediately after returning to Title. Bulk startup intentionally shifts the full download earlier; no physical-device or network-speed improvement is inferred from localhost results.

The source scene suites watch the approved opening, delayed Marty reveal, actual screen-emitted cast and physical street launch. Both routes keep portraits and layout anchors stable in landscape/portrait, and Franklin uses his own playable replies. The complete editable script contains 19 definitions and 56 beats, with the untriggered reusable projection-intro scene identified as an appendix. The Word export matches resolved script content; all **17 rendered pages** were inspected at original detail. The final gallery-only app change did not alter that script.

## Targeted native WebKit audio follow-up

Repeated Start/Skip/Pause/Title transitions exposed an intermittent native WebKit stall after the earlier passing suites. Pause now stops active sound cues and pauses both music nodes while leaving the silent AudioContext running. Concurrent unlock requests share a single in-flight native resume promise. Combat, scene content, loading and saves are unchanged.

The initial pause-only repair passed rapid-cycle probes but a clean campaign rerun stalled at Franklin's opening; that incomplete run receives no pass credit. The final shared-resume repair (`app.js` SHA256 `28a6c88fbb5cb735146dd9410bd0dbb16b06627e74348f425d90e71469acd505`) passes all **31 loading/facing/native-audio cases in each browser, 93/93 total**, with no page errors. Native concurrent unlock calls produce one resume operation; pause leaves music paused and active cues stopped. A clean, unwrapped WebKit campaign recheck also passes **31/31**, including both seven-stage routes with 75 knockouts, three waves, zero retries and correct machine/Duke/rescue order. Actual-source Chromium audio/presentation passes **19/19**, without media stubs or native-prototype replacement.

Portable receipts are `evidence/v8-loading-facing-{chromium,firefox,webkit}-results.json`, `evidence/campaign-webkit-final-audio-guard.json` and `evidence/audio-final-guard-chromium19.json`. These focused confirmations remain separate from the recorded 845-case aggregate; the final loading suite includes two new native-audio scenarios per browser and repeats its other earlier scenarios.
## Audio, input and compatibility boundaries

Chromium tests verify decoded MP3 playback, overlapping 0.9-second crossfades, thirteen real sound cues, mute and pause. Firefox headless keeps its AudioContext suspended: its checks verify retained cue bytes and deferred decoding, without claiming audible Firefox playback. WebKit decodes cues. This environment has no audible output device.

Controller checks inject standard/nonstandard Gamepad API fixtures into the real browser loop, covering analog/D-pad movement, combat, remapping, menus, scene advance/skip/pause, disconnect/reconnect and focus safety. Chromium mobile viewports receive actual CDP simultaneous three-finger events, including independent release and cancellation. Offline storage is explicitly emulated by that harness; source HTTP tests use actual origin-local browser storage. Missing Gamepad, Web Audio and fullscreen, plus denied storage, are separate fallback fixtures.

The launcher tests start a real local HTTP server on port 8788. The upgrade begins with the recovered exact v7 launcher, checks byte-identical old HTML backups and preserves companion/browser-save fixtures. The final ten-case upgrade reuses the original server process, retains the exact v7 backup/save fixture and serves the final v8 bytes at the same origin. It is a Linux launcher test, not physical Termux on Android.

## Final local build fingerprints

These refreshed bytes include both native WebKit audio repairs:

- `The-Critic-Coming-Attractions-v8.html`: 109,607,442 bytes; SHA256 `87e915c38ff84ca775aa4eff2a38ee5976673be5e9587de5591608001e38423b`.
- `The-Critic-Coming-Attractions-v8-Play.sh`: 111,457,902 bytes; SHA256 `2e565128d42302dc2f7b71e0065cc8d360923a7a56d5a03962c8759c8ff274fd`.

The broad behavioral suite used `app.js` hash prefix `ab13f22` and `render.js` prefix `e1c246` before the archive-only orientation/bounds correction. Sixteen source/offline archive checks verified that display boundary. The native audio repairs were then verified by the focused suites above. Final rebuild verification passes **20/20**: three strict embedding checks, seven real-HTTP launcher checks and ten v7-to-v8 upgrade checks. All 159 embedded runtime files, nine scripts, two stylesheets and current metadata match authoring bytes; launcher responses match the refreshed HTML exactly. Upgrade preserves the original server process, exact v7 backup and save fixtures. Repeated checks are counted once in their stated scope.
## Public release verification

**Pending for v8.** Local success does not establish that GitHub Pages serves these bytes. Reviewed merge, Pages deployment, actual HTTPS JavaScript/assets/music/story checks and public-browser route verification are recorded after publication. The existing address remains https://cattownfilms.github.io/the-critic-city-run/.

Physical Android, physical Termux installations, Logitech controllers, iPhone and desktop Safari remain untested. Playwright WebKit is compatibility coverage rather than certification of Apple hardware. See [COMPATIBILITY.md](COMPATIBILITY.md), [V8-REFINEMENT-CHECKLIST.md](V8-REFINEMENT-CHECKLIST.md) and [KNOWN-LIMITATIONS.md](KNOWN-LIMITATIONS.md).
