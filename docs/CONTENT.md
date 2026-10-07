# THE CRITIC: COMING ATTRACTIONS

This is the authored content implemented by `data/campaign.js`, `engine.js`, `render.js` and `data/cutscenes.js`. It documents the current source build; release and public deployment validation are recorded separately.

## Campaign structure

Seven districts contain 21 ordinary fights, 66 ordinary enemy spawns and four boss encounters. Shermometers account for 53 ordinary spawns. The first four districts retain their original 12 wave arrays and 39 spawns exactly. Jay’s attack constants, four-link combo, jump physics, analog movement, guard, parry, dodge and Review sequence remain the accepted baseline.

Every district uses a 2,860-unit scrolling arena with walkable depth from y=350 to y=465. Fights lock the camera’s movement corridor at three authored gates, x=520, 1,380 and 2,280. Defeating a wave opens the corridor, grants ten health and saves its checkpoint. The player proceeds right to the exit. Between districts the selected character celebrates; Continue is available after 0.4 seconds, and the screen advances automatically after four seconds. Entering the next district restores up to 25 health.

Ordinary enemies arrive from beyond the viewport and become targetable during their entrance. Alternating Shermometer entrances use masked sewer emergence outside the rooftop district. Bosses walk into the final encounter before their ready beat. Foreground items and actors sort by their ground position; backgrounds and seating leave the combat plane clear.

## Authored districts

| Stage | Purpose and visual identity | Fight rhythm and enemy mix | Finale and exit | Music |
|---|---|---|---|---|
| 1. Broadway Blocks | Pursue Duke through recognisable New York. Neon shops, coffee signs, brickwork, skyline and sidewalk courses establish the city before contamination escalates. | Two Shermometer v1 arrivals teach spacing; mixed v1/v2 groups introduce Accordion Bear, then Fred K. Eight ordinary enemies, six Shermometers. | Three street fights; leave right for the uptown subway. | Broadway Mix, arrangement (1) |
| 2. Last Train Uptown | Follow Marty’s shouted lead. Subway columns, station tile, platform signs and an under-avenue palette keep depth readable. | v1/v2/v3 combinations; JP Raptor Esq in the middle fight and Green Hippo in the last. Ten ordinary enemies, eight Shermometers. | Finish the platform encounters and proceed toward the rooftops. | Uptown Mix, arrangement (5) |
| 3. Above the Avenue | Follow the broadcasting signal across the rooftops. A night skyline, antennas, roof structures and warm window light distinguish the route. | Fred K, Accordion Bear and JP Raptor Esq appear once each among mixed Shermometer waves. Ten ordinary enemies, seven Shermometers. Ordinary entrances use off-screen walks here. | Cross three rooftop fights and reach the premiere district. | Rooftop Mix, arrangement (2) |
| 4. Theater District | Reach the premiere and get Franklin’s lead through the theater. Marquee lights, theater doors, red carpet and city architecture preserve the established level. | Eleven ordinary enemies, eight Shermometers; Green Hippo, Fred K and JP Raptor Esq supply occasional pattern changes. Franklin arrives after the last ordinary wave. | Jay defeats brown-haired Franklin; playable Franklin instead faces Shermometer v3. A death-free Jay attempt awards Franklin at this exit, then the campaign continues to Palace Cinema. | Premiere Mix, arrangement (4) |
| 5. Palace Cinema | Cross the infected auditorium and shut down its projection booth. Generated auditorium art, an authored screen, rear seating, foreground seat backs, blue projection light and three elevated booth windows frame an empty fighting aisle. | Nine ordinary enemies, eight Shermometers; Accordion Bear is the single guest. The projection-window woman appears during fights, marks a fixed floor target, then throws a visible film reel. | A Shermometer v3 guards three circuit cabinets during the final confrontation. Defeat it and break every circuit to stop the woman’s attacks and open the service exit to Little Italy. Marty identifies the broadcast building. | Premiere Mix, arrangement (4) |
| 6. Little Italy | Follow Duke’s service route past the pizzeria. Illustrated storefronts, striped awnings, warm brickwork and an open sidewalk supply the supplied male boss’s stage context. | Nine ordinary enemies, eight Shermometers; JP Raptor Esq appears in the middle fight. Three short fights lead to the boss’s portrait and physical entrance. | Defeat the Pizzeria Headliner, then leave right for the broadcast tower. | Broadway Mix, arrangement (1) |
| 7. Broadcast Tower | Reach Marty and stop Duke’s experimental system. Monitor walls, cables, media equipment, cold lighting and an elevated protected Duke/Marty mezzanine make the rescue objective visible. | Nine ordinary enemies, eight Shermometers; Green Hippo is the middle-wave guest. The last ordinary fight precedes Duke’s stationary transmitter. | Destroy the transmitter, proceed right to Marty, then view the rescue and resolution ending. | Rooftop Mix, arrangement (2) |

