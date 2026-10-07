# THE CRITIC: COMING ATTRACTIONS — Validation

The implementation baseline was the existing public repository’s reviewed main commit `03fe0af9d1857874edeb64e2f430dd1989576c64`. Repository history and the original Pages origin are retained. The first four districts reproduce their original 12 wave arrays and 39 ordinary spawns before the three added districts.

## Verification boundary

The tests exercise the actual source build over HTTP and the generated offline HTML in real Playwright browser engines. Complete route drivers accelerate fixed engine updates using ordinary movement, attack and Review inputs, route real events through the app, and skip presentation delays through the real transition methods. They do not alter health, enemy health, position, score or campaign flags during either route. These are automated complete combat runs, rather than a claimed human or physical-device playthrough. Separate explicit fixtures test unlock failures, checkpoints, old saves and boss counterplay.

Both routes visit all seven stages, defeat 70 opponents, shut down the projection circuits, defeat the final transmitter, rescue Marty and reach the ending. Franklin’s route uses Shermometer v3 in Stage 4. Stage-4 death-free unlock and death disqualification remain independently covered.

Keyboard, simulated simultaneous touch, standard and nonstandard Gamepad API layouts, custom mapping, neutral gating, reconnect/disconnect and focus loss are tested. Gamepad fixtures are not physical Logitech hardware. Browser sizes cover desktop, small landscape and Android-sized portrait. Playwright WebKit coverage is not a claim of physical Safari/iPhone testing.

## Combat, saves and content

Accepted player hit constants, timing, reach and combo definitions remain byte-identical to the preserved baseline. Movement, depth, walk/run, jump, air attack, running attack, guard, parry, evasive slip, counter and Review pass regression checks. No player damage or timing rebalance was introduced. New enemy patterns use visible warnings and explicit recovery windows; the projection target locks before its reel is thrown.

Every original animation bank, frame mapping and atlas file is preserved. New asset tests check source identity, derived hashes, dimensions, frame bounds, transparent padding, death ground contact and green-key residue. All six generated images have matching recorded SHA-256 hashes and were visually inspected. Actual rendered stage fixtures verify theater windows, projectionist silhouettes/reveal, readable floor markers, Cream Scarf boss identity, separate props, transmitter warnings and protected Duke/Marty staging.

Scene checks cover the exact approved opening dialogue, watch/skip equivalence, completion idempotence, keyboard/touch/controller advance and skip, pause, held-input suppression, portrait text layout, checkpoint flags, art decoding and the ending. Legacy save schemas 2/3 migrate to 4, retaining unlocks and settings; a completed old demo continues into Palace Cinema. Continue after the cinema defender’s defeat preserves the remaining circuit objective without duplicating the boss.

Music/effects, separate volume, mute, pause, crossfades, MP3 decoding and overlapping sampled cues are exercised in Chromium. Missing Gamepad/Web Audio/fullscreen/vibration and denied storage fixtures remain playable. Five original music recordings and thirteen source-derived cues are retained; no new recordings are claimed.

## Release artifacts and publication

The offline builder embeds all runtime dependencies. Linux loopback tests verify byte-exact served HTML, no-cache responses, repeat launch and restricted endpoints. The reviewed v5 launcher is rebuilt and upgraded to v6 twice: port/origin, install path, running server, original backup and retained files remain intact. Physical Termux/Android installation remains untested.

`PUBLIC-FILES.json` fingerprints the reviewed source/runtime allowlist. Publication tests reject changed files, unsafe paths, unrelated history, private repositories and wrong accounts. Raw videos, input archives, browser saves, credentials, private prompt logs and delivery duplicates remain outside the public repository.

Local suite results and browser versions are recorded in `Validation-Report.json`. The downloadable release’s hosted verification record is produced after the actual Pages deployment; a push alone is not treated as deployment evidence. GitHub Actions runs the core checks plus the real Chromium/Firefox/WebKit source/controller/campaign matrix. Read its actual results before claiming CI success.

See [COMPATIBILITY.md](COMPATIBILITY.md) and [KNOWN-LIMITATIONS.md](KNOWN-LIMITATIONS.md) for the remaining hardware, source-reference and loading limits.
