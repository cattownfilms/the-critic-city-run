"""Actual standalone Chromium tests; scenario fixtures are explicit, not campaign play."""
from pathlib import Path
import json,time
from playwright.sync_api import sync_playwright
from load_helper import load_html
from browser_support import standalone_path, launch_options
R=Path(__file__).resolve().parents[1]; results=[]; errors=[]
def check(name,ok,details=None):
 results.append(dict(name=name,passed=bool(ok),details=details)); print(time.strftime('%H:%M:%S'), 'PASS' if ok else 'FAIL',name,flush=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(**launch_options(audio=True))
 p=b.new_page(viewport={'width':1000,'height':460},has_touch=True,is_mobile=True)
 p.on('pageerror',lambda e:errors.append(str(e)))
 load_html(p,standalone_path().read_text())
 check('Title retains supplied art, Press Start and original-theme assignment',p.locator('#titleArt').get_attribute('src').startswith('data:') and 'START' in p.locator('#startButton').inner_text().upper() and p.evaluate('__brawler.audio.trackKey')=='title')
 p.locator('#startButton').tap();p.wait_for_timeout(150);p.locator('#sceneSkip').tap();p.wait_for_timeout(1200)
 p.evaluate('()=>{const g=__brawler.game;g.enemies=[];g.nextGate=3;g.activeGate=-1;g.p.x=800;g.p.hp=100;}')
 check('First district starts the Broadway recording',p.evaluate('__brawler.audio.trackKey==="broadway"&&!__brawler.audio.music.paused&&isFinite(__brawler.audio.music.duration)'))
 # Switch immediately, then inspect while both players are active.
 p.evaluate('()=>{const g=__brawler.game;g.stage=1;g.emit("stage",{stage:1});}')
 p.wait_for_timeout(200)
 cross=p.evaluate('({track:__brawler.audio.trackKey,fade:__brawler.audio.fade,both:!!__brawler.audio.outgoing&&!__brawler.audio.outgoing.paused&&!__brawler.audio.music.paused,newVolume:__brawler.audio.music.volume,oldVolume:__brawler.audio.outgoing?.volume})')
 check('Changing districts starts an overlapping, bounded crossfade',cross['track']=='subway' and cross['both'] and 0<cross['fade']<1,cross)
 p.wait_for_timeout(1100)
 check('Crossfade retires the old audio element after 0.9 seconds',p.evaluate('__brawler.audio.outgoing===null&&__brawler.audio.fade===1&&!__brawler.audio.music.paused'))
 durations={}
 for stage,key in [(0,'broadway'),(1,'subway'),(2,'rooftop'),(3,'theater')]:
  p.evaluate('(n)=>{const g=__brawler.game;g.stage=n;g.p.x=800;g.enemies=[];g.bossDefeated=false;g.nextGate=3;g.activeGate=-1;g.emit("stage",{stage:n});}',stage)
  p.wait_for_timeout(1150)
  durations[key]=p.evaluate('({key:__brawler.audio.trackKey,seconds:__brawler.audio.music.duration,playing:!__brawler.audio.music.paused,loop:__brawler.audio.music.loop})')
 check('All four district recordings decode, loop and play in their assigned levels',all(x['key']==k and 35<x['seconds']<100 and x['playing'] and x['loop'] for k,x in durations.items()),durations)
 # Repeat same track request must not restart the song.
 before=p.evaluate('__brawler.audio.music.currentTime');p.evaluate('__brawler.audio.playMusic()');p.wait_for_timeout(220)
 after=p.evaluate('__brawler.audio.music.currentTime')
 check('Same-level music requests preserve playback position',after>=before and after-before<.8,{'before':before,'after':after})
 p.evaluate('__brawler.pause()');p.wait_for_timeout(180)
 check('Pause stops music and clears held controls',p.evaluate('__brawler.audio.music.paused&&__brawler.input.pointers.size===0&&__brawler.game.mode==="pause"'))
 saved=p.evaluate('__brawler.audio.music.currentTime');p.evaluate('__brawler.resume()');p.wait_for_timeout(300)
 check('Resume keeps the assigned track and resumes its position',p.evaluate('__brawler.audio.trackKey==="theater"&&!__brawler.audio.music.paused') and p.evaluate('__brawler.audio.music.currentTime')>=saved)
 p.evaluate('__brawler.audio.toggle()');p.wait_for_timeout(180)
 check('Mute pauses the music without altering its assignment',p.evaluate('__brawler.audio.muted&&__brawler.audio.music.paused&&__brawler.audio.trackKey==="theater"'))
 p.evaluate('__brawler.audio.toggle()');p.wait_for_timeout(250)
 check('Unmute restores current-level music',p.evaluate('!__brawler.audio.muted&&!__brawler.audio.music.paused&&__brawler.audio.trackKey==="theater"'))
 # Trigger an actual engine exit through its next frame rather than calling menu methods.
 p.evaluate('()=>{const g=__brawler.game;g.stage=0;g.nextGate=3;g.activeGate=-1;g.enemies=[];g.p.x=2810;g.p.z=0;g.p.vz=0;g.p.action=null;g.p.hp=100;g.emit("stage",{stage:0});}')
 p.wait_for_function('__brawler.game.mode==="stageclear"')
 p.wait_for_timeout(450)
 check('District exit presents a separate visible character celebration',p.locator('#stageclear').is_visible() and p.locator('#clearCanvas').bounding_box()['height']>100 and p.locator('#controls').is_hidden())
 # Force a stale input to prove Continue flushes it.
 p.evaluate('__brawler.input.edges.attack=true;__brawler.input.down.attack=true;__brawler.input.mx=1;')
 p.locator('#clearContinue').tap();p.wait_for_timeout(150);p.evaluate('()=>{while(__brawler.scenes().active)__brawler.scenes().skip()}');p.wait_for_timeout(150)
 check('Clear-screen Continue advances once and flushes stale attack/movement',p.evaluate('__brawler.game.stage===1&&__brawler.game.mode==="play"&&!__brawler.input.down.attack&&!__brawler.input.edges.attack&&__brawler.input.mx===0'))
 # Next district: allow timeout to proceed; no input.
 p.evaluate('()=>{const g=__brawler.game;g.enemies=[];g.nextGate=3;g.activeGate=-1;g.p.x=2810;g.p.z=0;g.p.vz=0;g.p.action=null;}')
 p.wait_for_function('__brawler.game.mode==="stageclear"');p.wait_for_timeout(4450);p.evaluate('()=>{while(__brawler.scenes().active)__brawler.scenes().skip()}');p.wait_for_timeout(100)
 check('Stage celebration automatically continues without a mandatory tap',p.evaluate('__brawler.game.mode==="play"&&__brawler.game.stage===2&&__brawler.audio.trackKey==="rooftop"'))
 # Franklin replay fixture: unlock profile via real event path, then start Franklin.
 p.evaluate('()=>{const g=__brawler.game;g.franklinUnlocked=true;g.emit("unlock",{character:"franklin"});}')
 p.wait_for_timeout(120)
 p.evaluate('()=>{const g=__brawler.game;g.start(null,"franklin");g.stage=3;g.p.x=2450;g.cam=1900;g.nextGate=3;g.activeGate=-1;g.enemies=[];g.bossDefeated=false;g.bossSpawned=false;g.spawnFranklin();}')
 p.wait_for_timeout(150)
 check('Franklin replay finale uses the existing Slam Shermometer, not Franklin',p.evaluate('__brawler.game.enemies.some(e=>e.boss&&e.kind==="sherm-slam")&&!__brawler.game.enemies.some(e=>e.kind==="franklin")'))
 p.evaluate('()=>{const g=__brawler.game;g.enemies=[];g.bossDefeated=true;g.p.x=2810;g.p.hp=100;g.p.z=0;g.p.vz=0;g.p.action=null;g.lastUnlockEarned=false;}')
 p.wait_for_timeout(150);p.evaluate('()=>{while(__brawler.scenes().active)__brawler.scenes().skip()}');p.wait_for_function('__brawler.game.mode==="stageclear"');p.wait_for_timeout(150);check('Franklin Stage4 clear continues the expanded campaign',p.locator('#stageclear').is_visible());p.evaluate('()=>{const g=__brawler.game;g.stage=Brawler.STAGES.length-1;g.enemies=[];g.bossDefeated=true;g.nextGate=3;g.activeGate=-1;g.p.x=2810;g.mode="play";}');p.wait_for_timeout(150);p.evaluate('()=>{while(__brawler.scenes().active)__brawler.scenes().skip()}');p.wait_for_function('__brawler.game.mode==="complete"');p.wait_for_timeout(300)
 text=p.locator('#rewardHeading').inner_text()
 check('Franklin completion has visible winner art and no second unlock claim','FRANKLIN' in text and 'UNLOCKED' not in text and p.locator('#victoryCanvas').is_visible(),text)
 check('The original recording returns on the ending screen',p.evaluate('__brawler.audio.trackKey==="title"'))
 p.screenshot(path=str(R/'tests/v4-franklin-ending.png'))
 p.set_viewport_size({'width':412,'height':915});p.wait_for_timeout(200)
 check('Ending panel remains within portrait viewport',p.locator('#victoryCanvas').bounding_box()['width']<413 and p.locator('#complete').bounding_box()['width']<=413)
 p.screenshot(path=str(R/'tests/v4-franklin-ending-portrait.png'))
 check('No uncaught JavaScript or media decoding errors',not errors and not p.evaluate('__brawler.audio.errors'),{'page':errors,'audio':p.evaluate('__brawler.audio.errors')})
 report={'tests':results,'passed':sum(t['passed'] for t in results),'failed':sum(not t['passed'] for t in results),'boundary':'Exact standalone HTML streamed to Chromium in bounded CDP chunks. Real decoded MP3 playback and DOM interactions. Stage/completion fixtures explicit; storage emulated. Not a physical Android test.'}
 (R/'tests/v4-presentation-results.json').write_text(json.dumps(report,indent=2));b.close()
if report['failed']:raise SystemExit(1)
