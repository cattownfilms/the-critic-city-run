"""Test updating a running v4 local server without changing its origin or killing it.
Requires the original v4 launcher via CRITIC_V4_LAUNCHER; not an Android OS test.
"""
from pathlib import Path
import tempfile,subprocess,os,time,urllib.request,json,hashlib,signal
R=Path(__file__).resolve().parents[1];old=Path(os.environ.get('CRITIC_V4_LAUNCHER','/mnt/data/The-Critic-Brawler-v4-Play.sh'));new=Path(os.environ.get('CRITIC_LAUNCHER','/mnt/data/The-Critic-Brawler-v5-Play.sh'));results=[]
def check(name,ok,details=None):
 results.append(dict(name=name,passed=bool(ok),details=details));print('PASS' if ok else 'FAIL',name,flush=True)
with tempfile.TemporaryDirectory(prefix='critic-update-') as home:
 env={**os.environ,'HOME':home,'CRITIC_NO_BROWSER':'1','PYTHONUNBUFFERED':'1'};p=subprocess.Popen(['bash',str(old)],env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,start_new_session=True)
 try:
  url='http://127.0.0.1:8788/'
  for _ in range(150):
   if p.poll() is not None:raise RuntimeError(p.stdout.read().decode())
   try:
    with urllib.request.urlopen(url+'version.json',timeout=.5) as r:v=json.load(r)
    if v.get('app')=='cattown-critic-brawler-v4':break
   except OSError:pass
   time.sleep(.1)
  index=Path(home)/'.local/share/cattown/critic-brawler/index.html';oldbytes=index.read_bytes()
  update=subprocess.run(['bash',str(new)],env=env,capture_output=True,timeout=30)
  check('v5 reuses the already-running v4 server on the same browser origin',update.returncode==0 and p.poll() is None and b'already running' in update.stdout)
  with urllib.request.urlopen(url,timeout=5) as r:served=r.read()
  expected=(R/'The-Critic-City-Brawler-v5.html').read_bytes()
  check('The existing v4 server immediately serves the exact new v5 game',served==expected)
  backup=index.with_name('index-before-v5.html');check('The old installed HTML is backed up without being rewritten',backup.read_bytes()==oldbytes)
  second=subprocess.run(['bash',str(new)],env=env,capture_output=True,timeout=30)
  check('Repeated update does not replace the original backup',second.returncode==0 and backup.read_bytes()==oldbytes)
  check('No separate origin directory or delete operation is introduced',sorted(x.name for x in index.parent.iterdir())==['index-before-v5.html','index.html'])
 finally:
  if p.poll() is None:
   os.killpg(p.pid,signal.SIGINT)
   try:p.wait(timeout=5)
   except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGTERM);p.wait(timeout=3)
report={'tests':results,'passed':sum(x['passed'] for x in results),'failed':sum(not x['passed'] for x in results),'boundary':'Actual v4 and v5 self-contained launchers on temporary Linux HOME and loopback port 8788. Same-origin upgrade tested. Browser save migration is tested separately; no physical Android.'}
(R/'tests/upgrade-launcher-results.json').write_text(json.dumps(report,indent=2))
if report['failed']:raise SystemExit(1)
