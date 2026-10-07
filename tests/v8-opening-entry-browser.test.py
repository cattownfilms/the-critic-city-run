"""Real gameplay-canvas opening arrival, held input, pause, skip and Continue.

The opening's presentation clock is accelerated as an explicit scene fixture.
The actual Game.step/renderer, falling physics, pause and landing run normally.
An existing-unlocked profile enables the Franklin fixture; no health, position,
score, input results or campaign flags are changed by this test.
"""
from pathlib import Path
import argparse,json
from playwright.sync_api import sync_playwright
from browser_support import source_site,launch_options

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--engine',choices=['chromium','firefox','webkit'],default='chromium')
parser.add_argument('--url',default='local')
parser.add_argument('--output',type=Path)
parser.add_argument('--screenshots',type=Path)
args=parser.parse_args();results=[];errors=[];routes=[]
def check(name,passed,details=None):
    results.append({'name':name,'passed':bool(passed),'details':details})
    print('PASS' if passed else 'FAIL',name,details or '',flush=True)
def wait(page,expression):
    page.wait_for_function(expression,timeout=120000,polling=25)
def progress(page):
    return page.evaluate('''()=>{const g=__brawler.game;return {stage:g.stage,nextGate:g.nextGate,
      lives:g.p.lives,score:g.score,meter:g.p.meter,playerKind:g.playerKind,
      franklinUnlocked:g.franklinUnlocked,storyFlags:{...g.storyFlags}}}''')
def to_launch(page):
    page.evaluate('''()=>{const s=__brawler.scenes();for(let i=0;i<20&&s.active&&s.shot.id!=='window-launch';i++){
      s.time=Math.max(s.time,s.shot.minTime??.2);s.advance();}s.time=0;s.update(0);
      const update=s.update;s.update=function(dt){return update.call(this,
        this.active&&this.shot.id==='window-launch'?0:dt);};}''')
    wait(page,'__brawler.scenes().active&&__brawler.scenes().shot.id==="window-launch"')
def snapshot(page):
    return page.evaluate('''()=>({arrival:__brawler.openingArrival(),scene:__brawler.scenes().state(),
      mode:__brawler.game.mode,p:{x:__brawler.game.p.x,y:__brawler.game.p.y,z:__brawler.game.p.z,
        vz:__brawler.game.p.vz,anim:__brawler.game.p.anim,action:__brawler.game.p.action},
      input:__brawler.getInput(),attacks:__brawler.game.stats.attackStarts})''')

