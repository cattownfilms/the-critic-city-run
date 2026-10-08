"""Integrated campaign and scene regression in a real browser.

The complete-route driver accelerates fixed engine updates using normal combat
inputs and actual app event handling. It never sets enemy HP, player HP, position,
score, or campaign flags during either route. Explicit scenario fixtures are kept
separate and identified. Gamepads are fixtures; no physical hardware is claimed.
"""
from pathlib import Path
import argparse, json, time
from playwright.sync_api import sync_playwright
from browser_support import source_site, launch_options, standalone_path, trace_native_audio
from load_helper import load_html

ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser()
ap.add_argument('--engine',choices=['chromium','firefox','webkit'],default='chromium')
ap.add_argument('--url',default='local',help='local serves source; a real URL tests that build; standalone uses offline HTML')
ap.add_argument('--output',type=Path)
ap.add_argument('--screenshots',type=Path)
args=ap.parse_args()
results=[];errors=[];routes=[];test_started=time.monotonic()
def trace(label, details=None):
    # Observation only: flush before potentially blocking browser operations so
    # a cancelled CI job identifies the exact unfinished action or route batch.
    print('CAMPAIGN TRACE',json.dumps({'elapsedSeconds':round(time.monotonic()-test_started,2),'engine':args.engine,'operation':label,'details':details}),flush=True)
def ui_step(label, action):
    trace(label+' begin')
    value=action()
    trace(label+' end')
    return value
def check(name,ok,details=None):
    results.append({'name':name,'passed':bool(ok),'details':details})
    print('PASS' if ok else 'FAIL',name,details or '',flush=True)
def wait(page, expression, arg=None):
    page.wait_for_function(expression, arg=arg, timeout=60000, polling=50)
def opening_ready(page):
    trace('wait for decoded opening begin')
    wait(page,'__brawler.scenes().active&&!__brawler.scenes().loading&&__brawler.scenes().state().id==="opening"')
    trace('wait for decoded opening end')
def skip_scenes(page):
    # Actual app scene callbacks may prepare the next scene asynchronously.
    trace('safe scene queue skip begin')
    for _ in range(100):
        if page.evaluate('__brawler.scenes().active'):
            trace('safe scene skip callback begin',{'iteration':_})
            page.evaluate('__brawler.scenes().skip()')
            trace('safe scene skip callback end',{'iteration':_})
        elif page.evaluate('__brawler.game.mode!=="loading"&&__brawler.game.mode!=="cutscene"'):
            break
        page.wait_for_timeout(50)
    wait(page,'!__brawler.scenes().active&&__brawler.game.mode!=="loading"&&__brawler.game.mode!=="cutscene"')
    trace('safe scene queue skip end')
def load(page,url):
    page.on('pageerror',lambda e:errors.append(str(e)))
    if url=='standalone':load_html(page,standalone_path().read_text())
    else:page.goto(url);page.wait_for_function('window.__brawler?.ready()',timeout=60000)
def reload_game(page,url):
    if url=='standalone':
        seed=json.dumps(page.evaluate('window.__testStore')).replace('</script','<\\/script')
        page.goto('about:blank')
        html=standalone_path().read_text().replace('<head>','<head><script>window.__testStore='+seed+';</script>')
        load_html(page,html)
    else:
        page.reload();page.wait_for_function('__brawler.ready()',timeout=60000)
