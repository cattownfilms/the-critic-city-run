# Annotated polish validation

See [the focused correction ledger](V11-ANNOTATED-POLISH.md) for commands, evidence and the missing ending-source blocker. Earlier full-matrix results below are historical, not patch validation.

# V11 validation

Baseline: `8757424f41b7f7cc9a3eebaa927298473988d56b`. Local deterministic coverage includes both selected-player tutorial jumps, actual airborne underpass, skip at four phases, later dangerous can contact, settled punchline timing, screen-area trigger, exact volley widths and saved schema lineage. Retained full-campaign normal-input route tests remain required.

`node tests/v11-engine.test.js`
`python3 tests/v11-assets.test.py`
`python3 tests/v11-presentation-browser.test.py --engine chromium --url local` (remote browser runner; repeat Firefox/WebKit).

Source CI passed Core and all three engines: https://github.com/cattownfilms/the-critic-city-run/actions/runs/37742777465. Deployed HTTPS testing remains a separate post-merge gate. Physical phone observations are not inferred from these tests.

## Historical validation

# V10 validation

Version **10.0.0**, continued from released v9 `ba087d21a1699ffec1fd923d17a18b796ae37ab6`. Eleven local JavaScript suites pass, including both seven-stage routes through normal combat inputs, source audio lifecycle, controller contracts, saves and v10 encounter state machines. Core, Chromium, Firefox and WebKit passed [source run](https://github.com/cattownfilms/the-critic-city-run/actions/runs/37710897264) at `28c22162e361efe0384014687f9669e6f923c71a`. WebKit includes three independent campaign/loading repetitions; Chromium also tests the offline edition. Post-merge hosted verification is recorded separately in the external release receipt.

Supplemental intake: all four actual files, 10.005 seconds / 1280×720 / 24 fps / 240 frames each, were hashed and reviewed in full chronological sheets. The requested Duke filename ends `b917`; the actual matching Duke file ends `6917`. The discrepancy, exact hashes, selections, cleanup, scales, pivots and flips are recorded in `production/v10-assets.json`. Raw MP4s remain outside the repository.

New tests: `node tests/v10-engine.test.js`, `python tests/v10-assets.test.py`, `python tests/v10-presentation-browser.test.py --engine <chromium|firefox|webkit> --url local`. Existing native browser audio and full-campaign suites remain required. The remote browser matrix supplies real engines; no desktop browser is installed into Termux.

Local commands also passed: `python tests/site.test.py`, `python tests/production-assets.test.py`, `python tests/v10-assets.test.py`, `python tests/publish.test.py`, `python tools/export_script.py --check`, `python tools/publish.py --check-only`, `python tests/launcher.test.py` (8), and `python tests/upgrade-launcher.test.py` (10). The latter uses an isolated actual v9 installation, preserves the old HTML and file sentinels, and reuses its port-8788 server. Standalone parity covers eleven scripts/styles and 184 embedded runtime files.

All 142 authored dialogue/layout cases pass at each of 915×412, 360×800, 1280×720 and 640×360. Runtime screenshots were inspected for opening, pursuit, cinema, radio throw, Broadcast and both-route rescue. Supplemental review covers all 960 original frames and the final extracted action sheets.

Physical Android speaker output, touch/controller feel and subjective difficulty remain unverified until the phone smoke test.

## Historical v9 evidence

# V9 validation

Version **9.0.0**, based on released v8 `51f1131163edbccc28390d00d766bb348327da30`.

Source `6bb28cc3b4b3579ddae2897c59fa68bbe7f83819` passed Core, Chromium, Firefox and WebKit in [GitHub Actions](https://github.com/cattownfilms/the-critic-city-run/actions/runs/37693754120). Native browser audio checks measure a running AudioContext, advancing music clock and nonzero SFX bus after a trusted gesture, plus mute/unmute, pause/resume, reload/Continue, first Press Start and rapid track changes. Firefox/WebKit use a real virtual PulseAudio sink in the CI container; this does not establish physical speaker output.

Local commands executed: the ten Node suites listed in `.github/workflows/verify.yml`; `python tests/site.test.py`, `python tests/production-assets.test.py`, `python tests/publish.test.py`, `python tools/export_script.py --check`, and `python tools/publish.py --check-only`. All passed. Standalone parity verifies eleven scripts/styles and 159 embedded runtime files against source. Chromium also exercises the standalone campaign and native audio over local HTTP. `python tests/launcher.test.py` passed 7 checks; `python tests/upgrade-launcher.test.py` passed 10, using isolated temporary installations and preserving the original HTML/save sentinels.

Browser suites cover both routes, controller contracts, campaign/save behavior, v8 gameplay/loading/facing/opening, v7 scenes, and new v9 presentation/audio. WebKit repeats campaign and loading/facing checks three times without failure retries. Actual runtime cinema, broadcast and both-route intro screenshots were inspected. Existing media/provenance and controller bytes are unchanged; save schema remains 5.

The full 21-note ledger is in `docs/V9-PLAYTEST-LEDGER.md`. Physical Android audio, hardware controllers and subjective combat feel remain user-side. Final-source PR checks, merged-source checks, Pages deployment and public HTTPS/browser checks are release gates recorded in the external release receipt; this pre-merge source report does not claim a future deployment.

## Historical v8 evidence (not v9 results)

# THE CRITIC: COMING ATTRACTIONS / validation

The v8 refinement baseline is reviewed commit `29e97395ee88a63724a32c83a6c019996d09a39c`. The results below are freshly executed v8 checks. Earlier v7 totals, browser versions and public deployment receipts are historical and are not evidence for this release.

## Edited full-script revision

The supplied PDF’s 55 spoken entries match the applicable resolved routes verbatim: 28 authored line edits, 30 resolved route changes and two expression cues. The seven approved opening lines remain intact. The updated editable script was regenerated from frozen source, and all 17 Letter pages were rendered and visually reviewed. The opening retains its seven screen-born enemies across the launch and transfers recovery to the real gameplay canvas. Final native-browser and public-release checks for this revision are pending.

## Earlier local results

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

Fresh feature checks cover both players' RUN + HIT into Bear/Hippo, one stun and combo reset without enemy damage, ordinary Shermometer launches, thirteen world-fixed booths, onscreen powered appearances, four-phase shadow eyes, three reel hops, one contact and incoming-side guard after reflection. They cover the screen-origin Violent Austrian Rabbi, Spike's door entrance/throw bank, repeated capped transmitter waves, shutdown without extra rewards and the required Duke rescue sequence. Node checks retain accepted HITS/CHAIN definitions, ordinary enemy data and original source performances; asset checks compare decoded pixels, registration and timing with explicit preserved aliases.

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
# Cinematic V11 update

Source `f3ae1133cb073d818a1e96e7fdb51ebf5b062011` passes the [focused source run](https://github.com/cattownfilms/the-critic-city-run/actions/runs/37871929298): 69 Chromium scene checks, 35 standalone checks and 16 native audio checks; zero failures. Local interpolation, affected encounter and audio lifecycle checks pass. See [camera decisions, preserved cuts and boundaries](CINEMATIC-CAMERA.md). Subsequent release bookkeeping changes only documentation and inventory hashes. The deployed commit and public verification are recorded after merge in the external receipt.
