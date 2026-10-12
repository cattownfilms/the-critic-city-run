# Pass 2 playtest candidate

Baseline recorded before tuning: `d0d1051ee6abd88dc71c2462a6839084089a32ac` (the request omitted the `c` after `abd88d`). Branch: `polish-pass2`. Production remains `4ca587776cd953716ae03dbacae5f9f40a7792aa`.

## Seven-stage baseline

Regular counts include all three authored waves; support summons and bosses are additional. Shermometers remain the majority. Ordinary attack concurrency is one in stages 1–2, two thereafter; existing special enemy behavior and bosses have their own timing.

| Stage | Regular waves | Existing pressure / decision |
|---|---|---|
| Broadway | 2 / 3 / 3 | Basic combo introduction, then Bear and Fred. Preserve. |
| Last Train Uptown | 3 / 3 / 4 | Slam, Raptor, Hippo introduce lane and defense pressure; one ordinary attacker. Preserve. |
| Above the Avenue | 3 / 3 / 4 | Two ordinary attackers, Fred/Bear/Raptor mix. Preserve. |
| Theater District | 3 / 4 / 4 | Hippo/Fred/Raptor plus Franklin skill check; unlock unchanged. Preserve. |
| Palace Cinema | 3 / 3 / 3 | Additional support, localized 1/3/5 volleys, remote breaks and Rabbi. Preserve. |
| Little Italy | 3 / 3 / 3 | Wave 1 repeats Palace's punch/shove/punch; wave 2 has Raptor. Spike supplies anticipation/jump challenge. |
| Broadcast Tower | 3 / 3 / 3 | Wave 1/3 repeat basic Shermometer mix despite finale; wave 2 Hippo. Receiver waves and Duke already escalate. |

Retained passing campaign evidence: CI 38201714194, both input-driven routes 351.925 simulated seconds, 89 KOs, zero retries. This is a deterministic bot result, not a human difficulty measurement. No claim of physical Android timing or fair damage in every possible situation.

## Narrow tuning ledger

| Value | Before | After | Intended impact |
|---|---|---|---|
| Little Italy wave 1 slot 3 | sherm-punch | striped (Fred K) | Existing teleport tell asks for positioning before Spike; removes repeated two-punch composition without crowd growth. |
| Broadcast wave 1 slot 1 | sherm-punch | raptor | Existing committed flank charge combines with shove/slam lane pressure. No new simultaneous enemy or move. |

All other waves, HP/damage tables, pickups, concurrency, recovery, telegraphs, bosses, tutorials, physics and camera rules unchanged. These substitutions use each enemy's established stats rather than changing HP or damage values. Human playtest must confirm the combination feels fair.

## Mobile UX evidence

Native Chromium at 915x412 and 360x800: Stage Select summary is 44px tall but lacks the app’s controller focus styling. With browser focus correctly emulated, baseline uses a thin native 1px auto outline; candidate uses the existing teal 3px solid outline. Apply the same keyboard focus treatment to summary/select/input. Initial unfocused headless probes reported no outline; those probes are not valid evidence of an absent native focus ring. No navigation or saved progression changes.

## Duke opening correction — reference resolved

Actual reference: `/data/data/com.termux/files/home/storage/downloads/The-Critic-Duke-Opening-Reference.jpg`.
SHA-256: `438319b2f58e95ebcb55a08e2ebf70d46bbf7e5aaaf6b7995923525b46c84c77`.
The supplied follow-up identifies opening / duke-approach, not the final confrontation. Inspection confirms Duke previously appeared roughly seated-Jay height because all opening actors used presentation scale 1.

Only Duke actors in `scenes.opening` now use scale 1.35 (previously 1). Ten appearances cover walking, idle/dialogue, both button presses and exit. Scale is applied around the existing renderer foot pivot. No x/y, animation registration, camera, motion, timing, dialogue or props changed. Actor copies keep the scope confined to the opening. Later Receiver/button/final-boss scenes are unchanged.

