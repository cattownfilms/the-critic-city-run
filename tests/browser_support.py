"""Shared browser-test setup; source HTTP is served in the test's own process."""
from contextlib import contextmanager
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os, threading

ROOT = Path(__file__).resolve().parents[1]

def standalone_path():
    override = os.environ.get('CRITIC_HTML')
    if override:
        return Path(override)
    for name in ['The-Critic-Coming-Attractions-v6.html', 'The-Critic-City-Brawler-v5.html']:
        path = ROOT / name
        if path.exists():
            return path
    raise FileNotFoundError('Build the standalone HTML first with tools/build_standalone.py')

def launch_options(engine='chromium', audio=False):
    options = {'headless': True, 'timeout': 15000}
    if engine == 'chromium':
        binary = os.environ.get('CRITIC_CHROMIUM')
        if binary:
            options['executable_path'] = binary
        elif Path('/usr/bin/chromium').exists():
            options['executable_path'] = '/usr/bin/chromium'
        options['args'] = ['--no-sandbox', '--disable-dev-shm-usage']
        if audio:
            options['args'].append('--autoplay-policy=no-user-gesture-required')
    if engine == 'firefox':
        options['env'] = {**os.environ, 'MOZ_DISABLE_CONTENT_SANDBOX': '1', 'MOZ_DISABLE_GMP_SANDBOX': '1'}
    return options

@contextmanager
def source_site(url='local'):
    """Use a caller URL, or serve the current authoring source for --url local."""
    if url != 'local':
        yield url
        return
    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f'http://127.0.0.1:{server.server_address[1]}/'
    finally:
        server.shutdown()
        server.server_close()
