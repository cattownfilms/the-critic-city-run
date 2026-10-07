"""Touch, rendering, audio, and packaging tests of the exact standalone game.
The offline build is loaded with bounded parser writes; source URL coverage is separate.
Real multi-touch events are sent through CDP; storage is separately emulated.
"""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,time,math
from load_helper import load_html
from browser_support import standalone_path, launch_options
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'tests/screenshots-v4-regression';OUT.mkdir(exist_ok=True);RESULTS=[];ERRORS=[]
HTML=standalone_path().read_text()
def check(name,ok,details=None):
 RESULTS.append({'name':name,'passed':bool(ok),'details':details});print('PASS' if ok else 'FAIL',name,details or '',flush=True)
def document(storage=True):
 code=''
 if storage:
  code='window.__testStore={};Object.defineProperty(window,"localStorage",{configurable:true,value:{getItem:k=>window.__testStore[k]??null,setItem:(k,v)=>window.__testStore[k]=String(v),removeItem:k=>delete window.__testStore[k]}});'
 else:
  code='Object.defineProperty(window,"localStorage",{configurable:true,get:()=>{throw new Error("storage unavailable")}});'
 return HTML.replace('<head>','<head><script>'+code+'</script>')
def center(page,sel):
 b=page.locator(sel).bounding_box();return {'x':round(b['x']+b['width']/2),'y':round(b['y']+b['height']/2)}
def touch(cdp,kind,pts):cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':pts})
def resetArena(page):
 page.evaluate('''()=>{const g=__brawler.game;g.enemies=[];g.nextGate=3;g.activeGate=-1;g.p.x=500;g.p.y=400;g.p.z=g.p.vz=g.p.vx=g.p.vy=0;g.p.hp=100;g.p.inv=0;g.p.action=null;g.p.cosmetic=null;g.props=[];g.mode='play';g.camera=100;}''')
