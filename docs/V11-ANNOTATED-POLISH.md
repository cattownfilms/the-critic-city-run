# V11 annotated-playtest correction pass

Baseline: `ac9745966cffa707eb21fe94d3d30aaa88a0f3fd`.
Build identifier: `v11-playtest-20261008`; public version remains 11.0.0; save schema remains 5.

## Corrections and evidence

| Feedback | Implementation | Evidence / boundary |
| --- | --- | --- |
| 00:40 missing SFX | Retry missing/failed WAV decodes, deduplicate in-flight work, resume inside trusted gestures, retain compressor routing, expose concise `audio.lastSfx` reasons. | Audio lifecycle tests; Chromium real decode, running context and nonzero bus. Physical Android speakers still unverified. This repairs demonstrated failure paths; it does not establish which occurred on the phone. |
| 01:05 theater line | Jay's approved line is in Palace's introduction; Franklin's Nilknarf remains. | Scene source and regenerated full script; route conditions retained. |
| 01:22/01:42/01:56 booths | World positions 640/1500/2450, one circuit per encounter gate; three 1/3/5-wide volleys then one radio; radio releases traversal and saves circuit state. | Focused engine and browser checks; forward-edge camera and reachable radio test. |
| 01:56/02:14/02:34 reels | Booth-hand origin; target captured before release; airborne depth interpolates toward landing lane; reels share actor depth sorting and retain three bounces. | Nine player-position fixtures, renderer call-order check, screenshots. |
| 02:54 final circuit | Projection support actors visibly enter death animation, without score/KO reward calls; one shutdown event cancels attacks before Rabbi. | Idempotence and no-reward checks; scene gives collapse time. |
| 03:04 entrance | Screen figure and physical entry use matching initial scale/position; short flash, continuous floor emergence and settle; removed limb-clipping aperture. | Engine continuity and browser screenshot. |
| 03:12 facing | Apply an explicit display-facing map only to reviewed left-facing guard, landing and defeat frames; entry faces the actual player. | `production/v11-playtest-facing.json`; atlas bytes unchanged. No dedicated Rabbi hurt performance exists; existing fallback retained. |
| 03:42 can | Correct projectile center and rotation pivot to join the existing held pose. | Both route tutorials pass real release/bounce/underpass/landing/skip checks; release screenshots. |
| 04:04/04:21 staging | Keep room art; fixed background marks, separate scaled captive cage and Duke; remove intersecting decorative support frame; positions carry into foreground travel. | Background screenshot and measured Duke coordinate continuity. |
| 04:50 core | Existing core lights, electrical surges, hit flashes and shield rejection feedback; `HIT THE EXPOSED CORE` only while vulnerable. | Renderer screenshot; no attack timing, damage or wave thresholds changed. |
| 04:21/04:30/05:21 dialogue | Only flagged three exchanges replaced with requested Jay/Duke dialogue; Franklin alternatives retained. | Actual scene source and full-script export. |
| 05:10 handoff | Selected player physically runs left during existing breakdown; camera frames confrontation; Duke walks from actual background position; Marty remains captive. | Both-route engine checks and real-browser staging samples. |
| 05:49–05:58 new ending sting | **BLOCKED: source media unavailable.** Existing reunion/results retained intact. No substitute skyline or empty video player added. | Exact files absent from accessible storage: `1000085583.mp4`, `1000085577.png`, `1000085579.png`. |

The annotated playtest MP4 `1000085837.mp4` was also unavailable. Written annotations supplied by the user are the review evidence; no claim is made to have watched the missing recording.

Source validation passed: https://github.com/cattownfilms/the-critic-city-run/actions/runs/37856214732 (focused source, Chromium audio and affected scenes).

## Validation scope

- `node tests/audio-lifecycle.test.js`
- `node tests/v11-engine.test.js`
- `node tests/v11-playtest-engine.test.js`
- Focused Chromium workflow: `gh workflow run verify.yml --ref polish-v11-playtest -f focused=true -f site_url=local`
- `python tests/v9-audio-browser.test.py --engine chromium --url local`
- `python tests/v11-playtest-browser.test.py --url local`
- `python3 tools/export_script.py --check`
- `python3 tools/build_standalone.py`
- `python3 tools/build_launcher.py The-Critic-Coming-Attractions-v11.html The-Critic-Coming-Attractions-v11-Play.sh`

The first browser run passed audio and staging but its Palace fixture stopped before projectile release. The fixture now waits on the release event. A selected historical-test filter also inadvertently included a campaign test; it exposed a forward-camera cancellation at the first booth. The camera and radio bounds were repaired and directly covered by a hold-forward encounter test. No full matrix is claimed. Historical phase fixtures now explicitly enter the next separate booth; their mechanics assertions remain.

The site test verifies all 248 referenced files and exact retained pixels, frame timing and registration (253 states / 3,781 frames). Original frame metadata is also retained; facing fixes are separate display metadata.

Raw footage, audio recordings and atlas imagery were not changed. Browser screenshots and local build artifacts are outside the tracked public release. Final run, deployed commit and HTTP verification are recorded in the external publishing receipt.

## Phone checks still required

Confirm punch/impact, footsteps/jump, damage/boss sounds together with music; mute/unmute, pause/resume and a stage change. Check all three booth traversals, Rabbi facing, Spike's release/jump, Receiver core and final Duke transition. Physical speakers, multitouch and controller hardware were not exercised here.
