# V11 verification boundaries

- Physical Android speaker output, multitouch and Logitech hardware require a phone playtest.
- The three new reels contain no Marty locomotion or new Duke attacks. Existing run/reunion and combat assets remain authoritative. Pull/adjust mime alternates are preserved, not forced into gameplay.
- Core, Chromium, Firefox and WebKit passed https://github.com/cattownfilms/the-critic-city-run/actions/runs/37742777465. Public deployment is a separate post-merge gate recorded in the external receipt.

## Historical records

# V10 verification boundaries

- Core and all three browser engines passed [the source validation run](https://github.com/cattownfilms/the-critic-city-run/actions/runs/37710897264); public deployment is a separate post-merge gate recorded in the external receipt.
- Physical Android audio, multitouch and Logitech hardware are not automatically verified.
- Supplemental Duke source was found as `df8d7ed2-e798-410c-bdfb-ba0966676917.mp4`, not the prompt’s `...b917.mp4`; provenance preserves the actual name/hash. No original was renamed.
- Source performance review cannot establish subjective combat feel; use the release’s phone smoke checklist.
- All supplied songs/SFX and old banks are preserved; v10 adds lossless supplemental atlases and retains the large-library startup model.

## Historical v9 boundaries

# V9 verification boundaries

- Core, Chromium, Firefox and WebKit passed the documented source run. Native playback clocks and the SFX signal are verified, not audible physical Android output. A Firefox/WebKit virtual audio sink is CI infrastructure only.
- Heavy/boss tuning, cinema remotes, rolling cans and three broadcast rounds have deterministic behavior coverage. Subjective difficulty/readability still needs the user's phone playtest.
- Public deployment is gated separately; consult the external v9 release receipt for the exact merged commit and hosted checks.
- Save schema 5, stable storage keys and original audio/artwork are preserved. No physical controller test is claimed.

During v9 development, WebKit exposed a reload timeout and intermittent native media preparation errors. Overlapping prime requests, incomplete pause cleanup and permanent reuse of failed players were repaired. The exact native decoder cause is not established; the documented final-source/merged-source runs and public receipt are the verification boundary. No physical speaker result is inferred.

## Historical v8 limitations and investigation

# THE CRITIC: COMING ATTRACTIONS — known limitations

- Physical Android/Termux installations and Logitech controllers have not been tested. Automated browser touch, controller and launcher checks are distinguished from hardware tests in the validation report. Playwright WebKit coverage does not certify a physical Safari/iPhone.
- The projectionist retains a temporary display identity. The user-approved Violent Austrian Rabbi and Spike names are used for the cinema and Little Italy bosses; legacy asset IDs remain compatible.
- The soundtrack remains the five supplied recordings and thirteen source-derived sound cues. No new music or voice recording is claimed.
- Franklin's preferred supplied cartwheel is integrated. The new cream-scarf capture clips his feet and a later lunge, so its useful upper-body poses are used for screen framing while the existing grounded combat bank is retained. Spike's overhead can is briefly clipped in its source; his entrance uses an earlier fully framed lift.
- Bulk loading deliberately shifts the full runtime download to startup to avoid loading between scenes. The complete retained library remains large; download time depends on the connection and image decoding on the device. Historical atlases remain repository provenance and are excluded from the offline runtime's duplicate payload.
- Saves remain tied to the exact browser origin. Local localhost:8788 saves and HTTPS GitHub Pages saves are separate. Denied storage permits play but cannot retain progress after the tab closes.
- Raw media, supplied Sprite Forge ZIPs and private prompt logs remain outside the public repository. Asset manifests record hashes and derivations; regeneration of supplied derivatives requires the original archives.

## Release-completion verification boundary

The reviewed v8 commit passed GitHub Actions Core, Chromium, Firefox and WebKit. The original WebKit job exhausted its 15-minute limit after passing loading/facing assertions; its unchanged-source rerun passed. A native teardown stall is suspected, but its exact cause is not established. This does not establish physical Safari or audible playback. Native Termux loopback launcher and isolated upgrade checks now pass; interactive Android-browser and physical controller checks remain unperformed.

Later unpinned host-runner attempts reproduced intermittent native WebKit stalls at scene transitions as well as Ubuntu package-mirror stalls. The exact native cause is not established. In the matching official Playwright image, three independent 31-case campaign runs and three 31-case loading/facing runs passed with native audio enabled and cleanup completed. CI now requires those repetitions without retrying failures. This automated Linux result is not physical Safari/Android or audible-output verification.

The post-merge trace subsequently isolated a synchronous native `HTMLMediaElement.load()` stall during a scene-skip music transition, even in the pinned environment. The focused follow-up removes explicit media reload/destruction from track changes and keeps one reusable player per supplied recording. Crossfade and pause/resume behavior are regression tested; supplied audio and gameplay/script data are unchanged. Final native and hosted results are recorded in the release receipt.
