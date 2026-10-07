# THE CRITIC: COMING ATTRACTIONS

A complete seven-stage, mobile-first arcade brawler. Duke demands a glowing review, kidnaps Marty, and turns his experimental broadcasting system on. The Coming Attractions spill into New York. Jay goes after his son.

**[Play the game](https://cattownfilms.github.io/the-critic-city-run/)** · v6.0.0 · Touch, keyboard, optional remappable controller · No account or runtime service required.

## Play locally

Run `python3 -m http.server 8788 --bind 127.0.0.1` in this folder and open `http://127.0.0.1:8788/`. Keep this origin to retain existing local saves. Direct `file://index.html` is unsupported; use the generated standalone file for direct offline play.

The release bundle includes the complete standalone `The-Critic-Coming-Attractions-v6.html` and Termux launcher `The-Critic-Coming-Attractions-v6-Play.sh`. In Termux, install Python, then run `bash The-Critic-Coming-Attractions-v6-Play.sh`. It keeps the existing localhost:8788 origin and installation directory, backs up the old HTML, and never clears browser saves. The browser and Termux must remain open for reloads.

## Controls

| Input | Movement | HIT | JUMP | GUARD | REVIEW | Pause |
|---|---|---|---|---|---|---|
| Touch | Radial analog pad | HIT | JUMP | GUARD | REVIEW | Pause icon |
| Keyboard | WASD / arrows | J / X | Space / Z | K / C | L / V | Esc / P |
| Standard browser gamepad | Left stick / D-pad | West / X | South / A | East / B or LB | North / Y | Start |

Small stick deflection walks; full deflection runs. Standing HIT chains jab, cross, front kick, palm. JUMP + HIT kicks in the air; RUN + HIT rushes. Hold GUARD for frontal block, time GUARD to parry, MOVE + GUARD slips, then HIT counters. Full REVIEW meter fires the established finisher.

Controllers remain optional and off by default. Enable one in Controls/Pause; nonstandard devices require the existing eleven-step remapping wizard. Standard mapping is accepted only when the browser reports it, including Logitech-style devices. Disconnect/focus loss clears held controls and pauses. Hardware has not been tested physically.

Scenes: touch CONTINUE/SKIP, Enter/Space/J to advance, Esc/Backspace to skip, P to pause. Controller Confirm/HIT advances, Back skips, Start pauses. Release controls between scene and play. Skipping awards exactly the same progression as watching.

## Campaign

| Stage | Location | Main authored encounter |
|---|---|---|
| 1 | Broadway Blocks | The first Coming Attractions enter New York |
| 2 | Last Train Uptown | Follow Duke’s trail beneath the city |
| 3 | Above the Avenue | Trace the transmission across the rooftops |
| 4 | Theater District | Franklin; Shermometer v3 on Franklin’s route |
| 5 | Palace Cinema | Projection-window attacker, circuit shutdown, Shermometer v3 defender |
| 6 | Little Italy | Supplied cream-scarf male boss outside the pizzeria |
| 7 | Broadcast Tower | Duke’s transmitter; rescue Marty and stop the broadcast |

Shermometers v1/v2/v3 remain the ordinary roster’s backbone. Accordion Bear, Green Hippo, Fred K and JP Raptor Esq appear selectively. Coffee heals 18; Turkey Dinner heals 46. Trash Can and Box break immediately for pickups; legacy Bin IDs remain compatible.

Franklin remains brown-haired and unlocks when Jay defeats him and exits Stage 4 without dying during that attempt. The campaign continues after that unlock. Franklin never fights himself; later results never announce him as newly unlocked again.

## Saves and content

Existing save/profile/settings/controller keys remain unchanged. Schema 4 migrates v2/v3 checkpoints and retained unlocks; a completed old four-stage save resumes at Palace Cinema. Settings remain browser-local. Localhost and Pages are separate origins and do not automatically share saves. Denied localStorage permits play without persistence.

`data/campaign.js` authors stages, enemy definitions, bosses, props and items. `data/cutscenes.js` contains the exact approved opening and concise scene definitions. `cutscenes.js` is the reusable player. Player combat constants and the original nine animation banks remain unchanged. New assets append to the existing atlas manifest. Shared original atlases load once; new banks load when their stage or gallery needs them. Music keeps the supplied five recordings, separate volume controls and crossfades; no new recordings are claimed.

See [Story and canon](docs/STORY-CANON.md), [Content definitions](docs/CONTENT.md), [Validation](docs/VALIDATION.md), [Known limitations](docs/KNOWN-LIMITATIONS.md), [Changelog](CHANGELOG.md), and [NOTICE](NOTICE.md).

## Build and verify

Python 3.10+ and Node 22+; gameplay itself has no package dependencies.

```sh
python3 tools/build_standalone.py
python3 tools/build_launcher.py The-Critic-Coming-Attractions-v6.html The-Critic-Coming-Attractions-v6-Play.sh
node tests/engine.test.js
node tests/franklin.test.js
node tests/v4-engine.test.js
node tests/campaign-engine.test.js
node tests/gamepad.test.js
python3 tests/site.test.py
python3 tests/production-assets.test.py
python3 tests/publish.test.py
python3 tests/launcher.test.py
```

Browser tests require `pip install -r requirements-test.txt` and installed Playwright browser engines. `python3 tests/gamepad-browser.test.py --engine chromium --url local` exercises the real source site. `python3 tests/campaign-browser.test.py` covers scenes, touch, migration and campaign integration. CI runs Chromium/Firefox/WebKit and reports actual failures; configuration alone is not evidence of a passing run.

The historical first-publish tool remains for provenance and safety tests. Updates to this existing repository use a branch and reviewed merge, preserving the Pages path and history. `PUBLIC-FILES.json` fingerprints the reviewed release allowlist; prompt logs, saves, credentials, raw source media and duplicate builds are excluded from the repository.
