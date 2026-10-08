"""V10 real-browser layout, source-animation and continuous staging fixtures.
Fixtures are isolated from personal saves; campaign-browser remains the normal-input route test.
"""
from pathlib import Path
import argparse,json
from playwright.sync_api import sync_playwright
from browser_support import source_site,launch_options,skip_story
p=argparse.ArgumentParser();p.add_argument('--engine',default='chromium');p.add_argument('--url',default='local');a=p.parse_args();results=[];errors=[]
def check(name,value,details=None):
 results.append(dict(name=name,passed=bool(value),details=details));print('PASS' if value else 'FAIL',name,details or '',flush=True)
photos=Path(__file__).parent/'screenshots-v10';photos.mkdir(exist_ok=True)
with source_site(a.url) as url,sync_playwright() as pw:
 b=getattr(pw,a.engine).launch(**launch_options(a.engine));page=b.new_page(viewport={'width':915,'height':412},has_touch=True);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(url);page.wait_for_function('__brawler.ready()',timeout=120000);page.locator('#startButton').tap();page.wait_for_function('__brawler.scenes().active&&!__brawler.scenes().loading',timeout=60000)
  check('Runtime reports v10 with schema-five save lineage',page.evaluate("BRAWLER_CONFIG.version==='10.0.0'&&__brawler.game.snapshot().version===5"))
  for width,height in [(915,412),(360,800),(1280,720),(640,360)]:
   page.set_viewport_size(dict(width=width,height=height))
   report=page.evaluate("""()=>{const s=__brawler.scenes();s.paused=true;let tested=0,errors=[];
    for(const world of [false,true]){s.el.classList.toggle('world-stage',world);
     for(const route of ['hero','franklin'])for(const scene of Object.values(CriticCutscenes.scenes))for(const shot of CriticCutscenes.resolveScene(scene,route).shots){
      if(!(shot.dialogue||shot.caption||shot.objective))continue;
      s.shots=[shot];s.index=0;s._shot();const d=document.querySelector('#sceneDialogue'),p=document.querySelector('.scene-copy'),button=document.querySelector('#sceneAdvance');
      document.querySelector('.scene-portrait-frame').hidden=false;
      const box=p.getBoundingClientRect(),action=button.getBoundingClientRect();tested++;
      if(d.scrollHeight>d.clientHeight+1||d.scrollWidth>d.clientWidth+1||box.bottom>innerHeight+1||action.bottom>innerHeight+1||action.top<box.top)errors.push({id:scene.id,text:d.textContent,world,textHeight:d.scrollHeight,available:d.clientHeight,boxBottom:box.bottom,buttonBottom:action.bottom});
     }}return {tested,errors};}""")
   check(f'Every authored line fits {width}×{height} on both routes and overlay types',not report['errors'],report)
   page.screenshot(path=str(photos/f'{a.engine}-dialogue-{width}.png'))
  skip_story(page);page.set_viewport_size(dict(width=915,height=412))
  for route in ['hero','franklin']:
   page.evaluate("""route=>{const g=__brawler.game;g.franklinUnlocked=true;g.start(null,route);g.stage=0;g.nextGate=3;g.activeGate=-1;g.advanceStage();g.finishStageClear();for(const e of g.drain())__brawler.handleEvent(e);}""",route)
   page.wait_for_function('__brawler.scenes().active&&!__brawler.scenes().loading',timeout=60000)
   page.wait_for_function("__brawler.scenes().shot.id==='pursuit-entry'",timeout=10000)
   positions=[]
   for _ in range(12):positions.append(page.evaluate('__brawler.game.p.x'));page.wait_for_timeout(120)
   page.wait_for_function("!!__brawler.scenes().shot.dialogue",timeout=10000)
   state=page.evaluate('({p:__brawler.game.p.x,camera:__brawler.game.camera,width:__brawler.renderer().rect.w,face:__brawler.game.p.face})')
   check(route+': offscreen pursuit runs physically into a stopped, visible dialogue mark',positions[-1]>positions[0]+100 and all(y>=x-1 for x,y in zip(positions,positions[1:])) and state['camera']<state['p']<state['camera']+state['width'] and state['face']==1,dict(positions=positions,state=state))
   page.screenshot(path=str(photos/f'{a.engine}-{route}-pursuit.png'));skip_story(page)
  value=page.evaluate("""()=>{const m=__brawler.meta(),wanted={hero:['v10-fall','v10-recover','v10-reunion'],franklin:['v10-fall','v10-recover','v10-victory'],duke:['v10-button','v10-shoulder','v10-backhand','v10-one-two','v10-flurry','v10-defeat'],spike:['v10-walk','v10-can-windup','v10-can-release']};return Object.entries(wanted).flatMap(([bank,names])=>names.filter(n=>!m.characters[bank][n]?.frames.length).map(n=>bank+'/'+n));}""")
  check('Reviewed supplemental runtime actions resolve in their canonical banks',not value,value)
  check('No uncaught v10 presentation errors',not errors,errors)
 except Exception as e:check('V10 browser fixtures completed',False,str(e))
 finally:
  report=dict(engine=a.engine,tests=results,passed=sum(r['passed'] for r in results),failed=sum(not r['passed'] for r in results));Path(__file__).with_name('v10-presentation-'+a.engine+'-results.json').write_text(json.dumps(report,indent=2)+'\n');b.close()
raise SystemExit(1 if report['failed'] else 0)
