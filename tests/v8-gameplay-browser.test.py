"""V8 gameplay fixtures in a real browser; full normal-input routes are separate.

Arena state is explicitly installed for collision/presentation isolation. Actual
keyboard edges trigger run attacks; no sprite simulation replaces the renderer.
"""
from pathlib import Path
import argparse, hashlib, json
from playwright.sync_api import sync_playwright
from browser_support import source_site, launch_options, standalone_path, skip_story
from load_helper import load_html
ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--engine',default='chromium',choices=['chromium','firefox','webkit']);ap.add_argument('--url',default='local');ap.add_argument('--output',type=Path);ap.add_argument('--screenshots',type=Path);args=ap.parse_args()
results=[];errors=[]
def check(name,ok,details=None):
 results.append({'name':name,'passed':bool(ok),'details':details});print('PASS' if ok else 'FAIL',name,details or '',flush=True)
def fixture(page,kind='hero',stage=0):
 page.keyboard.up('ArrowRight');page.keyboard.up('KeyJ')
 page.evaluate('''([kind,stage])=>{const g=__brawler.game;g.franklinUnlocked=true;g.start(null,kind);g.stage=stage;g.resetWorld();g.mode='play';g.nextGate=3;g.activeGate=-1;g.props=[];g.enemies=[];g.projectiles=[];g.p.x=700;g.p.y=400;g.p.z=g.p.vz=g.p.vx=g.p.vy=0;g.p.hp=100;g.p.inv=0;g.p.action=null;g.p.guard=false;g.p.run=false;g.p.cosmetic=null;g.p.landTimer=0;g.p.airUsed=false;g.p.attackBuffer=g.p.jumpBuffer=g.p.exertion=g.p.counter=g.hitstop=0;g.camera=200;__brawler.input.clear();g.stageBanner=g.bannerT=0;g.events=[];window.__v8Events=[];if(!g.__v8Emit){g.__v8Emit=g.emit;g.emit=function(type,data){__v8Events.push({type,...data});return this.__v8Emit(type,data);};}}''',[kind,stage])
def photo(page,name):
 if args.screenshots:
  args.screenshots.mkdir(parents=True,exist_ok=True);page.screenshot(path=str(args.screenshots/f'{args.engine}-{name}.png'))
