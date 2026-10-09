"""Focused playtest corrections, using actual scene movement and canvas playback."""
from pathlib import Path
import argparse, json
from playwright.sync_api import sync_playwright
from browser_support import source_site, launch_options, skip_story, wait_scene

parser=argparse.ArgumentParser()
parser.add_argument('--url',default='local')
args=parser.parse_args()
results=[]
photos=Path(__file__).parent/'screenshots-playtest'/'refinement'
photos.mkdir(parents=True,exist_ok=True)
def check(name,ok,detail=None):
    results.append(dict(name=name,passed=bool(ok),details=detail))
    print('PASS' if ok else 'FAIL',name,detail or '',flush=True)

with source_site(args.url) as url,sync_playwright() as pw:
    browser=pw.chromium.launch(**launch_options('chromium'))
    page=browser.new_page(viewport={'width':915,'height':412},has_touch=True)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(url)
    page.wait_for_function('__brawler.ready()',timeout=120000)
    page.locator('#startButton').tap()
    wait_scene(page)
    skip_story(page)
    for viewport in [{'width':915,'height':412},{'width':412,'height':915}]:
        page.set_viewport_size(viewport)
        for route in ['hero','franklin']:
            for stage in range(7):
                page.evaluate('''([stage,route])=>{const b=__brawler,g=b.game;g.stage=stage;g.playerKind=route;
                  g.resetWorld();g.makePlayer();g.camera=0;g.viewWidth=b.renderer().rect.w;
                  b.renderer().draw(g,0);b.scenes().play(CriticCutscenes.scenes['stage-0'+(stage+1)+'-intro'],()=>{});}''',[stage,route])
                wait_scene(page)
                data=page.evaluate('''()=>{const b=__brawler,g=b.game,s=b.scenes(),camera=g.camera;
                  let maxCamera=0,maxDelta=0,earlyPlayer=false,lastDuke=null,exit=null,frames=0;
                  while(s.active&&s.index===0&&frames++<900){
                    const duke=g.storyActors.find(a=>a.kind==='duke'),marty=g.storyActors.find(a=>a.kind==='marty');
                    if(duke){if(lastDuke!==null)maxDelta=Math.max(maxDelta,Math.abs(duke.x-lastDuke));lastDuke=duke.x;}
                    earlyPlayer ||= g.p.x>camera-80;
                    exit=duke&&marty?Math.min(duke.x,marty.x)-160-camera-g.viewWidth:null;
                    s.update(1/60);maxCamera=Math.max(maxCamera,Math.abs(g.camera-camera));
                  }
                  const exited=!s.active||s.index>0;
                  if(s.active)for(let f=0;f<100&&s.index===1;f++)s.update(1/60);
                  b.renderer().draw(g,0);
                  return {maxCamera,maxDelta,earlyPlayer,exit,exited,frames,player:g.p.x,route:g.playerKind};}''')
                check(f"{viewport['width']} {route} stage {stage+1}: fixed view, physical exit before entry",
                      data['exited'] and data['exit']>-7 and data['maxCamera']==0 and data['maxDelta']<6
                      and not data['earlyPlayer'],data)
                if stage in [0,5,6] and route=='hero':
                    page.screenshot(path=str(photos/f"opening-{viewport['width']}-{stage+1}.png"))
                if page.evaluate('__brawler.scenes().active'):
                    page.locator('#sceneSkip').tap()
    page.set_viewport_size({'width':915,'height':412})
    # A scene start must not clear the already drawn Little Italy canvas.
    retained=page.evaluate('''()=>{const b=__brawler,g=b.game,r=b.renderer();g.stage=5;g.resetWorld();g.makePlayer();g.camera=900;
      g.mode='cutscene';r.draw(g,0);const before=r.c.toDataURL();
      b.scenes().play(CriticCutscenes.scenes['boss-spike-intro'],()=>{});
      return before===r.c.toDataURL();}''')
    check('Little Italy scene handoff retains every canvas pixel',retained)
    wait_scene(page);page.locator('#sceneSkip').tap()
    page.evaluate('''()=>{const b=__brawler,g=b.game;g.stage=6;g.playerKind='hero';g.resetWorld();g.makePlayer();
      g.p.x=2220;g.camera=1650;b.renderer().draw(g,0);b.scenes().play(CriticCutscenes.scenes.ending,()=>{});}''')
    wait_scene(page)
    page.evaluate('''()=>{const s=__brawler.scenes();s.index=s.shots.length-2;s._shot();s.update(1.1);}''')
    check('Exact Jay realization',page.locator('#sceneDialogue').inner_text()=='Oh my god, is that a plane?!? Hatchi Matchi!')
    page.locator('#sceneAdvance').tap()
    page.wait_for_function('__brawler.game.skyline?.time>.2')
    page.screenshot(path=str(photos/'window-pullback-early.png'))
    initial=page.evaluate('__brawler.game.skyline.window.width')
    page.wait_for_function('__brawler.game.skyline?.time>1')
    page.screenshot(path=str(photos/'window-pullback-exterior.png'))
    check('Window shrinks continuously into tower exterior',page.evaluate('__brawler.game.skyline.window.width')<initial)
    page.wait_for_function('__brawler.game.skyline?.time>2.8')
    page.screenshot(path=str(photos/'window-pullback-collapse.png'))
    check('Existing collapse follows window pullback',page.evaluate('__brawler.game.skyline.frame>0'))
    page.locator('#sceneSkip').tap()
    check('No fatal browser errors',not errors,errors)
    browser.close()
Path(__file__).with_name('cinematic-refinement-results.json').write_text(json.dumps(results,indent=2))
raise SystemExit(0 if all(r['passed'] for r in results) else 1)