All districts place a Trash Can at x=900/y=445, a Box at x=1,810/y=445 and a Box at x=2,540/y=354. These objects use the established immediate break-and-collect interaction. The middle Box drops Turkey Dinner in stages 5–7; other ordinary prop drops are Coffee. Interactive props remain separate from environment artwork.

## Regular enemy grammar

Names are canonical; legacy IDs retain compatibility. Speed is world units per second. Windup precedes the active attack; hit time is measured from the start of the attack after its windup.

| Enemy / legacy ID | HP / speed | Preferred attack spacing | Windup / active duration / hit time | Damage and role |
|---|---|---|---|---|
| Shermometer v1 / `sherm-punch` | 45 / 136 | 62 units | 0.45 / 0.41 / 0.17 s | 9; fast, frequent pressure using alternating swats. |
| Shermometer v2 / `sherm-shove` | 56 / 99 | 80 units | 0.56 / 0.52 / 0.23 s | 11; steadier close pressure with longer reach. |
| Shermometer v3 / `sherm-slam` | 94 / 76 | 93 units | 0.70 / 0.58 / 0.24 s | 16; slow heavy pressure with a wider depth hit area and alternate overhead slam. |
| Accordion Bear / `bear` | 56 / 95 | 80 units | 0.53 / 0.52 / 0.23 s | 11; rotates swipe, overhead and backhand source performances among its attacks. |
| Green Hippo / `hippo` | 102 / 74 | 93 units | 0.68 / 0.58 / 0.24 s | 17; heavy lane pressure using punch and double-punch variants. |
| Fred K / `striped` | 56 / 134 | 71 units | 0.48 / 0.47 / 0.20 s | 11; faster guest that changes approach rhythm. |
| JP Raptor Esq / `raptor` | 72 / 103 | 92 units | 0.61 / 0.55 / 0.24 s | 13; reach pressure with an alternate jaw sweep. |

Enemies seek the player’s depth lane and stop short of their full reach. Early stages allow one committed attacker at a time; stage 3 onward allow two. Other attackers space themselves instead of piling directly onto the player. Ordinary recovery lasts at least 0.34 seconds, followed by a cooldown. Visible windup markers support stepping into another depth lane, guarding frontally, timing a parry, jumping or slipping with MOVE + GUARD. Accepted knockback, hurt states and defeat performances remain in use. Green Hippo and ordinary Shermometer v3 defeats drop Coffee.

## Boss and hazard counterplay

