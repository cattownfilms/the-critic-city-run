# THE CRITIC: COMING ATTRACTIONS — Validation

The correction baseline is reviewed main commit `20f6a80e468f69e53baffea4268e6df0ee4f92cb`. Its immutable source and offline builds first passed 418 checks. The v7 correction preserves the accepted ordinary combat definitions, decoded source frames, action timing/registration and existing campaign, then adds the requested presentation changes, dedicated running attacks and physical Duke finale.

## Current local results

All 627 structured cases passed; the separate grouped cutscene-contract suite also passed. The machine→Duke→Marty order is checked in both normal-input routes in each source engine and the offline edition. Every route completed 7 stages and 71 knockouts, with no retries. Franklin never fights himself. Completed-v4 saves now resume the required Duke encounter, and schema 5 Continue preserves that phase without duplicate enemies or premature rescue.

| Suite / edition | Passed | Failed |
|---|---:|---:|
| Node engine/controller/campaign/correction cases |143|0|
| Python source paths / publication / asset semantics |36|0|
| Chromium 143.0.7499.4 — actual source HTTP |112|0|
| Firefox 144.0.2 — actual source HTTP |112|0|
| WebKit 26.0 — actual source HTTP |112|0|
| Exact offline Chromium — campaign/save |31|0|
| Exact offline Chromium — mobile/touch/render/gallery |34|0|
| Exact offline Chromium — soundtrack/presentation |19|0|
| Exact offline Chromium — denied storage |3|0|
| Exact offline Chromium — optional API fallbacks |8|0|
| Local Linux launcher |7|0|
| v6→v7 launcher upgrade |10|0|

Each source engine’s 112 cases comprise 39 controller, 31 campaign/save, 16 loading/failure-recovery, and 26 scene/layout/portrait checks. Source tests use genuine HTTP and origin-local saves. Scene tests watch the full opening in normal browser time with keyboard and touch, verifying exact approved dialogue, delayed Marty reveal, actual cast screen origins, Jay’s launch, six portraits, route-aware Franklin and fixed portrait/landscape anchors. Loading tests deliberately stall dependencies and abort repeated Continue requests; options remain usable, all gallery entrances stay blocked until ready, and retries preserve the pending-Duke checkpoint.

The offline tests load the exact HTML with bounded parser writes and explicitly emulated storage. CDP sends multiple simultaneous touches to the real browser. All 14 complete animation banks are loaded through the actual gallery before all 193 runtime states are drawn at both facings. Music tests use actual decoded recordings and overlapping crossfades. Missing Gamepad API, Web Audio, fullscreen and denied storage are explicit fixtures. Launcher tests start the real local server; upgrade tests preserve existing installation files and reject conflicting listeners.

## Exact offline artifact

`The-Critic-Coming-Attractions-v7.html`: 99,553,793 bytes.

SHA256: `241ff96b2f5eef28fdd4b5f88eb5d72d49f0bfce7125ab7ac3f6423fb7b350fe`.

## Loading comparison

| Fresh source startup budget | Reviewed v6 | v7 |
|---|---:|---:|
| Requested atlas bytes |55,478,726|29,973,308|
| Actual decoded atlas RGBA bytes |204,845,056|109,731,128|
| Cold headless localhost duration |.432s|.725s|

Startup atlas/decode budgets are about 46% lower while retained performances remain available on demand. This local timing sample did not show a wall-clock speedup and does not measure Android/network loading speed. The final atlas library has 75 pages; page count alone is not a byte or performance measure. See [startup measurements](../Validation-Report.json).

## Visual and correction review

Actual rendered screenshots were reviewed for the seated shared opening, Marty’s single cage, cast emergence, pixel portraits, all seven environments, three masked projection windows/circuit links, readable reel flight, larger pizzeria-door entrance, grounded defeats and the physical Duke arena. The original strengths marked GOOD were retained. [The 45-item checklist](PLAYTEST-CHECKLIST.md) links each correction to concise evidence; the raw private prompt and annotated video are not published.

## Scope and limitations

Normal-input full-route drivers accelerate fixed updates through the real app event handlers and use ordinary movement, attack and Review. They do not edit player/enemy health, position, enemies, score or story flags during either route. Stage-clear presentation delays are skipped through the real transition; scene callbacks are exercised rather than bypassed. Explicit render/save/scene fixtures are identified separately.

This is not physical Android, physical Logitech, iPhone or desktop Safari testing. Playwright WebKit checks compatibility, not every Safari/device combination. Chromium uses the explicitly selected Chrome for Testing 143 headless shell; Firefox and WebKit use installed Playwright engines. No newly synthesized music is claimed.

Local verification is complete. Current-v7 GitHub CI and public HTTPS verification remain separate release checks and must be appended after publication. Prior-v6 hosted success is not evidence of a deployed v7 build.

[Machine-readable report](../Validation-Report.json) · [Browser details](COMPATIBILITY.md) · [Known limitations](KNOWN-LIMITATIONS.md)
