"""Actual v11 scene rendering and tutorial lifecycle, both selected-player routes."""
from pathlib import Path
import argparse,json
from playwright.sync_api import sync_playwright,TimeoutError as PlaywrightTimeout
from browser_support import source_site,launch_options,skip_story,wait_scene
p=argparse.ArgumentParser();p.add_argument('--engine',default='chromium');p.add_argument('--url',default='local');p.add_argument('--reproduce-legacy',action='store_true');a=p.parse_args();results=[];errors=[]
def check(name,value,details=None):
 results.append(dict(name=name,passed=bool(value),details=details));print('PASS' if value else 'FAIL',name,details or '',flush=True)
photos=Path(__file__).parent/'screenshots-v11';photos.mkdir(exist_ok=True)
with source_site(a.url) as url,sync_playwright() as pw:
 b=getattr(pw,a.engine).launch(**launch_options(a.engine));page=b.new_page(viewport={'width':915,'height':412},has_touch=True);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(url);page.wait_for_function('__brawler.ready()',timeout=120000);page.locator('#startButton').tap();page.wait_for_function('__brawler.scenes().active&&!__brawler.scenes().loading',timeout=60000);skip_story(page)
  check('Public/source runtime is v11 and schema 5',page.evaluate("BRAWLER_CONFIG.version==='11.0.0'&&__brawler.game.snapshot().version===5"))
  def state():
   return page.evaluate("""()=>{const b=__brawler,s=b.scenes(),g=b.game,t=g.spikeTutorial;return {shot:s.shot?.id||s.shot?.speaker,index:s.index,time:s.time,mode:g.mode,camera:s.cameraState,marksComplete:s.marksComplete,tutorial:t?{time:t.time,released:t.released,jumped:t.jumped,complete:t.complete,can:t.can?{id:t.can.id,phase:t.can.phase,x:t.can.x,z:t.can.z}:null}:null};}""")
  def begin(route,viewport=(915,412)):
   page.set_viewport_size({'width':viewport[0],'height':viewport[1]})
   page.evaluate("""route=>{const b=__brawler,g=b.game;g.franklinUnlocked=true;g.start(null,route);g.stage=5;g.resetWorld();g.makePlayer();g.p.x=2200;g.p.y=407;g.camera=1820;g.activeGate=g.nextGate=2;g.spawnBoss();g.drain();const e=g.enemies[0];e.entry=null;e.hidden=false;e.x=2600;e.y=407;g.mode='play';window.v11Trace={shots:[],frames:[],releases:[],events:[]};b.handleEvent({type:'story',id:'boss-spike-intro'});}""",route)
   wait_scene(page)
  # Observers delegate every call unchanged. Record simulation frames so a short
  # airborne interval cannot disappear between Playwright polling samples.
  page.evaluate("""()=>{const b=__brawler,g=b.game,s=b.scenes();window.v11Trace={shots:[],frames:[],releases:[],events:[]};
   const shot=s._shot;s._shot=function(...args){const previous={id:this.shot?.id||this.shot?.speaker,marks:this.marksComplete,cameraActive:!!this.cameraState?.active,time:this.time};const value=shot.apply(this,args);v11Trace.shots.push({previous,id:this.shot?.id||this.shot?.speaker});return value;};
   const release=g.releaseTrashCan;g.releaseTrashCan=function(...args){const q=release.apply(this,args);if(args[2]?.tutorial)v11Trace.releases.push({id:q.id,overhead:args[2].overhead,time:this.spikeTutorial.time,x:q.sourceX,y:q.sourceY});return q;};
   const update=g.updateSpikeTutorial;g.updateSpikeTutorial=function(...args){const value=update.apply(this,args),t=this.spikeTutorial,q=t?.can;if(t&&v11Trace.frames.length<2400)v11Trace.frames.push({time:t.time,hp:this.p.hp,z:this.p.z,x:this.p.x,y:this.p.y,canX:q?.x,canY:q?.y,canZ:q?.z,signedDistance:q?q.x-this.p.x:null,camera:this.camera,worldScale:s.scene.worldScale,shot:s.shot.id,player:this.playerKind,jumped:t.jumped,complete:t.complete,phase:q?.phase||null,done:!!q?.done,dx:q?Math.abs(q.x-this.p.x):null,activeCans:this.projectiles.filter(p=>p.tutorial).length,hidden:document.querySelector('.scene-copy').hidden});return value;};
   const emit=g.emit;g.emit=function(type,...args){if(type==='spikeTutorialComplete')v11Trace.events.push(type);return emit.call(this,type,...args);};
  }""")
  if a.reproduce_legacy:
   begin('hero')
   page.evaluate("const s=__brawler.scenes();s.index=s.shots.findIndex(q=>q.id==='tutorial-marks');s._shot()")
   timed_out=False
   try:page.wait_for_function('__brawler.game.spikeTutorial?.can?.phase==="rolling"',timeout=15000)
   except PlaywrightTimeout:timed_out=True
   diagnostic={**state(),'browserErrors':errors,'trace':page.evaluate('v11Trace')}
   (photos/f'{a.engine}-legacy-timeout.json').write_text(json.dumps(diagnostic,indent=2))
   check('Legacy fixture waits on manual overhead dialogue, not a stalled staging shot',timed_out and diagnostic['shot']=='JAY' and diagnostic['tutorial'] is None and any(t['previous']['id']=='tutorial-marks' and t['previous']['marks'] and not t['previous']['cameraActive'] for t in diagnostic['trace']['shots']),diagnostic)
   page.screenshot(path=str(photos/f'{a.engine}-legacy-timeout.png'));skip_story(page)
  def overhead(route,viewport):
   begin(route,viewport)
   page.wait_for_function("__brawler.scenes().shot.speaker==='SPIKE'&&__brawler.scenes().time>=__brawler.scenes().shot.minTime")
   page.locator('#sceneAdvance').tap()
   page.wait_for_function("__brawler.scenes().shot.actors?.some(a=>a.animation==='overhead-ready')&&__brawler.scenes().time>=__brawler.scenes().shot.minTime",timeout=15000)
   trace=page.evaluate('v11Trace')
   check(route+' staging advances only after marks and camera settle',any(t['previous']['id']=='tutorial-marks' and t['previous']['marks'] and not t['previous']['cameraActive'] and t['previous']['time']>=1.8 for t in trace['shots']),trace['shots'])
   check(route+' overhead dialogue waits for real Continue without premature release',state()['tutorial'] is None and not trace['releases'])
  for route,viewport in [(r,v) for r in ['hero','franklin'] for v in [(915,412),(360,800)]]:
   case=f'{route}-{viewport[0]}x{viewport[1]}'
   overhead(route,viewport)
   page.locator('#sceneAdvance').tap()
   page.wait_for_function('v11Trace.frames.some(f=>f.phase==="rolling")',timeout=15000)
   page.screenshot(path=str(photos/f'{a.engine}-{case}-tutorial-roll.png'))
   page.wait_for_function('v11Trace.frames.some(f=>f.z>65)',timeout=5000)
   page.screenshot(path=str(photos/f'{a.engine}-{case}-tutorial-jump.png'))
   page.wait_for_function('!__brawler.scenes().active&&__brawler.game.mode==="play"',timeout=15000)
   trace=page.evaluate('v11Trace');(photos/f'{a.engine}-{case}-tutorial-trace.json').write_text(json.dumps(trace,indent=2))
   check(route+' one overhead release at the authored event',len(trace['releases'])==1 and trace['releases'][0]['overhead'] and .167<=trace['releases'][0]['time']<.25,trace['releases'])
   frames=trace['frames'];crossings=[f for prev,f in zip(frames,frames[1:]) if f['phase']=='rolling' and prev['signedDistance'] is not None and prev['signedDistance']>0>=f['signedDistance']]
   rolling=next((f for f in frames if f['phase']=='rolling'),None)
   check(case+' real flight, roll, selected-player jump and airborne underpass',any(f['phase']=='flight' for f in frames) and rolling is not None and len(crossings)==1 and crossings[0]['z']>58 and all(f['z']>58 for f in frames if f['phase']=='rolling' and f['dx']<38) and all(f['player']==route for f in frames),{'rollingStart':rolling,'crossings':crossings})
   check(route+' no tutorial damage, duplicate can or obscured combat floor',all(f['hp']==100 and f['activeCans']<=1 and f['hidden'] for f in trace['frames']))
   check(route+' tutorial completes once and returns grounded to combat',trace['events']==['spikeTutorialComplete'] and page.evaluate("__brawler.game.spikeTutorial===null&&__brawler.game.p.hp===100&&__brawler.game.p.z===0&&!__brawler.game.projectiles.some(q=>q.tutorial)"))
   for when in ['before-release','rolling']:
    overhead(route,viewport)
    if when=='rolling':
     page.locator('#sceneAdvance').tap();page.wait_for_function('v11Trace.frames.some(f=>f.phase==="rolling")',timeout=15000)
    count=page.evaluate('v11Trace.releases.length');page.locator('#sceneSkip').tap();page.wait_for_function('!__brawler.scenes().active&&__brawler.game.mode==="play"')
    page.wait_for_timeout(500)
    check(route+' skip '+when+' cleans state without delayed or duplicate release',count==(1 if when=='rolling' else 0) and page.evaluate("__brawler.game.spikeTutorial===null&&__brawler.game.p.hp===100&&!__brawler.game.projectiles.some(q=>q.tutorial)") and page.evaluate('v11Trace.releases.length')==count)
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
 except Exception as e:
  diagnostic={**state(),'browserErrors':errors};(photos/f'{a.engine}-failure-state.json').write_text(json.dumps(diagnostic,indent=2));page.screenshot(path=str(photos/f'{a.engine}-failure.png'));check('V11 browser fixtures completed',False,{'error':str(e),'state':diagnostic})
 finally:
  report=dict(engine=a.engine,tests=results,passed=sum(r['passed'] for r in results),failed=sum(not r['passed'] for r in results));Path(__file__).with_name('v11-presentation-'+a.engine+'-results.json').write_text(json.dumps(report,indent=2)+'\n');b.close()
raise SystemExit(1 if report['failed'] else 0)
