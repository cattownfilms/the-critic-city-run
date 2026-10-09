# Six-item micro-patch

Baseline: 8035e5dfb1cae8728a290cfa735c9bad49f6ee90. Build: v11-six-20261009. Version 11.0.0 and campaign save schema 5 unchanged.

1. Duke shares the cage platform at y=305, x=2535, clear of the Receiver right-side rail. Existing background scale and sprite ground pivot remain; the button performance compensates its frame-ground offset. His later physical entrance remains authored by existing scenes.
2. Existing v10-button plays for Receiver activation and actual broadcastWave events. Its contact pose at 333 ms coincides with the event; it recovers to grounded idle. No wave intervals, enemy counts, attacks or damage changed.
3. A canvas-drawn stylized aircraft approaches the right tower, its nose contacting the existing frame-5 flash. A 0.9-second skyline hold provides approach time; original collapse frames, window pullback, reunion, final line/card and neutral results remain. No replacement media or extra explosion.
4. Creamy Scarf-Sprite Forge-sprite-sheet.zip supplies pizzeria-boss Hurt: four frames, 125 ms each, one-shot. One .25 scale preserves the baked 832px cells and (416,759.2) pivot. Existing encode pipeline writes one appended lossless page; existing Rabbi magenta-neutralization rule is applied only to this import. Original banks/atlases untouched. Source hash and frame IDs: production/rabbi-hurt.json. Existing valid-hit/protected-action/death priorities preserved; Hurt recovers after 0.5 seconds.
5. Options/Intermission contains compact Stage Select. Completed-stage IDs persist in the existing profile, independently of the campaign checkpoint. Compatible saves infer earlier completed stages; campaign completion unlocks all seven. Replay uses the existing Game and normal stage intro with the selected character, suppresses campaign save writes and permanent reward events, and returns to Stage Select. New Game does not clear stage unlocks.
6. The existing cinematic director uses sprite-bound safe margins. Expected visible players run physically inside existing arena bounds; pans that threaten visibility slow to a reachable speed, with rendered velocity retained on handoff. Manual gameplay never auto-runs. Stationary openings, intentional player-free shots, explicit entry motion, tutorial and accepted reunion are excluded.

## Focused verification

Local: tests/six-items.test.js and tests/5857.test.js. Short Chromium fixtures exercise stage migration, locked choices, both-character selection, replay checkpoint isolation, permanent reload, final-stage replay, Receiver button/idle, Hurt decode, left/right cinematic runs, gameplay non-interference, and aircraft frame contact. Existing standalone ending checks preserve both-route collapse/card/results/replay/Skip/reduced-motion behavior. No campaign or browser matrix.

Initial run 37900104799 exposed float rounding at the exact impact frame. The frame-index boundary was corrected; run 37900339547 passed the affected source/browser and standalone checks. Final exact-source/public run URLs and artifact hashes are recorded in the external six-items release receipt.

Physical Android screen, controls and speakers have not been observed. Browser fixtures use isolated synthetic saves, never personal browser data. Raw archive remains outside the repository.
