# THE CRITIC: COMING ATTRACTIONS / asset usage

Current runtime: 14 banks, 189 animation states, 2,811 frame references, 2,626 unique packed rectangles and 22 atlas pages, as recorded in `assets/sprites.json`. Nine original banks retain all 153 states and 2,306 frame references. Five supplied-media banks add 36 states and 505 references. The cinema circuit defender aliases the existing Shermometer v3 bank; the final broadcast machine uses authored renderer geometry rather than another sprite bank.

The campaign has seven districts, 21 ordinary encounters, 66 ordinary spawns and four boss encounters. Shermometers provide 53 ordinary spawns. The first four districts retain the established 39 spawns. See [docs/CONTENT.md](docs/CONTENT.md) and [docs/STORY-CANON.md](docs/STORY-CANON.md).

The original v3 action libraries are retained. The baseline mapping is preserved in production/v3-Asset-Usage-BASELINE.md as historical documentation; new gameplay mappings below supersede its old jump/air-kick, entry and ending triggers. Original-source review flags remain visible rather than silently reclassifying every old pose as clean.

## Retained v4 animation selections

| Bank | New state | Frames | Source | Registration |
|---|---|---:|---|---|
| hero | jump-start-v4 | 8 | `3b1c223f-fd02-4420-9088-b637decbadcf.mp4`, f38-52 | ground |
| hero | rise-v4 | 11 | `3b1c223f-fd02-4420-9088-b637decbadcf.mp4`, f54-74 | air |
| hero | apex-v4 | 12 | `3b1c223f-fd02-4420-9088-b637decbadcf.mp4`, f76-98 | air |
| hero | fall-v4 | 11 | `3b1c223f-fd02-4420-9088-b637decbadcf.mp4`, f104-124 | air |
| hero | land-v4 | 13 | `3b1c223f-fd02-4420-9088-b637decbadcf.mp4`, f126-150 | landing |
| hero | air-kick-v4 | 17 | `2d140dee-e69a-4cdc-8e97-45335b64207f (1).mp4`, f103-119 | air |
| sherm-punch | arrival-v4 | 14 | `4c6d7f8b-4368-4b41-8ed4-7232da76b7d4.mp4`, f54-80 | landing |
| raptor | arrival-v4 | 16 | `13c4f1d7-1f80-4f6d-9380-ddba01a03770.mp4`, f38-68 | landing |
| hippo | arrival-v4 | 13 | `21f910f5-9180-4636-81a7-db74ff2541ee.mp4`, f61-85 | landing |
| bear | arrival-v4 | 14 | `6a8f55d3-9c92-4b35-ad10-87b6873edb0d.mp4`, f42-68 | landing |
| striped | arrival-v4 | 10 | `Character_spawn_pixel_art_animation_20261005143856.mp4`, f42-60 | ground |

The two other Shermometer banks reference the same 14 entrance frames. This produces 13 additional states, not 13 independently filmed performances. The original standalone character videos and archives remain unchanged. The duplicate kick upload adds no unique take. Incomplete drawing-in and tiny-to-large openings are not gameplay assets. The old hero jump/held front kick remain in the viewer while reviewed derivatives supply the primary jump and air attack. The jump-start take is retained for review/phase availability; immediate jump physics is not delayed to play its full windup.

## Cleanup and retention

Franklin: 34 runtime crop rectangles receive a constrained saturated-magenta negative-space mask. All other decoded pixels, including transparency, are preserved. Skin, red sash, glasses and hair are retained. No old bald Elder graphics are restored. The separate full-resolution package patches 37 PNG entries including repeated/anchor entries.

Original non-Franklin crop pixels, track durations, source frame order and original offsets are preserved. Contact metadata is appended, not baked a second time. Settled death support and shadow corrections happen at rendering. New video crops use one fixed scale per take and lossless alpha/RGB atlas encoding after initial resizing.

## Current runtime counts

| Canonical name / bank | Runtime states | Frame references | Use |
|---|---:|---:|---|
| Jay Sherman / `hero` | 59 | 1028 | Starting player, personality, reactions and celebrations |
| Accordion Bear / `bear` | 10 | 138 | Occasional ordinary opponent |
| Green Hippo / `hippo` | 8 | 123 | Occasional heavy opponent |
| Shermometer v1 / `sherm-punch` | 9 | 129 | Recurring ordinary opponent |
| Shermometer v2 / `sherm-shove` | 7 | 101 | Recurring ordinary opponent |
| Shermometer v3 / `sherm-slam` | 9 | 145 | Ordinary opponent, Franklin-route stage-4 finale, cinema defender alias |
| Fred K / `striped` | 9 | 121 | Occasional guest opponent |
| JP Raptor Esq / `raptor` | 9 | 143 | Occasional reach-pressure opponent |
| Franklin / `franklin` | 33 | 378 | Brown-haired stage-4 boss and unlockable player |
| Pizzeria Headliner / `pizzeria-boss` | 8 | 105 | Supplied cream-scarf male boss; temporary proper name |
| Marty Sherman / `marty` | 11 | 187 | Story/rescue context only; unique supplied Red Pullover performances retained |
| Duke Phillips / `duke` | 10 | 156 | Antagonist context only; supplied Blue Polo performances retained |
| Turkey Dinner / `turkey-dinner` | 3 | 17 | Immediate large health pickup; additional source states retained |
| Trash Can / `trash-can` | 4 | 40 | Breakable prop with dent and break performances |

