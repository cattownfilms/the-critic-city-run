"""Upgrade the reviewed v9 installation with the actual v10 launcher on port 8788.

The old launcher's Python bootstrap runs verbatim in this process, so the
loopback server remains reachable in test environments with process isolation.
This exercises its real HTTP handler and the new Bash/Python updater. Browser
save migration and physical Android testing are separate checks.
"""
from pathlib import Path
import hashlib
import json
import os
import socket
import subprocess
import sys
import tempfile
import threading
import time
import urllib.request
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
BASELINE = os.environ.get('CRITIC_V9_REF', 'ba087d21a1699ffec1fd923d17a18b796ae37ab6')
NEW_HTML = Path(os.environ.get('CRITIC_HTML', ROOT / 'The-Critic-Coming-Attractions-v10.html'))
NEW_LAUNCHER = Path(os.environ.get('CRITIC_LAUNCHER', ROOT / 'The-Critic-Coming-Attractions-v10-Play.sh'))
URL = 'http://127.0.0.1:8788/'
results = []


def check(name, ok, details=None):
    results.append({'name': name, 'passed': bool(ok), 'details': details})
    print('PASS' if ok else 'FAIL', name, flush=True)


def baseline_blob(name):
    return subprocess.run(['git', 'show', f'{BASELINE}:{name}'], cwd=ROOT,
                          check=True, capture_output=True).stdout


def prepare_v9(folder):
    """Rebuild the actual reviewed offline game, without a historical download."""
    override = os.environ.get('CRITIC_V9_LAUNCHER')
    if override:
        launcher = Path(override)
        if not launcher.is_file():
            raise FileNotFoundError(f'CRITIC_V9_LAUNCHER does not exist: {launcher}')
        return launcher
    source = folder / 'baseline-v9'
    source.mkdir()
    for name in ['index.html', 'style.css', 'cutscenes.css', 'cutscenes.js', 'data/campaign.js', 'data/cutscenes.js', 'engine.js', 'render.js', 'config.js',
                 'gamepad.js', 'controller-ui.js', 'app.js',
                 'tools/build_standalone.py', 'tools/build_launcher.py',
                 'assets/sprites.json']:
        target = source / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(baseline_blob(name))
    # Runtime assets are restored from the reviewed commit too: later atlases and
    # metadata changes cannot accidentally turn the old fixture into a v10 game.
    names = subprocess.run(['git', 'ls-tree', '-r', '--name-only', BASELINE, 'assets/'],
                           cwd=ROOT, check=True, text=True, capture_output=True).stdout.splitlines()
    for name in names:
        if name.endswith(('.png', '.webp', '.mp3', '.wav')):
            target = source / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(baseline_blob(name))
    subprocess.run([sys.executable, str(source / 'tools/build_standalone.py')],
                   check=True, capture_output=True)
    old_html = source / 'The-Critic-Coming-Attractions-v9.html'
    launcher = folder / 'The-Critic-Coming-Attractions-v9-Play.sh'
    subprocess.run([sys.executable, str(source / 'tools/build_launcher.py'),
                    str(old_html), str(launcher)], check=True, capture_output=True)
    return launcher


def bootstrap(path):
    code = path.read_text().split("<<'PYGAME'\n", 1)[1].split('\nPYGAME\n', 1)[0]
    if '__CRITIC_EMBEDDED_BRAWLER_V9__' not in code:
        raise AssertionError('Upgrade fixture must use the v9 launcher bootstrap.')
    return code


if not NEW_HTML.is_file() or not NEW_LAUNCHER.is_file():
    raise FileNotFoundError('Build the v10 standalone HTML and launcher before running this test. '
                            'See docs/PUBLISHING.md for the two build commands.')
# This fixed port is part of the save-origin contract. Never stop an unrelated
# process to make the test pass; launcher tests must run serially.
with socket.socket() as probe:
    # Match the launcher's reusable HTTP listener so a completed preceding test's
    # TIME_WAIT connections are not mistaken for an unrelated active server.
    probe.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        probe.bind(('127.0.0.1', 8788))
    except OSError as exc:
        raise RuntimeError('Port 8788 is occupied. Run launcher tests serially after stopping '
                           'your own local test server; this test will not kill it.') from exc

