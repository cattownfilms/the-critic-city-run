# THE CRITIC: COMING ATTRACTIONS release workflow

The existing public repository is [cattownfilms/the-critic-city-run](https://github.com/cattownfilms/the-critic-city-run). Its Pages address remains [cattownfilms.github.io/the-critic-city-run](https://cattownfilms.github.io/the-critic-city-run/). Keep that repository, its history, and the Pages origin when releasing v8. The public game title is **THE CRITIC: COMING ATTRACTIONS**.

A successful push is not proof that Pages has deployed. Record the released commit and verify the live HTTPS build before reporting publication as complete. The release validation report records what was actually tested and any blocked publication steps.

## Source and hosted build

Edit `app.js`, `engine.js`, `render.js`, the authored definitions in `data/`, and source assets. `index.html` is the hosted entry point. Its runtime dependencies include `cutscenes.js`, `cutscenes.css`, the scene definitions, atlases, cutscene images, story portraits, music, and effects. The offline HTML and launcher are generated outputs; rebuild them after source changes.

Use a branch in the existing clone:

```sh
git fetch origin
git switch -c gameplay-staging-v8
python -m pip install -r requirements-test.txt
python -m playwright install --with-deps chromium firefox webkit
node tests/engine.test.js
node tests/v4-engine.test.js
node tests/franklin.test.js
node tests/gamepad.test.js
node tests/campaign-engine.test.js
node tests/v7-engine.test.js
node tests/v8-engine.test.js
python tests/production-assets.test.py
```

Review the source, asset provenance, save migration, and the validation report. Browser checks use Playwright's installed engines by default. To deliberately test a separately provisioned Chromium binary, set `CRITIC_CHROMIUM` to its full executable path; the harness does not automatically select a host-system browser. Record unavailable engines honestly.

Run the source-HTTP controller and campaign checks in each installed engine:

```sh
for browser_engine in chromium firefox webkit; do
  python tests/gamepad-browser.test.py --engine "$browser_engine" --url local
  python tests/campaign-browser.test.py --engine "$browser_engine"
  python tests/v8-loading-facing-browser.test.py --engine "$browser_engine"
  python tests/v8-gameplay-browser.test.py --engine "$browser_engine"
done
```

The standalone regression scripts require the generated HTML below. Keep test reports out of the published runtime.

After validation, commit the reviewed changes and push the branch to the existing repository. Merge through the repository's normal review workflow. Preserve its current Pages configuration and deployment continuity. Do not force-push or create a replacement repository for this update.

The legacy `tools/publish.py` and `The-Critic-Publish-GitHub-v5.sh` workflow were intended for first publication of a prepared v5 snapshot. Their hash allowlist is not a development or upgrade mechanism. Use ordinary reviewed Git commits for this established repository; do not use the old publisher to recreate it or overwrite newer work.

## Complete offline release

From the repository root, build the single-file game and self-contained launcher:

```sh
python tools/build_standalone.py --output The-Critic-Coming-Attractions-v8.html
python tools/build_launcher.py The-Critic-Coming-Attractions-v8.html The-Critic-Coming-Attractions-v8-Play.sh
```

The standalone build requires Python and Node.js. The standalone builder embeds the runtime artwork, audio, sprite metadata, styles, authored campaign data, scene definitions, and JavaScript. It does not need a CDN or the original source videos. The launcher embeds this exact HTML and verifies its SHA-256 digest before installing it.

Run the local launcher tests serially because they intentionally use the fixed save origin at port 8788:

```sh
python tests/launcher.test.py
python tests/upgrade-launcher.test.py
```

The upgrade test rebuilds the reviewed v7 baseline from Git automatically, or uses the exact preserved v7 launcher when `CRITIC_V7_LAUNCHER` is supplied. It runs that launcher's original Python bootstrap and HTTP handler, applies the actual v8 launcher twice, and checks served bytes, the installation directory, original backup and retained files. `CRITIC_HTML` and `CRITIC_LAUNCHER` override current artifact locations. Run fixed-port checks serially. Browser-save migration is tested separately.

Deliver the offline HTML, launcher, and source package together with the story/canon document, asset provenance, changelog, validation report, and known limitations. Generated delivery files are ignored by Git and should be distributed as release artifacts, not added to the Pages runtime.

## Android / Termux launch and update

Install Python in Termux, then run the downloaded v8 launcher:

```sh
pkg install python
bash ~/storage/downloads/The-Critic-Coming-Attractions-v8-Play.sh
```

If Termux cannot access Downloads, run `termux-setup-storage` once and grant the requested storage access. The launcher opens `http://127.0.0.1:8788/` and installs the embedded game at `~/.local/share/cattown/critic-brawler/index.html`. Leave that Termux session running for browser reloads. `Ctrl+C` stops its local server.

For an update, run the new launcher at the same path. It preserves the port, hostname, and installation directory, backs up the previous HTML once as `index-before-v8.html`, and reuses a recognised running v2–v8 server. Reload the browser tab to receive the updated game. It does not clear browser storage or delete other installed files. If an unrelated application occupies port 8788, it reports the conflict instead of killing that process.

Browser progress remains tied to the exact origin. The local launcher and HTTPS Pages site have separate saves. Avoid changing `127.0.0.1` to `localhost` or changing the port if retaining an existing local browser save. The game retains its established storage keys and migrates supported old save versions; it does not require uninstalling the app or clearing browser data.

These instructions describe the supported launcher workflow. Automated Linux loopback tests do not constitute physical Android, Termux, or controller hardware testing.

## Hosted verification

After Pages reports a completed deployment, open the actual HTTPS game and verify the release title, JavaScript, sprite pages, music, cutscene images, new stages, scene skipping, and controller settings. Check responsive layouts and the browser console. Record the live commit/build identity and asset responses in the release validation report.

Publish only the intended source and runtime dependencies. Keep credentials, browser saves, prompt logs, raw videos, temporary generation folders, and generated standalone/launcher duplicates out of the hosted tree. Retain `NOTICE.md` and the asset provenance documentation.

Share the HTTPS Pages URL with players. They can use touch, keyboard, or an enabled/remapped controller without Termux or a GitHub account. The hosted multi-file build downloads its assets normally and does not promise offline caching or a service worker.

### Release-completion gate

After the merged main commit reports a completed Pages build, run:

```sh
gh workflow run verify-pages.yml --repo cattownfilms/the-critic-city-run --ref main
```

This manual workflow reads the site URL and deployed commit from GitHub, rejects a stale deployment, and runs the existing controller, full-campaign, v8 gameplay and opening/Continue regressions in Chromium against public HTTPS. Reports and opening screenshots are saved as workflow artifacts. It does not replace the three-engine source checks. In native Termux, use Actions for desktop browser engines rather than installing desktop browsers locally. Keep the final deployment receipt outside the tracked source so recording the deployed commit does not recursively change it.

Browser CI and the public check use the digest-pinned official Playwright 1.58.0 image matching `requirements-test.txt`. This avoids repeated package-mirror installation and variation in the host media libraries. The source WebKit job requires three independent campaign/loading passes; any failed pass fails the job. Gallery comparisons wait for the selected animation to be drawn and retain exact pixel equality. Runtime game and supplied media bytes are unchanged by these release-validation corrections.
