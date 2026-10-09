"""5872: isolated reviewed scenes and dedicated ending music, no campaign replay."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import source_site,launch_options,wait_scene,skip_story
p=argparse.ArgumentParser();p.add_argument('--url',default='local');a=p.parse_args();out=Path(__file__).parent/'screenshots-playtest/5872';out.mkdir(parents=True,exist_ok=True);results=[];errors=[]
def check(n,v,d=None):
 results.append(dict(name=n,passed=bool(v),details=d));print('PASS' if v else 'FAIL',n,d or '',flush=True)
with source_site(a.url) as url,sync_playwright() as pw:
 browser=pw.chromium.launch(**launch_options('chromium'));ctx=browser.new_context(viewport={'width':412,'height':915},has_touch=True,record_video_dir=str(out));page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(url);page.wait_for_function('__brawler.ready()',timeout=120000);page.locator('#startButton').tap();wait_scene(page);skip_story(page)
  check('Piano preloaded alongside all original recordings',page.evaluate('__brawler.loading().cachedMusicFiles===6'))
  for layout in ['portrait','landscape']:
   page.set_viewport_size({'width':412,'height':915} if layout=='portrait' else {'width':915,'height':412})
   page.evaluate("""()=>{const b=__brawler,g=b.game;g.stage=6;g.resetWorld();g.makePlayer();g.viewWidth=b.renderer().resize().w;g.p.x=2200;g.camera=Math.max(0,2850-g.viewWidth-100);g.activeGate=2;g.spawnBoss();g.drain();g.storyActors=[{id:'duke',kind:'duke',x:2535,y:305,face:-1,anim:'idle',animT:0,renderScale:1.18*.63,backdrop:true},{id:'marty',kind:'marty',x:2740,y:305,face:-1,anim:'v11-captive-idle',animT:0,renderScale:.63,backdrop:true}];g.storyCage={x:2740,y:305,scale:.63,backdrop:true};g.mode='pause';b.renderer().draw(g,0);b.scenes().play(CriticCutscenes.scenes['boss-broadcast-intro'],()=>{});} """);wait_scene(page)
   trace=page.evaluate("""async()=>{const b=__brawler,g=b.game,s=b.scenes(),log=[];for(let n=0;n<230;n++){await new Promise(requestAnimationFrame);log.push({camera:g.camera,target:s.cameraState?.target?.x,shot:s.shot.id||s.shot.speaker,poses:b.renderer().backgroundActorPoses});}return log;}""");(out/f'{layout}-receiver.json').write_text(json.dumps(trace));dukes=[d for t in trace for d in t['poses'] if d['kind']=='duke'];check(layout+' Duke button and idle share wheel-contact floor',dukes and all(abs(d['y']-321.38)<.01 for d in dukes) and any(d['animation']=='v10-button' for d in dukes) and any(d['animation']=='idle' for d in dukes));check(layout+' Receiver shots hold one camera target',len(set(t['target'] for t in trace))==1);page.screenshot(path=str(out/f'{layout}-receiver.png'));page.locator('#sceneSkip').tap()
   before=page.evaluate('__brawler.game.camera');page.wait_for_timeout(100);check(layout+' Receiver handoff is continuous',abs(page.evaluate('__brawler.game.camera')-before)<25)
   # Exact Jay replacement and finite, real source talking performance.
   page.evaluate("""()=>{const b=__brawler,g=b.game;g.playerKind='hero';g.makePlayer();g.p.x=2180;g.mode='pause';b.renderer().draw(g,0);b.scenes().play(CriticCutscenes.scenes['boss-duke-intro'],()=>{});} """);wait_scene(page)
   page.evaluate("const s=__brawler.scenes();s.index=s.shots.length-1;s._shot();s.time=.7;s.update(0)");check(layout+' Duke response and speaking animation',page.locator('#sceneDialogue').inner_text()=='Duke, you kidnapped my son. What did you expect?' and page.evaluate('__brawler.game.p.anim==="v10-point"'));page.screenshot(path=str(out/f'{layout}-jay-speaking.png'))
   page.evaluate('const s=__brawler.scenes();s.time=8;s.update(0)');check(layout+' Jay stops speaking and holds an appropriate reaction',page.evaluate('__brawler.game.p.anim==="grumpy-idle"'));page.locator('#sceneSkip').tap()
   for route in ['hero','franklin']:
    page.evaluate("""route=>{const b=__brawler,g=b.game;g.stage=6;g.resetWorld();g.playerKind=route;g.makePlayer();g.p.x=2180;g.camera=Math.max(0,2850-b.renderer().resize().w);g.mode='play';g.dukeDefeated=g.machineDefeated=true;b.renderer().draw(g,0);b.handleEvent({type:'complete',ending:'ending'});} """,route);wait_scene(page)
    page.evaluate("const s=__brawler.scenes();s.index=s.shots.findIndex(x=>x.id==='skyline-realization');s._shot();s.time=.7;s.update(0)");check(layout+' '+route+' Jay realization retains exact line and source performance',page.locator('#sceneDialogue').inner_text()=='Oh my god, is that a plane?!? Hatchi Matchi!' and page.evaluate("const b=__brawler,g=b.game;const jay=g.playerKind==='hero'?g.p:g.storyActors.find(a=>a.id==='jay');jay.anim==='double-take'&&jay.animDuration>1"));page.screenshot(path=str(out/f'{layout}-{route}-realization.png'))
    page.evaluate("const s=__brawler.scenes();s.index=s.shots.length-1;s._shot()");page.wait_for_timeout(1200)
    audio=page.evaluate('({track:__brawler.audio.trackKey,time:__brawler.audio.music.currentTime,loop:__brawler.audio.music.loop,paused:__brawler.audio.music.paused,volume:__brawler.audio.music.volume})');check(layout+' '+route+' exact piano plays once during card',audio['track']=='ending' and audio['time']>.3 and not audio['loop'] and not audio['paused'],audio);page.screenshot(path=str(out/f'{layout}-{route}-memorial.png'))
    page.locator('#scenePause').tap();t=page.evaluate('__brawler.audio.music.currentTime');page.wait_for_timeout(250);check(layout+' '+route+' piano pauses',page.evaluate('__brawler.audio.music.paused') and abs(page.evaluate('__brawler.audio.music.currentTime')-t)<.1);page.locator('#scenePause').tap();page.wait_for_timeout(300);check(layout+' '+route+' piano resumes without restart',page.evaluate('__brawler.audio.trackKey==="ending"&&!__brawler.audio.music.paused') and page.evaluate('__brawler.audio.music.currentTime')>t)
    page.evaluate('__brawler.audio.toggle()');check(layout+' '+route+' mute pauses ending recording',page.evaluate('__brawler.audio.muted&&__brawler.audio.music.paused'));page.evaluate('__brawler.audio.toggle()');page.wait_for_timeout(200);check(layout+' '+route+' unmute retains ending cue',page.evaluate('__brawler.audio.trackKey==="ending"&&!__brawler.audio.music.paused'))
    check(layout+' '+route+' memorial fits viewport',page.evaluate("const r=document.querySelector('.scene-copy').getBoundingClientRect(),d=document.querySelector('#sceneDialogue');r.top>=0&&r.bottom<=innerHeight&&d.scrollHeight<=d.clientHeight+1&&getComputedStyle(d).fontFamily.includes('Georgia')"))
    page.locator('#sceneAdvance' if route=='hero' else '#sceneSkip').tap();check(layout+' '+route+' immediate neutral results stop music',page.locator('#complete').is_visible() and page.evaluate('__brawler.audio.music.paused'))
  check('No browser exceptions',not errors,errors)
 except Exception as e:
  check('Fixtures completed',False,str(e));page.screenshot(path=str(out/'failure.png'))
 finally:ctx.close();browser.close()
Path(__file__).with_name('5872-results.json').write_text(json.dumps(results,indent=2));raise SystemExit(0 if all(r['passed'] for r in results) else 1)
