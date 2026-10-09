"""Exercise real camera, ending playback and cleanup against source or hosted HTTP."""
from pathlib import Path
import argparse
import json
from playwright.sync_api import sync_playwright
from browser_support import source_site, launch_options, skip_story, wait_scene

parser = argparse.ArgumentParser()
parser.add_argument('--url', default='local')
parser.add_argument('--engine', default='chromium', choices=['chromium', 'firefox', 'webkit'])
parser.add_argument('--ending-only', action='store_true')
args = parser.parse_args()
results, errors = [], []
photos = Path(__file__).parent / 'screenshots-playtest'
if args.ending_only:
    photos = photos/'offline'
photos.mkdir(parents=True,exist_ok=True)

def check(name, value, details=None):
    results.append(dict(name=name, passed=bool(value), details=details))
    print('PASS' if value else 'FAIL', name, details or '', flush=True)

def ending(page, route):
    page.evaluate('''route=>{const g=__brawler.game;g.playerKind=route;g.stage=6;
      g.resetWorld();g.makePlayer();g.p.x=2220;g.camera=1900;
      g.storyCage={x:2740,y:305,scale:.63,backdrop:true,open:false};
      g.storyActors=[{id:'marty',kind:'marty',x:2740,y:305,backdrop:true,face:-1,
        anim:'v11-captive-idle',animT:0,renderScale:.63}];window.endingDone=[];
      __brawler.scenes().play(CriticCutscenes.scenes.ending,r=>endingDone.push(r));}''', route)
    wait_scene(page)

