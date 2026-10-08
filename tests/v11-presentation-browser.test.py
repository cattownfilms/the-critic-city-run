"""Actual v11 scene rendering and tutorial lifecycle, both selected-player routes."""
from pathlib import Path
import argparse,json
from playwright.sync_api import sync_playwright
from browser_support import source_site,launch_options,skip_story
p=argparse.ArgumentParser();p.add_argument('--engine',default='chromium');p.add_argument('--url',default='local');a=p.parse_args();results=[];errors=[]
def check(name,value,details=None):
 results.append(dict(name=name,passed=bool(value),details=details));print('PASS' if value else 'FAIL',name,details or '',flush=True)
photos=Path(__file__).parent/'screenshots-v11';photos.mkdir(exist_ok=True)
with source_site(a.url) as url,sync_playwright() as pw:
 b=getattr(pw,a.engine).launch(**launch_options(a.engine));page=b.new_page(viewport={'width':915,'height':412},has_touch=True);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(url);page.wait_for_function('__brawler.ready()',timeout=120000);page.locator('#startButton').tap();page.wait_for_function('__brawler.scenes().active&&!__brawler.scenes().loading',timeout=60000);skip_story(page)
  check('Public/source runtime is v11 and schema 5',page.evaluate("BRAWLER_CONFIG.version==='11.0.0'&&__brawler.game.snapshot().version===5"))
  for route in ['hero','franklin']:
   page.set_viewport_size({'width':915,'height':412} if route=='hero' else {'width':360,'height':800})
   page.evaluate("""route=>{const g=__brawler.game;g.playerKind=route;g.stage=5;g.resetWorld();g.makePlayer();g.p.x=2200;g.p.y=407;g.camera=1820;g.activeGate=g.nextGate=2;g.spawnBoss();g.drain();const e=g.enemies[0];e.entry=null;e.hidden=false;e.x=2600;e.y=407;__brawler.scenes().play(CriticCutscenes.scenes['boss-spike-intro'],()=>{});}""",route)
   page.wait_for_function('__brawler.scenes().active&&!__brawler.scenes().loading',timeout=60000)
   page.evaluate("const s=__brawler.scenes();s.index=s.shots.findIndex(q=>q.id==='tutorial-marks');s._shot()")
   page.wait_for_function('__brawler.game.spikeTutorial?.can?.phase==="rolling"',timeout=15000)
   page.screenshot(path=str(photos/f'{a.engine}-{route}-tutorial-roll.png'))
   check(route+' tutorial leaves the combat floor unobscured',page.evaluate("document.querySelector('.scene-copy').hidden"))
   page.wait_for_function('__brawler.game.p.z>65',timeout=5000)
   page.screenshot(path=str(photos/f'{a.engine}-{route}-tutorial-jump.png'))
   check(route+' uses selected player real airborne jump',page.evaluate("__brawler.game.p.hp===100&&__brawler.game.spikeTutorial.jumped&&__brawler.game.p.z>58"))
   page.wait_for_function('!__brawler.scenes().active',timeout=15000)
   check(route+' tutorial cleans projectile and returns grounded without damage',page.evaluate("__brawler.game.spikeTutorial===null&&__brawler.game.p.hp===100&&__brawler.game.p.z===0&&!__brawler.game.projectiles.some(q=>q.tutorial)"))
  page.set_viewport_size({'width':915,'height':412})
  page.evaluate("""()=>{const g=__brawler.game;g.playerKind='hero';g.stage=6;g.resetWorld();g.makePlayer();g.camera=0;__brawler.scenes().play(CriticCutscenes.scenes['stage-07-intro'],()=>{});}""")
  page.wait_for_function('__brawler.scenes().active&&!__brawler.scenes().loading',timeout=60000)
  travel=page.evaluate("""async()=>{const out=[];for(let i=0;i<12;i++){const g=__brawler.game,d=g.storyActors.find(a=>a.kind==='duke'),m=g.storyActors.find(a=>a.kind==='marty');if(d&&m)out.push({x:d.x,cart:g.storyCage.x,gap:m.x-d.x,anim:d.anim});await new Promise(r=>setTimeout(r,75));}return out;}""")
  check('Duke physically pushes separate cart with stable contact spacing',len(travel)>5 and all(abs(t['gap']-130)<.01 for t in travel) and travel[-1]['x']>travel[0]['x'] and any(t['anim']=='v11-cart-push' for t in travel),travel)
  page.screenshot(path=str(photos/f'{a.engine}-duke-cart-push.png'));skip_story(page)
  page.evaluate("""()=>{const g=__brawler.game;g.stage=4;g.resetWorld();g.activeGate=2;g.camera=1820;g.p.x=2250;g.configureProjection();g.drain();g.mode='pause';g.updateProjection(2.41);g.updateProjection(.5);__brawler.renderer().draw(g,0);}""")
  check('Exactly three booths above screen and eyes-only phase',page.evaluate("__brawler.game.projection.booths.length===3&&__brawler.game.projection.windowY===92&&__brawler.game.projection.phase==='shadow'"))
  page.screenshot(path=str(photos/f'{a.engine}-palace-three-booths.png'))
  page.evaluate("""()=>{const g=__brawler.game;g.playerKind='franklin';g.stage=6;g.resetWorld();g.p.x=2220;g.p.y=407;g.camera=1820;g.storyCage={x:2620,y:407,open:false};g.storyActors=[{id:'marty',kind:'marty',x:2620,y:407,face:-1,anim:'trapped',animT:0,renderScale:.92}];__brawler.scenes().play(CriticCutscenes.scenes.ending,()=>{});}""")
  page.wait_for_function('__brawler.scenes().active&&!__brawler.scenes().loading',timeout=60000);page.wait_for_timeout(2400)
  order=page.evaluate("""()=>{const r=__brawler.renderer(),g=__brawler.game,out=[],original=r.sprite;r.sprite=function(c,who,...args){out.push(who);return original.call(this,c,who,...args)};try{r.draw(g,0)}finally{r.sprite=original}return {out,layer:g.reunionLayers,jay:g.storyActors.some(a=>a.id==='jay'),distance:g.storyActors.find(a=>a.kind==='marty').x-g.storyActors.find(a=>a.id==='jay').x};}""")
  check('Franklin witness, Jay father, Marty explicitly drawn above Jay at hug',order['layer'] and order['jay'] and order['out'].index('franklin')<order['out'].index('hero')<order['out'].index('marty') and abs(order['distance']-70)<5,order)
  page.screenshot(path=str(photos/f'{a.engine}-franklin-hug-layers.png'));skip_story(page)
  check('Reunion override clears after scene',page.evaluate('!__brawler.game.reunionLayers'))
  check('No uncaught v11 browser errors',not errors,errors)
 except Exception as e:check('V11 browser fixtures completed',False,str(e))
 finally:
  report=dict(engine=a.engine,tests=results,passed=sum(r['passed'] for r in results),failed=sum(not r['passed'] for r in results));Path(__file__).with_name('v11-presentation-'+a.engine+'-results.json').write_text(json.dumps(report,indent=2)+'\n');b.close()
raise SystemExit(1 if report['failed'] else 0)
