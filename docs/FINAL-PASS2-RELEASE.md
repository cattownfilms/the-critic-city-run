# Final Pass 2 visual candidate

Base: `79c80a7dcfa22cbee446cbecb3e2d156baa78b2c`, local `polish-pass2`.

The foreground final Duke used 1.18 in world dialogue and 1.10 at physical-boss creation. His final encounter now shares 1.35 across source performances and dialogue/combat/defeat, including a defeated actor away from the default floor lane. The source idle bounds are 186 units high (251.1 at 1.35). The walk is 187 high; the existing bent and attacking poses retain their original proportional bounds and registration. The Receiver's background endpoint remains 1.18 × .63; his descent interpolates to the foreground endpoint. No attack definitions, hitboxes, timing, difficulty or artwork changed. Studio and cage transport retain their approved scales.

The memorial had overlapping dark panel overrides; results used a separate small canvas. Both now share the existing final skyline atlas tile, uncropped 16:9, and a single text-construction function using the authored ending caption. Shared serif typography and a whole-image gradient replace the placard. Continue stays outside the wording; results retain the statistics and existing navigation below a full-width memorial. Saves and the localhost installation origin are unchanged.

## Focused evidence

Local evidence: `~/.local/share/cattown/critic-release/pass2/final-visual/`.

Matched `before-` and `after-` PNGs cover Duke dialogue/combat on both routes, ending and results, at 915x412 and 360x800. `after-results-actions-*` shows the scrolled navigation. `before-trace.json` and `after-trace.json` record source bounds and actual sprite/shadow render calls. The local native Chromium fixture checks all seven move entries plus idle, walk, run, folded guard, hurt, retreat and defeat, both facings. Fixed scene clocks supplement visual review; these are not physical-controller tests.

`tests/final-visual.test.js` compares both routes' deterministic combat snapshots against the base for 2,400 ticks each and retains schema 5. `tests/final-visual-browser.test.py` covers the real ending/results callback, native piano, Continue reopening, skip, geometry, statistics and scrollable actions. `tests/final-packaging.test.py` verifies embedded source, launcher payload parity, integrity hash, atomic replacement/backup, unchanged save keys and port 8788.

## Release expectation audit

- Keep current v9/v10/v11, campaign, input, audio, opening and loading browser checks. The v10 memorial assertions still require exact wording, fully visible lines, serif size ≥17 and an accessible Continue action; no relaxation is needed.
- Current Pass 1 plus Pass 2 engine, Palace/cart and studio-mob checks are included. Historical baseline comparisons need a complete Git history (the core checkout already provides it).
- The old standalone `5867.test.js` expects an immediate null camera after circuit defeat; the approved Pass 2 final shutdown intentionally holds that camera through staging. Its current replacement is `pass2-duke-palace.test.js`, which checks the three encounters, shutdown staging, retry/checkpoint and unchanged Theater District. Do not revive the obsolete shutdown assertion.
- The old v4 celebration-image results fixture predates the neutral memorial and is not part of the current release matrix. Current campaign/v10 checks cover completion and saved results.
- No new art, save migration, campaign content or global camera/scaling changes.

Run the focused job before the single complete release gate. The gate must qualify its exact commit in Core, Chromium, Firefox and WebKit with packaging integrity. Publication remains conditional on that gate passing. Record remote run IDs, final hashes and deployment outcome in the external release receipt, so the qualified source commit stays unchanged.