Focused validation on the follow-up:
- `node tests/pass2-opening.test.js` passed: all ten opening appearances at 1.35, y=318; full scene-definition comparison against 2ec3260 matches exactly after normalizing only those ten scales.
- Native Chromium captures before/after at 915x412 and 360x800, covering duke-approach at 0.7s, motivation at 0.7s and activation at 0.35s. Actual rendered screenshots reviewed: Duke taller than seated Jay, stable feet, no visible head/limb clipping or unintended actor overlap. All three performances share the scale.
- Screenshot directory: `~/.local/share/cattown/critic-release/pass2/`; names `duke-opening-{before,after}-{duke-approach,motivation,activation}-{915x412,360x800}.png`. Matching JSON records contain scale/position/animation state. Local `opening.cjs` captures fixed authored times without a pause overlay.
- Standalone and Termux builds succeeded; updated scene/config embedded verbatim; launcher payload byte parity and port 8788 passed. Launcher not installed or executed. No campaign/matrix rerun.

## One static contract audit

Reviewed active historical assertions for music counts, stage definitions, dialogue, viewport and scene timing. Earlier obsolete music counts are already corrected by Pass 1. First-four-stage exact roster assertions remain valid; both substitutions preserve Shermometer majority and overall two-thirds share. Approved dialogue/camera/ending contracts are unchanged. No demonstrated obsolete assertion requires another fixture edit. No full matrix scheduled.

## Bounded verification results

- `node tests/pass2.test.js`: both checks passed, including exactly one full input-driven route per character. Jay and Franklin each completed seven stages in 351.408 simulated seconds, 89 KOs, zero retries. No debug damage/teleport used in the route runner. This does not prove human difficulty or every possible damage situation.
- `node tests/franklin.test.js`: all 26 checks passed: unlock eligibility, retry/death persistence, old checkpoint migration, roster majority, fixed combo mechanics and existing telegraphs.
- `node tests/six-items.test.js`: four focused checks passed, including completed-stage migration/permanent union (and retained Hurt behavior).
- Native Chromium CDP mobile focus screenshots: 915x412 and 360x800 passed focus, 44px target and panel bounds checks after correcting page-focus emulation in the local probe. No runtime focus workaround was added. Before/after evidence is under `~/.local/share/cattown/critic-release/pass2/`.
- Native Chromium isolated Stage Select fixture: five checks passed—three completed stages enabled, Franklin normal opening, replay checkpoint isolation, return-to-menu isolation, permanent unlocks after reload. Fresh temporary browser profile; user storage untouched.
- Existing standalone and launcher builders succeeded. Embedded launcher HTML matches the standalone byte-for-byte; campaign/config/CSS source embeds verbatim; port 8788 unchanged. Launcher not executed against the installed game.
- No full Core/browser matrix run or scheduled. Retain Pass 1 CI evidence, including focused loading 38203519288 (31/31 each browser), Core/controller/audio/presentation evidence from 38201714194, and focused 5872 run 38202179388. These are historical evidence, not results rerun on this candidate.
- Initial local probe setup failures (unfocused headless page; a baseline-only script quoting error) were corrected in external diagnostic scripts. `build_launcher.py --help` is unsupported; the normal two-argument build succeeded. No unresolved targeted gameplay failure reproduced.

## Preview and rollback

Build ID: `v11-pass2-20261012-duke-palace`; version remains 11.0.0. Artifacts: `release/pass2/The-Critic-Pass2.html` and `release/pass2/The-Critic-Pass2-Play.sh`; hashes in `release/pass2/artifact-hashes.json`. No production publication, installation, branch merge or save clearing.

HTML SHA-256: `75c7e6331efbaf9652976708031e57e29e57583f31e52c1e70a535b478e1c0c5`.
Launcher SHA-256: `8138cc2d0335f52d04707798324fd99fc13e1534a36fce01bd2621ecdaa27a60`.

The launcher uses the established installed path and origin if manually executed. It has not been run here. Review the standalone in a separate browser profile first if preserving the currently installed build is essential. Original Pass 1 source remains on reliability-pass1; roll back by switching branches with a clean worktree, without reset or storage changes.

## Android playtest checklist / limitations

