# THE CRITIC: COMING ATTRACTIONS — Playtest corrections

The 45 requested corrections were implemented and checked against the reviewed v6 baseline. Automated assertions establish behavior and consistency; pixel identity, staging, readability and stage distinctions also received visual inspection of actual rendered source screenshots. This checklist contains concise outcomes and public test/source references.

| # | Correction | Verification |
|---:|---|---|
| 1 | initial loading improved | Startup atlas request budget is 29,973,308 bytes versus 55,478,726; decoded budget is 109,731,128 versus 204,845,056. Cold localhost time increased .432→.725 s, so no wall-time speedup is claimed. [Evidence](../Validation-Report.json) |
| 2 | Animation Room inaccessible until ready | Three browser loading suites: stalled startup/gallery files, every entrance and direct handler guard; repeated failed Continue remains retryable. [Evidence](../Validation-Report.json) |
| 3 | options menu preserved | Controller/settings suites retain native volume, accessibility and remapping controls; options usable during stalled loading. [Evidence](../Validation-Report.json) |
| 4 | Belly Bash is Jay's RUN + HIT | Engine run-attack assertions and original Belly Bash source contact registration. [Evidence](../Validation-Report.json) |
| 5 | Belly Bash gives substantial knockback | Normal RUN+HIT launches a lane-valid foe 302.68 units, hits once for existing 24 damage; off-lane target is untouched. [Evidence](../Validation-Report.json) |
| 6 | Marty is not prematurely visible in opening | Both watched opening routes keep Marty absent through duke-approach, refusal and motivation. [Evidence](../Validation-Report.json) |
| 7 | opening begins with Jay seated on Coming Attractions set | Actual landscape screenshot reviewed: seated Jay/chair on a shared pixel Coming Attractions set. [Evidence](../cutscenes.js) |
| 8 | Duke approaches Jay | Real browser time shows Duke x advancing toward seated Jay within the shared shot. [Evidence](../Validation-Report.json) |
| 9 | Jay and Duke share scene continuity | Shared set/camera and Jay/Duke bodies retained across the opening exchange; screenshots reviewed. [Evidence](../data/cutscenes.js) |
| 10 | Marty reveal happens later | Both routes reveal Marty only after motivation; the reveal uses his own portrait and one authored cage. [Evidence](../Validation-Report.json) |
| 11 | dialogue portraits implemented | All 6 speaker portraits decode in all 3 engines with pixel rendering and independent geometry. [Evidence](../Validation-Report.json) |
| 12 | cutscenes match 32-bit game aesthetic | Pixel studio, sprite bodies and portrait frames visually inspected; retained animation pixels verified by semantic asset tests. [Evidence](../tests/production-assets.test.py) |
| 13 | Duke's activation visibly releases enemies from screens | Opening activation/emergence scene shows the 7 actual enemy banks originating from named screen positions. [Evidence](../Validation-Report.json) |
| 14 | multiple Coming Attractions emerge in droves | Seven recurring cast banks appear together and move from screens into the studio. [Evidence](../Validation-Report.json) |
| 15 | origin of enemies is visually understandable | Named screen origins and actual screen-to-floor movement are asserted and visually inspected. [Evidence](../Validation-Report.json) |
| 16 | Jay is physically blasted/thrown into Stage 1 | Jay moves out of the studio toward the window before the separate street-recovery beat and Stage 1. [Evidence](../Validation-Report.json) |
| 17 | boxes/trash props larger | Props use a consistent 1.35 presentation scale; break/drop values retained; screenshots reviewed. [Evidence](../Validation-Report.json) |
| 18 | inter-stage Duke/Marty cage scenes added | Short stage scenes visibly continue Duke’s portable Marty-cage trail; scene contract and route tests. [Evidence](../tests/cutscenes-v7.test.js) |
| 19 | first four stages visually distinct | Rendered first 4 reviewed: broadcasting/media block, subway train/platform, rooftop skyline, neon premiere theater. [Evidence](../render.js) |
| 20 | short cutscene between meaningful stages | All stage/boss story beats integrate into both complete routes and are safely skipped through actual callbacks. [Evidence](../Validation-Report.json) |
| 21 | parry preserved | Original guard/parry/counter combat definitions and controller/touch regression remain passing. [Evidence](../Validation-Report.json) |
| 22 | weak transitional dialogue rewritten | Stage transitions use brief visual cage/trail exchanges; Jay/Franklin dialogue tables and scene player tested. [Evidence](../data/cutscenes.js) |
| 23 | combat preserved | Exact accepted HITS/CHAIN baseline, original decoded action pixels/timing/registration, movement and combat suites pass. [Evidence](../Validation-Report.json) |
| 24 | projectionist is clearly readable | Projectionist silhouette/reveal and face are readable inside a masked background window in actual cinema capture. [Evidence](../render.js) |
| 25 | projectionist art matches 32-bit game | New pixel projectionist art uses the supplied identity; actual staged screenshots inspected. [Evidence](../assets/story/projection-woman-pixel.webp) |
| 26 | projection windows fixed | Three windows are fixed and masked, with aligned numbered circuit/wire connections. [Evidence](../render.js) |
| 27 | circuit objective understandable | Three matched circuits, explicit objective and 0/3 counter are visible; partial checkpoint and full shutdown tested. [Evidence](../Validation-Report.json) |
| 28 | projectiles fair/readable | Visible reveal precedes locked-floor telegraph and throw; projectile stays at locked target; matching circuit cancels its reels; large reel visually reviewed. [Evidence](../Validation-Report.json) |
| 29 | good death behavior preserved | Preserved decoded death frames and ground-contact metadata; pizzeria grounded defeat capture reviewed. [Evidence](../tests/production-assets.test.py) |
| 30 | muddy theater progression clarified | Actual cinema progression requires all 3 circuit shutdowns before exit; both routes clear it; HUD objective remains visible during the enforcer fight. [Evidence](../Validation-Report.json) |
| 31 | confusing transitions removed/restaged | Authored cage trails, cinema objective and pizzeria door entrance visibly communicate cause/exit; full routes and scene tests pass. [Evidence](../data/campaign.js) |
| 32 | Pizzeria boss consistently larger | Boss uses one fixed 1.24 body scale across states; doorway capture appears about 19% taller than Jay. [Evidence](../Validation-Report.json) |
| 33 | Pizzeria boss intro clearly staged | Engine asserts explicit pizzeria-door source, door-open then walk phases, one entrance event; capture reviewed. [Evidence](../Validation-Report.json) |
| 34 | dialogue scene vertical bounce eliminated | All 10 opening beats have identical viewport/dialogue/portrait/Continue bounds in landscape and portrait in all 3 engines; all lines fit. [Evidence](../Validation-Report.json) |
| 35 | final broadcast gameplay preserved | Both routes fight the original broadcast machine before Duke; existing machine attack definition and normal combat remain passing. [Evidence](../Validation-Report.json) |
| 36 | final-broadcast cutscene converted to game-consistent art | Broadcast story uses pixel stage/studio art, retained cast sprite overlays and pixel portraits; scene dependencies decode. [Evidence](../data/cutscenes.js) |
| 37 | final-broadcast scene contains movement | Broadcast scene actor/screen emergence motion is authored and covered by scene contracts; rendered scene player checked. [Evidence](../tests/cutscenes-v7.test.js) |
| 38 | stakes visibly established | Marty remains visibly caged in the final arena; rescue objective and alarm/screen effects tie the machine to the confrontation. [Evidence](../render.js) |
| 39 | Duke becomes final combat boss after broadcast | Every normal-input route defeats broadcast-rig then the actual grounded Duke; 3 source-backed attacks have telegraph/recovery tests. [Evidence](../Validation-Report.json) |
| 40 | Marty rescue follows Duke defeat | Every route asserts no premature martyRescued flag; schema 5 and old-complete-v4 Continue require Duke first. [Evidence](../Validation-Report.json) |
| 41 | existing ending/results strengths preserved | Exact offline soundtrack/presentation19 checks retain visible winner, celebrations, title music and portrait results without repeated Franklin unlock. [Evidence](../Validation-Report.json) |
| 42 | Franklin visible in route-appropriate intro | Franklin body is visible as ally in the opening; Jay stays present as Marty’s father. [Evidence](../Validation-Report.json) |
| 43 | Franklin does not inherit Jay-specific dialogue | Every Franklin player comment in stage/boss/ending scenes uses FRANKLIN speaker and portrait; approved father lines remain Jay’s. [Evidence](../Validation-Report.json) |
| 44 | Franklin dialogue is route-aware | Resolved route-specific dialogue is watched in the real scene player; Franklin reply/ending contracts pass. [Evidence](../Validation-Report.json) |
| 45 | Franklin RUN + HIT improved | Franklin uses independent cartwheel-run source poses; normal RUN+HIT contact and 302.68-unit launch tested; never borrows Belly Bash. [Evidence](../Validation-Report.json) |

The normal campaign drivers use movement, attack and Review inputs through the existing engine and real app callbacks. Explicit scene/render/save fixtures supplement those runs. No physical Android, Logitech hardware or desktop Safari test is claimed. Local results are separate from subsequent CI and public HTTPS verification.
