# THE CRITIC: COMING ATTRACTIONS

A complete seven-stage, mobile-first arcade brawler. Duke demands a glowing review, kidnaps Marty, and turns his experimental broadcasting system on. The Coming Attractions spill into New York. Jay goes after his son.

**[Play the game](https://cattownfilms.github.io/the-critic-city-run/)** · v8.0.0 · Touch, keyboard, optional remappable controller · No account or runtime service required.

## Play locally

Run `python3 -m http.server 8788 --bind 127.0.0.1` in this folder and open `http://127.0.0.1:8788/`. Keep this origin to retain existing local saves. Direct `file://index.html` is unsupported; use the generated standalone file for direct offline play.

The release bundle includes the complete standalone `The-Critic-Coming-Attractions-v8.html` and Termux launcher `The-Critic-Coming-Attractions-v8-Play.sh`. In Termux, install Python, then run `bash The-Critic-Coming-Attractions-v8-Play.sh`. It keeps the existing localhost:8788 origin and installation directory, backs up the old HTML, and never clears browser saves. The browser and Termux must remain open for reloads.

The title shell and options appear first. The game then bulk loads and decodes all runtime sprite atlases, portraits, scene and environment images, and downloads the five music recordings and thirteen sound cues. Start, Continue and every Animation Room entrance remain disabled until this preparation finishes. Progress reflects actual completed files and downloaded bytes, with Retry after a failed download. Later scenes use the prepared cache. This intentionally moves loading to startup and retains every unique animation.

## Controls

| Input | Movement | HIT | JUMP | GUARD | REVIEW | Pause |
|---|---|---|---|---|---|---|
| Touch | Radial analog pad | HIT | JUMP | GUARD | REVIEW | Pause icon |
| Keyboard | WASD / arrows | J / X | Space / Z | K / C | L / V | Esc / P |
| Standard browser gamepad | Left stick / D-pad | West / X | South / A | East / B or LB | North / Y | Start |

Small stick deflection walks; full deflection runs. Standing HIT chains jab, cross, front kick, palm. JUMP + HIT kicks in the air; RUN + HIT Belly Bashes as Jay or cartwheels as Franklin. Hold GUARD for frontal block, time GUARD to parry, MOVE + GUARD slips, then HIT counters. Full REVIEW meter fires the established finisher.

Accordion Bear and Green Hippo stop either player's running attack. The collision stuns the player and breaks the combo; use ordinary punches, kicks and defensive timing against these heavy opponents. Other running-attack targets retain the strong horizontal launch. Franklin's cartwheel now uses the preferred supplied performance, retimed to the existing running-attack window.

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

Palace Cinema's booths span the rear wall and move with that wall. The projectionist appears only in an onscreen powered booth. Each of three circuit colors controls a group of booths; breaking a circuit darkens its group and cancels its reels. Reels bounce three times and knock down the player after an unblocked hit. Both all circuits and the Violent Austrian Rabbi must be defeated before the exit opens.

## Saves and content

Existing save/profile/settings/controller keys remain unchanged. Schema 5 migrates v2/v3/v4 checkpoints and retained unlocks. A completed old four-stage save resumes at Palace Cinema; a completed v6 campaign resumes at the new Duke confrontation. Settings remain browser-local. Localhost and Pages are separate origins and do not automatically share saves. Denied localStorage permits play without persistence.

`data/campaign.js` authors stages, enemy definitions, bosses, props and items. `data/cutscenes.js` contains the exact approved opening and concise scene definitions. `cutscenes.js` is the reusable player. The accepted standing combo, air kick, guard, parry, dodge and Review constants remain unchanged. Running attacks change only as requested. Original source performances retain their decoded pixels, registration and timing; metadata repairs and the replaced cartwheel retain explicit source aliases. Music keeps the supplied five recordings, separate volume controls and crossfades; no new recordings are claimed.

The complete editable script is available as [FULL-SCRIPT.md](docs/FULL-SCRIPT.md), with a Word edition in the release bundle. It includes Jay and Franklin routes, staged actions, scene/beat identifiers and story UI text. Regenerate the Markdown from the actual scene definitions with `python3 tools/export_script.py` after dialogue edits; adding `--docx OUTPUT.docx` also exports Word. Asset facing and scene movement are documented in [the direction audit](production/v8-direction-audit.md).

See [Story and canon](docs/STORY-CANON.md), [Content definitions](docs/CONTENT.md), [v8 review checklist](docs/V8-REFINEMENT-CHECKLIST.md), [Validation](docs/VALIDATION.md), [Known limitations](docs/KNOWN-LIMITATIONS.md), [Changelog](CHANGELOG.md), and [NOTICE](NOTICE.md).

## Release verification

The reviewed v8 source passed Core, Chromium, Firefox and WebKit in [Actions run 37656134125](https://github.com/cattownfilms/the-critic-city-run/actions/runs/37656134125). WebKit passed an unchanged-source rerun after the first job timed out. The manual [deployed Pages check](https://github.com/cattownfilms/the-critic-city-run/actions/workflows/verify-pages.yml) verifies the deployed commit and runs the existing browser regressions against the public game. See [publishing](docs/PUBLISHING.md) for the release gates; a source-CI pass alone does not verify deployment.

## Build and verify

Python 3.10+ and Node 22+; gameplay itself has no package dependencies.

```sh
python3 tools/build_standalone.py
python3 tools/build_launcher.py The-Critic-Coming-Attractions-v8.html The-Critic-Coming-Attractions-v8-Play.sh
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
