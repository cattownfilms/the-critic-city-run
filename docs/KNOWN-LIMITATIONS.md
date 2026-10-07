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
