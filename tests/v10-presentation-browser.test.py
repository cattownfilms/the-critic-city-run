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
  page.evaluate("const s=__brawler.scenes();s.index=s.shots.findIndex(q=>q.id==='activation');s._shot();s.paused=true;s.time=.15;s.update(0)")
  dark=page.evaluate("Array.from(__brawler.scenes().canvas.getContext('2d').getImageData(455,66,1,1).data)")
  page.screenshot(path=str(photos/f'{a.engine}-button-before-power.png'))
  page.evaluate("const s=__brawler.scenes();s.time=.55;s.update(0)")
  lit=page.evaluate("Array.from(__brawler.scenes().canvas.getContext('2d').getImageData(455,66,1,1).data)")
  check('First red-button contact precedes actual TV illumination',dark!=lit,dict(before=dark,after=lit))
  page.screenshot(path=str(photos/f'{a.engine}-button-powered.png'))
  for width,height in [(915,412),(360,800),(1280,720),(640,360)]:
   page.set_viewport_size(dict(width=width,height=height))
   report=page.evaluate("""()=>{const s=__brawler.scenes();s.paused=true;let tested=0,errors=[];
    for(const world of [false,true]){s.el.classList.toggle('world-stage',world);
     for(const route of ['hero','franklin'])for(const scene of Object.values(CriticCutscenes.scenes))for(const shot of CriticCutscenes.resolveScene(scene,route).shots){
      if(shot.gameplayEntry||!(shot.dialogue||shot.caption||shot.objective))continue;
      s.shots=[shot];s.index=0;s._shot();const d=document.querySelector('#sceneDialogue'),p=document.querySelector('.scene-copy'),button=document.querySelector('#sceneAdvance');
      document.querySelector('.scene-portrait-frame').hidden=false;
      const box=p.getBoundingClientRect(),action=button.getBoundingClientRect();tested++;
      if(!s.active||s.el.hidden||box.width===0||box.height===0||d.scrollHeight>d.clientHeight+1||d.scrollWidth>d.clientWidth+1||box.bottom>innerHeight+1||action.bottom>innerHeight+1||action.top<box.top)errors.push({id:scene.id,text:d.textContent,world,textHeight:d.scrollHeight,available:d.clientHeight,boxBottom:box.bottom,buttonBottom:action.bottom});
     }}return {tested,errors};}""")
   check(f'Every authored line fits {width}×{height} on both routes and overlay types',not report['errors'],report)
   page.screenshot(path=str(photos/f'{a.engine}-dialogue-{width}.png'))
  skip_story(page);page.set_viewport_size(dict(width=915,height=412))
  for route in ['hero','franklin']:
   page.evaluate("""route=>{const g=__brawler.game;g.franklinUnlocked=true;g.start(null,route);g.stage=0;g.nextGate=3;g.activeGate=-1;g.advanceStage();g.finishStageClear();for(const e of g.drain())__brawler.handleEvent(e);}""",route)
   page.wait_for_function('__brawler.scenes().active&&!__brawler.scenes().loading',timeout=60000)
   departed=page.evaluate("""async()=>{let last=null;while(__brawler.scenes().shot.id==='transport'){const s=__brawler.scenes(),d=s.actorStates.find(a=>a.id==='duke');if(d)last={x:d.x,camera:__brawler.game.camera,width:__brawler.renderer().rect.w};await new Promise(r=>setTimeout(r,80));}return last;}""")
   check(route+': Duke leaves the visible stage before pursuit begins',departed and departed['x']>departed['camera']+departed['width']+50,departed)
   page.wait_for_function("__brawler.scenes().shot.id==='pursuit-entry'",timeout=10000)
   positions=[]
   for _ in range(12):positions.append(page.evaluate('__brawler.game.p.x'));page.wait_for_timeout(120)
   page.wait_for_function("!!__brawler.scenes().shot.dialogue",timeout=10000)
   state=page.evaluate('({p:__brawler.game.p.x,camera:__brawler.game.camera,width:__brawler.renderer().rect.w,face:__brawler.game.p.face})')
   check(route+': offscreen pursuit runs physically into a stopped, visible dialogue mark',positions[-1]>positions[0]+100 and all(y>=x-1 for x,y in zip(positions,positions[1:])) and state['camera']<state['p']<state['camera']+state['width'] and state['face']==1,dict(positions=positions,state=state))
   page.screenshot(path=str(photos/f'{a.engine}-{route}-pursuit.png'));skip_story(page)
  page.evaluate("""()=>{const g=__brawler.game;g.stage=4;g.resetWorld();g.mode='pause';g.activeGate=2;g.camera=1820;g.p.x=2250;g.p.y=407;g.configureProjection();g.updateProjection(2.5);g.updateProjection(.5);__brawler.renderer().draw(g,0);}""")
  page.screenshot(path=str(photos/f'{a.engine}-projection-eyes.png'))
  check('Projectionist remains eyes-only after half a real second of simulation',page.evaluate("__brawler.game.projection.phase==='shadow'"))
  page.evaluate("""()=>{const g=__brawler.game;g.updateProjection(.66);g.projection.shots=3;g.updateProjection(.56);g.updateProjection(.75);__brawler.renderer().draw(g,0);}""")
  page.screenshot(path=str(photos/f'{a.engine}-radio-windup.png'))
  value=page.evaluate("""()=>{const g=__brawler.game,a=g.projection,b=a.booths[a.window];return {ready:a.remoteReady,phase:a.phase,face:a.face,expected:g.p.x<b.x?-1:1};}""")
  check('Radio is visibly held during its separate windup and faces the player',value['ready'] and value['phase']=='telegraph' and value['face']==value['expected'],value)
  page.evaluate("""()=>{const g=__brawler.game;g.updateProjection(.41);g.updateProps(.35);__brawler.renderer().draw(g,0);}""")
  page.screenshot(path=str(photos/f'{a.engine}-radio-flight.png'))
  page.evaluate("""()=>{const g=__brawler.game;g.stage=6;g.resetWorld();g.mode='play';g.activeGate=2;g.camera=1820;g.p.x=2200;g.p.y=407;g.spawnBoss();g.drain();const e=g.enemies[0];for(let n=0;n<700&&(!g.broadcastSummons.waveStarted||g.broadcastSummons.phase!=='shielded');n++){g.updateEnemies(1/120);g.updateBroadcastSummons(1/120);}g.mode='pause';g.updateMachine(e,4);g.updateMachine(e,.85);g.updateMachine(e,.51);__brawler.renderer().draw(g,0);}""")
  page.screenshot(path=str(photos/f'{a.engine}-broadcast-laser.png'))
  check('Rail device exposes a finite visible laser during the live enemy wave',page.evaluate("__brawler.game.enemies[0].telegraph?.firing&&__brawler.game.enemies.some(e=>e.broadcastSummon&&e.hp>0)&&!__brawler.game.enemies[0].targetable"))
  page.evaluate("""()=>{const g=__brawler.game,e=g.enemies[0];for(const q of g.enemies.filter(q=>q.broadcastSummon))g.registerHit(q,{damage:9999,kb:0});g.mode='play';g.updateBroadcastSummons(.01);g.broadcastSummons.timer=.7;g.updateMachine(e,.01);g.mode='pause';__brawler.renderer().draw(g,0);}""")
  page.screenshot(path=str(photos/f'{a.engine}-transmitter-crash.png'))
  for route in ['hero','franklin']:
   page.evaluate("""route=>{const g=__brawler.game;g.playerKind=route;g.stage=6;g.resetWorld();g.p.x=2220;g.p.y=407;g.camera=1820;g.storyCage={x:2620,y:407,open:false};g.storyActors=[{id:'marty',kind:'marty',x:2620,y:407,face:-1,anim:'trapped',animT:0,renderScale:.92}];__brawler.scenes().play(CriticCutscenes.scenes.ending,()=>{});}""",route)
   page.wait_for_function('__brawler.scenes().active&&!__brawler.scenes().loading',timeout=60000)
   travel=page.evaluate("""async()=>{const xs=[];for(let i=0;i<46;i++){xs.push(__brawler.game.storyActors.find(a=>a.kind==='marty').x);await new Promise(r=>setTimeout(r,50));}return xs;}""")
   check(route+': rescue never overshoots or reverses away from the reunion mark',all(y<=x+.75 for x,y in zip(travel,travel[1:])),travel)
   value=page.evaluate("""()=>{const g=__brawler.game,m=g.storyActors.find(a=>a.kind==='marty'),father=g.playerKind==='hero'?g.p:g.storyActors.find(a=>a.id==='jay');return {distance:m.x-father.x,martyFace:m.face,fatherFace:father.face,cage:g.storyCage.x,marty:m.x};}""")
   check(route+': Marty stops beside Jay while the opened cart remains at its known position',abs(value['distance']-70)<5 and value['martyFace']==-1 and value['fatherFace']==1 and value['cage']==2620,value)
   page.screenshot(path=str(photos/f'{a.engine}-{route}-rescue.png'));skip_story(page)
  value=page.evaluate("""()=>{const m=__brawler.meta(),wanted={hero:['v10-fall','v10-recover','v10-reunion'],franklin:['v10-fall','v10-recover','v10-victory'],duke:['v10-button','v10-shoulder','v10-backhand','v10-one-two','v10-flurry','v10-defeat'],spike:['v10-walk','v10-can-windup','v10-can-release']};return Object.entries(wanted).flatMap(([bank,names])=>names.filter(n=>!m.characters[bank][n]?.frames.length).map(n=>bank+'/'+n));}""")
  check('Reviewed supplemental runtime actions resolve in their canonical banks',not value,value)
  check('No uncaught v10 presentation errors',not errors,errors)
 except Exception as e:check('V10 browser fixtures completed',False,str(e))
 finally:
  report=dict(engine=a.engine,tests=results,passed=sum(r['passed'] for r in results),failed=sum(not r['passed'] for r in results));Path(__file__).with_name('v10-presentation-'+a.engine+'-results.json').write_text(json.dumps(report,indent=2)+'\n');b.close()
raise SystemExit(1 if report['failed'] else 0)
