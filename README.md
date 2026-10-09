# THE CRITIC: COMING ATTRACTIONS

A complete seven-stage, mobile-first arcade brawler. Duke demands a glowing review, kidnaps Marty, and turns his experimental broadcasting system on. The Coming Attractions spill into New York. Jay goes after his son.

**[Play the game](https://cattownfilms.github.io/the-critic-city-run/)** · v11.0.0 · Touch, keyboard, optional remappable controller · No account or runtime service required.

## Play locally

Run `python3 -m http.server 8788 --bind 127.0.0.1` in this folder and open `http://127.0.0.1:8788/`. Keep this origin to retain existing local saves. Direct `file://index.html` is unsupported; use the generated standalone file for direct offline play.

The release bundle includes the complete standalone `The-Critic-Coming-Attractions-v11.html` and Termux launcher `The-Critic-Coming-Attractions-v11-Play.sh`. In Termux, install Python, then run `bash The-Critic-Coming-Attractions-v11-Play.sh`. It keeps the existing localhost:8788 origin and installation directory, backs up the old HTML, and never clears browser saves. The browser and Termux must remain open for reloads.

The title shell and options appear first. The game then bulk loads and decodes all runtime sprite atlases, portraits, scene and environment images, and downloads the five music recordings and thirteen sound cues. Start, Continue and every Animation Room entrance remain disabled until this preparation finishes. Progress reflects actual completed files and downloaded bytes, with Retry after a failed download. Later scenes use the prepared cache. This intentionally moves loading to startup and retains every unique animation.

## V11 cinematic update

Continuous shot framing now spans all seven stages. The Receiver descends into view, its final collapse/explosion renders in the foreground, and the preserved reunion leads into the supplied animated skyline collapse. See [camera decisions and verification](docs/CINEMATIC-CAMERA.md). Version 11.0.0 and save schema 5 remain unchanged.

## V11 annotated polish

Audio recovery, spatial Palace booths, reel depth, Rabbi facing/entry, Spike release and Receiver/Duke staging have been repaired. See [the correction ledger](docs/V11-ANNOTATED-POLISH.md) for that patch's checks and boundaries. The later supplied skyline source resolves its media blocker; the approved reunion and results remain intact.

## V11

Three exact source reels add Duke’s prop-free cart mime, cautious backsteps and Marty’s captive reactions. Palace has three screen-area booths with 1/3/5-reel spread volleys. Spike demonstrates a real rolling can and selected-player jump before combat. Settled boss falls precede the jokes; Franklin’s cartwheel is more readable; the reunion explicitly draws Marty above Jay. Original atlases, audio and schema-five saves remain intact. See [the v11 playtest ledger](docs/V11-V10-PLAYTEST-LEDGER.md). Browser and public-release evidence are recorded in validation and the release receipt.

## V10

Raptors flank and charge; Fred K teleports with readable tells. Projectionist booths reveal eyes, throw 3/4/5 reels and visibly release radios while bounded support enemies enter. The Broadcast device travels on a rail, lasers during waves, crashes for three vulnerability rounds, then breaks down before Duke’s expanded physical fight. Supplemental source performances are appended to the existing banks. Source validation passed [Core and all three browsers](https://github.com/cattownfilms/the-critic-city-run/actions/runs/37710897264). See [the 26-note ledger](docs/V10-V9-PLAYTEST-LEDGER.md) and [validation boundaries](docs/VALIDATION.md).

## Controls

| Input | Movement | HIT | JUMP | GUARD | REVIEW | Pause |
|---|---|---|---|---|---|---|
| Touch | Radial analog pad | HIT | JUMP | GUARD | REVIEW | Pause icon |
| Keyboard | WASD / arrows | J / X | Space / Z | K / C | L / V | Esc / P |
| Standard browser gamepad | Left stick / D-pad | West / X | South / A | East / B or LB | North / Y | Start |

Small stick deflection walks; full deflection runs. Standing HIT chains jab, cross, front kick, palm. JUMP + HIT kicks in the air; RUN + HIT Belly Bashes as Jay or cartwheels as Franklin. Hold GUARD for frontal block, time GUARD to parry, MOVE + GUARD slips, then HIT counters. Full REVIEW meter fires the established finisher.

Accordion Bear, Green Hippo and the Violent Austrian Rabbi overpower either player's running attack: one backward knockdown and brief protected recovery. The original Belly Bash/cartwheel remains strong against ordinary enemies. Heavy character scale is consistent across each complete animation bank.

Controllers remain optional and off by default. Enable one in Controls/Pause; nonstandard devices require the existing eleven-step remapping wizard. Standard mapping is accepted only when the browser reports it, including Logitech-style devices. Disconnect/focus loss clears held controls and pauses. Hardware has not been tested physically.

Scenes: touch CONTINUE/SKIP, Enter/Space/J to advance, Esc/Backspace to skip, P to pause. Controller Confirm/HIT advances, Back skips, Start pauses. Release controls between scene and play. Skipping awards exactly the same progression as watching.

The v8 script includes the user’s revised dialogue on both playable routes. The opening retains all seven screen-born enemies through the studio disruption and transfers the launch directly to the live Broadway gameplay landing.

## Campaign

| Stage | Location | Main authored encounter |
|---|---|---|
| 1 | Broadway | The first Coming Attractions enter New York |
| 2 | Last Train Uptown | Follow Duke’s trail beneath the city |
| 3 | Above the Avenue | Trace the transmission across the rooftops |
| 4 | Theater District | Franklin; Shermometer v3 on Franklin’s route |
| 5 | Palace Cinema | Projection booths and three circuits; the cream-scarf Violent Austrian Rabbi emerges from the screen |
| 6 | Little Italy | Spike, an African American boss who throws trash cans outside the pizzeria |
| 7 | Broadcast Tower | Disable the transmitter amid repeated enemy waves, defeat a faster Duke personally, then rescue Marty |

Shermometers v1/v2/v3 remain the ordinary roster’s backbone. Accordion Bear, Green Hippo, Fred K and JP Raptor Esq appear selectively. Coffee heals 18; Turkey Dinner heals 46. Trash Can and Box break immediately for pickups; legacy Bin IDs remain compatible.

Franklin remains brown-haired and unlocks when Jay defeats him and exits Stage 4 without dying during that attempt. The campaign continues after that unlock. Franklin never fights himself; later results never announce him as newly unlocked again.

Palace Cinema uses three projection phases: dodge three reels, then smash one temporary remote to darken that circuit. No permanent floor boxes. After the third remote, the larger Rabbi emerges once from the auditorium screen. Spike releases a bouncing, rolling can aimed at the player's lane at release; jump over it. Broadcast Tower has three screen-born waves, each followed by a timed core vulnerability. Living summons must be defeated. Duke pursues physically, varies attacks contextually, and increases pressure below 65% and 35% health. Boss clears progress directly into the next story/stage.

## Saves and content

Existing save/profile/settings/controller keys remain unchanged. Schema 5 migrates v2/v3/v4 checkpoints and retained unlocks. A completed old four-stage save resumes at Palace Cinema; a completed v6 campaign resumes at the new Duke confrontation. Settings remain browser-local. Localhost and Pages are separate origins and do not automatically share saves. Denied localStorage permits play without persistence.

`data/campaign.js` authors stages, enemy definitions, bosses, props and items. `data/cutscenes.js` contains the exact approved opening and concise scene definitions. `cutscenes.js` is the reusable player. The accepted standing combo, air kick, guard, parry, dodge and Review constants remain unchanged. Running attacks change only as requested. Original source performances retain their decoded pixels, registration and timing; metadata repairs and the replaced cartwheel retain explicit source aliases. Music keeps the supplied five recordings, separate volume controls and crossfades; no new recordings are claimed.

The complete editable script is available as [FULL-SCRIPT.md](docs/FULL-SCRIPT.md), with a Word edition in the release bundle. It includes Jay and Franklin routes, staged actions, scene/beat identifiers and story UI text. Regenerate the Markdown from the actual scene definitions with `python3 tools/export_script.py` after dialogue edits; adding `--docx OUTPUT.docx` also exports Word. Asset facing and scene movement are documented in [the direction audit](production/v8-direction-audit.md).

See [Story and canon](docs/STORY-CANON.md), [Content definitions](docs/CONTENT.md), [v8 review checklist](docs/V8-REFINEMENT-CHECKLIST.md), [Validation](docs/VALIDATION.md), [Known limitations](docs/KNOWN-LIMITATIONS.md), [Changelog](CHANGELOG.md), and [NOTICE](NOTICE.md).

## Release verification

[Source verification](https://github.com/cattownfilms/the-critic-city-run/actions/workflows/verify.yml) runs Core and real Chromium, Firefox and WebKit tests. Browser jobs use the official pinned Playwright 1.58.0 image; WebKit must pass three independent campaign/loading runs without retrying failures. The manual [deployed Pages check](https://github.com/cattownfilms/the-critic-city-run/actions/workflows/verify-pages.yml) verifies the deployed commit and runs existing regressions against public HTTPS. See [publishing](docs/PUBLISHING.md) and the final external release receipt for deployment evidence; a source-CI pass alone does not verify publication.

## Build and verify

Python 3.10+ and Node 22+; gameplay itself has no package dependencies.

```sh
python3 tools/build_standalone.py
python3 tools/build_launcher.py The-Critic-Coming-Attractions-v11.html The-Critic-Coming-Attractions-v11-Play.sh
node tests/engine.test.js
node tests/franklin.test.js
node tests/v4-engine.test.js
node tests/campaign-engine.test.js
node tests/gamepad.test.js
node tests/v7-engine.test.js
node tests/v8-engine.test.js
node tests/cutscenes-v7.test.js
python3 tests/site.test.py
python3 tests/production-assets.test.py
python3 tests/publish.test.py
python3 tests/launcher.test.py
```

Browser tests require `pip install -r requirements-test.txt` and installed Playwright browser engines. `python3 tests/gamepad-browser.test.py --engine chromium --url local` exercises the real source site. `python3 tests/campaign-browser.test.py` covers scenes, touch, migration and campaign integration. The v8 loading/facing and gameplay browser suites cover bulk readiness, scene cache use, direction, heavy run collisions, world-fixed booths, bouncing projectiles and the new boss sequence. The retained v7 scene suite covers route-aware staging and input safety; its old deferred-loading suite is historical because v8 intentionally changes that contract. CI runs Chromium/Firefox/WebKit and reports actual failures; configuration alone is not evidence of a passing run.

The historical first-publish tool remains for provenance and safety tests. Updates to this existing repository use a branch and reviewed merge, preserving the Pages path and history. `PUBLIC-FILES.json` fingerprints the reviewed release allowlist; prompt logs, saves, credentials, raw source media and duplicate builds are excluded from the repository.

## v9 playtest corrections

Music and WebAudio unlock directly on trusted pointer/key gestures; blocked playback retries on later interaction. Missing fields in old settings retain defaults; explicit zero volumes remain respected. The five songs and thirteen SFX are unchanged. Native browser tests measure advancing music time and nonzero SFX output, not only HTTP availability. Physical Android speaker output still requires the on-phone checklist.

Stage scenes overlay the real gameplay world. Visual-only beats hide the empty dialogue frame; the opening has distinct screen-power and materialization presses, retains its crowd, and lands on the live Broadway canvas.

Run `node tests/v9-engine.test.js` and `python tests/v9-audio-browser.test.py --engine chromium --url local` for the focused v9 regressions. CI also runs Firefox/WebKit. See `docs/V9-PLAYTEST-LEDGER.md` for each annotation and its evidence status.