with sync_playwright() as p:
 browser=p.chromium.launch(**launch_options())
 context=browser.new_context(viewport={'width':915,'height':412},device_scale_factor=1,has_touch=True,is_mobile=True)
 page=context.new_page();page.on('pageerror',lambda e:ERRORS.append(str(e)));load_html(page,HTML)
 check('Exact standalone HTML loads all atlas pages',page.evaluate('__brawler.renderer().images.every(i=>i.complete&&i.naturalWidth>0)'))
 check('All 50 original hero tracks are retained',page.evaluate('Object.values(__brawler.meta().characters.hero).filter(a=>a.original).length')==50)
 check('All 943 source hero frame entries are retained',page.evaluate('Object.values(__brawler.meta().characters.hero).filter(a=>a.original).reduce((n,a)=>n+a.frames.length,0)')==943)
 check('Original nine character banks and added production bank load',page.evaluate('Object.keys(__brawler.meta().characters).length')>=9)
 page.screenshot(path=str(OUT/'01-title-landscape.png'))
 page.locator('#startButton').tap();page.wait_for_timeout(150);page.locator('#sceneSkip').tap();page.wait_for_timeout(600)
 check('Press Start begins gameplay',page.evaluate('__brawler.game.mode')=='play')
 page.wait_for_function('__brawler.audio.loaded',timeout=15000)
 check('All 13 extracted audio clips decode',page.evaluate('Object.keys(__brawler.audio.buffers).length')==13)
 check('Stage soundtrack plays after a genuine tap',page.evaluate('!__brawler.audio.music.paused&&__brawler.audio.music.currentTime>0'))
 resetArena(page);cdp=context.new_cdp_session(page);st=center(page,'#stick');b=page.locator('#stick').bounding_box();rad=b['width']*.35
 mid={'x':st['x']+rad*.40,'y':st['y'],'id':1};full={'x':st['x']+rad,'y':st['y'],'id':1}
 touch(cdp,'touchStart',[mid]);page.wait_for_timeout(190);partial=page.evaluate('__brawler.getInput().mx')
 touch(cdp,'touchMove',[full]);page.wait_for_timeout(220);v=page.evaluate('({input:__brawler.getInput(),run:__brawler.game.p.run})')
 check('Radial pad provides proportional analog movement',0<partial<v['input']['mx'] and v['input']['mx']>.9,{'partial':partial,'full':v['input']['mx']})
 check('Outer pad range enables run automatically',v['run'])
 touch(cdp,'touchEnd',[]);page.wait_for_timeout(170);check('Pad release resets both axes',page.evaluate('__brawler.getInput().mx===0&&__brawler.getInput().my===0'))
 resetArena(page);down={'x':st['x'],'y':st['y']+rad*.8,'id':1};touch(cdp,'touchStart',[down]);page.wait_for_timeout(250);check('Analog pad moves between street depth lanes',page.evaluate('__brawler.game.p.y')>410);touch(cdp,'touchEnd',[])
 resetArena(page);attack={**center(page,'#attack'),'id':2};jump={**center(page,'#jump'),'id':3}
 touch(cdp,'touchStart',[full,jump]);page.wait_for_timeout(90);touch(cdp,'touchStart',[full,jump,attack]);page.wait_for_timeout(95)
 state=page.evaluate('({pointers:__brawler.input.pointers.size,z:__brawler.game.p.z,action:__brawler.game.p.action?.name,input:__brawler.getInput()})')
 check('Movement + jump + attack accept three simultaneous touches',state['pointers']==3 and state['z']>0 and state['action']=='air',state)
 page.screenshot(path=str(OUT/'02-jump-kick-mobile.png'))
 touch(cdp,'touchEnd',[jump]);page.wait_for_timeout(35);check('Releasing jump preserves movement and attack fingers',page.evaluate('__brawler.input.pointers.size===2&&__brawler.getInput().mx>.9&&__brawler.getInput().attackHeld'))
 touch(cdp,'touchEnd',[attack]);page.wait_for_timeout(35);check('Releasing attack preserves the stick finger',page.evaluate('__brawler.input.pointers.size===1&&__brawler.getInput().mx>.9&&!__brawler.getInput().attackHeld'))
 touch(cdp,'touchCancel',[]);page.wait_for_timeout(50);check('Touch cancellation clears movement without stuck controls',page.evaluate('__brawler.input.pointers.size===0&&__brawler.getInput().mx===0'))
 resetArena(page);touch(cdp,'touchStart',[{**center(page,'#guard'),'id':7}]);page.wait_for_timeout(250);check('Holding Guard enters the defense state',page.evaluate('__brawler.game.p.guard'))
 touch(cdp,'touchEnd',[])
 page.locator('#pauseBtn').tap();t=page.evaluate('__brawler.game.t');page.wait_for_timeout(350);check('Pause freezes the simulation',page.evaluate('__brawler.game.mode')=='pause' and page.evaluate('__brawler.game.t')==t)
 check('Music pauses with the game',page.evaluate('__brawler.audio.music.paused'))
 page.locator('#resumeButton').tap();page.wait_for_timeout(200);check('Resume restores gameplay and music',page.evaluate('__brawler.game.mode==="play"&&!__brawler.audio.music.paused'))
 page.evaluate('window.dispatchEvent(new Event("blur"))');page.wait_for_timeout(30);check('Focus loss pauses and releases every input',page.evaluate('__brawler.game.mode==="pause"&&__brawler.input.pointers.size===0'))
 page.locator('#resumeButton').tap();page.wait_for_timeout(60)
 # Render all actions and their last frame; this does not pretend each is a gameplay trigger.
 coverage=page.evaluate('''()=>{const r=__brawler.renderer(),c=document.createElement('canvas').getContext('2d');c.canvas.width=800;c.canvas.height=500;let count=0;for(const [who,aa] of Object.entries(__brawler.meta().characters)){for(const [name,a] of Object.entries(aa)){r.sprite(c,who,name,400,460,1,0,0,{loop:false});r.sprite(c,who,name,400,460,-1,a.ms/1000,0,{loop:false});count++;}}return count;}''')
 check('Every runtime animation draws at both facing directions',coverage>=153,{'animationStates':coverage})
 page.locator('#pauseBtn').tap();page.locator('#pauseGallery').tap();page.wait_for_timeout(100);check('Animation room lists all original and derived hero clips',page.locator('#animSelect option').count()==59)
 page.select_option('#animSelect','front-kick');page.wait_for_timeout(200);page.screenshot(path=str(OUT/'03-animation-room.png'));check('Animation viewer selects full source tracks', '32 frames' in page.locator('#galleryInfo').inner_text())
 page.locator('#closeGallery').tap();page.locator('#resumeButton').tap()
 # Browser save serialization, with Storage emulation rather than a claimed persistent origin test.
 page.evaluate('()=>{__brawler.game.nextGate=1;__brawler.game.checkpointSave()}');page.wait_for_timeout(100);check('Checkpoint save serializes the current brawler format',page.evaluate('JSON.parse(window.__testStore[BRAWLER_CONFIG.saveKey]).version===4'))
 page.locator('#pauseBtn').tap();page.locator('#titleButton').tap();page.wait_for_timeout(50);check('Continue appears when a checkpoint exists',page.locator('#continueButton').is_visible());page.locator('#continueButton').tap();page.wait_for_timeout(100);check('Continue resumes after the cleared block',page.evaluate('__brawler.game.nextGate')==1)
 # Independent source-derived sample channels can overlap safely.
 page.evaluate('()=>{for(const k of Object.keys(__brawler.audio.buffers).slice(0,8))__brawler.audio.sample(k,.1)}');page.wait_for_timeout(40);check('Sample engine supports overlapping combat effects',page.evaluate('Object.keys(__brawler.audio.played).length')>=8)
 # Representative close framing with true enemy assets and an actual strike pose.
 resetArena(page);page.evaluate('''()=>{const g=__brawler.game;g.stage=0;g.p.x=480;g.p.y=405;g.camera=80;g.spawnFight(0);g.stageBanner=0;g.bannerT=0;g.enemies[0].x=565;g.enemies[0].y=403;g.enemies[1].x=716;g.enemies[1].y=438;g.p.inv=2;g.p.meter=100;}''')
 page.locator('#attack').dispatch_event('pointerdown',{'pointerId':21,'clientX':870,'clientY':360,'pressure':.5});page.wait_for_timeout(180);page.screenshot(path=str(OUT/'04-combat-mobile.png'));page.evaluate('__brawler.input.clear()')
 # Render all four complete city treatments.
 for stage in range(7):
  page.evaluate('''stage=>{const g=__brawler.game;g.stage=stage;g.p.x=560;g.p.y=402;g.p.hp=100;g.p.inv=5;g.p.action=null;g.p.anim='guard';g.p.animT=.1;g.p.animDuration=0;g.camera=100;g.stageBanner=0;g.bannerT=0;g.enemies=[];g.nextGate=3;g.activeGate=-1;g.mode='pause';}''',stage)
  page.wait_for_timeout(80);page.screenshot(path=str(OUT/f'05-scene-{stage}.png'))
 check('Seven campaign scenes render without code errors',len(ERRORS)==0)
 # Completion UI generated through actual app event handling.
 page.evaluate('''()=>{const g=__brawler.game;g.stage=Brawler.STAGES.length-1;g.nextGate=3;g.bossDefeated=true;g.activeGate=-1;g.enemies=[];g.p.x=2800;g.p.hp=100;g.mode='play';}''');page.wait_for_timeout(100);page.evaluate('()=>{while(__brawler.scenes().active)__brawler.scenes().skip()}');page.wait_for_timeout(100)
 check('Final exit shows an actual completion screen',page.locator('#complete').is_visible() and page.evaluate('__brawler.game.mode')=='complete')
 page.screenshot(path=str(OUT/'06-complete.png'))
 # Native portrait layout without horizontal overflow or unreachable controls.
 page.locator('#againButton').tap();page.locator('#sceneSkip').tap();page.set_viewport_size({'width':412,'height':915});page.wait_for_timeout(150);page.screenshot(path=str(OUT/'07-portrait.png'))
 ok=page.evaluate('''()=>['stick','attack','jump','guard','special'].every(id=>{const b=document.getElementById(id).getBoundingClientRect();return b.left>=0&&b.top>=0&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1})''')
 check('Portrait keeps every touch control on screen',ok)
 check('No horizontal document overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
 page.set_viewport_size({'width':740,'height':360});page.wait_for_timeout(100);page.screenshot(path=str(OUT/'08-small-landscape.png'))
 check('Small landscape keeps all four action buttons on screen',page.evaluate('''()=>['attack','jump','guard','special'].every(id=>{const b=document.getElementById(id).getBoundingClientRect();return b.right<=innerWidth+1&&b.bottom<=innerHeight+1&&b.top>=0})'''))
 browser.close()
check('No uncaught JavaScript errors',len(ERRORS)==0,ERRORS)
(ROOT/'tests/mobile-results.json').write_text(json.dumps({'tests':RESULTS,'passed':sum(x['passed'] for x in RESULTS),'failed':sum(not x['passed'] for x in RESULTS),'errors':ERRORS,'boundary':'Mobile-sized Chromium using exact single-file HTML via bounded document.write chunks. Real CDP touches. Storage round-trip emulated separately. Not a physical Android device. Source URL coverage is recorded in the controller and campaign suites.'},indent=2))
if any(not x['passed'] for x in RESULTS):raise SystemExit(1)
