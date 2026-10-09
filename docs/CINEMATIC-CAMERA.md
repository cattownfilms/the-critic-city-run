# V11 cinematic presentation

Build: `v11-refinement-20261009`, based on published `3d0a366c96aacb32b480d4803d8db68c9b782c02`.

The presentation director eases from the displayed camera position to a bounded shot target. A new shot replaces the pending target, without resetting position. World actor coordinates retain their scene anchor across consecutive scenes. Dialogue frames actual actors; entrances frame their authored destinations. All seven stage openings deliberately hold a stationary composition. The cart must clear the viewport before the selected player enters; Broadway retains its studio blast and physical street landing. Broadcast transport continues physically to the accepted background marks without foreground obstruction. Gameplay keeps its existing responsive follow and encounter collision rules.

| Stage | Continuous framing | Deliberate discontinuity retained |
| --- | --- | --- |
| Broadway | Stationary studio and street departure, persistent crowd | Studio window exit to the actual Broadway arrival |
| Last Train Uptown | Stationary cart departure/player entry; subsequent dialogue and gameplay follow | Arrival from the previous district |
| Above the Avenue | Stationary cart departure/player entry; subsequent dialogue and gameplay follow | Subway to rooftop geography |
| Theater District | Stationary pursuit entry; Franklin encounter aftermath | Arrival from rooftop geography |
| Palace Cinema | Stationary pursuit entry, localized booth pans, screen emergence, defeat | Arrival inside the auditorium |
| Little Italy | Stationary pursuit entry, Spike approach/tutorial, defeat | Arrival from the cinema |
| Broadcast Tower | Stationary pursuit entry, background cart travel, descending Receiver, foreground destruction, Duke confrontation, reunion | Arrival from Little Italy |

Explicit Skip and checkpoint/retry loads retain their authored terminal positions. They are intentional state transitions. Ordinary dialogue advances do not reset the camera. Reduced motion shortens camera settling and removes the skyline zoom, while retaining the requested collapse information.

The Receiver descends on its existing support, then uses its existing combat elevation. Its final destruction renders in front of the player, with tilt, sparks, explosions and smoke. The existing four-second defeat gate and rewards are preserved. Duke's story scale follows background depth and reaches 1.18 at the combat plane.

The five approved reunion beats remain first. Jay says `Oh my god, is that a plane?!? Hatchi Matchi!` on both routes. The room, recessed window frame and tower facade share one continuous transform into the upper-floor window of the existing skyline. The seven original collapse atlas pages and their 112-frame playback remain byte-for-byte unchanged. Pause, Skip, reduced motion and saved completion retain their existing paths.

The Projectionist reveal pans toward the active world-fixed booth while keeping the player in the composition, then holds through dialogue. Identical camera targets across shot changes no longer restart an active interpolation. Scene entry no longer clears the canvas by reassigning unchanged dimensions; this removes a concrete flash source at the Little Italy handoff. No palette or environment artwork changes are involved.


## Refinement verification

The [focused source run](https://github.com/cattownfilms/the-critic-city-run/actions/runs/37887819166) passed 69 scene-continuity checks, 39 refinement checks, 35 standalone ending checks and 16 native Chromium audio checks. These overlapping source/offline suites are reported separately. The refinement checks cover all seven stationary departures on both routes at 915×412 and 412×915, exact background cart marks without teleportation, a pixel-identical Little Italy scene handoff, the real Broadway queue/landing, both exact dialogue replacements and the window-origin pullback.

Screenshots were inspected for the top-floor window, skyline, retained Receiver background composition and portrait Little Italy. Local checks passed: 7 camera, 7 affected encounters, 10 audio lifecycle, and the retained scene contracts. No new media were imported. Nine source modules and the unchanged seven skyline pages match the standalone HTML; the launcher payload matches that HTML byte-for-byte.

Physical Android speaker output, touch/controller hardware and subjective motion comfort were not tested. Firefox and WebKit were not rerun for this focused presentation patch. Intentional district geography cuts, the studio-to-street transition, explicit Skip and checkpoint loads remain; stage openings intentionally hold the camera stationary.

## Previous release verification

Local camera interpolation (4), audio lifecycle (10) and affected encounter checks (7) pass. The [final source run](https://github.com/cattownfilms/the-critic-city-run/actions/runs/37871929298) passes 69 Chromium scene checks, 35 standalone checks and 16 native browser audio checks with zero failures. These overlapping runs are reported separately. Runtime source SHA: `f3ae1133cb073d818a1e96e7fdb51ebf5b062011`.

The browser suite samples each affected scene at 915×412 and 412×915, checks camera bounds and continuity, Receiver descent and destruction depth, both route endings, pause/skip, desktop reduced motion and actual saved completion. Screenshots were reviewed, including Duke's corrected background mark beside the Receiver. The source-frame skyline animation reaches its final smoke state, and watched/skip paths both preserve the schema-5 completion save and reward.

The nine source modules and seven new atlas pages match the standalone payload. The launcher embeds that exact HTML. Existing character banks, media recordings, combat definitions and save keys remain unchanged. The only engine camera-target adjustment frames the machine and player together during the already-scripted destruction.

Public deployment and HTTPS/browser verification are separate post-merge gates in the external release receipt. Physical Android speaker output, touch, controller hardware and subjective motion comfort remain user-side. Firefox/WebKit were not rerun for this focused patch.
