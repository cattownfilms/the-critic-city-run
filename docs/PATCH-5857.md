# 5857 targeted correction patch

Build: `v11-5857-20261009`. Baseline: `2d75df175b54bfe40f233b6dec0a1984dad6a18f`. Version 11.0.0 and save schema 5 retained.

## Corrections and evidence

- Camera: the gameplay follow interpolated first, then clamped its displayed pose to newly narrowed booth bounds. The short baseline browser fixture reproduced a 205-world-unit single-frame jump in both 412×915 and 915×412 layouts. Clamp the target to encounter bounds, and the displayed pose only to the real level extent. Immediate player collision locks remain. Scene entry and return now use the actual last rendered same-stage pose and velocity; the existing director carries velocity into its eased shot, rather than preferring a stale previous scene pose. No extra camera system, fades, or longer blanket durations.
- Spike: the marks beat followed the raised-can dialogue and reset the actor; the tutorial then replayed a separate windup. Move marks/camera settlement before the raised performance. Reuse source 1000085785.mp4 frames 34–48 for the raised hold and 50–78 for its release continuation. Frame 54 is the first detached-can frame: its metadata crop retains the body/hands (width 140), while the independent can starts at the registered source-can center (118.488, -124), accounting for the projectile pivot. The single 167 ms event replaces only tutorial release staging. Original combat actions, damage, timing and atlas bytes remain unchanged. Jump scheduling follows the real rolling projectile arrival.
- Ending: hold source skyline frame 111, with the towers absent, behind the exact definitive card. Manual Continue opens neutral RUN RESULTS. Static markup, dynamic reward copy and complete-mode rendering all use the neutral presentation. Completed schema-five saves restore results without replaying completion awards. Reunion, spoken realization, window pullback and collapse frames remain intact.

## Focused validation

Source/browser run: https://github.com/cattownfilms/the-critic-city-run/actions/runs/37892600984

Local: `node tests/v11-engine.test.js` (6 groups), `node tests/v11-playtest-engine.test.js` (7 groups), `node tests/5857.test.js` (5 groups), `node tests/cinematic-camera.test.js` (7 groups) passed. Chromium short fixtures capture before/after WebM and per-frame camera pose/target/owner/bounds/deltas, overhead hold/release/bounce frames for both selections, watched endings, manual card, completed-save restore, replay and Skip. Standalone ending fixtures pass. Updated ending expectations in the retained cinematic checks; no historical campaign or browser matrix run.

Artifact evidence is retained outside the release tree under `~/.local/share/cattown/critic-release/5857/`. The established standalone and launcher build passed; nine source modules and all seven skyline pages match source, launcher payload is byte-identical to the standalone HTML. Final source and hosted verification runs and deployed commit are recorded in the external release receipt.

## Boundaries

1000085857.mp4 was unavailable at the accessible Downloads paths; supplied annotations were used, not inferred cuts between replay excerpts. No physical Android speaker, touch or display observation is claimed. Browser fixtures use synthetic isolated state and do not modify personal saves. No audio audit, full campaign, or multi-browser matrix was run. Stationary convoy openings and intentional location-change cuts remain unchanged.
