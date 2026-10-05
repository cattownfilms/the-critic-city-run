# Asset usage / Franklin Demo v3

All 50 original hero tracks and 943 entries remain, with unchanged timing and root offsets. The five supplied new enemy banks are fully retained, and the old Elder bank is fully replaced by new Franklin artwork. Runtime atlas packing discards unreferenced old pixels before repacking.

## Cast coverage

| Bank | Original/source tracks | Source frame entries | Gameplay |
|---|---:|---:|---|
| Main hero | 50 | 943 | Unchanged v2 animation triggers; three existing airborne derivatives also retained. |
| Accordion Bear | 6 | 93 | Ordinary occasional enemy; three existing video variants also retained. |
| Green Hippo | 6 | 88 | Ordinary occasional heavy; existing double-punch video variant retained. |
| Shermometer Punch | 8 | 115 | Main enemy; punch/swat attacks and alternate fall. |
| Shermometer Shove | 6 | 87 | Main enemy; shove attack. |
| Shermometer Slam | 8 | 131 | Main heavy; normal/overhead slam and alternate spill collapse. |
| Striped Claw | 8 | 111 | Occasional claw enemy. Source jump/land also available in gallery. |
| Snooty Pipe Raptor | 8 | 127 | Occasional guest; regular/jaw sweep and alternate defeat. |
| Franklin | 33 | 378 | Stage-4 capstone boss, then unlockable player. Derived tracks included in count. |

Total: 140 runtime states, 2,139 frame references, 2,004 unique crops, 12 atlas pages. The 29 Shermometers make up 74.4% of regular enemy spawns. Source-library retention is distinct from a guarantee that every frame appears in a normal playthrough.

## Hero: all 50 original tracks

Every row is available in the Animation Room in addition to the trigger described below. Cosmetic gestures are interruptible. Retaining REVIEW labels is not the same as declaring the original source defects fixed.

| Source action | Frames | In-game use |
|---|---:|---|
| Idle | 18 | Normal resting state and title background. |
| Walk | 24 | Low-to-medium analog movement, including depth changes. |
| Run | 18 | Outer joypad deflection; hysteresis prevents walk/run flicker. |
| Jump | 32 | Full original sequence retained in Animation Room; Rise/Apex/Fall derivatives supply gameplay poses, with one physics-driven jump arc. |
| Landing | 10 | Short landing compression after the physics jump. |
| Standing Punch | 20 | Standing punch used as the contact/recovery performance of a running rush punch. |
| Hurt / Flinch | 24 | Taking a hit; interrupts actions and grants a brief invulnerability window. |
| Defeat / Collapse [REVIEW] | 29 | Losing all health; collapse, final hold, then checkpoint retry or game over. Original REVIEW flag retained. |
| Anxious Foot Fidget | 19 | Interruptible safe-street idle variation. |
| Double Take | 18 | Enemy encounter entrance and occasional safe idle. |
| Knee and Shoulder Bounce | 26 | Interruptible safe idle. |
| Sweater-Vest Adjustment | 18 | Start, some block-clear moments, and safe idle. |
| Heel-Toe Shuffle | 19 | Interruptible safe idle. |
| Long Sigh | 23 | Low-health safe-street idle. |
| Impatient Toe Tap | 20 | Interruptible waiting variation. |
| Head Scratch | 21 | Interruptible safe idle. |
| Shoulder and Neck Release | 30 | Entering later districts and safe idle. |
| Balance Wobble | 17 | Interruptible safe idle. |
| Cautious Lean and Peek | 20 | Interruptible safe idle. |
| Shiver and Settle | 21 | Safe idle; more common in the subway. |
| Awkward Dance / Entry [REVIEW] | 16 | Campaign-completion background, then the dance loop. REVIEW flag retained. |
| Awkward Dance / Loop [REVIEW] | 32 | Campaign-completion background. REVIEW flag retained. |
| Charge / Approach | 20 | Short physical preparation before the running rush punch. |
| Belly Bash / Impact and Recovery [REVIEW] | 26 | Animation Room only. Retained, not forced into combat because the source exaggerates the character silhouette. |
| Startled Hop [REVIEW] | 18 | Elite encounter arrival reaction when not already under immediate threat. REVIEW flag retained; interruptible. |
| Panic Tremble | 6 | Low-health resting state. |
| Panic / Settle | 12 | Low-health safe idle variation. |
| Disgusted Grimace | 14 | Subway idle reaction. |
| Nose Pinch | 16 | Subway entrance and subway idle. |
| Wave Off and Lower Hand | 14 | Final block clear and subway idle variation. |
| Grumpy Idle / Blink | 32 | Mid-low-health resting state. |
| Fighting Guard / Entry | 12 | Automatic, interruptible transition when enemies are nearby. |
| Fighting Guard / Bounce | 22 | Ready bounce while enemies are nearby and no input is active. |
| Jab | 6 | First link of the four-hit chain; clean variant on a miss. |
| Cross | 12 | Second link of the chain; clean variant on a miss. |
| Front Kick | 32 | Third combo link, with its extended-foot pose aligned to the active hit phase. |
| Ducking Evade | 14 | Moving GUARD creates a short evasive slip. |
| Rising Elbow / Forearm | 22 | HIT from guard or after entering a slip. |
| Held Front Kick | 19 | Jump attack. Playback is retimed to extend the foot at the active hit window, hold briefly, then recover before landing. |
| High Block | 16 | Initial timed guard/parry interval. |
| Mid Guard / Block Set | 22 | Sustained frontal guard. |
| Palm Strike | 26 | Fourth combo link, a knockback finisher. |
| Jab / Impact Variant [REVIEW] | 6 | Hit-confirmed first combo link. Original REVIEW flag retained. |
| Cross / Impact Variant [REVIEW] | 10 | Hit-confirmed second combo link. Original REVIEW flag retained. |
| Spinning Backfist / Turning Strike [REVIEW] | 19 | Opening crowd strike of a fully charged REVIEW attack. Original REVIEW flag retained. |
| Low Finisher Windup | 9 | Brief chamber between the two REVIEW strikes. |
| Rising Palm / Impact [REVIEW] | 9 | REVIEW finisher. Original REVIEW flag retained. |
| Lead Palm / Impact [REVIEW] | 10 | First palm counter after a successful parry. Original REVIEW flag retained. |
| Rear Palm / Finisher [REVIEW] | 18 | Second, stronger parry-counter palm. Original REVIEW flag retained. |
| Exerted Guard / Recovery | 26 | Brief recovery after strong finishers, then normal input takes over. |