with source_site(args.url) as url,sync_playwright() as pw:
    browser=None;report={'engine':args.engine,'tests':results,'routes':routes}
    try:
        browser=getattr(pw,args.engine).launch(**launch_options(args.engine));report['browserVersion']=browser.version
        for route in ['hero','franklin']:
            context=browser.new_context(viewport={'width':915,'height':412},has_touch=True)
            context.add_init_script('localStorage.setItem("cattown.critic.brawler.v3.profile",JSON.stringify({franklinUnlocked:true,selected:'+json.dumps(route)+'}))')
            page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(url,wait_until='domcontentloaded');wait(page,'__brawler.ready()')
            if route=='hero':
                check('Broadway and the user-approved cinema boss names preserve their legacy content IDs',page.evaluate('Brawler.STAGES[0].id==="broadway"&&Brawler.STAGES[0].name==="Broadway"&&Brawler.STAGES[4].boss.kind==="pizzeria-boss"&&Brawler.EINFO["pizzeria-boss"].name==="Violent Austrian Rabbi"'))
            page.evaluate('''()=>{window.__arrivalTimeline=[];const game=__brawler.game,step=game.step;
              game.step=function(...args){const result=step.apply(this,args);if(__brawler.openingArrival()?.started&&__arrivalTimeline.length<180)
                __arrivalTimeline.push({t:this.t,x:this.p.x,y:this.p.y,z:this.p.z,vz:this.p.vz,anim:this.p.anim});return result;};}''')
            page.locator('#startButton').click();wait(page,'__brawler.scenes().active&&!__brawler.scenes().loading');to_launch(page)
            if route=='franklin':
                # Hold a gameplay key before the beat is advanceable, then use touch.
                page.keyboard.down('KeyJ');page.evaluate('__brawler.scenes().time=1.8');page.keyboard.press('Enter')
            else:
                page.evaluate('__brawler.scenes().time=1.8');page.keyboard.down('KeyJ')
            wait(page,'__brawler.game.mode==="play"&&!__brawler.scenes().active')
            first=snapshot(page)
            check(f'{route}: watched launch finishes before any cinematic street landing',
                  first['scene'].get('completion',{}).get('reason')=='gameplayEntry' and
                  first['scene'].get('completion',{}).get('shotId')=='street-recovery' and
                  page.locator('#cutscene').is_hidden(),first['scene'].get('completion'))
            check(f'{route}: selected player actually falls on the live game canvas',
                  first['arrival'] and first['arrival']['canvas']=='game' and first['arrival']['character']==route and
                  first['arrival']['active'] and first['p']['z']>0 and first['p']['vz']<0 and
                  page.locator('#game').is_visible() and page.locator('#hud').is_visible() and page.locator('#controls').is_visible(),first)
            check(f'{route}: held scene advance does not become an airborne attack',
                  not first['input']['attackHeld'] and not first['input']['attackPressed'] and
                  first['p']['action'] is None and first['attacks']==0)
            watched=progress(page);saved=page.evaluate('__brawler.getSave()')
            # Pause during the real fall, then let the ordinary engine resume it.
            page.keyboard.press('Escape');wait(page,'__brawler.game.mode==="pause"')
            paused=snapshot(page);page.wait_for_timeout(120);still=snapshot(page)
            check(f'{route}: pause freezes the actual opening descent without changing its lane',
                  paused['p']['z']>0 and paused['p']['z']==still['p']['z'] and paused['p']['y']==407 and still['p']['y']==407)
            page.locator('#resumeButton').click();wait(page,'__brawler.openingArrival()?.landed===true')
            page.wait_for_timeout(150);landed=snapshot(page);timeline=page.evaluate('__arrivalTimeline')
            check(f'{route}: existing fall, gravity and landing poses recover on the combat plane',
                  landed['arrival']['landed'] and not landed['arrival']['active'] and landed['p']['z']==0 and
                  landed['p']['y']==407 and any(s['anim']=='fall' for s in timeline) and any(s['anim']=='land' for s in timeline) and
                  all(s['y']==407 for s in timeline) and all(b['z']<=a['z']+.001 for a,b in zip(timeline,timeline[1:])),
                  {'arrival':landed['arrival'],'animations':sorted({s['anim'] for s in timeline})})
            if args.screenshots:
                args.screenshots.mkdir(parents=True,exist_ok=True);page.screenshot(path=str(args.screenshots/f'{args.engine}-{route}-actual-street-landing.png'))
            before={'progress':progress(page),'arrival':page.evaluate('__brawler.openingArrival()'),'save':page.evaluate('__brawler.getSave()')}
            page.evaluate('__brawler.scenes().finish(false,"gameplayEntry");__brawler.scenes().finish(true,"skip")')
            after={'progress':progress(page),'arrival':page.evaluate('__brawler.openingArrival()'),'save':page.evaluate('__brawler.getSave()')}
            check(f'{route}: repeated completion never starts another fall or awards progress twice',before==after and before['save']==saved)
            page.keyboard.up('KeyJ');page.keyboard.press('Escape');page.locator('#titleButton').click();page.locator('#startButton').click()
            wait(page,'__brawler.scenes().active&&!__brawler.scenes().loading')
            page.keyboard.down('KeyJ');page.keyboard.press('Escape');wait(page,'__brawler.game.mode==="play"')
            skipped=snapshot(page)
            check(f'{route}: skip begins grounded with exactly the watched story and checkpoint',
                  skipped['arrival'] is None and skipped['p']['z']==0 and skipped['p']['vz']==0 and
                  progress(page)==watched and page.evaluate('__brawler.getSave()')==saved and
                  not skipped['input']['attackHeld'] and skipped['attacks']==0,
                  {'progress':progress(page),'completion':skipped['scene'].get('completion')})
            page.keyboard.up('KeyJ');page.keyboard.press('Escape');page.locator('#titleButton').click()
            check(f'{route}: opening completion exposes a valid Continue checkpoint',page.locator('#continueButton').is_visible() and page.locator('#continueButton').is_enabled())
            page.locator('#continueButton').click();wait(page,'__brawler.game.mode==="play"');continued=snapshot(page)
            check(f'{route}: Continue resumes without replaying opening or landing presentation',
                  not continued['scene']['active'] and continued['arrival'] is None and continued['p']['z']==0 and progress(page)==watched)
            page.keyboard.press('Escape');page.locator('#titleButton').click();page.locator('#startButton').click();wait(page,'__brawler.scenes().active&&!__brawler.scenes().loading')
            check(f'{route}: a second New Game resets the transient arrival without discarding route',
                  page.evaluate('__brawler.openingArrival()===null&&__brawler.game.playerKind==='+json.dumps(route)+'&&!__brawler.game.storyFlags.opening'))
            page.evaluate('__brawler.scenes().skip()');routes.append({'character':route,'watchedProgress':watched,'initialSave':saved,'landed':landed['arrival']})
            context.close()
        check('The actual-canvas opening handoff has no uncaught browser errors',not errors,errors)
    except Exception as e:
        check('Opening gameplay handoff regression execution completed',False,str(e))
    finally:
        if browser:browser.close()
        report.update({'passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),'errors':errors,
          'boundary':'Actual browser source game, delegated unmodified engine gravity, real pause/keyboard/touch/Continue. Presentation clock and unlocked profile are explicit fixtures. No physical hardware claim.'})
        output=args.output or ROOT/'tests'/f'v8-opening-entry-{args.engine}-results.json';output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(report,indent=2)+'\n')
if report['failed']:raise SystemExit(1)
