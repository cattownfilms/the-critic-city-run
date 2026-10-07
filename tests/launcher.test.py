"""Run the actual self-contained launcher and compare real loopback HTTP responses."""
from pathlib import Path
import tempfile,subprocess,os,time,urllib.request,json,hashlib,signal
ROOT=Path(__file__).resolve().parents[1]
html=Path(os.environ.get('CRITIC_HTML',ROOT/'The-Critic-Coming-Attractions-v7.html'))
script=Path(os.environ.get('CRITIC_LAUNCHER',ROOT/'The-Critic-Coming-Attractions-v7-Play.sh'))
results=[]
def check(name,ok,details=None):
    results.append({'name':name,'passed':bool(ok),'details':details});print('PASS' if ok else 'FAIL',name,flush=True)
with tempfile.TemporaryDirectory(prefix='brawler-launcher-') as home:
    env={**os.environ,'HOME':home,'CRITIC_NO_BROWSER':'1','PYTHONUNBUFFERED':'1'}
    proc=subprocess.Popen(['bash',str(script)],env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,start_new_session=True)
    try:
        url='http://127.0.0.1:8788/'
        data=None
        for _ in range(100):
            if proc.poll() is not None:raise RuntimeError(proc.stdout.read().decode())
            try:
                with urllib.request.urlopen(url+'version.json',timeout=.5) as r:data=json.load(r)
                break
            except OSError:time.sleep(.1)
        check('Launcher starts its dedicated local server',data and data.get('app')=='cattown-critic-brawler-v7',data)
        with urllib.request.urlopen(url,timeout=5) as r:
            body=r.read();mime=r.headers.get('Content-Type');cache=r.headers.get('Cache-Control')
        expected=hashlib.sha256(html.read_bytes()).hexdigest()
        check('Served HTML is byte-identical to standalone',hashlib.sha256(body).hexdigest()==expected,{'bytes':len(body),'sha256':expected})
        check('HTML response has the correct MIME type',mime=='text/html; charset=utf-8')
        check('Local index uses no-cache to avoid stale updates',cache=='no-cache')
        index=Path(home)/'.local/share/cattown/critic-brawler/index.html'
        check('Only the new brawler directory receives the extracted game',index.exists() and not (Path(home)/'.local/share/cattown/critic-cityrun').exists())
        second=subprocess.run(['bash',str(script)],env=env,capture_output=True,timeout=20)
        check('A second launch reuses the same server without killing it',second.returncode==0 and proc.poll() is None and b'already running' in second.stdout)
        try:urllib.request.urlopen(url+'../../etc/passwd',timeout=2);safe=False
        except urllib.error.HTTPError as e:safe=e.code==404
        check('Local server exposes only the intended endpoints',safe)
    finally:
        if proc.poll() is None:
            os.killpg(proc.pid,signal.SIGINT)
            try:proc.wait(timeout=5)
            except subprocess.TimeoutExpired:os.killpg(proc.pid,signal.SIGTERM);proc.wait(timeout=3)
report={'tests':results,'passed':sum(t['passed'] for t in results),'failed':sum(not t['passed'] for t in results),'boundary':'Actual Python loopback server and downloaded-launcher payload tested in Linux. No physical Termux/Android installation claimed.'}
(ROOT/'tests/launcher-results.json').write_text(json.dumps(report,indent=2))
if report['failed']:raise SystemExit(1)