Total: 189 states, 2,811 frame references, 2,626 packed rectangles, 22 atlas pages. Original pages 00–12 remain intact; added pages 13–21 hold the supplied new banks. The hero retains 50 original source tracks / 943 source entries plus original and new derivatives. All 13 existing combat cues and the original title/portrait/theme bytes remain unchanged. Counts describe retained runtime availability, not a requirement to force every performance into ordinary combat.

## Added supplied performances and identity checks

`production/new-assets.json` records source archive names, hashes, source entity IDs, fixed bank scale, retained actions and limitations. The Pizzeria Headliner uses Cream Scarf material and the matching supplied male video. Its `attack`, `opposite-strike` and `guard-reset` poses supply the authored one-two, rush, counter and telegraphs. `opposite-strike` has `canonicalFacing: -1`, so its original leftward motion renders consistently with the gameplay attack direction. No independent hurt performance was supplied; its short reaction falls back to idle.

Red Pullover was verified as Marty Sherman and Blue Polo as Duke Phillips. Their original action libraries are retained for context and gallery use, but neither is spawned as an ordinary enemy or physical boss. Marty appears in the final protected rescue space. Duke operates the final machine; the game does not turn him into a monster. `booth-enforcer` is an internal set-piece ID mapped to the already retained `sherm-slam` artwork and named Shermometer v3 in play.

Turkey Dinner and Trash Can are imported from the supplied Sprite Forge archives. Turkey Dinner restores up to 46 health immediately; Coffee retains its 18-health behavior. Trash Can replaces the external Bin name while old `bin` references remain compatible. New crop processing uses one scale per bank, grounded registration and constrained removal of chroma-background edges. Existing source review labels and interesting unassigned actions remain available.

## Music

| Context | Supplied arrangement | Runtime recording |
|---|---|---|
| Title / final results | (3) | `theme.mp3` |
| Broadway Blocks / Little Italy | (1) | `music-broadway.mp3` |
| Last Train Uptown | (5) | `music-uptown.mp3` |
| Above the Avenue / Broadcast Tower | (2) | `music-rooftops.mp3` |
| Theater District / Palace Cinema | (4) | `music-theater.mp3` |

Recordings retain their full source bytes and vocals. No new music or voice recording is claimed. Level changes use 0.9-second crossfades. Separate music/effects levels, hit ducking, mute and pause remain. See `assets/music-map.json` for complete names, hashes, lengths and runtime files.

## Scene and environment art

Six generated 16:9 compositions fill actual production gaps: studio confrontation, broadcast rupture, rescue aftermath, Palace Cinema, pizzeria streetscape and broadcast interior. Optimized files are in `assets/cutscenes/` and `assets/environments/`; `data/cutscenes.js` assembles opening, district, boss and ending beats with dialogue rendered by the game. `production/cutscene-art.json` records generation prompts and provenance. The projection woman’s shadow/clear portraits and the male boss portrait in `assets/story/` derive from supplied references rather than new character redesigns.

Interactive circuits, floor warnings, moving projectiles, breakables, pickups and the final machine remain independently rendered elements. Theater seating frames the fight aisle instead of covering the combat lane. Duke and Marty use their contextual banks above the final arena. Missing optional environment art leaves authored geometry visible, while required atlas loading holds gameplay on a recoverable loading screen.

## Rendering and staging

Source clips provide poses only; game physics supplies world height and travel. Late enemy landing/ready poses are used after off-screen entry or masked sewer emergence. Franklin walks in, points and enters guard. Playable Franklin’s stage-4 opponent is Shermometer v3; Jay faces Franklin and can earn the established no-death stage-4 unlock. Both routes continue through the cinema, male boss and final broadcast confrontation. Existing dances are exposed in the stage-clear and ending canvases.

The loader preserves the shared original atlas pages and loads added player/stage/prop/boss dependencies before play; new optional gallery banks load when selected. Unique performances are retained rather than discarded to reduce the initial load. Source archives and raw videos are not required in the published runtime.