with tempfile.TemporaryDirectory(prefix='critic-v9-v10-upgrade-') as temporary:
    folder = Path(temporary)
    old = prepare_v9(folder)
    home = folder / 'user-home'
    home.mkdir()
    env = {**os.environ, 'HOME': str(home), 'CRITIC_NO_BROWSER': '1', 'PYTHONUNBUFFERED': '1'}
    namespace = {'__name__': '__main__'}
    failures = []

    def serve_old():
        try:
            exec(compile(bootstrap(old), str(old), 'exec'), namespace)
        except BaseException as exc:
            failures.append(repr(exc))

    with patch.dict(os.environ, env), patch.object(sys, 'argv', [str(old), str(old)]):
        thread = threading.Thread(target=serve_old, daemon=True)
        thread.start()
        try:
            version = None
            for _ in range(150):
                if failures:
                    raise RuntimeError('v9 server could not start: ' + '; '.join(failures))
                try:
                    with urllib.request.urlopen(URL + 'version.json', timeout=.5) as response:
                        version = json.load(response)
                    if version.get('app') == 'cattown-critic-brawler-v9':
                        break
                except OSError:
                    pass
                time.sleep(.1)
            if not version:
                raise RuntimeError('The v9 local server did not become available on port 8788.')
            server = namespace['server']
            index = home / '.local/share/cattown/critic-brawler/index.html'
            original = index.read_bytes()
            expected = NEW_HTML.read_bytes()
            check('Reviewed v9 launcher starts on the retained 8788 browser origin',
                  version.get('app') == 'cattown-critic-brawler-v9' and thread.is_alive(),
                  {'origin': URL, 'baseline': BASELINE})
            check('The installed v9 payload differs from the new v10 payload',
                  original != expected and b"version:'9.0.0'" in original and b"version:'10.0.0'" in expected)

            retained = {
                index.parent / 'existing-save-marker.json': b'{"keep":"installed companion data"}',
                home / '.config/chromium/Default/Local Storage/leveldb/keep-save.fixture':
                    b'cattown.critic.brawler.v3.save=existing-browser-progress',
                home / '.local/share/cattown/critic-cityrun/user-save.json':
                    b'{"keep":"unrelated legacy app data"}',
            }
            for path, value in retained.items():
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(value)
            first = subprocess.run(['bash', str(NEW_LAUNCHER)], env=env,
                                   capture_output=True, timeout=60)
            check('v10 reuses the running v9 server without replacing its process',
                  first.returncode == 0 and thread.is_alive() and namespace['server'] is server
                  and b'already running' in first.stdout,
                  {'returncode': first.returncode, 'stderr': first.stderr.decode()[:500]})
            with urllib.request.urlopen(URL, timeout=10) as response:
                served = response.read()
                cache = response.headers.get('Cache-Control')
            check('The same origin immediately serves the exact complete v10 HTML',
                  served == expected and index.read_bytes() == expected,
                  {'bytes': len(served), 'sha256': hashlib.sha256(served).hexdigest()})
            check('Updated HTML is not trapped behind a stale browser cache', cache == 'no-cache')
            backup = index.with_name('index-before-v10.html')
            check('The original installed v9 HTML is backed up byte-for-byte',
                  backup.is_file() and backup.read_bytes() == original)
            second = subprocess.run(['bash', str(NEW_LAUNCHER)], env=env,
                                    capture_output=True, timeout=60)
            check('Repeat launch reuses the live server and preserves the original backup',
                  second.returncode == 0 and thread.is_alive() and namespace['server'] is server
                  and backup.read_bytes() == original and b'already running' in second.stdout)
            check('Existing browser-profile, companion, and unrelated legacy files are intact',
                  all(path.read_bytes() == value for path, value in retained.items()))
            check('Upgrade keeps the same install directory with no stale temporary file',
                  sorted(path.name for path in index.parent.iterdir()) ==
                  ['existing-save-marker.json', 'index-before-v10.html', 'index.html'])
            with urllib.request.urlopen(URL + 'version.json', timeout=5) as response:
                final_version = json.load(response)
            check('The retained v9 server reports the hash of the updated v10 file',
                  final_version.get('app') == 'cattown-critic-brawler-v9'
                  and final_version.get('sha256') == hashlib.sha256(expected).hexdigest())
        finally:
            if namespace.get('server'):
                namespace['server'].shutdown()
                namespace['server'].server_close()
            thread.join(timeout=5)

report = {'tests': results, 'passed': sum(item['passed'] for item in results),
          'failed': sum(not item['passed'] for item in results),
          'boundary': 'Reviewed v9 offline payload and launcher rebuilt from git; original v9 Python '
                      'bootstrap and HTTP handler run verbatim in a same-process thread. Actual v10 '
                      'Bash launcher updates that installation twice on loopback port 8788. Retained '
                      'filesystem sentinels checked; browser localStorage migration is tested separately. '
                      'No physical Android or Termux testing claimed.'}
(ROOT / 'tests/upgrade-launcher-results.json').write_text(json.dumps(report, indent=2))
if report['failed']:
    raise SystemExit(1)
