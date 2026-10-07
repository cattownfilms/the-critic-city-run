#!/usr/bin/env python3
"""First publication of the prepared public game. Uses your locally authenticated gh.
No token is read, printed, embedded in the game, or sent anywhere except by GitHub CLI.
Refuses private/unrelated repositories and refuses to overwrite divergent history.
"""
from __future__ import annotations
import argparse, base64, hashlib, json, os, re, shutil, subprocess, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROJECT = 'cattown-critic-city-run'
DEFAULT_OWNER = 'cattownfilms'
DEFAULT_REPO = 'the-critic-city-run'
class PublishError(RuntimeError): pass

def run(args: list[str], *, root: Path = ROOT, data: str | None = None, check: bool = True, timeout: int = 120, live: bool = False):
    try:
        p = subprocess.run(args, cwd=root, input=data, text=True, capture_output=not live, timeout=timeout, env={**os.environ, "GH_HOST": "github.com"})
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise PublishError(f'{args[0]} could not complete: {exc}') from exc
    if check and p.returncode:
        raise PublishError(f'{args[0]} failed: {(p.stderr or p.stdout).strip()}')
    return p

def api(endpoint: str, *, method: str = 'GET', payload: dict | None = None, optional: bool = False, root: Path = ROOT):
    cmd = ['gh', 'api', '--hostname', 'github.com', '-H', 'Accept: application/vnd.github+json', '-X', method, endpoint]
    if payload is not None: cmd += ['--input', '-']
    p = run(cmd, root=root, data=json.dumps(payload) if payload is not None else None, check=False)
    if p.returncode:
        if optional and ('HTTP 404' in p.stderr or '(404)' in p.stderr): return None
        raise PublishError(f'GitHub {method} {endpoint}: {(p.stderr or p.stdout).strip()}')
    try: return json.loads(p.stdout) if p.stdout.strip() else {}
    except ValueError as exc: raise PublishError('GitHub returned invalid JSON; nothing will be guessed.') from exc

def safe_name(value: str, owner: bool = False) -> str:
    pat = r'[A-Za-z0-9][A-Za-z0-9-]{0,38}' if owner else r'[A-Za-z0-9][A-Za-z0-9._-]{0,99}'
    if not re.fullmatch(pat, value) or value in {'.', '..'}: raise PublishError('Invalid repository owner or name.')
    return value

def inventory(root: Path = ROOT) -> list[str]:
    """Allowlist only the reviewed files. Newly dropped files never get published."""
    p = root / 'PUBLIC-FILES.json'
    if not p.is_file(): raise PublishError('PUBLIC-FILES.json is missing. Use the prepared repository ZIP.')
    manifest = json.loads(p.read_text(encoding='utf-8'))
    if manifest.get('project') != PROJECT: raise PublishError('Wrong publication manifest.')
    out = []
    for rel, expected in manifest.get('sha256', {}).items():
        q = Path(rel)
        if q.is_absolute() or '..' in q.parts or '\\' in rel or not rel or q.parts[0] == '.git':
            raise PublishError('Unsafe publication path: ' + rel)
        f = root / q
        if f.is_symlink() or not f.is_file(): raise PublishError('Missing/linked publication file: ' + rel)
        if not f.resolve().is_relative_to(root.resolve()): raise PublishError('Publication path leaves the game folder.')
        if hashlib.sha256(f.read_bytes()).hexdigest() != expected:
            raise PublishError('Prepared file changed: ' + rel + '. Review your edits and use ordinary git, or restore the release before first publication.')
        if f.stat().st_size >= 95 * 1024 * 1024: raise PublishError('File too large for this publication route: ' + rel)
        out.append(rel)
    if not all(x in out for x in ['index.html', 'app.js', 'gamepad.js', 'assets/sprites.json', '.critic-project.json', 'NOTICE.md']):
        raise PublishError('Prepared game is incomplete.')
    out.append('PUBLIC-FILES.json')
    return sorted(out)

