"""Integrated campaign and scene regression in a real browser.

The complete-route driver accelerates fixed engine updates using normal combat
inputs and actual app event handling. It never sets enemy HP, player HP, position,
score, or campaign flags during either route. Explicit scenario fixtures are kept
separate and identified. Gamepads are fixtures; no physical hardware is claimed.
"""
from pathlib import Path
import argparse, json, time
from playwright.sync_api import sync_playwright
from browser_support import source_site, launch_options, standalone_path
from load_helper import load_html

ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser()
ap.add_argument('--engine',choices=['chromium','firefox','webkit'],default='chromium')
ap.add_argument('--url',default='local',help='local serves source; a real URL tests that build; standalone uses offline HTML')
args=ap.parse_args()
results=[];errors=[];routes=[]
def check(name,ok,details=None):
    results.append({'name':name,'passed':bool(ok),'details':details})
    print('PASS' if ok else 'FAIL',name,details or '',flush=True)
def skip_scenes(page):
    page.evaluate('()=>{let n=0;while(__brawler.scenes().active&&n++<20)__brawler.scenes().skip()}')
    page.wait_for_timeout(80)
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
    page.evaluate('''kind=>{window.__campaignQA={ticks:0,retries:0,stages:[],bosses:[],scenes:[],projectionDisabled:false,kind};}''',kind)
    started=time.monotonic()
    for batch in range(220):
        value=page.evaluate('''()=>{
          const g=__brawler.game,qa=window.__campaignQA;
          const events=()=>{for(const e of g.drain()){if(e.type==='bossEnter'&&!qa.bosses.includes(e.kind))qa.bosses.push(e.kind);__brawler.handleEvent(e);}};
          for(let n=0;n<1600;n++){
            if(__brawler.scenes().active){qa.scenes.push(__brawler.scenes().state().id);__brawler.scenes().skip();continue;}
            if(g.mode==='loading')break;
            if(g.mode==='complete')break;
            if(g.mode==='gameover'){qa.retries++;g.retry(true);events();}
            if(g.mode==='stageclear'){g.finishStageClear();events();continue;}
            if(g.mode!=='play')break;
            if(!qa.stages.includes(g.stage))qa.stages.push(g.stage);for(const e of g.enemies)if(e.boss&&!qa.bosses.includes(e.kind))qa.bosses.push(e.kind);
            if(g.projection.disabled)qa.projectionDisabled=true;
            const p=g.p,live=g.enemies.filter(e=>e.hp>0).concat(g.props.filter(o=>o.kind==='circuit'&&o.hp>0)).sort((a,b)=>Math.hypot(a.x-p.x,(a.y-p.y)*2)-Math.hypot(b.x-p.x,(b.y-p.y)*2));let input={};
            if(live.length){const e=live[0],dx=e.x-p.x,dy=e.y-p.y;
              input.mx=Math.abs(dx)>62?Math.sign(dx)*(Math.abs(dx)>150?1:.4):0;
              input.my=Math.abs(dy)>8?Math.sign(dy)*.55:0;
              input.attackPressed=Math.abs(dx)<122&&Math.abs(dy)<25&&qa.ticks%12===0;
              input.attackHeld=Math.abs(dx)<116&&Math.abs(dy)<27;
              if(p.meter>=100&&live.length>1&&!p.action)input.specialPressed=true;
            }else input.mx=1;
            g.step(1/120,input);qa.ticks++;events();
          }
          return {...qa,mode:g.mode,stage:g.stage,seconds:g.t,kos:g.stats.kos,hits:g.stats.hits,flags:{...g.storyFlags},selected:g.playerKind};
        }''')
        if value['mode']=='complete':
            value['wallSeconds']=round(time.monotonic()-started,2)
            return value
        if value['mode']=='loading':page.wait_for_timeout(120)
        else:page.wait_for_timeout(5)
    value['wallSeconds']=round(time.monotonic()-started,2)
    return value

