# THE CRITIC: COMING ATTRACTIONS

This document describes the story present in the source build. `data/cutscenes.js` is the authoritative dialogue/shot manifest; `data/campaign.js` supplies district order, and `engine.js` owns progression. It does not certify a public release.

## Premise and identities

Duke Phillips needs television ratings and demands that Jay Sherman praise a terrible movie. Jay refuses. Duke has kidnapped Marty Sherman as leverage. Rather than accepting the rejection, Duke activates an enormous experimental broadcasting system. Coming Attractions become physically real and spill into New York. Jay follows Duke’s trail to rescue his son and stop the broadcast.

The escalation begins with a petty review dispute and ends with a citywide media catastrophe. Duke remains responsible and remains human. Marty is the rescue objective throughout. Franklin has a conservative connecting role at the premiere; he is not responsible for the crisis.

| Canonical identity | Runtime use |
|---|---|
| Jay Sherman | Starting playable character; `hero` bank. Concern for Marty supplies the pursuit’s emotional direction. |
| Duke Phillips | Central antagonist; supplied Blue Polo material maps to contextual `duke`, never an ordinary enemy. |
| Marty Sherman | Kidnapped son; supplied Red Pullover material maps to contextual `marty`, never a boss or ordinary enemy. |
| Franklin | Brown-haired stage-4 opponent and unlockable replay character; `franklin`. Rejected bald Elder graphics remain absent. |
| Shermometer v1 / v2 / v3 | Most frequent ordinary enemy family; compatible IDs `sherm-punch`, `sherm-shove`, `sherm-slam`. |
| Accordion Bear / Green Hippo | Occasional guest enemies; `bear` / `hippo`. |
| Fred K / JP Raptor Esq | Canonical names using retained IDs `striped` / `raptor`. |
| Projection-window woman | Supplied shadow and clear reveal establish the recurring booth presence. "Projectionist" is the current functional label; no unapproved proper identity is asserted. |
| Pizzeria Headliner | Temporary display name; stable ID `pizzeria-boss`. Uses the supplied cream-scarf, black-cap male fighter and matching video performance. Easily renamed through enemy data. |
| Duke’s Broadcast System | Final combat machine, `broadcast-rig`; Duke operates it while Marty remains visible above the arena. |

The cinema’s internal `booth-enforcer` is an existing Shermometer v3 guarding the circuits, not an invented separate character or duplicate cream-scarf boss.

## Approved opening, verbatim

DUKE:
"Ratings are low. I need you to give this a glowing review, Sherman!"

JAY:
"It Stinks!"

DUKE:
"I thought you might say that... Allow me to give you a little motivation..."

MARTY:
"Dad!"

JAY:
"Marty!"

DUKE:
"If television can't bring the audience to us, perhaps we'll just bring the television to the audience!"

Duke activates the system. Monitors and energy erupt; Coming Attractions materialize.

JAY:
"Hatchi Matchi!!!"

The implementation uses eight staged beats: Duke’s demand, Jay’s refusal, Duke’s reveal, Marty, Jay’s reaction, Duke’s activation line, a silent rupture image, and Jay’s final reaction. Dialogue is rendered by the game. Three generated 16:9 artworks supply the studio, rupture and rescue compositions; controlled crops, zoom, crossfade, flash, shake and existing sounds assemble the scene rather than requiring a pre-rendered movie. Stage 1 begins after completion or skip.

## Pursuit and resolution

| Story point | Implemented consequence |
|---|---|
| Broadway Blocks | Jay begins the pursuit in New York among the first escaped previews. |
| Last Train Uptown | Marty’s shouted lead directs Jay uptown. |
| Above the Avenue | Duke calls to Jay as the player follows the signal toward the premiere. Jay answers that he is here for his son. |
| Theater District | Marty can be heard in the theater. Jay defeats Franklin; Franklin’s concise post-fight line points through the theater. On Franklin’s replay route, Jay supplies the connecting line instead. |
| Palace Cinema | The woman first appears in shadow, then reveals her face at projection windows. Jay discovers that the booth machinery sustains her appearances. Circuit shutdown stops her attacks, and Marty calls that Duke is taking him to the broadcast building. |
| Little Italy | A short route past the pizzeria introduces the supplied male boss. His defeat clears the remaining approach to Duke’s building. |
| Broadcast Tower | Marty calls from Duke’s protected operation. Duke insists on the premiere; Marty identifies the controls, and Jay resolves to pull the plug. The transmitter’s defeat produces a signal-loss flash. |
| Final exit | Engine facts `martyRescued` and `broadcastStopped` become true. The ending reunites Jay and Marty, shows Duke’s failed premiere and states that New York regains its reality. |

The implemented ending is concise:

MARTY: "Dad!"

JAY: "Marty. Are you all right?"

MARTY: "I am now."

DUKE: "You’ve ruined my premiere!"

JAY: "It Stinks!"

Final caption: "MARTY IS SAFE. THE BROADCAST IS OFF. NEW YORK GETS ITS REALITY BACK."

The selected playable character then appears in the final celebration. Jay’s results state that Marty is safe; Franklin replay results describe his help stopping the broadcast. Already-unlocked profiles receive no second unlock announcement. Franklin’s replay shares the Jay/Marty rescue story while changing the physical protagonist and stage-4 opponent.

## Scene and flag contract

| Scene ID | Trigger |
|---|---|
| `opening` | New Game; ordinary Continue resumes its checkpoint. |
| `stage-02-intro` through `stage-07-intro` | Arrival in the next authored district. The cinema introduction also plays when continuing an old completed four-stage save. |
| `stage4-clear` | Exit from stage 4 after its boss. |
| `boss-projection-intro` | Cinema final defender/circuit confrontation. |
| `boss-projection-defeat` | All booth circuits destroyed. |
| `boss-pizzeria-intro` / `boss-pizzeria-defeat` | Male boss spawn / defeat. |
| `boss-duke-intro` / `boss-duke-defeat` | Transmitter spawn / defeat. |
| `ending` | Final district exit after transmitter defeat. |

The engine emits `{type:'story', id, stage}` for authored hooks and records those IDs in `storyFlags`. Repeated hook calls do not emit duplicate scene events. The scene player freezes combat, can queue scenes, and uses the same completion callback for watching or skipping. Scene completion stores its flag and reconciles the checkpoint’s story flags without advancing the checkpoint’s stage or gate. Ending facts are set by campaign progression, so skip/watch choices cannot bypass or duplicate rewards.

Touch offers CONTINUE, SKIP and PAUSE. Keyboard uses Enter/Space/J/X/Z to advance, Escape/Backspace to skip and P to pause. Controller confirm/attack advance, Back skips and Start pauses. Scene boundaries clear input and require held keyboard/controller controls to be released before gameplay resumes. Blur and page hiding clear stale keyboard ownership and pause the scene. A completed scene returns to its preserved gameplay, stage-clear or results state.

Save schema 4 persists story flags with unlock and checkpoint data. Stage-4 unlock remains: Jay defeats Franklin and exits without dying in that attempt. Franklin’s stage-4 opponent is always Shermometer v3. Restart Stage 4 gives a fresh attempt from its beginning; New Game retains profile unlocks while resetting campaign flags.

See [CONTENT.md](CONTENT.md) for the actual encounter/boss mechanics, [Asset-Usage.md](../Asset-Usage.md) for retained and added performances, and `production/new-assets.json` / `production/cutscene-art.json` for media provenance.
