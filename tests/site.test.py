"""Real HTTP asset requests, project-subpath resolution and no-secret publication checks.
This is not a browser navigation test: browser engine coverage is reported separately.
"""
from pathlib import Path
import functools,http.server,json,re,runpy,tempfile,threading,urllib.request,urllib.parse,subprocess
R=Path(__file__).resolve().parents[1];res=[]
def ck(name,ok,details=None):
 res.append({'name':name,'passed':bool(ok),'details':details});print('PASS' if ok else 'FAIL',name,details or '')
html=(R/'index.html').read_text();refs=re.findall(r'(?:src|href)="([^"#]+)"',html)
meta=json.loads((R/'assets/sprites.json').read_text());refs+=['assets/'+p['file'] for p in meta['pages']]+['assets/'+p.name for p in (R/'assets').glob('*.mp3')]+['assets/'+p.name for p in (R/'assets').glob('*.wav')]+['assets/sprites.json']
refs+=['assets/'+p.relative_to(R/'assets').as_posix() for p in (R/'assets').rglob('*') if p.is_file() and p.suffix in {'.webp','.png','.jpg'}];refs=sorted(set(r for r in refs if not r.startswith(('data:','http:','https:'))))
local_path=lambda ref:urllib.parse.unquote(urllib.parse.urlparse(ref).path)
ck('All HTML, atlas, soundtrack and cue references are relative local files',all(not local_path(x).startswith('/') and (R/local_path(x)).is_file() for x in refs),{'references':len(refs)})
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(R.parent)));threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/{R.name}/'
try:
 with urllib.request.urlopen(base) as response:ck('Root index loads under a repository-style URL subpath',response.read()==html.encode())
 errors=[]
 for ref in refs:
  with urllib.request.urlopen(urllib.parse.urljoin(base,ref)) as response:
   payload=response.read()
   if payload!=(R/local_path(ref)).read_bytes():errors.append(ref)
 ck('Every runtime reference serves exact bytes beneath that subpath',not errors,errors)
finally:server.shutdown();server.server_close()
manifest=json.loads((R/'manifest.webmanifest').read_text());ck('Web manifest stays inside the repository URL scope',manifest['scope']=='./' and manifest['start_url']=='./index.html')
ck('JavaScript gamepad modules are loaded before the browser shell',html.index('src="gamepad.js')<html.index('src="app.js') and html.index('src="controller-ui.js')<html.index('src="app.js'))
ck('Source does not require an external runtime CDN',not re.search(r'<(?:script|link)[^>]+(?:src|href)="https?://',html))
campaign=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('./data/campaign.js').STAGES))"],cwd=R));ck('Seven authored stages preserve the established opening four',len(campaign)==7 and [x['name'] for x in campaign[:4]]==['Broadway Blocks','Last Train Uptown','Above the Avenue','Theater District'])
counts={'states':sum(len(v) for v in meta['characters'].values()),'frames':sum(len(a['frames']) for v in meta['characters'].values() for a in v.values()),'pages':len(meta['pages'])}
baseline=json.loads((R/'tests/v6-frame-semantic-baseline.json').read_text());semantic_errors=runpy.run_path(str(R/'tests/production-assets.test.py'))['semantic_baseline_errors'](meta,baseline,R/'assets');ck('Every accepted animation retains exact decoded pixels, timing, registration and frame order after dependency repacking',not semantic_errors,{**counts,'errors':semantic_errors[:20]})
ck('Music and SFX libraries remain complete',len(list((R/'assets').glob('*.mp3')))==5 and len(list((R/'assets').glob('*.wav')))==13)
ck('No file in the runtime asset set approaches the GitHub per-file limit',max(x.stat().st_size for x in (R/'assets').iterdir() if x.is_file())<95*1024*1024)
report={'tests':res,'passed':sum(t['passed'] for t in res),'failed':sum(not t['passed'] for t in res),'boundary':'Actual Python loopback HTTP reads under a repository-style subpath. No live GitHub Pages deployment or browser URL navigation is claimed.'}
(R/'tests/site-results.json').write_text(json.dumps(report,indent=2))
if report['failed']:raise SystemExit(1)
