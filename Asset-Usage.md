# THE CRITIC: COMING ATTRACTIONS / asset usage

Current runtime: 15 banks, 219 body animation states, 3,379 frame references, 2,979 unique packed rectangles and 85 dependency atlas pages, as recorded in `assets/sprites.json`. The 193 v7 source actions remain available, including explicit legacy aliases for repaired facing metadata and the replaced generated cartwheel. The 75 v7 dependency atlas pages remain unchanged. Forty-seven portrait WebPs support seven speakers separately from body-animation counts. The cream-scarf Violent Austrian Rabbi retains the internal `pizzeria-boss` bank; Spike has a new supplied-performance bank. The transmitter uses authored geometry and the final Duke fight uses his retained bank.

The campaign has seven districts, 21 ordinary encounters, 66 ordinary spawns and five boss encounters. Shermometers provide 53 ordinary spawns. The first four districts retain the established 39 spawns. See [docs/CONTENT.md](docs/CONTENT.md) and [docs/STORY-CANON.md](docs/STORY-CANON.md).

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
| Shermometer v1 / `sherm-punch` | 10 | 145 | Recurring ordinary opponent; original swat metadata retained as a source alias |
| Shermometer v2 / `sherm-shove` | 7 | 101 | Recurring ordinary opponent |
| Shermometer v3 / `sherm-slam` | 9 | 145 | Ordinary opponent and Franklin-route stage-4 finale |
| Fred K / `striped` | 9 | 121 | Occasional guest opponent |
| JP Raptor Esq / `raptor` | 9 | 143 | Occasional reach-pressure opponent |
| Franklin / `franklin` | 42 | 511 | Brown-haired stage-4 boss, unlockable player, supplied cartwheel and original metadata/performance aliases |
| Violent Austrian Rabbi / `pizzeria-boss` | 12 | 171 | Supplied cream-scarf cinema boss; user-approved proper name, new screen poses and retained grounded bank |
| Marty Sherman / `marty` | 14 | 219 | Story/rescue context; all supplied Red Pullover performances retained, including scared/trapped actions |
| Duke Phillips / `duke` | 10 | 156 | Antagonist, moving cage scenes and final physical boss; supplied Blue Polo performances retained |
| Turkey Dinner / `turkey-dinner` | 3 | 17 | Immediate large health pickup; additional source states retained |
| Trash Can / `trash-can` | 5 | 45 | Breakable prop and detached thrown-can rotation poses |
| Spike / `spike` | 12 | 316 | Supplied African American Little Italy boss; locomotion, attacks, throw, reactions and grounded defeat |

Total: 219 states, 3,379 frame references, 2,979 packed rectangles and 85 dependency atlas pages. Source aliases account for references to existing crops rather than duplicate image rectangles. Historical v6 atlas files remain intact in the repository; the runtime bulk loads the current dependency pages without decoding those duplicate historical pages. The hero retains 50 original source tracks / 943 source entries plus retained derivatives. All 13 existing combat cues, five music recordings and original title bytes remain unchanged. Counts describe retained availability, not a requirement to assign every performance to ordinary combat.

## Added supplied performances and identity checks

`production/new-assets.json` records the earlier supplied source archives. `production/v8-assets.json` and `assets/source-map.json` record the new supplied clips, hashes, fixed scale, sampled frame indices, registration, source aliases and limitations. The Violent Austrian Rabbi uses Cream Scarf material and matching supplied male videos. Its grounded `attack`, `opposite-strike` and `guard-reset` poses supply the authored one-two, rush, counter and telegraphs. New `screen-guard`, `screen-taunt` and `screen-punch` poses retain useful upper-body performances from the foot-clipped capture. No independent hurt performance was supplied; its short reaction falls back to idle.

Franklin's new `cartwheel-run` samples 26 chronological frames from the preferred supplied clip at a fixed 196-pixel reference body height. Its strongest lateral pose is source fraction 11/26, retimed to the established running-attack contact instead of delaying game physics for the clip. The generated six-pose action remains as `legacy-source-cartwheel-run`; the fuller supplied performance is also available as `cartwheel-source-v8`. Spike's locomotion, punch, reaction, defeat and trash-can lift/release actions use one bank-wide scale and ground registration. His first detached can occurs at source frame 55; sampled throw contact is fraction 7/19. Five fully detached can poses are retained in `trash-can/thrown`. The measured release center is +121.8397 horizontal / −126.3763 vertical in bank pixels. The projectile applies Spike's fixed 1.08 render scale, giving a world-space source offset of +131.5869 / −136.4864 and matching the separately rendered can.