with source_site(args.url) as url,sync_playwright() as pw:
 browser=None
 try:
  browser=getattr(pw,args.engine).launch(**launch_options(args.engine));page=browser.new_page(viewport={'width':960,'height':540},has_touch=True);page.on('pageerror',lambda x:errors.append(str(x)))
  if args.url=='standalone':load_html(page,standalone_path().read_text())
  else:page.goto(url);page.wait_for_function('__brawler.ready()',timeout=120000)
  page.locator('#startButton').click();skip_story(page)
  for character in ['hero','franklin']:
   for enemy in ['bear','hippo','sherm-punch']:
    fixture(page,character);page.keyboard.down('ArrowRight');page.wait_for_function('__brawler.game.p.run&&Math.abs(__brawler.game.p.vx)>180',timeout=5000)
    page.evaluate('kind=>{const g=__brawler.game;g.enemies=[{id:999,kind,name:kind,x:g.p.x+150,y:g.p.y,z:0,face:-1,hp:1000,maxHp:1000,speed:0,state:"seek",timer:0,cooldown:999,anim:"idle",animT:0,kb:0,variant:0,flashes:0}];g.p.combo=4;g.p.comboClock=1;g.p.chainIndex=2;}',enemy)
    page.keyboard.down('KeyJ')
    if enemy in ['bear','hippo']:
     page.wait_for_function('__v8Events.some(e=>e.type==="runBlocked")',timeout=5000)
     value=page.evaluate('({hp:__brawler.game.enemies[0].hp,combo:__brawler.game.p.combo,chain:__brawler.game.p.chainIndex,action:__brawler.game.p.action?.name,events:__v8Events.filter(e=>e.type==="runBlocked").length,buffer:__brawler.game.p.attackBuffer,kb:__brawler.game.enemies[0].kb})')
     check(f'{character}: actual RUN + HIT into {enemy} stuns player once without enemy damage',value['hp']==1000 and value['action']=='run-stun' and value['events']==1 and value['kb']==0,value)
     check(f'{character}: {enemy} collision clears the standing combo and attack buffer',value['combo']==0 and value['chain']==0 and value['buffer']==0,value)
    else:
     page.wait_for_function('__brawler.game.enemies[0].hp<1000',timeout=5000)
     value=page.evaluate('({hp:__brawler.game.enemies[0].hp,launch:__brawler.game.enemies[0].launchTimer,velocity:__brawler.game.enemies[0].launchVelocity,anim:__brawler.game.p.anim,blocked:__v8Events.some(e=>e.type==="runBlocked")})')
     check(f'{character}: RUN + HIT still launches ordinary Shermometers using the selected move',value['hp']<1000 and value['launch']>0 and value['velocity']>400 and not value['blocked'] and value['anim']==('belly-bash' if character=='hero' else 'cartwheel-run'),value)
    photo(page,f'{character}-run-{enemy}');page.keyboard.up('KeyJ');page.keyboard.up('ArrowRight');page.wait_for_timeout(800)
  fixture(page,stage=4)
  value=page.evaluate('''()=>{const g=__brawler.game;g.activeGate=0;g.configureProjection();const samples=[];for(const camera of [0,800,1700]){g.camera=camera;g.projection.phase='waiting';g.projection.visible=false;g.projection.timer=0;g.updateProjection(3);samples.push({camera,window:g.projection.window,x:g.projection.windowXs[g.projection.window],visible:g.projection.visible});}return {count:g.projection.booths.length,groups:g.projection.booths.map(b=>b.circuitId),width:g.viewWidth,samples};}''')
  check('Thirteen projection booths repeat across the whole back wall in three circuit groups',value['count']==13 and value['groups']==[i%3 for i in range(13)],value)
  check('Projectionist is restricted to active booths currently inside the viewport',all(s['visible'] and s['camera']+70<=s['x']<=s['camera']+value['width']-70 for s in value['samples']),value['samples'])
  value=page.evaluate('''()=>{const g=__brawler.game;g.mode='pause';g.camera=100;g.projection.visible=false;const r=__brawler.renderer();const crop=(x,y,w,h)=>Array.from(r.ctx.getImageData(x,y,w,h).data);r.draw(g,0);const before=crop(390-100-67,104,134,157);g.camera=140;r.draw(g,0);return {before,after:crop(390-140-67,104,134,157)};}''')
  check('Moving the camera shifts a booth and its architecture together with no internal pixel drift',value['before']==value['after'])
  eyes=page.evaluate('''()=>{const r=__brawler.renderer(),g=__brawler.game;g.mode='pause';g.camera=100;g.projection.visible=true;g.projection.window=1;g.projection.phase='shadow';return [.05,.15,.23,.32].map(t=>{g.projection.timer=t;r.draw(g,0);return Array.from(r.ctx.getImageData(390-100-22,164,44,12).data);});}''')
  check('Projectionist eyes choreograph left glance, right glance, blink and player-facing lock',eyes[0]!=eyes[1] and eyes[1]!=eyes[2] and eyes[0]!=eyes[2] and eyes[3]==eyes[1])
  photo(page,'booth-eyes-shadow')
  value=page.evaluate('''()=>{const g=__brawler.game;g.mode='pause';g.projectiles=[];g.events=[];g.p.x=700;g.p.y=400;g.p.hp=100;g.p.inv=0;g.p.action=null;g.activeGate=-1;const q=g.launchProjectile('reel',650,196,700,400,9,32,.7,0);g.updateProjectiles(.71);const contact={hp:g.p.hp,action:g.p.action?.name,contacted:q.contacted};g.updateProjectiles(1.0);return {contact,hp:g.p.hp,bounces:q.bounces,remaining:g.projectiles.length,knockdowns:g.drain().filter(e=>e.type==='playerKnockdown').length};}''')
  check('Reel impact knocks the player down with one contact and no repeated damage',value['contact']['hp']==91 and value['contact']['action']=='knockdown' and value['hp']==91 and value['knockdowns']==1,value)
  check('Reel keeps travelling through three visible floor hops before expiring',value['bounces']==3 and value['remaining']==0,value)
  value=page.evaluate('''()=>{const g=__brawler.game;g.projectiles=[];g.p.inv=0;g.p.hp=100;g.p.guard=true;g.p.guardT=1;g.p.face=-1;g.p.action=null;g.p.x=700;g.p.y=400;const q={kind:'reel',x:695,y:400,z:0,radius:32,sourceX:2600,face:1,damage:9,contacted:false};g.projectileContact(q);return {hp:g.p.hp,action:g.p.action?.name};}''')
  check('A reflected reel uses its current incoming side for frontal guard and does not knock down',value['hp']>=96 and value['action']!='knockdown',value)
  fixture(page,stage=4);value=page.evaluate('''()=>{const g=__brawler.game;g.activeGate=2;g.spawnBoss();return {kind:g.enemies[0].kind,route:g.enemies[0].entry.route,source:g.enemies[0].entry.sourceX,hp:g.enemies[0].hp};}''')
  check('Cream Scarf is the cinema boss with an explicit film-screen emergence',value['kind']=='pizzeria-boss' and value['route']=='screen' and value['source']==2450,value)
  skip_story(page);photo(page,'cream-cinema-entry')
  fixture(page,stage=5);value=page.evaluate('''()=>{const g=__brawler.game;g.activeGate=2;g.spawnBoss();return {kind:g.enemies[0].kind,route:g.enemies[0].entry.route,bank:Object.keys(__brawler.meta().characters.spike),impact:__brawler.meta().characters.spike['trash-throw'].sourceImpact};}''')
  check('Spike is the Little Italy boss with supplied trash-can combat and a door entrance',value['kind']=='spike' and value['route']=='door' and 'trash-throw' in value['bank'] and page.evaluate('!!__brawler.meta().characters["trash-can"]["thrown"]') and abs(value['impact']-.3684210526)<1e-6,value)
  skip_story(page);photo(page,'spike-pizzeria-entry')
  fixture(page,stage=6);value=page.evaluate('''()=>{const g=__brawler.game;g.activeGate=2;g.spawnBoss();g.mode='play';g.updateBroadcastSummons(1.21);const first=g.enemies.filter(e=>e.broadcastSummon&&e.hp>0);g.updateBroadcastSummons(5.01);const capped=g.enemies.filter(e=>e.broadcastSummon&&e.hp>0).length;g.updateBroadcastSummons(50);const max=g.enemies.filter(e=>e.broadcastSummon&&e.hp>0).length;for(const e of first){e.hp=0;e.timer=2;}g.updateBroadcastSummons(.01);return {first:first.length,routes:first.map(e=>e.entry.route),capped,max,waves:g.broadcastSummons.wave,replenished:g.enemies.filter(e=>e.broadcastSummon&&e.hp>0).length};}''')
  check('Broadcast machine sends repeated pairs through visible screens with a four-live-enemy cap',value['first']==2 and value['routes']==['broadcast','broadcast'] and value['capped']==4 and value['max']==4,value)
  check('Machine replaces defeated waves rather than exhausting a fixed spawn list',value['waves']==3 and value['replenished']==4,value)
  skip_story(page);photo(page,'machine-wave')
  value=page.evaluate('''()=>{const g=__brawler.game;g.mode='play';const before=g.stats.kos;g.registerHit(g.enemies.find(e=>e.kind==='broadcast-rig'),{damage:9999,kb:0});const state={active:g.broadcastSummons.active,living:g.enemies.filter(e=>e.broadcastSummon&&e.hp>0).length,mode:g.mode,rescued:!!g.storyFlags.martyRescued,kos:g.stats.kos-before};g.updateBroadcastSummons(100);return {...state,after:g.enemies.filter(e=>e.broadcastSummon&&e.hp>0).length};}''')
  check('Machine defeat ends all summons once without extra KO rewards or premature Marty rescue',not value['active'] and value['living']==0 and value['after']==0 and value['kos']==1 and not value['rescued'] and value['mode']=='confrontation',value)
  check('V8 gameplay and presentation fixtures have no uncaught JavaScript errors',not errors,errors)
 except Exception as e:
  import traceback
  check('V8 browser gameplay fixture execution completed',False,traceback.format_exc());print(page.evaluate('({mode:__brawler.game.mode,p:__brawler.game.p,input:__brawler.getInput(),enemies:__brawler.game.enemies,events:window.__v8Events})'))
 finally:
  version=browser.version if browser else None
  if browser:browser.close()
  report={'engine':args.engine,'browserVersion':version,'tests':results,'passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),'errors':errors,'boundary':'Real browser source/offline rendering. Explicit arena fixtures isolate mechanics; actual keyboard edges trigger run attacks. Full normal-input playthroughs are in the campaign suite. No physical Android or controller test.'}
  output=args.output or ROOT/'tests'/f'v8-gameplay-{args.engine}-results.json';output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(report,indent=2)+'\n')
if report['failed']:raise SystemExit(1)