def route_run(page,kind):
    trace('route initialization begin',{'kind':kind})
    page.evaluate('''kind=>{window.__campaignQA={ticks:0,retries:0,stages:[],bosses:[],scenes:[],defeats:[],projectionDisabled:false,earlyRescue:false,dukeBeforeMachine:false,machineWaves:0,maxLiveSummons:0,summonsAfterMachine:false,kind};}''',kind)
    trace('route initialization end',{'kind':kind})
    started=time.monotonic();loading_waits=[];previous=None
    for batch in range(220):
        batch_started=time.monotonic()
        trace('route batch begin',{'kind':kind,'batch':batch,'priorStage':previous.get('stage') if previous else None,'priorTicks':previous.get('ticks',0) if previous else 0})
        value=page.evaluate('''()=>{
          const g=__brawler.game,qa=window.__campaignQA;
          const events=()=>{for(const e of g.drain()){if(e.type==='bossEnter'&&!qa.bosses.includes(e.kind))qa.bosses.push(e.kind);if(e.type==='bossDefeated')qa.defeats.push(e.kind);if(e.type==='bossEnter'&&e.kind==='duke'&&!g.machineDefeated)qa.dukeBeforeMachine=true;__brawler.handleEvent(e);}};
          for(let n=0;n<1600;n++){
            if(g.storyFlags.martyRescued&&!g.dukeDefeated)qa.earlyRescue=true;
            qa.machineWaves=Math.max(qa.machineWaves,g.broadcastSummons?.wave||0);const summonCount=g.enemies.filter(e=>e.broadcastSummon&&e.hp>0).length;qa.maxLiveSummons=Math.max(qa.maxLiveSummons,summonCount);if(g.machineDefeated&&summonCount)qa.summonsAfterMachine=true;
            if(__brawler.scenes().active){const id=__brawler.scenes().state().id;if(qa.scenes.at(-1)!==id)qa.scenes.push(id);__brawler.scenes().skip();break;}
            if(g.mode==='loading')break;
            if(g.mode==='complete')break;
            if(g.mode==='gameover'){qa.retries++;g.retry(true);events();}
            if(g.mode==='stageclear'){g.finishStageClear();events();continue;}
            if(g.mode!=='play')break;
            if(!qa.stages.includes(g.stage))qa.stages.push(g.stage);for(const e of g.enemies)if(e.boss&&!qa.bosses.includes(e.kind))qa.bosses.push(e.kind);
            if(g.projection.disabled)qa.projectionDisabled=true;
            const p=g.p,live=g.enemies.filter(e=>e.hp>0&&(e.kind!=='broadcast-rig'||e.targetable)).concat(g.props.filter(o=>['circuit','remote'].includes(o.kind)&&o.hp>0)).sort((a,b)=>Math.hypot(a.x-p.x,(a.y-p.y)*2)-Math.hypot(b.x-p.x,(b.y-p.y)*2));let input={};
            if(live.length){const e=live[0],dx=e.x-p.x,dy=e.y-p.y;
              input.mx=Math.abs(dx)>62?Math.sign(dx)*(Math.abs(dx)>150?1:.4):0;
              input.my=Math.abs(dy)>8?Math.sign(dy)*.55:0;
              input.attackPressed=Math.abs(dx)<122&&Math.abs(dy)<25&&qa.ticks%12===0;
              input.attackHeld=Math.abs(dx)<116&&Math.abs(dy)<27;
              if(p.meter>=100&&live.length>1&&!p.action)input.specialPressed=true;
            }else input.mx=1;
            g.step(1/120,input);qa.ticks++;events();
          }
          return {...qa,mode:g.mode,stage:g.stage,seconds:g.t,kos:g.stats.kos,hits:g.stats.hits,flags:{...g.storyFlags},selected:g.playerKind,finalPhase:g.finalPhase,machineDefeated:g.machineDefeated,dukeDefeated:g.dukeDefeated};
        }''')
        trace('route batch end',{'kind':kind,'batch':batch,'wallSeconds':round(time.monotonic()-batch_started,3),'stage':value['stage'],'mode':value['mode'],'ticks':value['ticks'],'deltaTicks':value['ticks']-(previous['ticks'] if previous else 0),'kos':value['kos'],'deltaKOs':value['kos']-(previous['kos'] if previous else 0),'simulationSeconds':value['seconds'],'stageChanged':previous is None or previous['stage']!=value['stage'],'scenes':value['scenes'][-2:]})
        previous=value
        if value['mode']=='complete':
            value['wallSeconds']=round(time.monotonic()-started,2);value['loadingWaits']=loading_waits
            return value
        if value['mode']=='loading':
            # Network preparation is asynchronous app work, not a combat update.
            # Wait for a real scene/play transition without spending the fixed
            # simulation batch budget on a cold public asset download.
            loading_started=time.monotonic()
            diagnostic=page.evaluate('''()=>({stage:__brawler.game.stage,status:document.getElementById('contentLoadStatus').textContent,retryVisible:!document.getElementById('contentLoadRetry').hidden,scene:__brawler.scenes().state().id})''' )
            wait(page,"__brawler.game.mode!=='loading'||!document.getElementById('contentLoadRetry').hidden")
            outcome=page.evaluate('''()=>({mode:__brawler.game.mode,status:document.getElementById('contentLoadStatus').textContent,retryVisible:!document.getElementById('contentLoadRetry').hidden})''' )
            loading_waits.append({**diagnostic,**outcome,'waitSeconds':round(time.monotonic()-loading_started,2)})
            print('LOADING PROGRESSION',json.dumps(loading_waits[-1]),flush=True)
            if outcome['retryVisible']:raise AssertionError('Actual required dependency failed: '+outcome['status'])
        else:page.wait_for_timeout(5)
    value['wallSeconds']=round(time.monotonic()-started,2);value['loadingWaits']=loading_waits
    return value

