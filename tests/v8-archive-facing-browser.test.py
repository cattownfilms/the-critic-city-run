"""Actual renderer and gallery facing for retained, audited source aliases.

Metadata remains byte-for-byte frozen in the production semantic suite. These
checks prove that archives draw in the requested direction without frame edits.
"""
from pathlib import Path
import argparse,json
from playwright.sync_api import sync_playwright
from browser_support import source_site,launch_options,standalone_path
from load_helper import load_html
ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--engine',choices=['chromium','firefox','webkit'],default='chromium');ap.add_argument('--url',default='local');ap.add_argument('--output',type=Path);args=ap.parse_args()
results=[];errors=[]
def check(name,passed,details=None):
 results.append({'name':name,'passed':bool(passed),'details':details});print('PASS' if passed else 'FAIL',name,details or '',flush=True)
with source_site(args.url) as url,sync_playwright() as pw:
 b=None
 try:
  b=getattr(pw,args.engine).launch(**launch_options(args.engine));p=b.new_page(viewport={'width':960,'height':540});p.on('pageerror',lambda e:errors.append(str(e)))
  if args.url=='standalone':load_html(p,standalone_path().read_text())
  else:p.goto(url);p.wait_for_function('__brawler.ready()',timeout=120000)
  evidence=p.evaluate('''()=>{const r=__brawler.renderer(),m=__brawler.meta(),a=document.createElement('canvas'),b=document.createElement('canvas');a.width=b.width=600;a.height=b.height=400;const ac=a.getContext('2d'),bc=b.getContext('2d'),pixels=[],bounds=[],native=[];let drawn=0;
    const aliases=Object.entries(m.sourcePreservationAliases).filter(([key])=>key!=='franklin/cartwheel-run');
    for(const [key,archived] of aliases){const [who,name]=key.split('/'),archive=archived.split('/')[1],action=m.characters[who][name],old=m.characters[who][archive];let elapsed=0;
      for(let i=0;i<action.frames.length;i++){for(const face of [-1,1]){const t=(elapsed+action.frames[i].ms/2)/1000;ac.clearRect(0,0,600,400);bc.clearRect(0,0,600,400);r.shadow(ac,who,name,300,340,face,t,0);r.shadow(bc,who,archive,300,340,face,t,0);r.sprite(ac,who,name,300,340,face,t,0,{loop:false});r.sprite(bc,who,archive,300,340,face,t,0,{loop:false});const aa=ac.getImageData(0,0,600,400).data,bb=bc.getImageData(0,0,600,400).data;if(!aa.every((v,j)=>v===bb[j]))pixels.push({key,i,face});drawn++;}
        if(r.nativeFacing(who,name,action.frames[i],action)!==r.nativeFacing(who,archive,old.frames[i],old))native.push({key,i});elapsed+=action.frames[i].ms;}
      for(const face of [-1,1])if(JSON.stringify(r.animationBounds(who,name,face))!==JSON.stringify(r.animationBounds(who,archive,face)))bounds.push({key,face});}
    const old=m.characters.franklin['legacy-source-cartwheel-run'];return {aliases:aliases.length,drawn,pixels,bounds,native,cartwheelFrames:old.frames.length,cartwheelNative:old.frames.map(f=>r.nativeFacing('franklin','legacy-source-cartwheel-run',f,old))};}''')
  check('Every frame of all eight same-frame archived actions matches active sprite and shadow pixels at both requested facings',evidence['aliases']==8 and evidence['drawn']==162 and not evidence['pixels'] and not evidence['native'],evidence)
  check('Archived geometry follows corrected active facing without changing source pivots',not evidence['bounds'],evidence['bounds'])
  check('The distinct six-pose generated cartwheel retains its own right-facing source orientation',evidence['cartwheelFrames']==6 and evidence['cartwheelNative']==[1]*6)
  p.locator('#galleryButton').click();p.locator('#playAnim').click();ui=[]
  # Observe the actual gallery draw instead of assuming a frame occurred within
  # 60 ms on a busy runner. Delegate all pixels and geometry to the real renderer.
  p.evaluate('''()=>{const r=__brawler.renderer(),sprite=r.sprite;
    r.sprite=function(...args){const result=sprite.apply(this,args);
      if(args[0].canvas.id==='galleryCanvas')window.__galleryFrame={who:args[1],animation:args[2]};
      return result;};}''')
  def gallery_image(who,animation):
   p.evaluate('window.__galleryFrame=null')
   p.select_option('#characterSelect',who);p.select_option('#animSelect',animation)
   p.wait_for_function('([who,animation])=>window.__galleryFrame?.who===who&&window.__galleryFrame?.animation===animation',arg=[who,animation],timeout=10000)
   return p.locator('#galleryCanvas').evaluate('c=>c.toDataURL()')
  aliases=p.evaluate('Object.entries(__brawler.meta().sourcePreservationAliases).filter(([k])=>k!=="franklin/cartwheel-run")')
  for active,archive in aliases:
   who,name=active.split('/',1);old=archive.split('/',1)[1]
   first=gallery_image(who,name)
   second=gallery_image(who,old)
   ui.append({'action':active,'matches':first==second})
  check('Actual Animation Room selection keeps the same corrected body, shadow and centered framing for all audited archives',all(x['matches'] for x in ui) and not errors,{'gallery':ui,'errors':errors})
 except Exception as e:check('Archive facing browser execution completed',False,str(e))
 finally:
  version=b.version if b else None
  if b:b.close()
  report={'engine':args.engine,'browserVersion':version,'tests':results,'passed':sum(x['passed'] for x in results),'failed':sum(not x['passed'] for x in results),'errors':errors,'boundary':'Actual decoded renderer and real gallery controls. Eight same-frame archives are compared at every frame and both facings; the distinct generated cartwheel keeps its own source metadata. No metadata or frame pixels are altered.'}
  path=args.output or ROOT/'tests'/f'v8-archive-facing-{args.engine}-results.json';path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(report,indent=2)+'\n')
if report['failed']:raise SystemExit(1)
