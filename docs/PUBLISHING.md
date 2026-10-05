# Publish the complete playable site

## Current status

The prepared release has **not** been published from this chat. The connected GitHub integration can edit existing repositories but does not expose repository creation or Pages administration. The supplied publisher performs those actions only when run under your own authenticated GitHub CLI.

Default destination: `cattownfilms/the-critic-city-run`, **public**. The script checks the active account, verifies the allowlisted file hashes, asks you to type `PUBLISH`, creates a new public repository, pushes its initial `main` commit, and configures GitHub Pages from `main` and `/` (root). It prints the repository URL and the site address returned by GitHub, and distinguishes a completed build from a pending build. Internet access is required to publish.

It never prints or embeds a token, makes an existing private repository public, overwrites another repository's history, adds arbitrary files from your Downloads folder, or force-pushes. Review `NOTICE.md` before publication. This version includes supplied title art, music and sound effects.

## Android / Termux: self-contained publisher

Download `The-Critic-Publish-GitHub-v5.sh`. It contains the entire prepared repository, not merely an internet download link. Install these prerequisites explicitly, then authenticate using GitHub's browser/device flow:

```sh
pkg install git gh python
gh auth login --hostname github.com --git-protocol https --web --scopes workflow
bash ~/storage/downloads/The-Critic-Publish-GitHub-v5.sh
```

Use the `cattownfilms` account when GitHub asks. Never paste a token into ChatGPT. If Downloads is not accessible, grant Termux storage access with `termux-setup-storage` first. The script extracts into a version-specific folder under your home directory, verifies the payload, and launches the first-publish tool. Re-running preserves that folder and its Git metadata so an interrupted upload can resume. It does not touch the local game installation at port 8788.

## Desktop / extracted source alternative

Install Git, GitHub CLI and Python 3.10+, extract the public-ready source ZIP, and run from its `the-critic-city-run` folder:

```sh
gh auth login --hostname github.com --git-protocol https --web --scopes workflow
python tools/publish.py
```

On Windows, `py tools/publish.py` is also suitable. `python tools/publish.py --check-only` verifies the reviewed files without accessing an account or publishing anything.

For a different **new** name: `python tools/publish.py --repo the-critic-city-run-demo`. The owner defaults to `cattownfilms` and must match the authenticated account. Existing nonempty unrelated repositories are intentionally rejected rather than overwritten.

## Sharing

After GitHub reports a completed Pages build, send friends the **HTTPS Pages URL**, not the GitHub code page and not a raw HTML link. They open the page directly and play with touch, keyboard or an enabled/mapped controller. They do not need Termux, a GitHub account, or the original asset ZIPs. The first load downloads the game assets; the hosted version does not claim offline caching or a service worker.

The multi-file layout lets browsers request individual already-compressed images and songs rather than one enormous base64 HTML file. All runtime assets are present; no CDN or third-party asset server is required. Do not add the standalone HTML, launcher, generation videos or original character ZIPs to Git just to make the site work.

## Recovery

If upload fails, re-run the same publisher from the same extraction directory. It can resume an empty repository or finish Pages setup when the remote commit exactly matches the local release. If the remote branch has been changed elsewhere, it stops. Use normal `git fetch`/review rather than forcing the initial publisher over a changed repository.

A rejected workflow permission may require `gh auth refresh --hostname github.com --scopes repo,workflow`, then the same publish command. If repository upload succeeds but Pages administration is denied, open repository **Settings > Pages**, select **Deploy from a branch**, **main**, **/ (root)**, and save. Wait for GitHub to report the build status. Never infer successful hosting merely from a successful push.

## Future updates

After first publication, edit your clone normally, run the tests, inspect `git diff`, then commit and push. The first-publish hash allowlist intentionally blocks silent edits to the prepared release; it is not a replacement for normal development. New runtime versions can keep the same Pages origin and storage keys to preserve saves.

## Documentation checked

- GitHub CLI repository creation: https://cli.github.com/manual/gh_repo_create
- GitHub CLI authentication: https://cli.github.com/manual/gh_auth_login
- GitHub Pages REST API: https://docs.github.com/en/rest/pages/pages
- GitHub Pages limits: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