- Both routes: judge the Fred/shove combination in Little Italy and Raptor/shove/slam combination in Broadcast. Watch for an unfair overlap of existing telegraphs; report stage/wave and route.
- Check unchanged introductory difficulty, stage-4 unlock challenge, booth breaks, Spike jump timing, Receiver exposures and Duke punish windows.
- In portrait and landscape, use a physical controller to focus/open/close Stage Select, then touch controls; confirm the teal ring and readable menu.
- Resume the ordinary campaign after a stage replay; verify its checkpoint remains intact.
- Compare the opening walk, dialogue and button press against the resolved Duke reference; confirm scale feels imposing without changing the studio composition.

Physical Android input feel, speakers, controller hardware and human balance remain unverified. No performance improvement is claimed. Full release qualification is deferred until user acceptance, as requested. READY FOR USER PLAYTEST. The opening reference is resolved and the scoped Duke correction is complete.

## Opening enemy micro-patch

Base: `ad83824` on local `polish-pass2`; Duke remains 1.35. No reference JPEG was found in Downloads, so the exact opening shots were reproduced in native Chromium.

Only openingFormation changes runtime presentation. Source idle animation bounds establish these sizes (width x height in scene pixels):

| Enemy | Source bounds | Opening scale before → after | Presented height |
|---|---|---|---|
| Shermometer punch | 105 x 198 | .83 → 1.02 | 202 |
| Shermometer shove | 105 x 198 | .75 → 1.00 | 198 |
| Shermometer slam | 105 x 198 | .78 → 1.04 | 206 |
| Fred K | 89 x 194 | .74 → 1.03 | 200 |
| JP Raptor Esq | 135 x 186 | .70 → 1.18 | 219 |
| Accordion Bear | 110 x 186 | .75 → 1.24 | 231 |
| Green Hippo | 151 x 187 | .67 → 1.20 | 224 |

The Shermometers occupy staggered floor depths, Bear leads the foreground, and Hippo occupies the left studio wing. Shortened approaches retain space for the enlarged figures. Existing foot pivots and uniform per-character aspect ratios remain intact. The same emission objects supply all three shots; screen-start scale .23, growth interpolation, effects, camera, timing, dialogue and exit actions are unchanged. No gameplay size, hitbox, animation library, difficulty or later scene changes.

Validation: `node tests/pass2-opening.test.js` passed. It compares all scene definitions with the base after normalizing only the seven opening sizes/marks, verifies all ten Duke appearances, exercises the real emission renderer at both shot boundaries and through the exit, and checks grounded anchors, stable scale, depth order and left/bottom bounds.

Before/after captures at 915x412 and 360x800 cover screen-emergence (4.09s), Hatchi Matchi (1s), and window-launch (.6s). Hatchi Matchi shows all seven identifiable figures with deliberate foreground/background overlap; Jay, Duke and Marty remain readable and the cage clear. Source animations and the existing floor shadows retain contact. These are fixed authored-time captures, not physical-device testing.

Evidence: `~/.local/share/cattown/critic-release/pass2/enemy-opening-{before,after}-{screen-emergence,hatchi-matchi,window-launch}-{915x412,360x800}.png`. Corresponding `enemy-opening-{before,after}.json` records actor states and actual renderer animation bounds; `enemies.cjs` reproduces captures. Standalone and launcher rebuilt; embedded scene/config, payload byte parity and port 8788 checked. No full regression matrix or production deployment.

## Duke and Palace Cinema micro-patch

Base: local `a9b45d4`, branch `polish-pass2`. READY FOR USER PLAYTEST.

### Duke and the first trashcan

Reproduced in native Chromium: Duke's foreground story sprite was drawn after the trashcan at x=900/y=445 even though the cart travels behind it. Duke also used the cage deck y=407 as his foot position and scale 1 during ordinary stage transports.

Seven stage-opening transports now explicitly author Duke at 1.35. The source bounds audit covers walk (187 high), idle (186), cart-push (172, intentionally bent over), cart-stop/release (185.602), button (197.853 including the prop), and confrontation (186). The same actor scale preserves body proportions through the push/stop; the shorter bent pose is not inflated independently. Studio opening and its approved enemy formation are byte-for-byte unchanged as resolved scene data. Receiver/background and confrontation retain their established 1.18 scale with the existing .63 depth factor; no boss scale or hitbox change.

