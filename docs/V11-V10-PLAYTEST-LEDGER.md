# V11 / released-v10 playtest ledger

25/25 dispositions. PASS refers to the executed automated checks and reviewed source/browser imagery below. It does not claim physical Android audio, controls or subjective gameplay feel.

Source validation: https://github.com/cattownfilms/the-critic-city-run/actions/runs/37742777465 (`0d7e0d4b4b2e4742fc4b7361102489d7d904b340`). Final merged/public verification is recorded in the release receipt.

| Note / interpretation | Status | Implementation and evidence | Files / checks |
|---|---|---|---|
| Projection booth redesign | PASS | Three separate wall apertures; actual browser screenshot | render.js; v11-presentation |
| Only three booths | PASS | Exact 3-count and fixed world positions asserted in engine and browser | data/campaign.js; v11-engine; v8-gameplay-browser |
| Booths above movie screen | PASS | Window origin 92, screen starts 175; screenshot reviewed | render.js; screenshots-v11/*palace* |
| Encounter trigger at screen | PASS | Gate 0 inactive; screen-area gate 2 activates authored reveal | engine.js; v11-engine |
| Volley escalation 1 / 3 / 5 | PASS | Three volleys per phase with exact widths; no invisible camera attacks | engine.js; v11-engine; v8-gameplay-browser |
| Clean post-projection screen state | PASS | Booths power off and remain architectural; unobstructed movie image | render.js; retained cinema tests |
| Rabbi emergence delay | PASS | 0.45-second foreshadow beat hands straight into existing single screen entry | data/cutscenes.js; v8-engine |
| Rabbi emergence glitch | PASS | One physical actor, one entry event; old entry system retained | engine.js; v8-engine; v9-engine |
| Duplicate credits line | PASS | Exactly one credits joke remains; both script routes regenerated | data/cutscenes.js; v11-engine; export_script --check |
| Chroma/magenta cleanup | PASS | Reviewed derived Rabbi before/after; other legitimate green/pink preserved | production/v11-matte.json; v11-assets; global matte contact sheets |
| Rabbi falls before punchline | PASS | 2.05-second settle gate exceeds 1.7-second full fall; one story event | engine.js; v11-engine |
| Spike falls before punchline | PASS | Same settled-fall gate; body remains visible through the joke | engine.js; render.js; v11-engine |
| Duke physical retreat | PASS | Source backsteps replace retreat poses; physical velocity and old phase AI retained | engine.js; v9-engine; v10-engine; production/v11-assets.json |
| Broadcast screens physical introduction | PASS | Mounted panels exist in standby before encounter; power state changes without geometry spawn | render.js; browser staging screenshots |
| Final confrontation framing | PASS | Non-dialogue physical approach to centered opposing marks before speech | data/cutscenes.js; retained scene browser tests |
| Final confrontation dialogue | PASS | Concise Marty-specific threat and route-specific reply; approved lines untouched | data/cutscenes.js; FULL-SCRIPT.md; scene tests |
| Duke placement relative to cart | PASS | Separate actors maintain 130-world-unit contact spacing | app.js; v11-presentation cart test |
| Duke physically pushes cart | PASS | Source push mime, measured hand contact and rotating cart wheels; no baked cage | render.js; app.js; v11-presentation screenshot |
| Marty movement physically believable | PASS | Captive body follows cart; release uses retained run and known reunion destination | app.js; v10-presentation; v11-presentation |
| Optional hoist machinery | PASS | Not needed: floor cart stays at its established mark; no unexplained elevation | data/cutscenes.js; app.js; reviewed cart/rescue screenshots |
| Franklin cartwheel slowdown | PASS | 0.56 seconds, contact 0.24 seconds mapped to unchanged pose 11/26 | engine.js; v7-engine; v8-engine; v11-engine |
| Franklin gameplay preserved | PASS | Retained input/combat tests and full normal-input campaign route pass | franklin; campaign-engine; campaign-browser; gamepad-browser |
| Ending hug preserved | PASS | Existing reunion performances/positions retained; both route rescue checks pass | v10-presentation; data/cutscenes.js |
| Franklin-route Marty above Jay | PASS | Actual renderer call order verified; override clears on scene end | render.js; v11-presentation screenshot |
| Spike jump-teaching cutscene | PASS | Real can, bounce, jump, airborne underpass, exit, landing; dangerous later combat and skip cleanup | v11-engine; v11-presentation landscape/portrait |

Exactly three hash-deduplicated Downloads reels, 577 source frames reviewed; nine selected action sequences / 110 poses. Pull and adjust alternates are preserved without forcing new gameplay. Raw MP4s stay local. See production/v11-assets.json and production/v11-matte.json.

Phone confirmation: audio/mute/pause; Palace volleys and radio; watched/skipped Spike tutorial on both routes; cart staging; cartwheel readability; Marty-in-front reunion.
