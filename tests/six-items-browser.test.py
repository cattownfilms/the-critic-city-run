"""Isolated micro-patch fixtures. Never runs a campaign or touches personal saves."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import source_site,launch_options,wait_scene,skip_story
p=argparse.ArgumentParser();p.add_argument('--url',default='local');a=p.parse_args();out=Path(__file__).parent/'screenshots-playtest/six-items';out.mkdir(parents=True,exist_ok=True);results=[];errors=[]
def check(n,v,d=None):
 results.append(dict(name=n,passed=bool(v),details=d));print('PASS' if v else 'FAIL',n,d or '',flush=True)
with source_site(a.url) as url,sync_playwright() as pw:
 browser=pw.chromium.launch(**launch_options('chromium'));ctx=browser.new_context(viewport={'width':915,'height':412},has_touch=True,record_video_dir=str(out));page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(url);page.wait_for_function('__brawler.ready()',timeout=120000)
  # Seed an isolated compatible checkpoint; migration must infer completed prior stages.
  page.evaluate("localStorage.setItem(BRAWLER_CONFIG.saveKey,JSON.stringify({version:5,stage:3,nextGate:1,score:4321,playerKind:'hero',franklinUnlocked:true}));localStorage.setItem(BRAWLER_CONFIG.profileKey,JSON.stringify({franklinUnlocked:true,selected:'franklin'}))")
  page.reload();page.wait_for_function('__brawler.ready()',timeout=120000)
  checkpoint=page.evaluate('localStorage.getItem(BRAWLER_CONFIG.saveKey)')
  page.locator('#movesButton').tap()
  check('Only completed stages enabled',page.locator('#stageReplaySelect option:not([disabled])').count()==3 and page.locator('#stageReplaySelect option').count()==7)
  page.locator('summary').filter(has_text='STAGE SELECT').tap();page.locator('#stageReplaySelect').select_option('1');page.locator('#stageReplayStart').tap();wait_scene(page)
  check('Replay uses selected Franklin and normal stage opening',page.evaluate('__brawler.game.playerKind==="franklin"&&__brawler.game.stage===1&&__brawler.scenes().scene.id==="stage-02-intro"'))
  skip_story(page)
  page.evaluate("__brawler.game.checkpointSave();for(const e of __brawler.game.drain())__brawler.handleEvent(e)")
  check('Replay checkpoint never writes Continue',page.evaluate('localStorage.getItem(BRAWLER_CONFIG.saveKey)')==checkpoint)
  page.evaluate("const g=__brawler.game;g.mode='stageclear';__brawler.handleEvent({type:'stageClear',stage:1,next:2})")
  page.wait_for_timeout(700);page.locator('#clearContinue').tap();page.wait_for_timeout(150)
  check('Replay finishes at Stage Select, preserves Continue',page.locator('#pause').is_visible() and page.evaluate('localStorage.getItem(BRAWLER_CONFIG.saveKey)')==checkpoint)
  page.reload();page.wait_for_function('__brawler.ready()',timeout=120000);check('Stage unlocks survive reload',page.evaluate('__brawler.getProfile().completedStages.join(",")==="0,1,2"'))
  page.locator('#startButton').tap();wait_scene(page);skip_story(page)
  page.evaluate("__brawler.handleEvent({type:'stageClear',stage:3,next:4})")
  check('New completion permanently unlocks stage',page.evaluate('__brawler.getProfile().completedStages.includes(3)'))
  # Receiver staging and real wave event, without changing wave intervals.
  page.evaluate("const b=__brawler,g=b.game;g.stage=6;g.resetWorld();g.makePlayer();g.p.x=2200;g.camera=1900;g.activeGate=2;g.spawnBoss();g.drain();g.storyActors=[{id:'duke',kind:'duke',x:2610,y:305,face:-1,anim:'idle',animT:0,renderScale:1.18*.63,backdrop:true},{id:'marty',kind:'marty',x:2740,y:305,face:-1,anim:'v11-captive-idle',animT:0,renderScale:.63,backdrop:true}];g.storyCage={x:2740,y:305,scale:.63,backdrop:true};g.mode='play';b.handleEvent({type:'broadcastWave',wave:1});")
  page.wait_for_timeout(100);page.screenshot(path=str(out/'receiver-button.png'))
  check('Duke presses at real wave event beside grounded cage',page.evaluate("const g=__brawler.game,d=g.storyActors.find(a=>a.kind==='duke');d.anim==='v10-button'&&d.y===g.storyCage.y&&d.x===2610&&d.backdrop"))
  page.wait_for_timeout(1300);check('Duke returns to background idle',page.evaluate("__brawler.game.storyActors.find(a=>a.kind==='duke').anim==='idle'"));page.screenshot(path=str(out/'receiver-idle.png'))
  # New registered Hurt is available and renders in the real boss bank.
  page.evaluate("const g=__brawler.game;g.mode='pause';g.stage=4;g.resetWorld();g.makePlayer();g.projection.disabled=true;g.activeGate=2;g.spawnBoss();g.drain();const e=g.enemies.find(e=>e.kind==='pizzeria-boss');e.entry=null;e.hidden=false;e.x=650;e.y=407;e.state='hurt';e.timer=.2;e.anim='hurt';e.animDuration=.5;g.camera=0")
  page.wait_for_timeout(100);page.screenshot(path=str(out/'rabbi-hurt.png'));check('Hurt asset decoded',page.evaluate('__brawler.renderer().available("pizzeria-boss","hurt")'))
  for route in ['hero','franklin']:
   page.set_viewport_size({'width':412,'height':915})
   page.evaluate("""route=>{const b=__brawler,g=b.game;g.stage=5;g.resetWorld();g.playerKind=route;g.makePlayer();g.p.x=300;g.camera=0;g.mode='pause';b.renderer().draw(g,0);const original=CriticCutscenes.scenes['boss-spike-defeat'];b.scenes().play({...original,shots:[{speaker:'JAY',dialogue:'Camera fixture',actors:[{id:'player',character:'selected',worldX:300,x:300,y:318},{id:'spike',character:'spike',worldX:1450,x:1450,y:318}]}]},()=>{});} """,route)
   wait_scene(page)
   trace=page.evaluate("""async()=>{const b=__brawler,g=b.game,s=b.scenes(),r=b.renderer(),log=[];for(let n=0;n<280;n++){await new Promise(requestAnimationFrame);const f=s.playerFraming;log.push({x:g.p.x,y:g.p.y,face:g.p.face,anim:g.p.anim,camera:g.camera,bounds:f,active:s.cameraState?.active});}return log;}""")
   (out/f'{route}-framing.json').write_text(json.dumps(trace,indent=2));check(route+' cinematic run physically keeps player visible',any(t['anim']=='run' for t in trace) and all(t['bounds'] is None or t['bounds']['left']>=-1 and t['bounds']['right']<=761 for t in trace),trace[-1]);check(route+' feet remain grounded and pan settles',all(t['y']==407 for t in trace) and not trace[-1]['active'] and trace[-1]['anim']!='run');page.screenshot(path=str(out/f'{route}-framing.png'));page.locator('#sceneSkip').tap()
  # Aircraft contact is tied to the original flash frame, before collapse.
  page.set_viewport_size({'width':915,'height':412})
  page.evaluate("const b=__brawler,g=b.game;g.stage=6;g.mode='pause';g.skyline={time:2.9,images:b.scenes().imageCache,reduced:false}")
  # Prepare ending images through the existing cache path.
  page.evaluate("__brawler.scenes().play(CriticCutscenes.scenes.ending,()=>{})");wait_scene(page)
  page.evaluate("const s=__brawler.scenes();s.index=s.shots.findIndex(x=>x.skyline);s._shot();s.time=2.9;s.togglePause(true);s.update(0)");page.wait_for_timeout(100);page.screenshot(path=str(out/'aircraft-approach.png'))
  check('Aircraft approaches before existing impact',page.evaluate('__brawler.game.skyline.aircraft.visible&&__brawler.game.skyline.frame===0'))
  page.evaluate("const s=__brawler.scenes();s.time=2.9+7/24;s.update(0)");page.wait_for_timeout(100);page.screenshot(path=str(out/'aircraft-impact.png'));check('Contact synchronized to original flash',page.evaluate('!__brawler.game.skyline.aircraft.visible&&__brawler.game.skyline.frame===7'))
  page.locator('#sceneSkip').tap();check('No uncaught browser errors',not errors,errors)
 except Exception as e:
  check('Fixtures completed',False,str(e));page.screenshot(path=str(out/'failure.png'))
 finally:ctx.close();browser.close()
Path(__file__).with_name('six-items-results.json').write_text(json.dumps(results,indent=2));raise SystemExit(0 if all(x['passed'] for x in results) else 1)