Only a coupled foreground story cart joins the normal prop depth sort. Cage, Marty, and Duke render as one group at wheel-floor depth (430.92 for the existing .92 cage), behind the trashcan at 445. Duke's draw pivot uses that wheel-floor position. Source hand contacts are transformed through Duke and cage scales, preserving the handle connection. Marty remains at the deck, 130 units ahead of Duke; camera, authored path, prop position/health, and gameplay collision are unchanged. Other story layers retain their previous ordering.

### Palace Cinema only (internal stage 4)

The three active booths retain their fixed encounter targets. Between booths, the previous booth view is the lower camera bound; player facing no longer flips the travel target. Palace-only velocity easing caps travel at 360 world units/sec and prevents overshoot when a new booth captures the camera. Theater District (internal stage 3) and its Franklin encounter are untouched.

The third circuit immediately retains the current camera as a transient shutdown view; existing attack/projectile shutdown is preserved. The existing booth-shutdown shot now physically stages the player at the established 235/960 screen-left mark. It uses an existing grounded run, faces right when stopped, and waits for `awaitMarks` (including ground contact) and `awaitCamera` before the existing dialogue. If airborne, existing jump physics finishes the landing first. A player already at the mark stays still. The existing shutdown duration is retained and can extend for staging completion. No post-dialogue repositioning or new dialogue.

Skip during staging completes the physical movement, then skips dialogue and restores play through the normal callback. Skip from pause resumes staging. Checkpoint fields/schema and Rabbi entrance definitions remain unchanged; camera bookkeeping is transient and is not serialized.

### Focused verification

- `node tests/pass2-duke-palace.test.js`: passed. Seven cart scales, opening equality, unchanged dialogue/Rabbi definitions, all three fixed booths and forward handoffs on both routes, attack shutdown, checkpoint/Retry recovery, and identical Theater District camera/player traces against the base.
- `node tests/pass2-opening.test.js`: passed. Approved opening enemy sizes/continuity and Duke 1.35 preserved. Its historical full-scene comparison is now correctly limited to the opening, since this patch intentionally changes world-stage scenes.
- `CRITIC_SCREENSHOTS=~/.local/share/cattown/critic-release/pass2 node tests/pass2-duke-palace-browser.cjs`: passed in native headless Chromium at 915x412 and 360x800. Sixteen staging cases cover both routes, watched completion, paused skip, already positioned, and airborne finishes. Actual story event dispatch, completion callback, saved disabled state and return to play are exercised. Every dialogue frame checked occurs after marks/camera/ground completion; movement is bounded by the existing 340 units/sec staging speed, with no teleport. Also checks actual cart/prop renderer order, wheel contact, coupling, retained prop, and three booth camera locks/travel.
- Browser fixtures explicitly establish encounter state and advance the real scene/engine clocks. This is focused scene verification, not a full input-driven campaign or physical-device qualification. Initial fixture setup issues were corrected; final checks pass.
- Standalone and launcher rebuilt; all six changed runtime scripts embed verbatim, launcher payload byte parity and port 8788 verified. Launcher not installed/executed; no production deployment, full regression matrix, asset generation, combat rebalance, or save-format change.

Evidence directory: `~/.local/share/cattown/critic-release/pass2/`.

- `duke-palace-before-cart-{915x412,360x800}.png` and `duke-palace-after-cart-{915x412,360x800}.png`: first-can crossing. At the unchanged portrait opening camera, the can/crossing is beyond the right edge; `duke-palace-after-cart-entry-360x800.png` shows the visible portrait transport and coupling.
- `duke-palace-{before,after}-palace-{hero,franklin}-{915x412,360x800}.png`: defeat composition.
- `duke-palace-focused-results.json`: browser assertions, frame traces and source bounds; `duke-palace-before.json`: baseline trace.

The landscape dialogue panel still covers the lower part of the world view, as before; its layout was not changed. Both mobile layouts were visually reviewed. Physical controller/input feel remains for user playtest.