The [direction audit](production/v8-direction-audit.md) covers all 193 original actions. Verified native-left actions and mixed-direction frames declare `canonicalFacing:-1`; individual frame direction overrides action direction. The renderer mirrors the complete registered crop and horizontal offset, including its shadow. Original pixel data, timing and registration are retained through explicit source aliases. Same-frame legacy aliases display with their active counterpart's audited facing; the archived six-pose cartwheel retains its own performance direction. Marty's idle/walk/run artwork is already right-facing; his leftward ending run requires scene direction rather than resampling the source.

Red Pullover was verified as Marty Sherman and Blue Polo as Duke Phillips. Their original action libraries are retained for context and gallery use. Marty remains the protected rescue objective. Duke operates the final machine and then fights personally using his retained physical performances; the game does not turn him into a monster. The previous `booth-enforcer` content remains historical; the active cinema boss uses the retained cream-scarf bank.

Turkey Dinner and Trash Can are imported from the supplied Sprite Forge archives. Turkey Dinner restores up to 46 health immediately; Coffee retains its 18-health behavior. Trash Can replaces the external Bin name while old `bin` references remain compatible. New crop processing uses one scale per bank, grounded registration and constrained removal of chroma-background edges. Existing source review labels and interesting unassigned actions remain available.

## Music

| Context | Supplied arrangement | Runtime recording |
|---|---|---|
| Title / final results | (3) | `theme.mp3` |
| Broadway / Little Italy | (1) | `music-broadway.mp3` |
| Last Train Uptown | (5) | `music-uptown.mp3` |
| Above the Avenue / Broadcast Tower | (2) | `music-rooftops.mp3` |
| Theater District / Palace Cinema | (4) | `music-theater.mp3` |

Recordings retain their full source bytes and vocals. No new music or voice recording is claimed. Level changes use 0.9-second crossfades. Separate music/effects levels, hit ducking, mute and pause remain. See `assets/music-map.json` for complete names, hashes, lengths and runtime files.

## Scene and environment art

The retained v7 scenes replace the earlier illustrated cutscenes with native pixel composition and moving sprites. Generated gaps were the empty studio, seated Jay, canonical projectionist pixel bust, Jay shock/disgust and Marty fear portraits, and six Franklin cartwheel keyposes. The generated cartwheel now remains as an optional source alias, while the supplied preferred clip drives gameplay. Spike's neutral/talk portrait comes from his supplied performance. `production/presentation-art-v7.json`, `production/v7-assets.json` and `production/v8-assets.json` record public provenance and hashes; private assignment prompts are excluded. Earlier illustrations remain historical source assets and are excluded from the offline runtime when unused.

Interactive circuits, floor warnings, moving projectiles, breakables, pickups and the final machine remain independently rendered elements. The cinema's thirteen masked projection booths share the back wall's world-camera transform and leave the fight aisle clear. Three circuit groups control booth power. Duke and Marty use their contextual banks above the final arena. Machine summons use actual Shermometer banks and visible screen entrances; shutdown dismisses the transmitted enemies without counting extra kills.

## Rendering and staging

Source clips provide poses only; game physics supplies world height and travel. Late enemy landing/ready poses are used after off-screen entry or masked sewer emergence. Franklin walks in, points and enters guard. Playable Franklin’s stage-4 opponent is Shermometer v3; Jay faces Franklin and can earn the established no-death stage-4 unlock. Both routes continue through the cinema, male boss and final broadcast confrontation. Existing dances are exposed in the stage-clear and ending canvases.

The loader bulk prepares all current runtime atlases, every portrait expression, required scene/environment imagery and audio bytes at startup. Start, Continue and all Animation Room entrances enforce complete readiness, with recoverable download failures. Subsequent scenes and stages consume cached dependencies. Browser audio activation still respects the first user gesture. Unique performances are retained rather than discarded to reduce load size. Source archives and raw videos are not required in the published runtime.
