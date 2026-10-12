# Pass 1 reliability checkpoint (not a production release)

Baseline: `4ca587776cd953716ae03dbacae5f9f40a7792aa`, fetched main, clean working tree; build `v11-5872-20261009-r2`. Branch: `reliability-pass1`; candidate build `v11-pass1-20261012`, game version remains 11.0.0. Pass 2 has not begun. Pages remains sourced from main/root; this branch must not be merged or deployed until both passes are accepted.

## Persistence and assets

Save schema 5 remains compatible with 2/3/4. Keys unchanged: `cattown.critic.brawler.v3.save`, legacy `cattown.critic.brawler.v2.save`, profile `cattown.critic.brawler.v3.profile`, settings `cattown.critic.brawler.v2.settings`, controller `cattown.critic.brawler.v5.gamepad`. Continue and stage replay remain separate; completed stages persist in the profile and full completion unlocks all seven. Franklin's existing unlock conditions remain unchanged. Local origin remains `http://127.0.0.1:8788/`; Pages and local saves are separate.

Runtime policy stays `all-runtime-at-startup`: all current atlases, portrait/scene/environment images, 13 WAV cues and six distinct music files (five original songs plus ending piano) are prepared before entry. No art/audio bytes, manifest identities, geography, camera directions, combat numbers or dialogue changed. The reviewed public-file allowlist verified 379 baseline files; only reviewed source/docs/tests hashes are refreshed.

## Findings and changes

- Requested terminology: visible mechanic instructions, button, ready state, accessible description and controller mapping prompts now say Special/SPECIAL/SPECIAL READY. Internal `special` action and legacy attack metadata remain intact. Movie-review story copy is preserved.
- Reproducible defect: an array-shaped corrupted profile passed the object check; JSON serialization silently discarded fields assigned to that array. Normalize only that invalid shape to an object. Valid saved data is untouched. A deterministic regression reproduces the old loss and verifies durable fields after repair.
- Measured inefficiency: 600 unchanged renderer resize calls performed 1,200 CSS writes and allocated 600 viewport objects. Reusing the viewport only when dimensions, DPR and backing dimensions match reduces that to 2 writes and 1 object. Rotation/DPR changes recompute correctly. No gameplay camera interpolation is changed.
- Reproducible test infrastructure defect: AudioSystem gained a completion-state guard but its extracted unit-test fixture omitted `game`. The baseline audio suite failed with ReferenceError. Supply the real dependency as a mutable fixture; all existing audio assertions remain.
- A label-only change to internal HITS metadata tripped the immutable combat baseline. That unnecessary internal edit was removed; the original baseline test passes without weakening its assertion.

## Measurements and verification boundaries

Static runtime atlas footprint: 126 pages, 85,229,198 encoded bytes; 340,939,976 bytes for a single RGBA decode of those pages alone. This is a size estimate, not measured Android resident memory. Assets are unchanged, so before/after footprint is identical. Additional portraits/environments, native decoder overhead and browser copies are not included in that estimate.

Baseline local 5872 and six-item state checks passed. Reviewed main's latest CI run 38007042072 passed only focused playtest; Core and browsers were skipped. This is not a green full-matrix baseline claim.

Local Playwright is unavailable (`ModuleNotFoundError`); no browser installation attempted in Termux. The candidate workflow measures actual startup bytes/load duration, short frame intervals and available JS heap in Chromium, with portrait/landscape Special control bounds. Those are headless observations, not phone FPS or physical memory. The complete existing Core/browser matrix and focused 5872 workflow must be recorded on the exact candidate commit. Required failures block Pass 2; no repeat-until-green loop.

State/transition audit uses retained engine, gamepad, scene, audio lifecycle, stage-replay, camera and 5872 checks. No speculative fixes to stable transitions, decoding, listener ownership or ending music are included. Native-media stalls and physical-device memory remain unverified risks, not claimed repairs.

## Artifacts and rollback

Build with `python tools/build_standalone.py --output release/pass1/The-Critic-Pass1.html`, then `python tools/build_launcher.py release/pass1/The-Critic-Pass1.html release/pass1/The-Critic-Pass1-Play.sh`. Generated artifacts remain ignored, outside the public allowlist. Launcher tests use isolated temporary homes; no user installation is replaced. Do not run the preview launcher over an active user session until reviewed. Use an isolated browser profile for evaluation.

Rollback: production is unchanged. Keep this branch/artifacts for review; switch to main only with a clean or preserved working tree. No reset, force-push or storage clear is needed. Physical Android speaker output, multitouch, background/process death, hardware controller disconnect/remapping and subjective motion remain user checks.

## Gate outcome: BLOCKED

The local Core sequence stopped at `tests/v8-engine.test.js` with four failures:
- Guard/parry after reflected reels: `q.contacted` was false.
- Facing away from reflected reels: expected HP 91, observed 100.
- Spike release position: observed sourceY 396.4416783216783, expected 354.3216783216783.
- Spike 1.08-scale source-can registration assertion failed.

That suite, engine.js, campaign data and sprite assets are unchanged from the reviewed baseline. These inherited disagreements require diagnosis against the accepted playtest behavior; this pass does not change combat or weaken the assertions. Core did not finish. Chromium/Firefox/WebKit and the remote focused 5872 browser workflow were not dispatched after this required gate failure. No full-matrix pass is claimed. Local focused 5872, 5867, v11 playtest-engine, Special/resize/profile, audio lifecycle, engine, Franklin, v4, gamepad, campaign-engine and v7 checks passed. See external logs in `~/.local/share/cattown/critic-release/pass1/`.

Pass 1 is NOT READY FOR PASS 2. Next action: diagnose the four unchanged v8 fixture/engine disagreements on this checkpoint, preserving the reviewed Spike release and reel mechanics, then run the full exact-commit matrix and focused 5872 gate. Do not publish or merge this candidate.