with source_site(args.url) as url, sync_playwright() as pw:
    try:browser=getattr(pw,args.engine).launch(**launch_options(args.engine))
    except Exception as e:
        report={'engine':args.engine,'notRun':True,'reason':str(e),'tests':[],'passed':0,'failed':0}
        (ROOT/'tests'/f'campaign-browser-{args.engine}-results.json').write_text(json.dumps(report,indent=2))
        raise SystemExit(2)
    context=browser.new_context(viewport={'width':1000,'height':560},has_touch=True)
    page=context.new_page()
    trace_native_audio(page)
    load(page,url)
    check('Current canonical title and expanded campaign load',page.title().upper()=='THE CRITIC: COMING ATTRACTIONS' and page.evaluate('Brawler.STAGES.length===7&&BRAWLER_CONFIG.version==="10.0.0"'))
    ui_step('New Game click',lambda: page.locator('#startButton').click());opening_ready(page)
    check('New Game opens the implemented story',page.evaluate('__brawler.game.mode==="cutscene"&&__brawler.scenes().state().id==="opening"'))
    expected=[('DUKE','Ratings are low. I need you to give this a glowing review, Sherman!'),('JAY','It Stinks!'),('DUKE','I thought you might say that... Allow me to give you a little motivation...'),('MARTY','Dad!'),('JAY','Marty!'),('DUKE',"If television can't bring the audience to us, perhaps we'll just bring the television to the audience!"),('JAY','Hatchi Matchi!!!')]
    shown=[]
    for _ in range(30):
        if not page.evaluate('__brawler.scenes().active'):break
        wait(page,'__brawler.scenes().active&&!__brawler.scenes().loading')
        state=page.evaluate('__brawler.scenes().state()');index=state['index']
        if state['dialogue']:shown.append((state['speaker'],state['dialogue']))
        if page.evaluate('!!__brawler.scenes().shot.auto'):
            wait(page,'i=>!__brawler.scenes().active||__brawler.scenes().index!==i',index)
        else:
            wait(page,'__brawler.scenes().time>=(__brawler.scenes().shot.minTime??.2)')
            page.keyboard.press('Space')
            wait(page,'i=>!__brawler.scenes().active||__brawler.scenes().index!==i',index)
    wait(page,'__brawler.game.mode==="play"&&!__brawler.scenes().active')
    check('Opening presents every approved dialogue line verbatim',shown==expected,shown)
    check('Watching the opening restores play and commits one completion flag',page.evaluate('__brawler.game.mode==="play"&&__brawler.game.storyFlags.opening&&__brawler.scenes().state().completed.filter(id=>id==="opening").length===1'))
    stable=page.evaluate('({mode:__brawler.game.mode,stage:__brawler.game.stage,gate:__brawler.game.nextGate,score:__brawler.game.score,flags:{...__brawler.game.storyFlags}})')
    page.evaluate('__brawler.scenes().skip();__brawler.scenes().skip()')
    check('Repeated scene completion is idempotent',stable==page.evaluate('({mode:__brawler.game.mode,stage:__brawler.game.stage,gate:__brawler.game.nextGate,score:__brawler.game.score,flags:{...__brawler.game.storyFlags}})'))
    x=page.evaluate('__brawler.game.p.x');page.keyboard.down('ArrowRight');page.wait_for_function('(x)=>__brawler.game.p.x>x',arg=x,timeout=10000);page.keyboard.up('ArrowRight')
    check('Actual keyboard movement works after the story',page.evaluate('__brawler.game.p.x')>x)
    page.keyboard.down('KeyJ');page.wait_for_function('!!__brawler.game.p.action',timeout=10000)
    check('Actual keyboard attack drives accepted combat',page.evaluate('!!__brawler.game.p.action'))
    page.keyboard.up('KeyJ');page.wait_for_timeout(800)
    page.keyboard.press('Escape');check('Keyboard pause is preserved',page.evaluate('__brawler.game.mode==="pause"'))
    ui_step('Return to title click',lambda: page.locator('#titleButton').click());ui_step('New Game click',lambda: page.locator('#startButton').click());opening_ready(page)
    ui_step('Scene pause toggle',lambda: page.locator('#scenePause').click());before=page.evaluate('__brawler.scenes().time');page.wait_for_timeout(180)
    check('Scene pause freezes time and audio',page.evaluate('__brawler.scenes().paused&&__brawler.audio.music.paused&&__brawler.scenes().time')==before)
    ui_step('Scene pause toggle',lambda: page.locator('#scenePause').click());page.wait_for_timeout(140)
    page.keyboard.down('KeyJ');page.keyboard.press('Escape');page.wait_for_timeout(140)
    check('Skipping with HIT held does not leak a punch',page.evaluate('__brawler.game.mode==="play"&&!__brawler.getInput().attackHeld&&!__brawler.game.p.action'))
    page.keyboard.up('KeyJ');page.keyboard.down('KeyJ');page.wait_for_timeout(70)
    check('Fresh HIT after key release restores attack',page.evaluate('!!__brawler.game.p.action'));page.keyboard.up('KeyJ')
    page.keyboard.press('Escape');ui_step('Return to title click',lambda: page.locator('#titleButton').click());ui_step('New Game click',lambda: page.locator('#startButton').click());opening_ready(page)
    wait(page,'__brawler.scenes().time>=(__brawler.scenes().shot.minTime??.2)');before=page.evaluate('__brawler.scenes().index');ui_step('Touch scene advance',lambda: page.locator('#sceneAdvance').tap());page.wait_for_timeout(150)
    check('Touch advances the cutscene',page.evaluate('__brawler.scenes().index')==before+1)
    page.set_viewport_size({'width':412,'height':915});page.wait_for_timeout(120)
    check('Portrait scene text and controls stay inside viewport',page.evaluate('''()=>['sceneDialogue','sceneAdvance','sceneSkip','scenePause'].every(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1})&&document.documentElement.scrollWidth<=innerWidth'''))
    shotpath=(args.screenshots or ROOT/'tests')/f'campaign-scene-portrait-{args.engine}.png';shotpath.parent.mkdir(parents=True,exist_ok=True);page.screenshot(path=str(shotpath))
    ui_step('Touch scene skip',lambda: page.locator('#sceneSkip').tap());page.wait_for_timeout(100);check('Touch skip restores gameplay and clean input',page.evaluate('__brawler.game.mode==="play"&&__brawler.input.pointers.size===0'))
    page.set_viewport_size({'width':1000,'height':560})
    # Start each full run through the real title UI. Route simulation uses normal inputs.
    page.keyboard.press('Escape');ui_step('Return to title click',lambda: page.locator('#titleButton').click());ui_step('New Game click',lambda: page.locator('#startButton').click());skip_scenes(page)
    jay=route_run(page,'hero');routes.append(jay)
    check('Jay completes all seven stages through normal combat inputs',jay['mode']=='complete' and jay['stages']==list(range(7)) and jay['kos']>=71,jay)
    check('Jay route includes every required boss and projection counterplay',all(kind in jay['bosses'] for kind in ['franklin','pizzeria-boss','spike','broadcast-rig','duke']) and jay['projectionDisabled'] and jay['machineWaves']>=2 and jay['maxLiveSummons']<=4 and not jay['summonsAfterMachine'])
    check('Both final fights occur in order before Marty is rescued',not jay['earlyRescue'] and not jay['dukeBeforeMachine'] and jay['defeats'][-2:]==['broadcast-rig','duke'] and jay['machineDefeated'] and jay['dukeDefeated'],jay['defeats'])
    check('Ending resolves Marty and broadcasting and shows selected celebration',jay['flags'].get('martyRescued') and jay['flags'].get('broadcastStopped') and jay['flags'].get('ending') and page.locator('#complete').is_visible() and page.locator('#victoryCanvas').is_visible())
    check('Completed save uses migrated schema and retains story completion',page.evaluate('__brawler.getSave().version===5&&__brawler.getSave().complete&&__brawler.getSave().storyFlags.ending'))
    # An unlocked-profile fixture allows the replay route independently of driver eligibility.
    page.evaluate('localStorage.setItem(BRAWLER_CONFIG.profileKey,JSON.stringify({franklinUnlocked:true,selected:"franklin"}))')
    reload_game(page,url)
    page.select_option('#playerSelect','franklin');ui_step('New Game click',lambda: page.locator('#startButton').click());skip_scenes(page)
    franklin=route_run(page,'franklin');routes.append(franklin)
    check('Franklin replay completes all seven stages through normal combat inputs',franklin['mode']=='complete' and franklin['stages']==list(range(7)) and franklin['selected']=='franklin',franklin)
    check('Franklin defeats the machine and Duke before rescuing Marty',not franklin['earlyRescue'] and not franklin['dukeBeforeMachine'] and franklin['defeats'][-2:]==['broadcast-rig','duke'] and franklin['dukeDefeated'] and franklin['machineWaves']>=2 and franklin['maxLiveSummons']<=4 and not franklin['summonsAfterMachine'],franklin['defeats'])
    check('Franklin never fights himself and receives no duplicate unlock message','franklin' not in franklin['bosses'] and 'sherm-slam' in franklin['bosses'] and 'UNLOCKED' not in page.locator('#rewardHeading').inner_text())
    # Real-origin legacy storage scenario, explicit fixture rather than a playthrough claim.
    page.evaluate('''()=>{localStorage.setItem(BRAWLER_CONFIG.saveKey,JSON.stringify({version:3,stage:3,nextGate:3,complete:true,lives:2,score:4321,meter:42,franklinUnlocked:true,playerKind:'hero',deathsByStage:[0,1,0,0],stage4Eligible:true,bossDefeated:true}));localStorage.setItem(BRAWLER_CONFIG.settingsKey,JSON.stringify({music:.19,sfx:.43,reducedMotion:true,vibration:false}));localStorage.setItem(CriticGamepad.KEY,JSON.stringify({version:1,enabled:false,deadzone:.22,profiles:{}}));}''')
    reload_game(page,url)
    check('Completed legacy four-stage save offers Continue',page.locator('#continueButton').is_visible())
    ui_step('Continue click',lambda: page.locator('#continueButton').click());wait(page,'__brawler.scenes().active&&!__brawler.scenes().loading')
    check('Legacy completion continues into cinema without replaying opening',page.evaluate('__brawler.game.stage===4&&__brawler.scenes().state().id==="stage-05-intro"&&__brawler.game.score===4321&&__brawler.game.p.lives===2'))
    check('Migration retains Franklin, volume, accessibility, and controller settings',page.evaluate('__brawler.getProfile().franklinUnlocked&&settings.music===.19&&settings.sfx===.43&&settings.reducedMotion&&__brawler.controller.deadzone===.22'))
    skip_scenes(page);page.evaluate('__brawler.game.checkpointSave();for(const e of __brawler.game.drain())__brawler.handleEvent(e)')
    checkpoint=page.evaluate('__brawler.getSave()')
    page.keyboard.press('Escape');ui_step('Return to title click',lambda: page.locator('#titleButton').click());ui_step('Continue click',lambda: page.locator('#continueButton').click());wait(page,'__brawler.game.mode==="play"&&!__brawler.scenes().active')
    check('New-schema Continue restores checkpoint directly',page.evaluate('__brawler.game.mode==="play"&&!__brawler.scenes().active&&__brawler.game.stage===4') and page.evaluate('__brawler.getSave().nextGate')==checkpoint['nextGate'])
    # Older complete v6 saves predate Duke's physical finale and must resume him.
    page.evaluate("""()=>localStorage.setItem(BRAWLER_CONFIG.saveKey,JSON.stringify({version:4,stage:6,nextGate:3,complete:true,lives:2,score:6543,meter:42,playerKind:'franklin',franklinUnlocked:true,bossDefeated:true,storyFlags:{opening:true,martyRescued:true,broadcastStopped:true,ending:true}}))""")
    reload_game(page,url)
    check('Completed v4 seven-stage save offers the new required final confrontation',page.locator('#continueButton').is_visible())
    ui_step('Continue click',lambda: page.locator('#continueButton').click());wait(page,'__brawler.game.mode==="play"&&!__brawler.scenes().active')
    check('Old complete save resumes one real Duke with preserved score, route and lives',page.evaluate("""__brawler.game.stage===6&&__brawler.game.finalPhase==='duke'&&__brawler.game.enemies.filter(e=>e.kind==='duke').length===1&&__brawler.game.score===6543&&__brawler.game.p.lives===2&&__brawler.game.playerKind==='franklin'&&!__brawler.game.storyFlags.martyRescued&&!__brawler.game.dukeDefeated"""))
    page.evaluate('__brawler.game.checkpointSave();for(const e of __brawler.game.drain())__brawler.handleEvent(e)')
    reload_game(page,url);ui_step('Continue click',lambda: page.locator('#continueButton').click());wait(page,'__brawler.game.mode==="play"&&!__brawler.scenes().active')
    check('Pending-Duke schema5 Continue is idempotent and does not replay ordinary waves',page.evaluate("""__brawler.getSave().version===5&&__brawler.game.enemies.length===1&&__brawler.game.enemies[0].kind==='duke'&&__brawler.game.finalPhase==='duke'&&!__brawler.game.storyFlags.martyRescued"""))
    art=page.evaluate("""async()=>{const names=[...new Set(Object.values(CriticCutscenes.scenes).flatMap(scene=>['hero','franklin'].flatMap(route=>CriticCutscenes.dependencies(scene.id,route,__brawler.meta()).images)))];return Promise.all(names.map(name=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve({name,decoded:image.naturalWidth>0,width:image.naturalWidth,height:image.naturalHeight});image.onerror=()=>resolve({name,decoded:false});image.src=window.BRAWLER_ASSETS?BRAWLER_ASSETS.files[name]:BRAWLER_CONFIG.assetBase+name;})));}""")
    check('Every declared cutscene art dependency decodes in the browser',all(item['decoded'] for item in art),art)
    check('No uncaught browser JavaScript errors in campaign/story integration',not errors,errors)
    report={'engine':args.engine,'browserVersion':browser.version,'edition':'offline' if args.url=='standalone' else 'source' if args.url=='local' else 'hosted','tests':results,'routes':routes,'passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),'boundary':'Real browser rendering, event loop, keyboard/touch scenes. Source/hosted tests use actual origin-local storage; standalone parser tests explicitly emulate storage and restore its serialized values on reload. Complete routes accelerate fixed updates with normal combat inputs through the actual app event handlers; stageclear delays are skipped via the real engine transition. Legacy storage and unlocked Franklin profiles are explicit fixtures. No physical Android/Logitech hardware.'}
    output=args.output or ROOT/'tests'/f'campaign-browser-{args.engine}-results.json';output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(report,indent=2))
    if not args.output:(ROOT/'tests'/f'campaign-browser-{args.engine}-{report["edition"]}-results.json').write_text(json.dumps(report,indent=2))
    browser.close()
if report['failed']:raise SystemExit(1)
