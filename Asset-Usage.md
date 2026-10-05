# Asset usage / v4 motion and district score

The original v3 action libraries are retained. The baseline mapping is preserved in production/v3-Asset-Usage-BASELINE.md as historical documentation; new gameplay mappings below supersede its old jump/air-kick, entry and ending triggers. Original-source review flags remain visible rather than silently reclassifying every old pose as clean.

## New animation selections

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

## Counts

| Bank | Runtime states | Frame references |
|---|---:|---:|
| hero | 59 | 1028 |
| bear | 10 | 138 |
| hippo | 8 | 123 |
| sherm-punch | 9 | 129 |
| sherm-shove | 7 | 101 |
| sherm-slam | 9 | 145 |
| striped | 9 | 121 |
| raptor | 9 | 143 |
| franklin | 33 | 378 |

Total: 153 states, 2,306 frame references, 2,143 packed rectangles, 13 atlas pages. The hero retains 50 original source tracks / 943 source entries plus original and new derivatives. All 13 existing combat cues and the original title/portrait/theme bytes remain unchanged.

## Music

Title/results use recording (3); Broadway uses (1), subway (5), rooftop (2), theater (4). Recordings retain their full source bytes and vocals. Level changes use 0.9-second crossfades. See assets/music-map.json for complete names, hashes, lengths and runtime files.

## Rendering and staging

Source clips provide poses only; game physics supplies world height and travel. Late enemy landing/ready poses are used after off-screen entry or masked sewer emergence. Franklin walks in, points and enters guard. Franklin-player final boss is the existing Slam Shermometer; Jay's boss and no-death Stage 4 unlock condition stay Franklin. Existing dances are exposed in the stage-clear and ending canvases. No VHS prop interaction or new voice recording is invented.
