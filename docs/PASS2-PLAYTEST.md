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

## Reference limitation

1000085912.jpg not found in project/reference folders or accessible ~/storage/downloads, /storage/emulated/0/Download and /sdcard/Download (aliases of shared storage). Filename search also checked ~/Pictures. No screenshot was supplied inline to this execution. Candidate same-floor shot: boss-duke-intro, Jay response / Duke idle; actual reviewed shot cannot be identified confidently. Duke scale and staging are therefore preserved pending reference identification, including Receiver background/button and final combat. No claimed before/after Duke correction.

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

Build ID: `v11-pass2-20261012`; version remains 11.0.0. Artifacts: `release/pass2/The-Critic-Pass2.html` and `release/pass2/The-Critic-Pass2-Play.sh`; hashes in `release/pass2/artifact-hashes.json`. No production publication, installation, branch merge or save clearing.

HTML SHA-256: `be80254f3441f42b72549f23eb384f4ee23d94ae8bee5aee89d2b792621d3d81`.
Launcher SHA-256: `826646d4a3d342ec30ef8d115d3f8eb03d3789ab36a42db0aa2d3054951caacb`.

The launcher uses the established installed path and origin if manually executed. It has not been run here. Review the standalone in a separate browser profile first if preserving the currently installed build is essential. Original Pass 1 source remains on reliability-pass1; roll back by switching branches with a clean worktree, without reset or storage changes.

## Android playtest checklist / limitations

- Both routes: judge the Fred/shove combination in Little Italy and Raptor/shove/slam combination in Broadcast. Watch for an unfair overlap of existing telegraphs; report stage/wave and route.
- Check unchanged introductory difficulty, stage-4 unlock challenge, booth breaks, Spike jump timing, Receiver exposures and Duke punish windows.
- In portrait and landscape, use a physical controller to focus/open/close Stage Select, then touch controls; confirm the teal ring and readable menu.
- Resume the ordinary campaign after a stage replay; verify its checkpoint remains intact.
- Identify the Duke reference shot from the unchanged candidate screenshots or provide the real local reference filename. Duke scale remains unresolved, not silently guessed.

Physical Android input feel, speakers, controller hardware and human balance remain unverified. No performance improvement is claimed. Full release qualification is deferred until user acceptance, as requested. This is a partial playtest candidate: the screenshot-dependent Duke correction is blocked on reference identification.
