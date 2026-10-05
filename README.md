# The Critic: City Run

**v5.0.0: optional controller support and a public-web publishing package.** A fan-made, four-district belt-scrolling browser brawler. Touch, keyboard, and physical controllers share the same combat engine. No account, server-side game code, analytics, API key, or paid service is needed to play.

This archive is ready to publish, but delivering the archive does not create a live GitHub repository. The publishing script reports the actual repository and site status. See [Publishing](docs/PUBLISHING.md).

## Play

For the hosted edition, open the GitHub Pages URL printed by the publisher. Do not send friends a raw GitHub HTML/blob URL: send the Pages address. Wait for the cast to load, then press **PRESS START**. Tap/click once if the browser requests permission to start audio. Landscape provides the largest combat view; portrait also remains usable.

For local development, run this from the repository root, then open the printed localhost address:

```sh
python -m http.server 8788 --bind 127.0.0.1
```

A separately delivered standalone HTML bundles everything for offline play. A separately delivered Termux launcher embeds that same HTML. Neither is necessary for friends visiting the public site. The unpacked edition needs HTTP(S), not direct `file://index.html` loading, because it fetches individual assets.

## Optional physical controller

Open **Controls** on the title screen, or **Pause** during play. Scroll to **Controller**, enable **Enable physical controller**, then press a controller button while this page is focused. Support is off by default and never removes your touch buttons or keyboard controls.

The game uses the standard mapping **only when the browser reports `mapping: "standard"`**. Brand recognition alone does not determine the mapping. Your exact Logitech model is not assumed.

| Physical input (standard browser layout) | Action |
|---|---|
| Left stick or D-pad | Move horizontally or between street depth lanes |
| Small / large stick deflection | Walk / run |
| West face button, usually X | HIT / combo |
| South face button, usually A | JUMP |
| East face button, usually B, or left bumper | GUARD / parry; move + guard to dodge |
| North face button, usually Y | REVIEW |
| Start / Menu | Pause / resume; start from title |
| Stick / D-pad in menus | Navigate controls |
| South / East face buttons in menus | Confirm / back |

Jump, then HIT for the airborne kick. Running then HIT retains the existing rush punch. Timing, damage, hit windows, enemy behavior, four stages, unlock rules, animation library, and soundtrack are unchanged from v4.

**Nonstandard layouts:** choose **Map controller**. Center the sticks and release all buttons, choose **Ready to map**, then follow the eleven movement/action/menu prompts. Release after each prompt. The game saves the completed profile for that controller identity in this browser. An incomplete or cancelled mapping never overwrites the last usable profile. Switching a hardware X/D mode may expose a different identity and require mapping again. Only use a mode switch if your actual model has it.

Adjust **Stick dead zone** if a centered stick drifts. Disconnecting the active controller or leaving the page pauses gameplay and clears its input. After reconnect/resume, release controls before moving again. Multiple detected devices are selectable, but this remains one-player gameplay.

Some browsers only expose gamepads after a physical button is pressed. Use the direct HTTPS page or localhost, not a restricted embedded preview. See [Browser and hardware test boundaries](docs/COMPATIBILITY.md). Physical Logitech hardware has not been tested in this environment.

## Other controls

- **Touch:** radial analog pad; HIT, JUMP, GUARD, REVIEW. Multiple fingers remain independent.
- **Keyboard:** WASD/arrows move, J attacks, Space jumps, K guards, L uses Review, Escape pauses. Native settings fields keep normal keyboard behavior.
- Existing music/effects volume, reduced camera shake, touch vibration, fullscreen, Animation Room, and character selection remain.

## What is preserved

All **153 runtime animation states, 2,306 frame references, 13 atlas pages, nine character banks, five music tracks and 13 combat cues** remain. Every file in `assets/`, along with `engine.js` and `render.js`, is byte-for-byte unchanged from the v4 source archive. The original hero's 50 source tracks and 943 entries remain available. This update adds input/browser integration, not another combat redesign.

Jay still faces Franklin at the end of Stage 4. Defeat Franklin and finish Stage 4 without dying in that attempt to unlock him. Franklin's replay route keeps the Slam Shermometer finale. New jumps, physical enemy entrances, ground-contact corrections, cleanup, and stage-clear celebrations from v4 remain intact.

Soundtrack: Broadway Mix in stage 1, Uptown Mix in stage 2, Rooftop Mix in stage 3, Premiere Mix in stage 4, Original Theme for title/results. Existing 0.9-second crossfades and combat cues remain.

## Saves and privacy

Existing v3/v4 progress, profile, and audio settings keys are unchanged. Controller preferences use a separate `cattown.critic.brawler.v5.gamepad` key. They stay in browser storage; the game does not transmit controller IDs, progress, or input data.

**Localhost and GitHub Pages are different storage origins.** Existing local saves and Franklin unlocks are not automatically copied to a new public URL. Keep using the same browser and localhost address for local continuity. Do not clear site storage to update. Denied storage does not block play, but persistence is unavailable.

The public package excludes raw generation videos, original oversized Sprite Forge archives, conversation/prompt logs, personal email addresses, local saves, credentials, generated HTML/launcher duplicates, and stale patch scripts. Included assets are the complete runtime derivatives required to play, not an incomplete source-only skeleton.

## Build and test

Python 3.10+ and Node 22+ are suitable for the supplied tooling. No npm installation is required for the game or engine tests.

```sh
python tools/build_standalone.py
python tools/build_launcher.py The-Critic-City-Brawler-v5.html The-Critic-Brawler-v5-Play.sh
node tests/engine.test.js
node tests/franklin.test.js
node tests/v4-engine.test.js
node tests/gamepad.test.js
python tests/publish.test.py
python tests/site.test.py
```

Browser testing additionally requires Playwright and installed browser engines:

```sh
python -m pip install -r requirements-test.txt
python -m playwright install chromium firefox webkit
python tests/gamepad-browser.test.py --engine chromium
```

Use `--url http://127.0.0.1:8788/` to exercise the actual multi-file site on a running local server. The shipped GitHub Actions matrix runs this hosted route in Chromium, Firefox, and WebKit after publication. It uses injected API fixtures for controller input, not a physical pad. Local delivered verification is recorded in `Validation-Report.json`; browser engines not run are explicitly identified. A configured CI job is not a claim that it has run.

## Rights and provenance

This is an unofficial fan-made game, not an official release of the referenced show or game inspirations. See [NOTICE](NOTICE.md). No blanket open-source license is applied to third-party media. The supplied artwork and recordings retain their provenance; public repository visibility does not newly license those assets.
