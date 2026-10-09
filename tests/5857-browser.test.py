"""Short cinema, Spike and ending fixtures only; no campaign or audio audit."""
from pathlib import Path
import argparse,json
from playwright.sync_api import sync_playwright
from browser_support import source_site,launch_options,wait_scene,skip_story

p=argparse.ArgumentParser();p.add_argument('--url',default='local');p.add_argument('--baseline',action='store_true');p.add_argument('--ending-only',action='store_true');a=p.parse_args()
tag='before' if a.baseline else 'offline' if a.ending_only else 'after'
out=Path(__file__).parent/'screenshots-playtest'/('5857-'+tag);out.mkdir(parents=True,exist_ok=True)
results=[];errors=[]
def check(name,value,details=None):
    results.append(dict(name=name,passed=bool(value),details=details));print('PASS' if value else 'FAIL',name,details or '',flush=True)

with source_site(a.url) as url,sync_playwright() as pw:
    browser=pw.chromium.launch(**launch_options('chromium'))
    ctx=browser.new_context(viewport={'width':915,'height':412},has_touch=True,record_video_dir=str(out))
    page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    try:
        page.goto(url);page.wait_for_function('__brawler.ready()',timeout=120000)
        page.locator('#startButton').tap();wait_scene(page);skip_story(page)
        if not a.ending_only:
            for width,height in [(412,915),(915,412)]:
                page.set_viewport_size({'width':width,'height':height})
                trace=page.evaluate('''async()=>{const b=__brawler,g=b.game,r=b.renderer();g.stage=4;g.resetWorld();g.makePlayer();g.viewWidth=r.resize().w;g.p.x=241;g.p.inv=999;g.camera=0;g.mode='pause';r.draw(g,0);const log=[];
                  for(let f=0;f<150;f++){await new Promise(requestAnimationFrame);const last=r.lastView?.camera??g.camera;
                    if(f===10)g.spawnFight(0);if(f===20)g.p.x=0;if(f===90)g.disableCircuit(0);
                    if(f<60||f>=72){g.mode='play';g.step(1/60,{mx:0});g.mode='pause';g.drain();}
                    r.draw(g,0);log.push({frame:f,last,pose:g.camera,target:g.cameraTrace?.target??null,owner:g.cameraTrace?.owner??'legacy-gameplay',bounds:[g.cameraTrace?.min??null,g.cameraTrace?.max??null],delta:g.camera-last,player:g.p.x,locked:g.activeGate,paused:f>=60&&f<72});}
                  return log;}''')
                (out/f'camera-{width}.json').write_text(json.dumps(trace,indent=2))
                peak=max(abs(t['delta']) for t in trace)
                check(f'{width} booth activation '+('reproduces old snap' if a.baseline else 'eases without snapping'),peak>100 if a.baseline else peak<25,{'maxDelta':peak})
                check(f'{width} immediate player lock preserved',trace[20]['player']>=240)
                check(f'{width} pause retains pose',len(set(t['pose'] for t in trace if t['paused']))==1)
                if not a.baseline:
                    handoff=page.evaluate('''async()=>{const b=__brawler,g=b.game,r=b.renderer(),s=b.scenes();g.p.x=520;g.activeGate=0;g.configureProjection();g.drain();g.camera=220;r.draw(g,0);s.play(CriticCutscenes.scenes['boss-projection-intro'],()=>{});await s.prepare(s.scene);s.loading=false;
                      for(let n=0;n<45;n++){s.update(1/60);r.draw(g,0);}g.camera=280;g.cameraVelocity=42;r.draw(g,0);const last=r.lastView.camera;
                      // Queue the next same-stage beat while the old director still exists.
                      s.play(CriticCutscenes.scenes['boss-projection-intro'],()=>{});s.finish(false);await Promise.resolve();const start=g.camera;s.skip();const released=g.camera;return {last,start,released};}''')
                    check(f'{width} scene ownership starts/ends at actual last rendered pose',handoff['last']==handoff['start']==handoff['released'],handoff)
            if not a.baseline:
                page.set_viewport_size({'width':915,'height':412})
                for route in ['hero','franklin']:
                    page.evaluate('''route=>{const b=__brawler,g=b.game;g.stage=5;g.playerKind=route;g.resetWorld();g.makePlayer();g.viewWidth=b.renderer().resize().w;g.camera=1600;g.p.x=1900;g.activeGate=2;g.spawnBoss();g.drain();const e=g.enemies[0];e.entry=null;e.hidden=false;e.x=2450;e.y=407;b.renderer().draw(g,0);b.scenes().play(CriticCutscenes.scenes['boss-spike-intro'],()=>{});}''',route)
                    wait_scene(page)
                    page.evaluate('''()=>{const s=__brawler.scenes();s.index=s.shots.findIndex(x=>x.id==='tutorial-marks');s._shot();}''')
                    page.wait_for_function('__brawler.scenes().shot.actors?.some(a=>a.animation==="overhead-ready")',timeout=15000)
                    page.wait_for_timeout(800)
                    page.screenshot(path=str(out/f'{route}-overhead-hold.png'))
                    check(route+' hold settled before release',page.evaluate('!__brawler.scenes().cameraState.active&&__brawler.game.enemies[0].anim==="overhead-ready"'))
                    page.locator('#sceneAdvance').tap()
                    frames=page.evaluate('''async()=>{const b=__brawler,g=b.game,s=b.scenes(),r=b.renderer(),log=[];for(let n=0;n<80&&s.active;n++){await new Promise(requestAnimationFrame);const t=g.spikeTutorial,e=t?.boss,q=t?.can;if(t)log.push({time:t.time,anim:e.anim,frame:r.frame('spike',e.anim,e.animT,e.animDuration)?.f.sourceFrame,projectiles:g.projectiles.length,released:t.released,sourceY:q?.sourceY,canY:q?q.y-q.z-39*q.renderScale:null,phase:q?.phase,jump:g.p.z,canX:q?.x,playerX:g.p.x,image:n%5===0?r.c.toDataURL():null});}return log;}''')
                    import base64
                    for i,f in enumerate(frames):
                        image=f.pop('image',None)
                        if image:(out/f'{route}-throw-{i:03d}.png').write_bytes(base64.b64decode(image.split(',')[1]))
                    (out/f'{route}-throw.json').write_text(json.dumps(frames,indent=2))
                    check(route+' one overhead continuation, no restarted pickup',bool(frames) and all(f['anim'] in ['overhead-release','idle'] for f in frames) and max(f['projectiles'] for f in frames)==1)
                    check(route+' visible raised release and bounce',any(f['released'] and f['canY']<320 for f in frames) and any(f['phase']=='rolling' for f in frames))
                    page.wait_for_function('!__brawler.scenes().active',timeout=15000)
                    check(route+' tutorial lands and cleans up without damage',page.evaluate('__brawler.game.p.hp===100&&!__brawler.game.spikeTutorial&&!__brawler.game.projectiles.some(q=>q.tutorial)'))
        if not a.baseline:
            for route in ['hero','franklin']:
                page.evaluate('''route=>{const b=__brawler,g=b.game;g.playerKind=route;g.stage=6;g.resetWorld();g.makePlayer();g.p.x=2200;g.camera=1650;g.mode='play';g.score=1234;g.bossDefeated=g.machineDefeated=g.dukeDefeated=true;g.dukeDefeatTime=4;g.enemies=[];g.advanceStage();for(const e of g.drain())b.handleEvent(e);}''',route)
                wait_scene(page)
                # Run the genuine reunion beats, then watch the complete pullback/collapse.
                for _ in range(10):
                    if page.evaluate('__brawler.scenes().shot.id==="skyline-collapse"'):break
                    page.wait_for_timeout(1700);page.locator('#sceneAdvance').tap()
                page.wait_for_function('__brawler.scenes().shot.id==="ending-card"',timeout=20000)
                text=page.locator('#sceneDialogue').inner_text()
                check(route+' definitive card follows final tower-less frame',text=='Jay and Marty Sherman perished on September 11, 2001.\n\nNever forget.\n\nTHE END.' and page.evaluate('__brawler.game.skyline.frame===111'))
                page.screenshot(path=str(out/f'{route}-card.png'))
                page.wait_for_timeout(1200)
                check(route+' card requires manual continuation',page.evaluate('__brawler.scenes().active&&document.getElementById("complete").hidden'))
                page.locator('#sceneAdvance').tap()
                page.wait_for_function('!document.getElementById("complete").hidden')
                copy=page.locator('#complete').inner_text().lower()
                check(route+' neutral results and one award', 'run results' in copy and not any(x in copy for x in ['marty is safe','marty is home','premiere is yours','wrap']) and page.evaluate('__brawler.game.score===2234&&__brawler.getSave().complete'))
                page.screenshot(path=str(out/f'{route}-results.png'))
            page.locator('#completeTitle').tap();page.locator('#continueButton').tap()
            page.wait_for_function('!document.getElementById("complete").hidden')
            check('Completed save restores neutral results without another award',page.evaluate('__brawler.game.score===2234&&!__brawler.scenes().active'))
            page.locator('#againButton').tap();wait_scene(page)
            check('Replay resets through existing New Game',page.evaluate('__brawler.game.score===0&&__brawler.game.stage===0'))
            page.locator('#sceneSkip').tap()
            page.evaluate('''()=>{const b=__brawler,g=b.game;g.stage=6;g.bossDefeated=g.machineDefeated=g.dukeDefeated=true;g.dukeDefeatTime=4;g.mode='play';g.enemies=[];g.advanceStage();for(const e of g.drain())b.handleEvent(e);}''')
            wait_scene(page);page.locator('#sceneSkip').tap()
            check('Explicit ending skip lands in neutral completed state',page.locator('#complete').is_visible() and 'RUN RESULTS' in page.locator('#complete').inner_text())
        check('No uncaught browser errors',not errors,errors)
    except Exception as e:
        check('Fixture completed',False,str(e));page.screenshot(path=str(out/'failure.png'))
    finally:
        ctx.close();browser.close()
Path(__file__).with_name('5857-'+tag+'-results.json').write_text(json.dumps(results,indent=2))
raise SystemExit(0 if all(r['passed'] for r in results) else 1)