def check_remote(meta: dict | None, owner: str, repo: str):
    if meta is None: return
    if str(meta.get('full_name', '')).lower() != f'{owner}/{repo}'.lower(): raise PublishError('GitHub returned a different repository.')
    if meta.get('private') is not False: raise PublishError('An existing private repository will NOT be made public. Choose another name.')
    if not meta.get('permissions', {}).get('admin'): raise PublishError('Administrator permission is required to publish Pages for this repository.')

def publish(owner: str, repo: str, *, yes: bool = False, root: Path = ROOT, wait_seconds: int = 120):
    owner, repo = safe_name(owner, True), safe_name(repo)
    files = inventory(root)
    for binary in ('git', 'gh'):
        if not shutil.which(binary): raise PublishError(f'{binary} is not installed. In Termux: pkg install git gh python')
    # Verify identity using the authenticated API, not a cached profile or email.
    try: user = api('user', root=root)
    except PublishError as exc:
        raise PublishError('Authenticate locally first: gh auth login --hostname github.com --git-protocol https --web --scopes workflow\n' + str(exc)) from exc
    if str(user.get('login', '')).lower() != owner.lower():
        raise PublishError(f'You are signed in as {user.get("login", "unknown")}, not {owner}. Switch GitHub CLI accounts before publishing.')
    target = f'{owner}/{repo}'
    meta = api('repos/' + target, optional=True, root=root)
    check_remote(meta, owner, repo)
    # Listing branches first avoids treating an empty repository's HTTP 409 as a missing ref.
    branches = api('repos/' + target + '/branches', root=root) if meta else []
    if branches and not any(b.get('name') == 'main' for b in branches):
        raise PublishError('Repository already contains another branch. Use a new empty repository.')
    remote_head = api('repos/' + target + '/git/ref/heads/main', root=root) if branches else None
    print(f'Public destination: https://github.com/{target}')
    print(f'Contents: {len(files)} reviewed game/source files, including supplied art, music, and sound.')
    print('Private prompts, original videos, credentials, local saves, and build duplicates are excluded.')
    print('Review NOTICE.md: this is a fan-made game; included media are not newly relicensed.')
    if not yes and input('Type PUBLISH to make these files public: ').strip() != 'PUBLISH':
        print('Cancelled. No remote changes made.'); return {'published': False, 'cancelled': True}
    if not (root / '.git').exists():
        if remote_head: raise PublishError('That repository is not empty. No history will be overwritten. Choose a new name or clone the existing repository.')
        run(['git', 'init', '--initial-branch=main', '.'], root=root)
        run(['git', 'config', '--local', 'user.name', owner], root=root)
        run(['git', 'config', '--local', 'user.email', f'{user["id"]}+{owner}@users.noreply.github.com'], root=root)
        run(['git', 'config', '--local', 'core.autocrlf', 'false'], root=root)
    if run(['git', 'branch', '--show-current'], root=root).stdout.strip() != 'main': raise PublishError('Local branch is not main. No branch will be reset.')
    local_top = Path(run(['git', 'rev-parse', '--show-toplevel'], root=root).stdout.strip()).resolve()
    if local_top != root.resolve(): raise PublishError('This folder is inside a different Git repository.')
    remote = run(['git', 'remote', 'get-url', 'origin'], root=root, check=False)
    url = 'https://github.com/' + target + '.git'
    if remote.returncode == 0 and remote.stdout.strip() not in {url, url[:-4]}: raise PublishError('Local origin points elsewhere. It will not be changed.')
    head = run(['git', 'rev-parse', '--verify', 'HEAD'], root=root, check=False)
    if remote_head and (head.returncode or remote_head['object']['sha'] != head.stdout.strip()):
        raise PublishError('Remote main differs from this release. No force-push or automatic merge will be performed.')
    tracked = set(run(['git', 'ls-files'], root=root).stdout.splitlines())
    if tracked - set(files): raise PublishError('Other files are already tracked here. Use a fresh extracted release folder.')
    if not head.returncode and run(['git', 'status', '--porcelain', '--untracked-files=no'], root=root).stdout.strip():
        raise PublishError('The local release has uncommitted tracked changes. Resolve them first.')
    if head.returncode:
        # Explicit paths only. Never use git add . on a user folder.
        for i in range(0, len(files), 50): run(['git', 'add', '--', *files[i:i + 50]], root=root)
        run(['git', 'commit', '-m', 'Publish THE CRITIC: COMING ATTRACTIONS v7'], root=root)
    if meta is None:
        run(['gh', 'repo', 'create', target, '--public', '--description', 'Fan-made browser brawler with touch, keyboard and optional controller support.'], root=root)
        meta = api('repos/' + target, root=root); check_remote(meta, owner, repo)
    if remote.returncode: run(['git', 'remote', 'add', 'origin', url], root=root)
    # Credential helper is local to this clone; never embeds an access token in a remote URL.
    run(['git', 'config', '--local', '--unset-all', 'credential.https://github.com.helper'], root=root, check=False)
    run(['git', 'config', '--local', '--add', 'credential.https://github.com.helper', ''], root=root)
    run(['git', 'config', '--local', '--add', 'credential.https://github.com.helper', '!gh auth git-credential'], root=root)
    print('Uploading the game. Keep this terminal open; no force push is used.', flush=True)
    pushed = run(['git', 'push', '--progress', '--set-upstream', 'origin', 'main'], root=root, check=False, timeout=1800, live=True)
    if pushed.returncode:
        raise PublishError('Upload did not complete. Retrying this script safely resumes the same release.\n' + (pushed.stderr or '') + '\nFor a workflow-scope error, run: gh auth refresh --hostname github.com --scopes repo,workflow')
    print('Repository uploaded: ' + meta['html_url'], flush=True)
    endpoint = 'repos/' + target + '/pages'
    pages = api(endpoint, optional=True, root=root)
    if pages:
        src = pages.get('source', {})
        if src.get('branch') != 'main' or src.get('path') != '/' or pages.get('cname'):
            raise PublishError('Existing Pages configuration differs. Repository uploaded, but Pages settings were left unchanged.')
    else:
        try: pages = api(endpoint, method='POST', payload={'build_type': 'legacy', 'source': {'branch': 'main', 'path': '/'}}, root=root)
        except PublishError as exc:
            raise PublishError('Repository uploaded. Pages was not enabled. In repository Settings > Pages, select Deploy from a branch, main, / (root).\n' + str(exc)) from exc
    try: api(endpoint, method='PUT', payload={'https_enforced': True}, root=root)
    except PublishError: print('HTTPS enforcement may need the certificate to finish provisioning; check Settings > Pages.')
    site = pages.get('html_url')
    if not site: raise PublishError('Repository uploaded, but GitHub did not return a playable site URL. Check Settings > Pages.')
    print('GitHub returned the site address: ' + site)
    print('Waiting briefly for the Pages build, not assuming it is already live.', flush=True)
    built = pages.get('status') == 'built'
    deadline = time.monotonic() + max(0, min(wait_seconds, 300))
    while not built and time.monotonic() < deadline:
        time.sleep(5)
        latest = api(endpoint + '/builds/latest', optional=True, root=root)
        if latest and latest.get('status') == 'errored': raise PublishError('Repository is uploaded, but Pages build failed: ' + str(latest.get('error')))
        built = bool(latest and latest.get('status') == 'built')
    state = {'published': True, 'repository': meta['html_url'], 'site': site, 'pagesBuild': 'built' if built else 'pending', 'version': '8.0.0'}
    (root / '.publish-state.json').write_text(json.dumps(state, indent=2), encoding='utf-8')
    print(('Pages reports the build complete. Share: ' if built else 'Pages is still building. Share this address once Settings > Pages reports success: ') + site)
    return state

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--owner', default=DEFAULT_OWNER); p.add_argument('--repo', default=DEFAULT_REPO)
    p.add_argument('--yes', action='store_true', help='Explicitly consent to public publication without the PUBLISH prompt.')
    p.add_argument('--check-only', action='store_true', help='Verify local reviewed-file hashes; no account access or publication.')
    a = p.parse_args()
    try:
        if a.check_only: print(f'Local reviewed-file verification passed: {len(inventory())} files. Nothing published.'); return
        publish(a.owner, a.repo, yes=a.yes)
    except (PublishError, ValueError, KeyError, EOFError) as exc: print('\nSTOPPED: ' + str(exc), file=sys.stderr); raise SystemExit(1)
if __name__ == '__main__': main()
