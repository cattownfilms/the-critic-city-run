"""Browser controller integration. Injected Gamepad objects are fixtures, not hardware tests.
Default reads the exact single-file build through bounded parser writes in this environment.
Use --url http://127.0.0.1:8788/ in unrestricted environments to test the multi-file site.
"""
from pathlib import Path
import argparse,json,os,sys,time
from playwright.sync_api import sync_playwright
from load_helper import load_html
from browser_support import source_site, launch_options, standalone_path
R=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--engine',default='chromium',choices=['chromium','firefox','webkit']);ap.add_argument('--url');ap.add_argument('--output',type=Path);ap.add_argument('--screenshots',type=Path);args=ap.parse_args()
results=[];errors=[]
def check(name,ok,detail=None):
 results.append({'name':name,'passed':bool(ok),'details':detail});print('PASS' if ok else 'FAIL',name,detail or '',flush=True)
fixtures='''window.__pads=[];Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>window.__pads});window.__makePad=(index=0,mapping='standard')=>({id:'Logitech-style API fixture / NOT physical hardware',index,connected:true,mapping,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))});'''
html=standalone_path().read_text().replace('<head>','<head><script>'+fixtures+'</script>') if not args.url else None
with source_site(args.url) as site_url, sync_playwright() as pw:
 launch=launch_options(args.engine)
 try:b=getattr(pw,args.engine).launch(**launch)
 except Exception as e:
  (R/'tests'/f'gamepad-{args.engine}-results.json').write_text(json.dumps({'passed':0,'failed':0,'notRun':True,'reason':str(e),'tests':[]},indent=2));raise SystemExit(2)
 context=b.new_context(viewport={'width':1280,'height':720},has_touch=True)
 p=context.new_page();p.on('pageerror',lambda e:(errors.append(str(e)),print('BROWSER ERROR',str(e),getattr(e,'stack',''),flush=True)))
 if args.url:
  p.add_init_script(fixtures);p.goto(site_url);p.wait_for_function('window.__brawler?.ready()',timeout=60000)
 else:load_html(p,html)
 check('Controller and every runtime atlas decode before bulk startup completes',p.evaluate('BRAWLER_CONFIG.version==="9.0.0"&&__brawler.meta().pages.length>=85&&__brawler.meta().pages.every((_,i)=>__brawler.renderer().images[i]?.naturalWidth>0)'))
 check('Controller defaults off without hiding touch controls',p.evaluate('!__brawler.controller.enabled'))
 p.locator('#movesButton').click();p.locator('#controllerEnabled').check();p.evaluate('__pads=[__makePad()]');p.wait_for_function('__brawler.controller.mappingOrigin==="standard"&&document.getElementById("controllerDevice").textContent.includes("Logitech-style")',timeout=10000)
 check('Browser-reported standard layout is recognized',p.evaluate('__brawler.controller.mappingOrigin==="standard"'))
 check('Controller status identifies the connected device', 'Logitech-style' in p.locator('#controllerDevice').evaluate('el=>el.selectedOptions[0].textContent'))
 shotdir=args.screenshots or R/'tests';shotdir.mkdir(parents=True,exist_ok=True);p.screenshot(path=str(shotdir/f'controller-settings-desktop-{args.engine}.png'))
 p.locator('#titleButton').click();p.wait_for_timeout(80)
 def btn(n,on=True):p.evaluate('([n,on])=>__pads[0].buttons[n]={pressed:on,value:on?1:0}',[n,on])
 def wait_observed(expression,timeout=10):
  # Driver-side reads keep the observer independent of WebKit's page timer/RAF
  # suspension when a focused native menu field is hidden by a transition.
  deadline=time.monotonic()+timeout
  while time.monotonic()<deadline:
   if p.evaluate(expression):return
   p.wait_for_timeout(50)
  raise AssertionError('Browser state was not observed: '+expression)
 def tap(n,ms=60):
  wait_observed('!__brawler.controller.blocked')
  before=p.evaluate('__brawler.controller.lastActivity');btn(n)
  wait_observed('__brawler.controller.lastActivity>'+str(before))
  p.wait_for_timeout(ms);btn(n,False)
  wait_observed('!__brawler.controller.blocked&&!Object.values(__brawler.controller.state.held).some(Boolean)')
  p.wait_for_timeout(100)
 tap(9);wait_observed('__brawler.game.mode==="cutscene"&&__brawler.scenes().state().id==="opening"&&!__brawler.scenes().loading',timeout=60);check('Controller Start opens the approved story from title',p.evaluate('__brawler.game.mode==="cutscene"&&__brawler.scenes().state().id==="opening"'))
 wait_observed('__brawler.scenes().time>=(__brawler.scenes().shot.minTime??.2)')
 tap(0);check('Controller Confirm advances a story beat',p.evaluate('__brawler.scenes().index===1'))
 tap(9);sceneTime=p.evaluate('__brawler.scenes().time');p.wait_for_timeout(160);check('Controller Start pauses the scene and freezes its clock',p.evaluate('__brawler.scenes().paused&&__brawler.scenes().time')==sceneTime)
 tap(9);check('Controller Start resumes the cutscene',p.evaluate('!__brawler.scenes().paused'))
 p.evaluate('__pads[0].buttons[2]={pressed:true,value:1};__pads[0].buttons[1]={pressed:true,value:1}');p.wait_for_function('__brawler.game.mode==="play"',timeout=10000)
 check('Controller Back skips the opening into gameplay',p.evaluate('__brawler.game.mode==="play"'))
 btn(1,False);p.wait_for_timeout(160);check('Held controller HIT does not leak through scene skip',p.evaluate('!__brawler.getInput().attackHeld&&!__brawler.game.p.action'))
 btn(2,False);p.wait_for_function('!__brawler.controller.blocked',timeout=10000);btn(2);p.wait_for_function('__brawler.game.p.action?.name==="jab"',timeout=10000)
 check('Controller neutral plus a fresh HIT restores combat',p.evaluate('__brawler.game.p.action?.name==="jab"'));btn(2,False);p.wait_for_function('__brawler.game.p.action===null',timeout=10000)

 check('Start does not also jump or attack',p.evaluate('__brawler.game.p.z===0&&__brawler.game.p.action===null'))
 def arena():p.evaluate('''()=>{const g=__brawler.game;g.enemies=[];g.props=[];g.nextGate=3;g.activeGate=-1;g.p.x=700;g.p.y=400;g.p.z=g.p.vz=g.p.vx=g.p.vy=0;g.p.hp=100;g.p.inv=0;g.p.action=null;g.p.guard=false;g.p.run=false;g.p.cosmetic=null;g.p.landTimer=0;g.p.airUsed=false;g.p.attackBuffer=g.p.jumpBuffer=g.p.exertion=g.p.counter=g.hitstop=0;g.mode='play';}''')
 arena();p.evaluate('__pads[0].axes[0]=.48');p.wait_for_function('__brawler.getInput().mx>0&&__brawler.getInput().mx<.6',timeout=10000);small=p.evaluate('__brawler.getInput().mx');p.evaluate('__pads[0].axes[0]=1');p.wait_for_function('__brawler.getInput().mx>.99&&__brawler.game.p.run',timeout=10000)
 check('Stick has graduated walk/run response',0<small<.6 and p.evaluate('__brawler.getInput().mx>.99&&__brawler.game.p.run'),{'partial':small})
 p.evaluate('__pads[0].axes[0]=0');p.wait_for_timeout(160);check('Stick release returns to zero',p.evaluate('__brawler.getInput().mx===0'))
 p.evaluate('__pads[0].axes[0]=.08');p.wait_for_timeout(60);check('Centered stick noise is rejected',p.evaluate('__brawler.getInput().mx===0'));p.evaluate('__pads[0].axes[0]=0')
 arena();tap(12,180);p.wait_for_function('__brawler.game.p.y<400',timeout=10000);check('D-pad moves along street depth',p.evaluate('__brawler.game.p.y<400'))
 arena();btn(2);p.wait_for_timeout(50);check('West face button enters jab',p.evaluate('__brawler.game.p.action?.name==="jab"'))
 p.wait_for_timeout(280);check('Held attack advances combo without repeated edges',p.evaluate('["cross","kick"].includes(__brawler.game.p.action?.name)'))
 btn(2,False);p.wait_for_timeout(1300)
 arena();btn(0);p.wait_for_function('__brawler.game.p.z>25',timeout=5000);btn(2);p.wait_for_function('__brawler.game.p.action?.name==="air"',timeout=3000)
 check('Jump plus attack selects the dedicated airborne kick',p.evaluate('__brawler.game.p.z>0&&__brawler.game.p.action?.name==="air"'),p.evaluate('({z:__brawler.game.p.z,action:__brawler.game.p.action?.name})'))
 p.screenshot(path=str(R/'tests/controller-air-kick.png'));btn(0,False);btn(2,False);p.wait_for_timeout(1200)
 arena();btn(1);p.wait_for_timeout(180);check('East face button holds guard',p.evaluate('__brawler.game.p.guard'));btn(1,False);p.wait_for_timeout(200)
 arena();p.evaluate('__brawler.game.p.meter=100');btn(3);p.wait_for_timeout(60);check('North face button triggers existing Review',p.evaluate('__brawler.game.p.action?.name==="spin"'));btn(3,False);p.wait_for_timeout(1400)
 arena();tap(9);check('Start pauses rather than repeatedly toggling',p.evaluate('__brawler.game.mode==="pause"'))
 t=p.evaluate('__brawler.game.t');btn(9);p.wait_for_timeout(450);check('Held Start resumes only once',p.evaluate('__brawler.game.mode==="play"'));btn(9,False);p.wait_for_timeout(80)
 # Disconnect while holding movement and attack.
 arena();p.evaluate('__pads[0].axes[0]=1');btn(2);p.wait_for_timeout(80);p.evaluate('__pads=[]');p.wait_for_timeout(120)
 check('Disconnect pauses and releases pad input',p.evaluate('__brawler.game.mode==="pause"&&!__brawler.getInput().attackHeld&&__brawler.getInput().mx===0'))
 p.locator('#resumeButton').click();p.keyboard.down('ArrowRight');p.wait_for_timeout(150);check('Keyboard remains playable after controller disconnect',p.evaluate('__brawler.getInput().mx===1'));p.keyboard.up('ArrowRight')
 # Touch and gamepad ownership coexist; physical release cannot release a touch.
 p.evaluate('__pads=[__makePad()]');p.wait_for_timeout(100);arena();btn(2);p.wait_for_timeout(30)
 p.locator('#attack').dispatch_event('pointerdown',{'pointerId':45,'clientX':1230,'clientY':650,'pressure':.5});btn(2,False);p.wait_for_timeout(50)
 check('Releasing physical HIT does not release touch HIT',p.evaluate('__brawler.getInput().attackHeld&&__brawler.input.pointers.size===1'))
 p.evaluate('window.dispatchEvent(new PointerEvent("pointerup",{pointerId:45}))');p.wait_for_timeout(50);check('Independent touch release clears the last HIT owner',p.evaluate('!__brawler.getInput().attackHeld'))
 # Browser blur protection.
 p.evaluate('__pads[0].axes[0]=1');p.wait_for_timeout(100);p.evaluate('window.dispatchEvent(new Event("blur"))');p.wait_for_timeout(60)
 check('Focus loss pauses and suppresses held movement',p.evaluate('__brawler.game.mode==="pause"&&__brawler.getInput().mx===0'))
 p.locator('#resumeButton').click();p.wait_for_timeout(100);check('Held stick does not immediately run after resume',p.evaluate('__brawler.getInput().mx===0'))
 p.evaluate('__pads[0].axes[0]=0');p.wait_for_timeout(80);p.evaluate('__pads[0].axes[0]=1');p.wait_for_timeout(80);check('Neutral-then-move restores control',p.evaluate('__brawler.getInput().mx===1'));p.evaluate('__pads[0].axes[0]=0')
 # Nonstandard pad replacement and actual menu mapping wizard.
 p.locator('#pauseBtn').click();p.evaluate('__pads=[__makePad(0,"")]');p.wait_for_timeout(180)
 check('Nonstandard pad does not guess the Logitech layout',p.evaluate('__brawler.controller.mapping===null'))
 p.locator('#controllerMap').click();p.locator('#controllerMapReady').click();p.wait_for_timeout(320)
 choices=[('a',0,-1),('a',0,1),('a',1,-1),('a',1,1),('b',5,1),('b',6,1),('b',7,1),('b',8,1),('b',9,1),('b',6,1),('b',7,1)]
 for kind,index,value in choices:
  if kind=='a':p.evaluate('([i,v])=>__pads[0].axes[i]=v',[index,value])
  else:btn(index)
  p.wait_for_timeout(70)
  if kind=='a':p.evaluate('(i)=>__pads[0].axes[i]=0',index)
  else:btn(index,False)
  p.wait_for_timeout(310)
 check('Complete UI mapping wizard saves a custom profile',p.evaluate('__brawler.controller.mappingOrigin==="custom"&&__brawler.controller.mapping.attack[0].index===5&&__brawler.controller.capture===null'))
 check('Custom profile is persisted in separate settings key',p.evaluate('JSON.parse(__testStore[CriticGamepad.KEY]).profiles[__brawler.controller.key].attack[0].index===5') if not args.url else p.evaluate('JSON.parse(localStorage.getItem(CriticGamepad.KEY)).profiles[__brawler.controller.key].attack[0].index===5'))
 p.locator('#resumeButton').click();p.wait_for_timeout(100);arena();btn(5);p.wait_for_timeout(50);check('Custom physical HIT drives the real game',p.evaluate('__brawler.game.p.action?.name==="jab"'));btn(5,False)
 # Native menu navigation and confirm/back sharing.
 tap(9);p.locator('#resumeButton').focus();p.evaluate('__pads[0].axes[1]=1');p.wait_for_timeout(70);p.evaluate('__pads[0].axes[1]=0');p.wait_for_timeout(60)
 check('Stick navigates focus through the current menu',p.evaluate('document.activeElement.id!=="resumeButton"&&document.activeElement.closest("#pause")!==null'))
 tap(7);p.keyboard.down('ArrowRight');p.wait_for_function('__brawler.getInput().mx===1',timeout=10000,polling=50);check('Custom Menu Back resumes gameplay and returns keyboard focus',p.evaluate('__brawler.game.mode==="play"&&document.activeElement.closest("#pause")===null&&__brawler.getInput().mx===1'));p.keyboard.up('ArrowRight')
 # Portrait controller UI remains scrollable and inside the panel.
 p.locator('#pauseBtn').click();p.set_viewport_size({'width':412,'height':915});p.locator('#controllerSettings').scroll_into_view_if_needed();p.wait_for_timeout(180)
 check('Controller panel fits portrait width',p.locator('#controllerDevice').bounding_box()['width']<412 and p.evaluate('document.documentElement.scrollWidth<=innerWidth'))
 p.screenshot(path=str(shotdir/f'controller-settings-portrait-{args.engine}.png'))
 # Keyboard editing on a native field must not create gameplay edges.
 p.locator('#controllerDeadzone').focus();p.keyboard.press('ArrowRight');check('Keyboard can adjust native settings without game movement',p.evaluate('__brawler.input.keys.size===0'))
 check('No uncaught JavaScript errors during controller integration',not errors,errors)
 report={'engine':args.engine,'browserVersion':b.version,'tests':results,'passed':sum(x['passed'] for x in results),'failed':sum(not x['passed'] for x in results),'boundary':'Real browser rendering and event loop; injected standard and nonstandard Gamepad API fixtures. No physical Logitech device. '+('Actual multi-file authoring source served on same-process localhost.' if args.url=='local' else 'Hosted multi-file URL.' if args.url else 'Exact standalone loaded through bounded parser writes; storage explicitly emulated.')}
 output=args.output or R/'tests'/f'gamepad-{args.engine}-results.json';output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(report,indent=2));b.close()
if report['failed']:raise SystemExit(1)
