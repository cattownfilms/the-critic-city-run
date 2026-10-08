"""Runtime v9 overlays, stable actor handoff and encounter presentation fixtures."""
from pathlib import Path
import argparse,json
from playwright.sync_api import sync_playwright
from browser_support import source_site,launch_options,skip_story
p=argparse.ArgumentParser();p.add_argument('--engine',default='chromium');p.add_argument('--url',default='local');a=p.parse_args();results=[];errors=[]
def check(name,value,details=None):
 results.append(dict(name=name,passed=bool(value),details=details));print('PASS' if value else 'FAIL',name,details or '',flush=True)
def wait(page,expr):page.wait_for_function(expr,timeout=60000)
photos=Path(__file__).parent/'screenshots-v9';photos.mkdir(exist_ok=True)
with source_site(a.url) as url,sync_playwright() as pw:
 b=getattr(pw,a.engine).launch(**launch_options(a.engine));page=b.new_page(viewport={'width':915,'height':412},has_touch=True);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(url);wait(page,'__brawler.ready()');page.locator('#startButton').tap();wait(page,'__brawler.scenes().active&&!__brawler.scenes().loading')
  value=page.evaluate("""()=>{const s=__brawler.scenes(),shots=s.shots,first=shots.findIndex(x=>x.id==='activation'),second=shots.findIndex(x=>x.id==='second-press'),emerge=shots.findIndex(x=>x.id==='screen-emergence');return {first,second,emerge,firstPowered:shots[first].powered,firstEmpty:!shots[first].emissions,presses:[first,second].every(i=>shots[i].actors.some(a=>a.character==='duke'&&a.animation==='v10-button'))};}""")
  check('Two separate Duke actions power screens before materialization',value['first']<value['second']<value['emerge'] and value['firstPowered'] and value['firstEmpty'] and value['presses'],value)
  page.evaluate("const s=__brawler.scenes();s.index=s.shots.findIndex(x=>x.id==='second-press');s._shot()")
  check('Visual activation beat has no dialogue box, portrait square or Continue',page.locator('.scene-copy').is_hidden() and page.locator('#sceneAdvance').is_hidden())
  skip_story(page)
  for route in ['hero','franklin']:
   page.evaluate("""route=>{const g=__brawler.game;g.franklinUnlocked=true;g.start(null,route);g.stage=0;g.activeGate=-1;g.nextGate=3;g.advanceStage();g.finishStageClear();for(const e of g.drain())__brawler.handleEvent(e);}""",route)
   wait(page,'__brawler.scenes().active&&!__brawler.scenes().loading')
   check(route+': intro overlays actual loaded subway stage',page.evaluate("__brawler.game.stage===1&&document.querySelector('#cutscene').classList.contains('world-stage')&&getComputedStyle(document.querySelector('#cutscene')).backgroundColor==='rgba(0, 0, 0, 0)'"))
   page.wait_for_timeout(300);page.screenshot(path=str(photos/(a.engine+'-'+route+'-stage-intro.png')))
   page.wait_for_function("!!__brawler.scenes().shot.dialogue",timeout=10000);page.wait_for_timeout(300);before=page.evaluate('({x:__brawler.game.p.x,y:__brawler.game.p.y,camera:__brawler.game.camera})');page.evaluate('__brawler.scenes().advance()')
   after=page.evaluate('({x:__brawler.game.p.x,y:__brawler.game.p.y,camera:__brawler.game.camera})')
   check(route+': dismissing dialogue does not reset player or camera',abs(after['x']-before['x'])<15 and after['y']==before['y'] and abs(after['camera']-before['camera'])<15,dict(before=before,after=after))
  page.evaluate("""()=>{const g=__brawler.game;g.stage=4;g.resetWorld();g.mode='pause';g.p.x=2100;g.camera=1820;g.activeGate=2;g.projection.disabled=true;g.spawnBoss();g.drain();const e=g.enemies[0];for(let i=0;i<400&&e.entry;i++)g.updateEntry(e,1/120);__brawler.renderer().draw(g,0);}""")
  page.screenshot(path=str(photos/(a.engine+'-cinema-boss.png')))
  check('Single larger physical Rabbi survives after one emergence',page.evaluate("__brawler.game.enemies.filter(e=>e.kind==='pizzeria-boss').length===1&&__brawler.game.enemies[0].renderScale===1.52&&!__brawler.game.enemies[0].entry"))
  page.evaluate("""()=>{const g=__brawler.game;g.stage=6;g.resetWorld();g.mode='play';g.p.x=2150;g.camera=1820;g.activeGate=2;g.spawnBoss();for(const e of g.drain())__brawler.handleEvent(e);}""")
  wait(page,'__brawler.scenes().active');skip_story(page);wait(page,"__brawler.game.mode==='play'&&__brawler.game.broadcastSummons.waveStarted&&__brawler.game.enemies.some(e=>e.broadcastSummon&&e.hp>0)");page.screenshot(path=str(photos/(a.engine+'-broadcast-wave.png')))
  check('Environmental core moves on its rail, shielded with a living wave',page.evaluate("Number.isFinite(__brawler.game.enemies[0].x)&&__brawler.game.enemies[0].targetable===false&&__brawler.game.enemies.some(e=>e.broadcastSummon&&e.hp>0)"))
  check('No uncaught presentation errors',not errors,errors)
 except Exception as e:check('Presentation fixture completed',False,str(e))
 finally:
  report=dict(engine=a.engine,tests=results,passed=sum(r['passed'] for r in results),failed=sum(not r['passed'] for r in results));Path(__file__).with_name('v9-presentation-'+a.engine+'-results.json').write_text(json.dumps(report,indent=2)+'\n');b.close()
raise SystemExit(1 if report['failed'] else 0)