## Franklin gameplay mappings

The player logic and hit timing remain shared with the main character. Only the visual animation mapping changes. Full original performances and derived phases remain available in the Animation Room.

| Trigger | New Franklin art |
|---|---|
| Idle / walk / run | New breathing and locomotion loops. |
| Jump / apex / fall / landing | New physical jump phases; runtime elevation corrected to avoid double movement. |
| Combo links 1-3 | Jab, cross and front kick. |
| Combo finisher | New power punch, mirrored as a whole take toward canonical facing. |
| Air attack | New held front-kick pose. |
| Guard / parry | New fighting-guard entry and guard. |
| Dodge / dodge strike | Low dodge phase and rear punch. |
| Parry counter | Lead punch into rear punch. |
| Rush entry / strike | Run into the one-two attack performance. |
| Review | Spinning kick, slam windup, ground-slam impact. |
| Damage / defeat | New flinch and collapse, final hold. |
| Contextual gestures / celebration | Finger-point taunt, arms-up pose and dance; interruptible as before. |
| Boss special repertoire | One-two, front kick, spinning kick, full leap/slam and power punch, each with an explicit telegraph. |

`production/Franklin-Source-Map.json` gives exact source clip/frame selections and transforms. No old `1000085623` animation frames contribute to Franklin. All of his graphics come from `1000085687`, `1000085688` and `1000085689`.

## Encoding and provenance

The hero, Bear and Hippo's 1,154 decoded crops were checked pixel-for-pixel after lossless repacking. New source PNG/video crops are scaled once per identity and encoded as WebP quality 93 with lossless alpha for the runtime. This is not a claim that the new runtime RGB pixels match original full-resolution PNG bytes. The separate Franklin Sprite Forge package retains full-resolution PNGs.

Every runtime frame is covered by `assets/source-map.json`. Original title/score and 13 source-derived audio cues are unchanged. Historical audio filenames `elder-strike`/`elder-hit` remain sound cues only; no old bald Elder atlas images, menu banks or sprite actions remain.