| Confrontation | Attacks and warning | Recovery / counterplay | Consequence |
|---|---|---|---|
| Franklin, stage 4 | 420 HP. ONE-TWO, FRONT KICK, SPIN KICK, LEAP / SLAM and POWER PUNCH retain their 0.60–0.78-second windups and existing physical patterns. | Existing approximately 0.48-second recovery, lane alignment, knockback and hurt interruption remain unchanged. Guard, parry and slip use the accepted combat rules. | Exit after defeat. Jay’s death-free stage-4 attempt unlocks Franklin once. |
| Franklin route’s stage-4 Shermometer v3 | 420 HP, using the established SLAM / OVERHEAD SLAM alternation with 0.70 / 0.82-second windups. | Existing stage-4 boss behavior and recoveries. | Preserves the challenge without Franklin fighting himself. |
| Projection-window woman, stage 5 | A booth window lights up after a 2.6-second interval. A floor marker locks to the player’s current x/y for 1.1 seconds; the visible reel then flies for 0.65 seconds. It deals 9 damage within 32 horizontal units and 26 depth units of that fixed target. | Move off the marker, change lane, jump or slip before impact. The target does not chase the player after warning. The woman recovers briefly, disappears and rotates windows. | Break all three 45-HP circuit cabinets to cancel active reels and stop further appearances. Cabinets are at x/y=2,110/354, 2,310/414 and 2,530/452. |
| Cinema Shermometer v3, internal `booth-enforcer` | 280 HP. AISLE RUSH warns for 0.85 seconds before a short advancing slam; OVERHEAD SLAM warns for 0.90 seconds before a broader close impact. Uses the existing v3 sprite bank. | 0.85 / 1.05-second recovery. Depth movement separates the rush from the broader slam. A circuit can be attacked while the defender recovers. | Both defender defeat and complete circuit shutdown are required; neither alone opens the exit. |
| Pizzeria Headliner, internal `pizzeria-boss` | 330 HP. GUARDED ONE-TWO warns for 0.72 seconds; SIDEWALK RUSH for 0.85 seconds; HEAVY COUNTER for 0.95 seconds. Uses the supplied cream-scarf fighter’s ready, lunge and opposite-strike performances. | 0.85-second recovery, or 1.05 seconds after the heavy counter. Frontal light hits during guarded windup deal 55% damage; stronger finishing strikes or another approach avoid that reduction. Light hits do not cancel committed attacks; heavy knockback can interrupt them. Native leftward strike art is normalized through `canonicalFacing`. | Defeat clears Duke’s service route. Proper name remains unconfirmed and is deliberately temporary. |
| Duke’s Broadcast System, internal `broadcast-rig` | 460 HP, stationary at x=2,450/y=409. SWEEPING SIGNAL locks a marked depth strip after a 1.12-second warning. STATIC BURST locks a 67-unit spot after 1.18 seconds. LIVE FEED locks a 44-unit target after 1.02 seconds, then launches a visible signal projectile. | Move out of the locked warning, then attack the machine during its 1.30-second recovery; LIVE FEED exposes 1.55 seconds. Committed windup/attack states receive 35% damage and resist interruption; recovery receives full damage. Existing guard, parry, jump and dodge safety also apply. | Defeat stops its shots. Reaching the final exit marks Marty rescued and the broadcast stopped, then runs the ending. Duke remains a human antagonist operating a machine. |

## Items, saves and presentation

Coffee immediately restores up to 18 health and eight Review meter; Turkey Dinner restores up to 46 health and twelve meter. Neither enters an inventory. Trash Can replaces the redundant external Bin name; internal `bin` remains a supported alias. Box retains its existing behavior. Circuit cabinets drop no health item.

`data/campaign.js` defines stages, waves, canonical enemy data, new boss moves, props and items. `data/cutscenes.js` defines the 15 scenes and 45 staged beats; `cutscenes.js` supplies their reusable image/sprite/dialogue player. Generated scene and environment images are in `assets/cutscenes/` and `assets/environments/`; supplied portraits are in `assets/story/`. See [STORY-CANON.md](STORY-CANON.md) and [Asset-Usage.md](../Asset-Usage.md).

Save schema 4 keeps the existing storage keys, profile unlocks, selected player, stage/gate checkpoint, score, lives, Review meter, per-stage deaths, stage-4 eligibility and story flags. Schema 2/3 checkpoints migrate; an old completed four-stage save resumes at Palace Cinema. A cinema save after defender defeat restores the remaining circuits without duplicating its boss. Settings and controller mappings remain in their established stores.

All music uses the five supplied recordings; no new soundtrack recording is claimed. Title and final results use arrangement (3). Stage changes preserve the existing 0.9-second crossfade, separate music/effects volume, ducking, mute and pause. New banks load for their required district; original shared atlas pages and retained gallery performances are preserved.