with source_site(args.url) as url, sync_playwright() as pw:
    browser = getattr(pw, args.engine).launch(**launch_options(args.engine))
    page = browser.new_page(viewport={'width':915,'height':412}, has_touch=True)
    page.on('pageerror', lambda e: errors.append(str(e)))
    try:
        page.goto(url)
        page.wait_for_function('__brawler.ready()', timeout=120000)
        page.locator('#startButton').tap()
        wait_scene(page)
        page.wait_for_timeout(500)
        check('Opening uses a finite cinematic camera', page.evaluate('Number.isFinite(__brawler.scenes().state().camera?.x)'))
        skip_story(page)
        stage_scenes = [
            (1, 'stage-02-intro'), (2, 'stage-03-intro'),
            (3, 'stage-04-intro'), (3, 'stage4-clear'),
            (4, 'stage-05-intro'), (4, 'boss-projection-intro'),
            (4, 'boss-projection-defeat'), (4, 'boss-cinema-intro'),
            (4, 'boss-cinema-defeat'), (5, 'stage-06-intro'),
            (5, 'boss-spike-intro'), (5, 'boss-spike-defeat'),
            (6, 'stage-07-intro'), (6, 'boss-broadcast-intro'),
            (6, 'boss-broadcast-defeat'), (6, 'boss-duke-intro'),
            (6, 'boss-duke-defeat')]
        if args.ending_only:
            stage_scenes = []
        for viewport in [{'width':915,'height':412}, {'width':412,'height':915}]:
            page.set_viewport_size(viewport)
            for stage, scene_id in stage_scenes:
                page.evaluate('''([stage,id])=>{const g=__brawler.game;g.stage=stage;g.resetWorld();
                  g.makePlayer();g.viewWidth=__brawler.renderer().resize().w;
                  g.p.x=id.startsWith('stage-')?170:2200;g.p.y=407;
                  g.camera=id.startsWith('stage-')?0:Math.max(0,Brawler.LENGTH-g.viewWidth);
                  if(id.startsWith('boss-')){g.activeGate=g.nextGate=2;
                    if(id.includes('projection')){g.projection.circuits.forEach((c,i)=>c.active=i===2);g.configureProjection();}
                    else{if(stage===4){g.projection.circuits.forEach(c=>c.active=false);g.projection.disabled=true;}
                      if(id.includes('duke'))g.finishDukeConfrontation(false);else g.spawnBoss();}
                    g.drain();
                    if(id.endsWith('defeat')){g.enemies.forEach(e=>{e.hp=0;e.entry=null;});}
                  }
                  __brawler.scenes().play(CriticCutscenes.scenes[id],()=>{});
                }''', [stage, scene_id])
                wait_scene(page)
                continuity=page.evaluate('''()=>{const s=__brawler.scenes(),g=__brawler.game;
                  let maxStep=0,snaps=0,finite=true,motion=0;
                  for(let index=0;index<s.shots.length;index++){
                    if(s.shots[index].spikeTutorial)continue;
                    const before=g.camera;s.index=index;s._shot();
                    if(Math.abs(before-g.camera)>.001)snaps++;
                    const duration=s.shot.auto||1.8;
                    for(let frame=0;frame<Math.ceil(duration*60)-1&&s.active&&s.index===index;frame++){
                      const previous=g.camera;s.update(1/60);
                      maxStep=Math.max(maxStep,Math.abs(g.camera-previous));motion+=Math.abs(g.camera-previous);
                      finite=finite&&Number.isFinite(g.camera)&&g.camera>=0&&g.camera<=Math.max(0,Brawler.LENGTH-g.viewWidth)+.001;
                    }
                  }
                  __brawler.renderer().draw(g,0);
                  return {maxStep,snaps,finite,motion,origin:s.scene.worldOrigin};}''')
                check(str(viewport['width'])+' '+scene_id+' continuous bounded shots',
                      continuity['snaps']==0 and continuity['maxStep']<25 and continuity['finite'],continuity)
                page.screenshot(path=str(photos/f"camera-{viewport['width']}-{scene_id}.png"))
                if page.evaluate('__brawler.scenes().active'):
                    page.locator('#sceneSkip').tap()
        page.set_viewport_size({'width':915,'height':412})
        page.evaluate('''()=>{const g=__brawler.game;g.stage=6;g.resetWorld();g.makePlayer();
          g.p.x=2250;g.camera=Math.max(0,Brawler.LENGTH-__brawler.renderer().rect.w);
          g.activeGate=g.nextGate=2;g.spawnBoss();g.drain();
          __brawler.scenes().play(CriticCutscenes.scenes['boss-broadcast-intro'],()=>{});}''')
        wait_scene(page)
        descent=page.evaluate('''()=>{const s=__brawler.scenes(),g=__brawler.game,out=[];
          for(let frame=0;frame<140;frame++){s.update(1/60);out.push(g.receiverDescent.z);}return out;}''')
        check('Receiver descends continuously from ceiling before combat',
              descent[0]>450 and descent[-1]<195 and all(a>=b for a,b in zip(descent,descent[1:])))
        page.screenshot(path=str(photos/'cinematic-receiver-descent.png'))
        page.locator('#sceneSkip').tap()
        order=page.evaluate('''()=>{const g=__brawler.game,r=__brawler.renderer(),core=g.enemies[0],order=[];
          g.mode='pause';core.hp=0;g.machineDefeated=true;g.broadcastSummons.defeatTime=2.5;
          const sprite=r.sprite,receiver=r.receiver;
          r.sprite=function(ctx,who,...args){if(who===g.playerKind)order.push('player');return sprite.call(this,ctx,who,...args)};
          r.receiver=function(...args){order.push('machine');return receiver.apply(this,args)};
          try{r.draw(g,0);}finally{r.sprite=sprite;r.receiver=receiver;}return order;}''')
        check('Destruction and explosion render in front of player',order.index('machine')>order.index('player'),order)
        page.screenshot(path=str(photos/'cinematic-machine-explosion.png'))
        for route in ['hero', 'franklin']:
            ending(page, route)
            check(route+' reunion opens before the reveal',page.evaluate('__brawler.scenes().shot.id==="marty-freed"'))
            samples = page.evaluate('''async()=>{const out=[];for(let i=0;i<24;i++){
              const s=__brawler.scenes();out.push({x:__brawler.game.camera,target:s.cameraState.target.x});
              await new Promise(r=>setTimeout(r,50));}return out;}''')
            deltas = [b['x']-a['x'] for a,b in zip(samples,samples[1:])]
            check(route+' world camera eases toward the target without jumps',
                  any(abs(d)>0.01 for d in deltas) and max(abs(d) for d in deltas)<70
                  and abs(samples[-1]['x']-samples[-1]['target'])<2, samples)
            page.locator('#scenePause').tap()
            frozen = page.evaluate('[__brawler.game.camera,__brawler.scenes().time]')
            page.wait_for_timeout(300)
            check(route+' pause freezes camera and story clock', frozen==page.evaluate('[__brawler.game.camera,__brawler.scenes().time]'))
            page.locator('#scenePause').tap()
            page.wait_for_function('__brawler.scenes().time>3', timeout=10000)
            check(route+' original reunion remains first', page.evaluate('''(()=>{const g=__brawler.game,
              m=g.storyActors.find(a=>a.kind==='marty'),f=g.playerKind==='hero'?g.p:g.storyActors.find(a=>a.id==='jay');
              return __brawler.scenes().index===1&&g.reunionLayers&&Math.abs(m.x-f.x-70)<8;})()'''))
            for _ in range(8):
                if page.evaluate('__brawler.scenes().shot.id==="skyline-realization"'):
                    break
                page.wait_for_timeout(400)
                page.locator('#sceneAdvance').tap()
            check(route+' Jay delivers the realization after reunion', page.evaluate('''__brawler.scenes().shot.id==='skyline-realization'&&__brawler.scenes().shot.speaker==='JAY'&&__brawler.scenes().shot.dialogue==="Oh my God! What's that?!?"'''))
            page.screenshot(path=str(photos/f'{route}-cinematic-reunion.png'))
            page.wait_for_timeout(1050)
            page.locator('#sceneAdvance').tap()
            page.wait_for_function('__brawler.game.skyline?.time>0.1')
            check(route+' all seven skyline atlas pages decoded', page.evaluate('''CriticCutscenes.scenes.ending.shots.at(-1).images.every(k=>__brawler.scenes().imageCache.get(k)?.naturalWidth===2560)'''))
            page.keyboard.press('Enter')
            check(route+' collapse cannot advance early', page.evaluate('__brawler.scenes().active&&__brawler.scenes().shot.id==="skyline-collapse"&&endingDone.length===0'))
            page.wait_for_function('__brawler.game.skyline?.time>2.8')
            first = page.evaluate('__brawler.game.skyline.frame')
            page.screenshot(path=str(photos/f'{route}-cinematic-skyline.png'))
            page.wait_for_timeout(500)
            check(route+' actual skyline animation progresses',page.evaluate('__brawler.game.skyline.frame')>first)
            page.wait_for_function('__brawler.game.skyline?.time>4.5')
            page.screenshot(path=str(photos/f'{route}-cinematic-collapse.png'))
            page.keyboard.press('KeyP')
            frozen = page.evaluate('[__brawler.game.skyline.frame,__brawler.scenes().time]')
            page.wait_for_timeout(250)
            check(route+' pause freezes collapse playback',frozen==page.evaluate('[__brawler.game.skyline.frame,__brawler.scenes().time]'))
            page.keyboard.press('KeyP')
            page.wait_for_function('endingDone.length===1',timeout=15000)
            check(route+' watched ending finishes once and clears cinematic state',page.evaluate('''endingDone[0].reason==='watched'&&!__brawler.game.skyline&&!__brawler.renderer().skylineSnapshot&&!__brawler.game.reunionLayers'''))
            ending(page,route)
            page.locator('#sceneSkip').tap()
            check(route+' skipping ending completes once and clears layers',page.evaluate('endingDone.length===1&&endingDone[0].skipped&&!__brawler.game.skyline&&!__brawler.game.reunionLayers'))
        # Reduced-motion uses the same decoded footage and a short settling camera.
        page.evaluate('__brawler.scenes().o.settings().reducedMotion=true')
        page.set_viewport_size({'width':1280,'height':720})
        ending(page,'hero')
        page.wait_for_timeout(300)
        check('Desktop reduced-motion camera settles',page.evaluate('!__brawler.scenes().cameraState.active'))
        page.evaluate("const s=__brawler.scenes();s.index=s.shots.length-1;s._shot()")
        page.wait_for_function('__brawler.game.skyline?.time>2.2')
        check('Reduced-motion skyline renders',page.evaluate('__brawler.game.skyline.reduced&&__brawler.game.skyline.frame>0'))
        page.screenshot(path=str(photos/'reduced-motion-cinematic-skyline.png'))
        page.locator('#sceneSkip').tap()
        check('Skip during collapse releases the snapshot',page.evaluate('endingDone.length===1&&!__brawler.renderer().skylineSnapshot&&!__brawler.game.skyline'))
        for route in ['hero','franklin']:
            page.evaluate('''route=>{const g=__brawler.game;g.stage=6;g.playerKind=route;g.resetWorld();g.makePlayer();
              g.dukeDefeated=g.machineDefeated=true;g.finalPhase='resolved';g.mode='play';g.score=1234;
              g.advanceStage();for(const event of g.drain())__brawler.handleEvent(event);}''',route)
            wait_scene(page)
            page.evaluate('const s=__brawler.scenes();s.index=s.shots.length-1;s._shot()')
            if route=='hero':
                page.wait_for_function('__brawler.game.mode==="complete"',timeout=15000)
            else:
                page.locator('#sceneSkip').tap()
                page.wait_for_function('__brawler.game.mode==="complete"')
            check(route+' real completion retains rewards and schema-5 save',page.evaluate('''(()=>{
              const g=__brawler.game,save=__brawler.getSave();return g.score===2234&&g.storyFlags.martyRescued&&save.complete&&save.version===5;})()'''))
        check('No scene asset failures',page.evaluate('__brawler.scenes().assetErrors.length===0'))
        check('No uncaught browser errors',not errors,errors)
    except Exception as error:
        check('Cinematic browser fixtures completed',False,str(error))
        page.screenshot(path=str(photos/'cinematic-failure.png'))
    finally:
        report=dict(url=url,engine=args.engine,tests=results,passed=sum(r['passed'] for r in results),failed=sum(not r['passed'] for r in results))
        suffix = '-offline' if args.ending_only else ''
        Path(__file__).with_name(f'cinematic-{args.engine}{suffix}-results.json').write_text(json.dumps(report,indent=2)+'\n')
        browser.close()
raise SystemExit(bool(report['failed']))
