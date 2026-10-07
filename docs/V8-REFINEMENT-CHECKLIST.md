# THE CRITIC: COMING ATTRACTIONS / v8 refinement review

This checklist maps the eight follow-up requests to their source changes and release checks. A box is checked only after the applicable current-build validation has been recorded in [VALIDATION.md](VALIDATION.md). Historical v7 results do not establish v8 success.

| Request | Current implementation | Required release check |
|---|---|---|
| 1. Bulk load to avoid scene waits | `app.js` prepares all current atlases, portrait expressions, runtime scene/environment art and audio bytes. Title/options remain responsive; Start, Continue and all Animation Room entrances require complete readiness. | Cold startup progress/Retry, no partial entry, then zero new dependency requests or loader overlays through scene/stage transitions; source and offline builds. |
| 2. Preferred Franklin cartwheel | `assets/sprites.json` maps `cartwheel-run` to 26 supplied poses at a fixed 196-pixel reference height. `engine.js` retimes impact to the existing run window. The previous six generated poses remain aliased. | Both movement directions, ground pivot, contact timing, strong launch against ordinary targets, normal movement recovery and legacy asset preservation. |
| 3. Repeated machine waves; harder Duke | `engine.js` sends two screen-born Shermometers at a time, first after 1.2 seconds and then every five seconds, capped at four live summons. Machine defeat stops/cancels/dismisses these without extra rewards. `data/campaign.js` defines Duke's 340 HP, speed 145 and shorter pressure/recovery. | Multiple bounded waves before shutdown, none afterward, no duplicate kills/rewards, required machine → Duke → rescue order, and complete Jay/Franklin progression. |
| 4. Bear/Hippo stop RUN + HIT | A lane-valid running collision gives the heavy enemy no damage/knockback and stuns/recoils the player while clearing the combo/buffers. Nearest heavy targets stop the rush before targets behind them. | Jay and Franklin; both heavies; one recoil per attack; lane miss; ordinary running target launch; standing/air attacks, guard/parry/dodge unchanged. |
| 5. Correct facing | `production/v8-direction-audit.md` documents all original actions. Verified native-left actions/frames use facing metadata while explicit aliases retain originals. Renderers resolve frame/action direction and scene motion/look targets. | Full source preservation, mirror/offset/shadow alignment, both movement directions, speaker gaze and Marty's leftward ending run on both routes. |
| 6. Downloadable full script | `tools/export_script.py` exports the actual scene definitions, resolved Jay/Franklin lines, staging and story UI to `docs/FULL-SCRIPT.md` and an editable Word release file. | Exact approved opening, both routes, matching current source, stable scene/beat references and visual review of every Word page. |
| 7. Fixed whole-wall booths; eyes; bouncing reels | `data/campaign.js`, `engine.js` and `render.js` author thirteen world-fixed masked booths, three circuit groups, onscreen-only appearances, four-phase shadow eyes, three reflected reel hops and one unblocked-hit knockdown. | Wall/window alignment during scrolling and gates, mask bounds, only onscreen active booths, choreographed eyes, circuit shutdown, three bounces, one contact, fair guard/parry and knockdown recovery. |
| 8. Cinema cream-scarf boss; Little Italy Spike | Palace Cinema foreshadows and releases the cream-scarf Cinema Headliner from the screen. Its exit requires both him and all circuits. Little Italy uses Spike's supplied African American bank, portrait, door entrance and visible trash-can throws. | Clear screen emergence/door arrival, bank identity and fixed scale, grounded deaths, throw-hand/projectile continuity, boss HUDs, stage exit requirements and both campaign routes. |

## Current-build release signoff

- [x] Bulk startup and cached transition checks recorded.
- [x] Supplied Franklin cartwheel and retained source assets verified.
- [x] Machine waves, harder Duke and rescue order verified on both routes.
- [x] Heavy-enemy running collisions and accepted combat regressions verified.
- [x] Body and story facing verified, including Marty.
- [x] Full Markdown/Word script matches source and every Word page is reviewed.
- [x] Cinema booths, eyes, circuits, bouncing reels and knockdown verified.
- [x] Cinema Headliner and Spike arrivals, fights and exits verified.
- [x] Existing save migration, unlocks, controller/settings and launcher upgrade verified.
- [ ] Offline release rebuilt and inspected; reviewed repository and actual public HTTPS game verified.

The first nine items have current local evidence: 845 structured cases passed with zero failures, plus the reviewed editable script. Final offline parity and launcher upgrade also passed; the final combined release item stays pending until the actual public deployment is verified.

Physical Android/Termux, Logitech hardware and Safari/iPhone checks are reported separately in [KNOWN-LIMITATIONS.md](KNOWN-LIMITATIONS.md). Browser automation does not imply physical-device testing.
