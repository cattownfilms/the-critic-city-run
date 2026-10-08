"""Focused annotated-playtest checks; isolated scene fixtures, not a campaign run."""
from pathlib import Path
import argparse,json
from playwright.sync_api import sync_playwright
from browser_support import source_site,launch_options,skip_story
p=argparse.ArgumentParser();p.add_argument('--url',default='local');a=p.parse_args();results=[];errors=[]
def check(name,value,details=None):
 results.append(dict(name=name,passed=bool(value),details=details));print('PASS' if value else 'FAIL',name,details or '',flush=True)
photos=Path(__file__).parent/'screenshots-playtest';photos.mkdir(exist_ok=True)
with source_site(a.url) as url,sync_playwright() as pw:
 b=pw.chromium.launch(**launch_options());page=b.new_page(viewport={'width':915,'height':412},has_touch=True);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(url);page.wait_for_function('__brawler.ready()',timeout=120000);page.locator('#startButton').tap();page.wait_for_function('__brawler.scenes().active&&!__brawler.scenes().loading',timeout=60000);skip_story(page)
  for phase in range(3):
   state=page.evaluate('''phase=>{const g=__brawler.game;g.stage=4;g.resetWorld();g.makePlayer();g.activeGate=g.nextGate=phase;g.camera=[205,1065,1900][phase];g.p.x=[520,1380,2280][phase];g.p.y=407;g.projection.circuits.forEach((c,i)=>c.active=i>=phase);g.configureProjection();g.drain();g.mode='pause';g.updateProjection(2.5);g.updateProjection(1.1);g.updateProjection(1);g.updateProjection(2);g.updateProjectiles(.35);__brawler.renderer().draw(g,0);return {booth:g.projection.booths[phase].x,reels:g.projectiles.length,depth:g.projectiles[0]?.y};}''',phase)
   check('Booth '+str(phase+1)+' fixed location and 1/3/5 spread',state['booth']==[640,1500,2450][phase] and state['reels']==1+2*phase,state);page.screenshot(path=str(photos/f'palace-{phase+1}.png'))
  order=page.evaluate('''()=>{const g=__brawler.game,r=__brawler.renderer(),out=[],oldP=r.projectile,oldS=r.sprite;g.projectiles=[{kind:'reel',x:g.p.x,y:315,z:80},{kind:'reel',x:g.p.x,y:465,z:0}];r.projectile=function(c,g,o){out.push(o.y);return oldP.call(this,c,g,o)};r.sprite=function(c,who,...args){if(who===g.playerKind)out.push('player');return oldS.call(this,c,who,...args)};try{r.draw(g,0)}finally{r.projectile=oldP;r.sprite=oldS}return out;}''')
  check('Reels render behind and ahead according to depth',order.index(315)<order.index('player')<order.index(465),order)
  page.evaluate('''()=>{const g=__brawler.game;g.projectiles=[];g.projection.disabled=true;g.projection.active=false;g.enemies=[];g.spawnBoss();g.drain();__brawler.scenes().play(CriticCutscenes.scenes['boss-cinema-intro'],()=>{});}''');page.wait_for_function('__brawler.scenes().active&&!__brawler.scenes().loading',timeout=60000)
  page.wait_for_function("__brawler.game.enemies[0]?.entry?.phase==='emerge'",timeout=15000);page.wait_for_timeout(500);page.screenshot(path=str(photos/'rabbi-emergence.png'))
  check('Single Rabbi emerges facing the actual player',page.evaluate("__brawler.game.enemies.filter(e=>e.kind==='pizzeria-boss').length===1&&__brawler.game.enemies[0].face===Math.sign(__brawler.game.p.x-__brawler.game.enemies[0].x)"));skip_story(page)
  for route in ['hero','franklin']:
   page.evaluate('''route=>{const g=__brawler.game;g.playerKind=route;g.stage=5;g.resetWorld();g.makePlayer();g.p.x=2200;g.p.y=407;g.camera=1900;g.activeGate=g.nextGate=2;g.spawnBoss();g.drain();const e=g.enemies[0];e.entry=null;e.hidden=false;e.x=2600;e.y=407;__brawler.scenes().play(CriticCutscenes.scenes['boss-spike-intro'],()=>{});}''',route)
   page.wait_for_function('__brawler.scenes().active&&!__brawler.scenes().loading',timeout=60000);page.evaluate("const s=__brawler.scenes();s.index=s.shots.findIndex(q=>q.id==='tutorial-marks');s._shot()")
   page.wait_for_function('__brawler.game.spikeTutorial?.can?.phase==="flight"',timeout=15000);page.screenshot(path=str(photos/f'{route}-can-release.png'))
   page.wait_for_function('__brawler.game.p.z>65',timeout=5000);page.screenshot(path=str(photos/f'{route}-jump.png'))
   page.wait_for_function('!__brawler.scenes().active',timeout=15000);check(route+' real tutorial completes without damage or leftover can',page.evaluate('__brawler.game.p.hp===100&&__brawler.game.p.z===0&&!__brawler.game.projectiles.some(q=>q.tutorial)'))
  page.evaluate('''()=>{const g=__brawler.game;g.playerKind='hero';g.stage=6;g.resetWorld();g.makePlayer();g.p.x=2280;g.camera=1900;g.activeGate=g.nextGate=2;g.spawnBoss();g.drain();__brawler.scenes().play(CriticCutscenes.scenes['boss-broadcast-intro'],()=>{});}''');page.wait_for_function('__brawler.scenes().active&&!__brawler.scenes().loading',timeout=60000);page.wait_for_timeout(2800);skip_story(page)
  bg=page.evaluate('''()=>{const g=__brawler.game;g.mode='pause';g.broadcastSummons.phase='vulnerable';const core=g.enemies[0];core.x=2450;core.y=407;core.z=0;core.targetable=true;__brawler.renderer().draw(g,0);return {actors:g.storyActors.map(a=>({kind:a.kind,x:a.x,y:a.y,backdrop:a.backdrop})),cage:g.storyCage};}''')
  check('Duke and captive Marty occupy real background marks',all(x['backdrop'] and x['y']==305 for x in bg['actors'] if x['kind'] in ['duke','marty']) and bg['cage']['backdrop'] and not bg['cage']['open'],bg);page.screenshot(path=str(photos/'receiver-exposed-core.png'))
  page.evaluate('''()=>{const g=__brawler.game;g.machineDefeated=true;g.enemies[0].hp=0;g.finalPhase='duke';__brawler.scenes().play(CriticCutscenes.scenes['boss-broadcast-defeat'],()=>{});}''');page.wait_for_function('__brawler.scenes().active&&!__brawler.scenes().loading',timeout=60000)
  travel=page.evaluate('''async()=>{const out=[];for(let i=0;i<20;i++){const d=__brawler.game.storyActors.find(a=>a.kind==='duke');out.push({x:d.x,y:d.y});await new Promise(r=>setTimeout(r,80));}return out;}''')
  check('Duke physically leaves the background without a snap',travel[-1]['y']>travel[0]['y'] and all(abs(q['x']-p['x'])<25 and abs(q['y']-p['y'])<15 for p,q in zip(travel,travel[1:])),travel)
  page.wait_for_timeout(1000);page.screenshot(path=str(photos/'duke-confrontation.png'));check('Marty stays captive through confrontation',page.evaluate('!__brawler.game.storyCage.open'));skip_story(page)
  for route in ['hero','franklin']:
   page.evaluate('''route=>{const g=__brawler.game;g.playerKind=route;g.stage=6;g.resetWorld();g.makePlayer();g.p.x=2220;g.camera=1900;g.storyCage={x:2740,y:305,scale:.63,backdrop:true,open:false};g.storyActors=[{id:'marty',kind:'marty',x:2740,y:305,backdrop:true,face:-1,anim:'v11-captive-idle',animT:0,renderScale:.63}];__brawler.scenes().play(CriticCutscenes.scenes.ending,()=>{});}''',route)
   page.wait_for_function('__brawler.scenes().active&&!__brawler.scenes().loading',timeout=60000);page.wait_for_timeout(3000)
   check(route+' approved reunion still arrives beside father',page.evaluate("(()=>{const g=__brawler.game,m=g.storyActors.find(a=>a.kind==='marty'),father=g.playerKind==='hero'?g.p:g.storyActors.find(a=>a.id==='jay');return g.reunionLayers&&Math.abs(m.x-father.x-70)<8&&!m.backdrop;})()"));page.screenshot(path=str(photos/f'{route}-reunion.png'));skip_story(page);check(route+' ending skip clears layers',page.evaluate('!__brawler.game.reunionLayers'))
  check('No uncaught browser errors',not errors,errors)
 except Exception as e:check('Focused browser fixtures completed',False,str(e));page.screenshot(path=str(photos/'failure.png'))
 finally:
  report=dict(url=url,tests=results,passed=sum(r['passed'] for r in results),failed=sum(not r['passed'] for r in results));Path(__file__).with_name('v11-playtest-browser-results.json').write_text(json.dumps(report,indent=2)+'\n');b.close()
raise SystemExit(1 if report['failed'] else 0)
