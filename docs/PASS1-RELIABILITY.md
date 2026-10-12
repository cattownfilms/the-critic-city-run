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

## Verification unblock

Both the original candidate `9c791c8c099fb05dca7d1e95932f384805e625db` and an isolated unchanged production worktree at `4ca587776cd953716ae03dbacae5f9f40a7792aa` reproduce the same four v8 assertions. These are obsolete test fixtures, not Pass 1 gameplay regressions:

- Reflected frontal guard/parry: the fixture assigned bounce phase without completing flight, leaving y at booth depth. The floor-contact model correctly rejected contact.
- Reflected rear guard: the same invalid depth prevented the intended damage event.
- Spike warning/release test: expected the source-art center as the physics origin, omitting the renderer's 39 × renderScale vertical pivot correction.
- Spike 1.08 registration test: the same omitted pivot made the measured source-art comparison incorrect.

The updated reel fixture flies to either arena edge and reflects through the actual engine before arranging player contact. It checks incoming direction, floor depth, frontal block and timed parry, failed rear protection, exactly one contact reaction, and no protected damage/knockdown. Spike tests compare rendered projectile origin against the existing measured source-art center. Gameplay, overhead throw, collision, timing, and assets are unchanged. The retained 5857 checks separately cover overhead release and both tutorial routes.

Qualification runs are recorded outside the repository in `~/.local/share/cattown/critic-release/pass1-unblock/`, tied to the exact candidate SHA. Passing local tests alone does not qualify Pass 2: full Core, Chromium, Firefox, WebKit, focused 5872 and packaging results must all be verified. No production merge or deployment is authorized in this pass.

The broader Core run also exposed a production-reproducible stale v11 assertion expecting the removed credits joke. The approved 5872 RSVP line is now checked exactly once, with no obsolete credits line; scene source is untouched.

The site suite also reproduced an obsolete five-MP3 count on production, which already includes the approved ending piano. It now checks the exact six filenames, retaining the thirteen-WAV requirement and existing real-HTTP byte checks. No recording or audio configuration changed.

## Gate outcome: BLOCKED pending asset validation and remote evidence

The full local Core sequence reaches `tests/production-assets.test.py`, which fails identically on unchanged production: missing `loading.actions[*].hurt`, a frame with x=0 violating the atlas-padding assertion, and `source-map.currentFrameReferences` 3781 versus 3807 runtime frames. No approved asset, dependency manifest, or source map was altered to bypass these checks. These are additional qualification blockers, not regressions introduced by this recovery.

Other local Core commands passed, including all engine suites, publication-safety mocks, actual subpath HTTP/site checks, v10/v11 asset checks, script export and inventory. Focused 5857, 5867, 5872, six-item replay/save and v11 playtest-engine checks passed. The exact candidate's GitHub matrix and focused 5872 browser results, packaging upgrade results, and final disposition are recorded in the external recovery receipt; never infer a full pass from this list. Production remains unchanged. Pass 2 must wait for a verified green qualification checkpoint.

## Final qualification correction

The three missing loading action mappings are derived from the preserved runtime frames: Rabbi Hurt [125], Spike overhead-ready [78], overhead-release [78,79]. Their 4+7+15 references explain the stale 3781 count; current accounting is 3807. Historical provenance entries and hashes remain untouched, with a separate accounting addition listing these actions.

The reviewed Hurt file is a dedicated 832x208 row of four 208x208 cells. Only its first pose reaches the top image edge. The validation now pins that import's SHA-256 and exact cell geometry and requires transparent shared side boundaries; ordinary pages retain the original external two-pixel padding rule. No sprite pixels, frame timing, registration, or gameplay were modified.

The old v10 browser fixture forced a visible portrait into the portrait-free memorial. It now preserves that authored absence and adds real completion-entry checks at 915x412,360x800,1280x720,640x360 on both routes: exact text, line/card bounds, readable font, accessible >=40px action, and neutral results. Screenshots are retained per route and viewport. No ending CSS, text, skyline, piano or choreography changed. The focused 5872 workflow runs these affected validations before the retained checks; full qualification remains a separate exact-commit matrix.

Final exact-SHA results are recorded in `~/.local/share/cattown/critic-release/pass1-final/receipt.json`. Do not treat this correction description as a green qualification result; consult that receipt and the GitHub runs before starting Pass 2.
