"""Publication dry-run tests. Git operations run in temp folders; all GitHub I/O is mocked."""
from pathlib import Path
from unittest.mock import patch
import base64, importlib.util, json, hashlib, tempfile, subprocess
R=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('publisher',R/'tools/publish.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
res=[]
def check(name,test):
 try:test();res.append({'name':name,'passed':True});print('PASS',name)
 except Exception as exc:res.append({'name':name,'passed':False,'details':repr(exc)});print('FAIL',name,repr(exc))
def assert_(ok):assert ok

def make_root(root):
 files=['index.html','app.js','gamepad.js','assets/sprites.json','.critic-project.json','NOTICE.md']
 for rel in files:
  p=root/rel;p.parent.mkdir(exist_ok=True,parents=True);p.write_text(m.PROJECT if rel=='.critic-project.json' else 'reviewed test fixture')
 data={'project':m.PROJECT,'sha256':{rel:hashlib.sha256((root/rel).read_bytes()).hexdigest() for rel in files}}
 (root/'PUBLIC-FILES.json').write_text(json.dumps(data));return files

def inventory_tests():
 with tempfile.TemporaryDirectory() as d:
  root=Path(d);files=make_root(root);assert m.inventory(root)==sorted(files+['PUBLIC-FILES.json'])
  (root/'private-notes.txt').write_text('not public');assert 'private-notes.txt' not in m.inventory(root)
check('Only reviewed paths are published; extra user files are excluded',inventory_tests)
def bad_content():
 with tempfile.TemporaryDirectory() as d:
  r=Path(d);make_root(r);(r/'app.js').write_text('tampered')
  try:m.inventory(r);raise AssertionError('tamper accepted')
  except m.PublishError:pass
check('Changed content stops publication',bad_content)
def traversal():
 with tempfile.TemporaryDirectory() as d:
  r=Path(d);make_root(r);v=json.loads((r/'PUBLIC-FILES.json').read_text());v['sha256']['../private']='a';(r/'PUBLIC-FILES.json').write_text(json.dumps(v))
  try:m.inventory(r);raise AssertionError('path accepted')
  except m.PublishError:pass
check('Path traversal is rejected',traversal)
def private():
 try:m.check_remote({'full_name':'cattownfilms/the-critic-city-run','private':True},'cattownfilms','the-critic-city-run');raise AssertionError()
 except m.PublishError:pass
check('Existing private repositories never become public',private)
def names():
 for n in ['../project','--public','a/b','x;rm -rf','']:
  try:m.safe_name(n);raise AssertionError(n)
  except m.PublishError:pass
check('Unsafe names cannot become CLI flags or paths',names)
def transient():
 with patch.object(m,'run',return_value=subprocess.CompletedProcess([],1,'','network failure')):
  try:m.api('repos/a/b',optional=True);raise AssertionError()
  except m.PublishError:pass
check('Network errors are not mistaken for a missing repository',transient)
def optional404():
 with patch.object(m,'run',return_value=subprocess.CompletedProcess([],1,'','gh: Not Found (HTTP 404)')):assert m.api('repos/a/b',optional=True) is None
check('A verified HTTP 404 is the optional missing-resource path',optional404)

class FakeGitHub:
 def __init__(self,root,login='cattownfilms',existing=False,private=False,remote_head=False):
  self.root=root;self.login=login;self.exists=existing;self.private=private;self.head=remote_head;self.calls=[];self.push=[];self.real=m.run
 def api(self,endpoint,method='GET',payload=None,optional=False,root=None):
  self.calls.append((method,endpoint,payload))
  if endpoint=='user':return {'login':self.login,'id':266597162}
  if endpoint.endswith('/branches'):return [{'name':'main'}] if self.head else []
  if endpoint.endswith('/git/ref/heads/main'):return {'object':{'sha':'different-history'}}
  if endpoint.endswith('/pages'):
   if method=='GET':return None
   if method=='POST':return {'html_url':'https://example.test/critic/','status':'built'}
   return {}
  return {'full_name':'cattownfilms/the-critic-city-run','html_url':'https://example.test/repo','private':self.private,'permissions':{'admin':True}} if self.exists else None
 def run(self,args,**kw):
  if args[0]=='gh':
   self.calls.append(('CLI',args,None));self.exists=True;return subprocess.CompletedProcess(args,0,'','')
  if args[:2]==['git','push']:
   self.push.append(args);return subprocess.CompletedProcess(args,0,'','')
  return self.real(args,**kw)
def scenario(mode):
 with tempfile.TemporaryDirectory() as d:
  root=Path(d);files=make_root(root)
  f=FakeGitHub(root,login='wrong-account' if mode=='account' else 'cattownfilms',existing=mode in ['existing','empty','private'],private=mode=='private',remote_head=mode=='existing')
  with patch.object(m,'api',f.api),patch.object(m,'run',f.run),patch.object(m.shutil,'which',return_value='/fake/bin'),patch('builtins.input',return_value='CANCEL'):
   if mode in ['account','existing','private']:
    try:m.publish('cattownfilms','the-critic-city-run',yes=True,root=root,wait_seconds=0);raise AssertionError('unsafe remote accepted')
    except m.PublishError:pass
    assert not f.push
    assert not any(c[0] in ['POST','PUT','CLI'] for c in f.calls)
   elif mode=='cancel':
    out=m.publish('cattownfilms','the-critic-city-run',yes=False,root=root);assert out['cancelled'] and not (root/'.git').exists() and not f.push
   else:
    out=m.publish('cattownfilms','the-critic-city-run',yes=True,root=root,wait_seconds=0)
    assert out['published'] and out['pagesBuild']=='built' and len(f.push)==1 and '--force' not in f.push[0]
    tracked=set(m.run(['git','ls-files'],root=root).stdout.splitlines());assert tracked==set(files+['PUBLIC-FILES.json'])
    assert not any(x in tracked for x in ['.publish-state.json','private-notes.txt'])
    assert any(c[0]=='POST' and c[1].endswith('/pages') and c[2]['source']=={'branch':'main','path':'/'} for c in f.calls)
    email=m.run(['git','config','user.email'],root=root).stdout.strip();assert email.endswith('@users.noreply.github.com')
for mode,name in [('account','Wrong authenticated account stops before any remote mutation'),('existing','Unrelated existing main is not overwritten'),('private','Private repository rejected during complete preflight'),('cancel','Declining PUBLISH leaves local and remote repositories unchanged'),('new','New public repo is committed, pushed, and Pages configured through mocked API'),('empty','Existing empty public repo accepts initial publication without ref-error guesswork')]:
 check(name,lambda mode=mode:scenario(mode))
report={'tests':res,'passed':sum(x['passed'] for x in res),'failed':sum(not x['passed'] for x in res),'boundary':'Real local git repositories; mocked GitHub CLI/API network mutations. No public repository was created by these tests.'}
(R/'tests/publish-results.json').write_text(json.dumps(report,indent=2))
if report['failed']:raise SystemExit(1)