with source_site(args.url) as url, sync_playwright() as pw:
    try:browser=getattr(pw,args.engine).launch(**launch_options(args.engine))
    except Exception as e:
        report={'engine':args.engine,'notRun':True,'reason':str(e),'tests':[],'passed':0,'failed':0}
        (ROOT/'tests'/f'campaign-browser-{args.engine}-results.json').write_text(json.dumps(report,indent=2))
        raise SystemExit(2)
    context=browser.new_context(viewport={'width':1000,'height':560},has_touch=True)
    page=context.new_page();load(page,url)
    check('Current canonical title and expanded campaign load',page.title().upper()=='THE CRITIC: COMING ATTRACTIONS' and page.evaluate('Brawler.STAGES.length===7&&BRAWLER_CONFIG.version==="6.0.0"'))
    page.locator('#startButton').click();page.wait_for_timeout(160)
    check('New Game opens the implemented story',page.evaluate('__brawler.game.mode==="cutscene"&&__brawler.scenes().state().id==="opening"'))
    expected=[('DUKE','Ratings are low. I need you to give this a glowing review, Sherman!'),('JAY','It Stinks!'),('DUKE','I thought you might say that... Allow me to give you a little motivation...'),('MARTY','Dad!'),('JAY','Marty!'),('DUKE',"If television can't bring the audience to us, perhaps we'll just bring the television to the audience!"),('JAY','Hatchi Matchi!!!')]
    shown=[]
    for _ in range(12):
        if not page.evaluate('__brawler.scenes().active'):break
        state=page.evaluate('__brawler.scenes().state()')
        speaker=page.locator('#sceneSpeaker').inner_text();dialogue=page.locator('#sceneDialogue').inner_text()
        if dialogue:shown.append((speaker,dialogue))
        if state['index']==6:page.wait_for_timeout(1450)
        else:page.wait_for_timeout(150);page.keyboard.press('Space')
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
    page.locator('#titleButton').click();page.locator('#startButton').click();page.wait_for_timeout(160)
    page.locator('#scenePause').click();before=page.evaluate('__brawler.scenes().time');page.wait_for_timeout(180)
    check('Scene pause freezes time and audio',page.evaluate('__brawler.scenes().paused&&__brawler.audio.music.paused&&__brawler.scenes().time')==before)
    page.locator('#scenePause').click();page.wait_for_timeout(140)
    page.keyboard.down('KeyJ');page.keyboard.press('Escape');page.wait_for_timeout(140)
    check('Skipping with HIT held does not leak a punch',page.evaluate('__brawler.game.mode==="play"&&!__brawler.getInput().attackHeld&&!__brawler.game.p.action'))
    page.keyboard.up('KeyJ');page.keyboard.down('KeyJ');page.wait_for_timeout(70)
    check('Fresh HIT after key release restores attack',page.evaluate('!!__brawler.game.p.action'));page.keyboard.up('KeyJ')
    page.keyboard.press('Escape');page.locator('#titleButton').click();page.locator('#startButton').click();page.wait_for_timeout(160)
    before=page.evaluate('__brawler.scenes().index');page.locator('#sceneAdvance').tap();page.wait_for_timeout(150)
    check('Touch advances the cutscene',page.evaluate('__brawler.scenes().index')==before+1)
    page.set_viewport_size({'width':412,'height':915});page.wait_for_timeout(120)
    check('Portrait scene text and controls stay inside viewport',page.evaluate('''()=>['sceneDialogue','sceneAdvance','sceneSkip','scenePause'].every(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1})&&document.documentElement.scrollWidth<=innerWidth'''))
    page.screenshot(path=str(ROOT/'tests/campaign-scene-portrait.png'))
    page.locator('#sceneSkip').tap();page.wait_for_timeout(100);check('Touch skip restores gameplay and clean input',page.evaluate('__brawler.game.mode==="play"&&__brawler.input.pointers.size===0'))
    page.set_viewport_size({'width':1000,'height':560})
    # Start each full run through the real title UI. Route simulation uses normal inputs.
    page.keyboard.press('Escape');page.locator('#titleButton').click();page.locator('#startButton').click();skip_scenes(page)
    jay=route_run(page,'hero');routes.append(jay)
    check('Jay completes all seven stages through normal combat inputs',jay['mode']=='complete' and jay['stages']==list(range(7)) and jay['kos']>=60,jay)
    check('Jay route includes every required boss and projection counterplay',all(kind in jay['bosses'] for kind in ['franklin','booth-enforcer','pizzeria-boss','broadcast-rig']) and jay['projectionDisabled'])
    check('Ending resolves Marty and broadcasting and shows selected celebration',jay['flags'].get('martyRescued') and jay['flags'].get('broadcastStopped') and jay['flags'].get('ending') and page.locator('#complete').is_visible() and page.locator('#victoryCanvas').is_visible())
    check('Completed save uses migrated schema and retains story completion',page.evaluate('__brawler.getSave().version===4&&__brawler.getSave().complete&&__brawler.getSave().storyFlags.ending'))
    # An unlocked-profile fixture allows the replay route independently of driver eligibility.
    page.evaluate('localStorage.setItem(BRAWLER_CONFIG.profileKey,JSON.stringify({franklinUnlocked:true,selected:"franklin"}))')
    reload_game(page,url)
    page.select_option('#playerSelect','franklin');page.locator('#startButton').click();skip_scenes(page)
    franklin=route_run(page,'franklin');routes.append(franklin)
    check('Franklin replay completes all seven stages through normal combat inputs',franklin['mode']=='complete' and franklin['stages']==list(range(7)) and franklin['selected']=='franklin',franklin)
    check('Franklin never fights himself and receives no duplicate unlock message','franklin' not in franklin['bosses'] and 'sherm-slam' in franklin['bosses'] and 'UNLOCKED' not in page.locator('#rewardHeading').inner_text())
    # Real-origin legacy storage scenario, explicit fixture rather than a playthrough claim.
    page.evaluate('''()=>{localStorage.setItem(BRAWLER_CONFIG.saveKey,JSON.stringify({version:3,stage:3,nextGate:3,complete:true,lives:2,score:4321,meter:42,franklinUnlocked:true,playerKind:'hero',deathsByStage:[0,1,0,0],stage4Eligible:true,bossDefeated:true}));localStorage.setItem(BRAWLER_CONFIG.settingsKey,JSON.stringify({music:.19,sfx:.43,reducedMotion:true,vibration:false}));localStorage.setItem(CriticGamepad.KEY,JSON.stringify({version:1,enabled:false,deadzone:.22,profiles:{}}));}''')
    reload_game(page,url)
    check('Completed legacy four-stage save offers Continue',page.locator('#continueButton').is_visible())
    page.locator('#continueButton').click();page.wait_for_timeout(150)
    check('Legacy completion continues into cinema without replaying opening',page.evaluate('__brawler.game.stage===4&&__brawler.scenes().state().id==="stage-05-intro"&&__brawler.game.score===4321&&__brawler.game.p.lives===2'))
    check('Migration retains Franklin, volume, accessibility, and controller settings',page.evaluate('__brawler.getProfile().franklinUnlocked&&settings.music===.19&&settings.sfx===.43&&settings.reducedMotion&&__brawler.controller.deadzone===.22'))
    skip_scenes(page);page.evaluate('__brawler.game.checkpointSave();for(const e of __brawler.game.drain())__brawler.handleEvent(e)')
    checkpoint=page.evaluate('__brawler.getSave()')
    page.keyboard.press('Escape');page.locator('#titleButton').click();page.locator('#continueButton').click();page.wait_for_timeout(120)
    check('New-schema Continue restores checkpoint directly',page.evaluate('__brawler.game.mode==="play"&&!__brawler.scenes().active&&__brawler.game.stage===4') and page.evaluate('__brawler.getSave().nextGate')==checkpoint['nextGate'])
    art=page.evaluate('''async()=>{const names=[...new Set(Object.values(CriticCutscenes.scenes).flatMap(scene=>scene.shots.flatMap(shot=>[shot.background||scene.background,shot.foreground].filter(Boolean))))];return Promise.all(names.map(name=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve({name,decoded:image.naturalWidth>0,width:image.naturalWidth,height:image.naturalHeight});image.onerror=()=>resolve({name,decoded:false});image.src=window.BRAWLER_ASSETS?BRAWLER_ASSETS.files[name]:BRAWLER_CONFIG.assetBase+name;})));}''')
    check('Every declared cutscene art dependency decodes in the browser',all(item['decoded'] for item in art),art)
    check('No uncaught browser JavaScript errors in campaign/story integration',not errors,errors)
    report={'engine':args.engine,'browserVersion':browser.version,'edition':'offline' if args.url=='standalone' else 'source' if args.url=='local' else 'hosted','tests':results,'routes':routes,'passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),'boundary':'Real browser rendering, event loop, keyboard/touch scenes. Source/hosted tests use actual origin-local storage; standalone parser tests explicitly emulate storage and restore its serialized values on reload. Complete routes accelerate fixed updates with normal combat inputs through the actual app event handlers; stageclear delays are skipped via the real engine transition. Legacy storage and unlocked Franklin profiles are explicit fixtures. No physical Android/Logitech hardware.'}
    (ROOT/'tests'/f'campaign-browser-{args.engine}-results.json').write_text(json.dumps(report,indent=2))
    (ROOT/'tests'/f'campaign-browser-{args.engine}-{report["edition"]}-results.json').write_text(json.dumps(report,indent=2))
    browser.close()
if report['failed']:raise SystemExit(1)
