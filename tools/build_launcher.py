"""Build the self-contained local-browser launcher for the user's Termux workflow."""
from pathlib import Path
import base64,gzip,hashlib,sys
html=Path(sys.argv[1]).read_bytes();out=Path(sys.argv[2]);sha=hashlib.sha256(html).hexdigest()
header='''#!/usr/bin/env bash
# THE CRITIC: COMING ATTRACTIONS v6.0. Offline game, local browser launcher.
# The embedded game is extracted only when you run this script.
set -euo pipefail
PYTHON="$(command -v python3 || command -v python || true)"
if [ -z "$PYTHON" ]; then
  printf '\\nPython is needed to serve the game locally. In Termux, run:\\n  pkg install python\\nThen run this launcher again.\\n'
  exit 1
fi
"$PYTHON" - "$0" <<'PYGAME'
from pathlib import Path
import base64,gzip,hashlib,http.server,json,os,subprocess,sys,urllib.request
MARKER=b"\\n__CRITIC_EMBEDDED_BRAWLER_V6__\\n"
raw=Path(sys.argv[1]).read_bytes().split(MARKER,1)[1]
html=gzip.decompress(base64.b64decode(raw))
EXPECTED="__SHA256__"
if hashlib.sha256(html).hexdigest()!=EXPECTED:
    raise SystemExit('The launcher download is incomplete. Download it again.')
app=Path.home()/'.local/share/cattown/critic-brawler';app.mkdir(parents=True,exist_ok=True)
f=app/'index.html';tmp=app/'index.html.tmp'
if f.exists() and f.read_bytes()!=html:
    backup=app/'index-before-v6.html'
    if not backup.exists():backup.write_bytes(f.read_bytes())
tmp.write_bytes(html);tmp.replace(f)
HOST='127.0.0.1';PORT=8788;URL=f'http://{HOST}:{PORT}/';TAG='cattown-critic-brawler-v6'
def open_browser():
    if os.environ.get('CRITIC_NO_BROWSER')=='1':return
    for cmd in (['termux-open-url',URL],['am','start','-a','android.intent.action.VIEW','-d',URL],['xdg-open',URL]):
        try:
            result=subprocess.run(cmd,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=10)
            if result.returncode==0:return
        except (FileNotFoundError,subprocess.TimeoutExpired):pass
    print('Open this address in your browser:',URL)
class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        path=self.path.split('?',1)[0]
        if path in ('/','/index.html'):
            data=f.read_bytes();mime='text/html; charset=utf-8'
        elif path=='/version.json':
            data=json.dumps({'app':TAG,'version':'6.0','sha256':hashlib.sha256(f.read_bytes()).hexdigest()}).encode();mime='application/json'
        elif path=='/favicon.ico':
            self.send_response(204);self.end_headers();return
        else:
            self.send_error(404);return
        self.send_response(200);self.send_header('Content-Type',mime);self.send_header('Content-Length',str(len(data)));self.send_header('Cache-Control','no-cache');self.end_headers();self.wfile.write(data)
    def log_message(self,*args):pass
class Server(http.server.ThreadingHTTPServer):allow_reuse_address=True
try:server=Server((HOST,PORT),Handler)
except OSError:
    try:
        with urllib.request.urlopen(URL+'version.json',timeout=2) as r:existing=json.load(r)
        if existing.get('app') in (TAG,'cattown-critic-brawler-v5','cattown-critic-brawler-v2','cattown-critic-brawler-v3','cattown-critic-brawler-v4'):
            print('Coming Attractions is already running. Opening the updated game.');open_browser();raise SystemExit(0)
    except (OSError,ValueError):pass
    raise SystemExit('Port 8788 is occupied by another app. Stop that app, then run again. No files or saves were deleted.')
print('THE CRITIC: COMING ATTRACTIONS')
print('Game ready at '+URL)
print('All graphics and music are on this phone. No internet is required.')
print('Leave this Termux session open for reloads. Ctrl+C stops the local server.')
print('Save location: browser storage for '+URL)
open_browser()
try:server.serve_forever()
except KeyboardInterrupt:print('\\nComing Attractions launcher stopped. Your browser save is kept.')
finally:server.server_close()
PYGAME
exit 0
__CRITIC_EMBEDDED_BRAWLER_V6__
'''.replace('__SHA256__',sha)
encoded=base64.encodebytes(gzip.compress(html,compresslevel=9)).decode();out.write_text(header+encoded);out.chmod(0o755);print(out,out.stat().st_size)
