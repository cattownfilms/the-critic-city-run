# V11 cinematic presentation

Build: `v11-cinematic-20261009`, based on `0574767fe4c771d994acd8bb4ceddbc3d9061bf7`.

The presentation director eases from the displayed camera position to a bounded shot target. A new shot replaces the pending target, without resetting position. World actor coordinates retain their scene anchor across consecutive scenes. Dialogue frames actual actors; entrances frame their authored destinations. Gameplay keeps its existing responsive follow and encounter collision rules.

| Stage | Continuous framing | Deliberate discontinuity retained |
| --- | --- | --- |
| Broadway | Studio speaker/group reframing, persistent crowd | Studio window exit to the actual Broadway arrival |
| Last Train Uptown | Cart departure, pursuit run-in, dialogue, gameplay | Arrival from the previous district |
| Above the Avenue | Cart departure, pursuit run-in, dialogue, gameplay | Subway to rooftop geography |
| Theater District | Pursuit and Franklin encounter aftermath | Arrival from rooftop geography |
| Palace Cinema | Pursuit, localized booth reveals, screen emergence, defeat | Arrival inside the auditorium |
| Little Italy | Pursuit, Spike approach/tutorial, defeat | Arrival from the cinema |
| Broadcast Tower | Cart arrival, descending Receiver, foreground destruction, Duke confrontation, reunion | Arrival from Little Italy |

Explicit Skip and checkpoint/retry loads retain their authored terminal positions. They are intentional state transitions. Ordinary dialogue advances do not reset the camera. Reduced motion shortens camera settling and removes the skyline zoom, while retaining the requested collapse information.

The Receiver descends on its existing support, then uses its existing combat elevation. Its final destruction renders in front of the player, with tilt, sparks, explosions and smoke. The existing four-second defeat gate and rewards are preserved. Duke's story scale follows background depth and reaches 1.18 at the combat plane.

The five approved reunion beats remain first. Jay then uses his retained double-take performance and says `Oh my God! What's that?!?` on both routes. This is the exact wording supplied in the earlier annotated-playtest request; the later prompts' exact-dialogue fields were blank.

The skyline is a shrinking world-frame composite into decoded frames from the supplied source, followed by both towers collapsing and smoke clearing. It uses the normal scene clock, pause, Skip and completion callback. Seven WebP atlas pages preload with the existing scene dependencies and embed in the standalone build. No native video autoplay permission or visible-time download is needed. Raw source videos remain outside the release.

## Verification

Local camera interpolation, audio lifecycle and affected encounter tests pass. The browser suite samples each affected scene in landscape and portrait, checks bounds and continuity, Receiver descent and destruction depth, both route endings, pause/skip, reduced motion and actual saved completion. Final browser/deployment evidence is recorded after validation; physical Android speaker, touch and controller observations remain user-side.
