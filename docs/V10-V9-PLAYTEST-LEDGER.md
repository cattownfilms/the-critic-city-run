# V10 post-v9 playtest ledger

Source playtests: `1000085805.mp4`, `1000085806.mp4`. Exact copies were not found in Downloads; the supplied annotation ledger is authoritative. The four supplemental performances were reviewed separately, across all 240 frames each.

Source validation: [Core / Chromium / Firefox / WebKit](https://github.com/cattownfilms/the-critic-city-run/actions/runs/37710897264), commit `28c22162e361efe0384014687f9669e6f923c71a`. PASS means the cited implementation and automated checks passed; it does not claim physical Android observations. All 26 notes have dispositions. Subjective final-boss difficulty remains PARTIAL pending the user’s playtest.

## 1. I kinda want a scene where Duke presses a big red button.

- Interpretation / implementation: Two source-backed button performances with a large red control; screens power before emergence.
- Files: data/cutscenes.js; cutscenes.js; production/v10-assets.json.
- Automated evidence: v9/v10 presentation browser; supplemental asset tests.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.

## 2. GOOD: Hatchi Matchi!!!

- Interpretation / implementation: Exact approved line retained.
- Files: data/cutscenes.js.
- Automated evidence: cutscenes-v7; opening browser.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.

## 3. Jay should start offscreen, and run onscreen to say something.

- Interpretation / implementation: Departure, separate offscreen pursuit, deceleration and stopped dialogue mark.
- Files: app.js; data/cutscenes.js.
- Automated evidence: v10 presentation browser, both routes.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.

## 4. I think I’d like the raptors to have a unique attack pattern. They should move to the sides of the screen, then charge forward to attack with great speed.

- Interpretation / implementation: Physical flank, .65-second tell, committed 510-unit/s charge, overshoot, recovery and stagger reservation.
- Files: engine.js.
- Automated evidence: v10-engine Raptor behavior.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.

## 5. Again, Jay needs to run onscreen after Duke leaves. We need to feel like he’s right behind him.

- Interpretation / implementation: Shared pursuit sequence applies to subway, rooftop, theater, cinema and Little Italy; route-aware.
- Files: data/cutscenes.js; app.js.
- Automated evidence: v10 presentation browser.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.

## 6. The dialogue isn’t all the way visible. And I want Jay to run onscreen after Duke leaves.

- Interpretation / implementation: Responsive shared overlay height; all authored lines checked at four viewport sizes; pursuit above.
- Files: cutscenes.css; app.js.
- Automated evidence: v10 presentation browser.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.

## 7. Fred should have a teleporting attack pattern.

- Interpretation / implementation: Tell, absent untargetable state, safe reappearance, second tell, claw, recovery, cooldown.
- Files: engine.js.
- Automated evidence: v10-engine Fred behavior.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.

## 8. GOOD: Ah the theater, where nothing is sharper than my rapier wit!

- Interpretation / implementation: Exact approved line retained.
- Files: data/cutscenes.js.
- Automated evidence: cutscenes-v7; script export.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.

## 9. Projectionist should always face Jay. And I need more eyes in the dark. It should show eyes in the dark for atleast a second before she emerges.

- Interpretation / implementation: Faces active route; 1.15-second eyes-only gameplay interval; 1.3+ second authored reveal.
- Files: engine.js; render.js; data/campaign.js.
- Automated evidence: v10-engine; v8 gameplay browser.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.

## 10. The projectionist windows are too cramped. And I’d like her to throw more reels the more radios I destroy. She also needs to throw the radio. I need to know that’s what I need to destroy.

- Interpretation / implementation: Nine spaced full-height openings; 3/4/5 reels; hand-held radio windup and physical trajectory.
- Files: data/campaign.js; engine.js; render.js.
- Automated evidence: v10-engine; v8 gameplay browser.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.

## 11. She should throw more reels. And enemies should still spawn too.

- Interpretation / implementation: Bounded Shermometer supports enter physically, cap two then three, alongside escalating reels.
- Files: engine.js.
- Automated evidence: v10-engine support cap and phases.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.

## 12. See it’s not clear when the radio is thrown. I need a visual.

- Interpretation / implementation: Visible hand/control windup, release from booth, heavier arc, bounce and SMASH cue.
- Files: engine.js; render.js.
- Automated evidence: v10-engine trajectory and landing.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.

## 13. Why is Jay moving offscreen? He should face the boss. And also the boss needs to emerge better and cleaner.

- Interpretation / implementation: Stopped player under dialogue; authored marks; screen preview held until a single physical emergence.
- Files: app.js; engine.js; render.js.
- Automated evidence: v8-engine entrance; presentation browser.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.

## 14. There are some lags in dialogue with no visual motion. Add visuals during those lulls.

- Interpretation / implementation: Source gestures, live sprite clocks, animated portraits, monitor/projection motion continue under dialogue.
- Files: app.js; data/cutscenes.js; render.js.
- Automated evidence: presentation browser runtime screenshots.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.

## 15. GOOD: Finally! A believable performance.

- Interpretation / implementation: Exact approved line retained.
- Files: data/cutscenes.js.
- Automated evidence: cutscenes-v7; script export.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.

## 16. Why does Spike slide over? He should walk if he has to move at all.

- Interpretation / implementation: Source walk drives physical story, entrance and combat travel; live entry clocks advance.
- Files: app.js; engine.js; production/v10-assets.json.
- Automated evidence: v8/v10-engine; presentation browser.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.

## 17. GOOD: Stay down, Spike. Like your diminishing box-office returns.

- Interpretation / implementation: Exact approved line retained.
- Files: data/cutscenes.js.
- Automated evidence: cutscenes-v7; script export.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.

## 18. This framing is weird... They’re in the confrontation, they should be center frame and facing one another.

- Interpretation / implementation: Responsive world marks and explicit facing; no residual player locomotion under dialogue.
- Files: app.js; data/cutscenes.js.
- Automated evidence: presentation browser.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.

## 19. Also, throughout Marty is just sliding along. Should he be on a cart with wheels? So it seems believable?

- Interpretation / implementation: Cage sits on visible wheeled platform; escort and cage move together; open cage stays anchored.
- Files: render.js; cutscenes.js; app.js; engine.js.
- Automated evidence: presentation browser; authored staging review.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.

## 20. I’m not sure about this jump cut Marty and duke. This whole section seems messy.

- Interpretation / implementation: Persistent tower actors/cart, physical escort between entry and arena, Duke walks to controls.
- Files: app.js; engine.js; data/cutscenes.js.
- Automated evidence: campaign/browser staging fixtures.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.

## 21. I think the transmitter should move. When it’s protected it should be on either side, shooting a massive laser at the main character while the player fights the wave of enemies.

- Interpretation / implementation: Rail-mounted physical travel, shielded side positions and locked, telegraphed finite beam.
- Files: engine.js; render.js.
- Automated evidence: v10-engine physical delta, shield and laser bounds.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.

## 22. When the enemies are defeated, the transmitter should crash to the ground and let the player hit it. Rinse repeat.

- Interpretation / implementation: Actual wave kills trigger 1.1-second falling core, exposed damage budget, rise and next side.
- Files: engine.js; render.js.
- Automated evidence: v10-engine three rounds; full campaign.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.

## 23. Real jumpy. I need a slow defeat animation. Maybe an explosion or something before Duke appears.

- Interpretation / implementation: Four-second spark, shudder, two rupture pulses, collapse and story gate.
- Files: engine.js; render.js.
- Automated evidence: v10-engine four-second gate.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.

## 24. This fight is kinda boring. It should be the hardest. Let’s give Duke some more moves and attack patterns.

- Interpretation / implementation: Seven physical moves; 3/6/7 phase pools, source one-two/backhand/rush/flurry, physical retreat and recovery.
- Files: data/campaign.js; engine.js; production/v10-assets.json.
- Automated evidence: v9/v10-engine cadence, contact opportunities, repetition and continuity.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PARTIAL — seven patterns, phases, physical pursuit, repetition suppression and recovery pass; whether it feels hardest remains a physical playtest judgment.

## 25. Also need a more epic defeat scenario.

- Interpretation / implementation: Dedicated stagger/defiant-gesture/collapse source performance, strong final hitstop, held defeated actor and rescue gate.
- Files: engine.js; render.js; data/cutscenes.js.
- Automated evidence: v10 assets; v7/v9 campaign progression.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.

## 26. Where the fuck is Marty going?!? This is jank.

- Interpretation / implementation: Rescue targets actual father position plus 70 units, decelerates, stops and faces him; cart remains anchored.
- Files: app.js; data/cutscenes.js.
- Automated evidence: presentation browser; both-route ending/campaign checks.
- Manual evidence: source and extracted action sheets reviewed where applicable; runtime screenshots reviewed for opening, dialogue, pursuit, cinema, radio, Broadcast and reunion. No physical-phone observation claimed.
- Disposition: PASS — cited behavior checks passed in the validated source; physical-device boundary above.
