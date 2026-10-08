"""Real user gestures and native playback; no autoplay-policy bypass or audio mocks."""
from pathlib import Path
import argparse,json
from playwright.sync_api import sync_playwright
from browser_support import source_site,launch_options,skip_story
p=argparse.ArgumentParser();p.add_argument('--engine',default='chromium',choices=['chromium','firefox','webkit']);p.add_argument('--url',default='local');args=p.parse_args()
results=[];errors=[]
def check(name,value,details=None):
 results.append(dict(name=name,passed=bool(value),details=details));print('PASS' if value else 'FAIL',name,details or '',flush=True)
def wait(page,code):page.wait_for_function(code,timeout=60000)
def state(page):return page.evaluate('''()=>{const a=__brawler.audio;return {context:a.ctx?.state,musicPaused:a.music.paused,time:a.music.currentTime,volume:a.music.volume,track:a.trackKey,readyState:a.music.readyState,sfx:settings.sfx,loaded:a.loaded,played:a.played,errors:a.errors,blocked:a.lastBlocked,primeError:a.lastPrimeError,nodes:[...a.musicNodes].map(([key,n])=>({key,ready:n.readyState,network:n.networkState,error:n.error?{code:n.error.code,message:n.error.message}:null}))}}''')
with source_site(args.url) as url,sync_playwright() as pw:
 browser=getattr(pw,args.engine).launch(**launch_options(args.engine))
 context=browser.new_context(viewport={'width':915,'height':412},has_touch=True)
 # A historical partial settings object must not silently zero both volume sliders.
 context.add_init_script("if(!localStorage.getItem('cattown.critic.brawler.v2.settings'))localStorage.setItem('cattown.critic.brawler.v2.settings',JSON.stringify({reducedMotion:true}))")
 page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(url);wait(page,'__brawler.ready()');check('Version is v10 without changing storage keys',page.evaluate("BRAWLER_CONFIG.version==='10.0.0'&&BRAWLER_CONFIG.saveKey==='cattown.critic.brawler.v3.save'"))
  check('Partial old settings preserve audible defaults',page.evaluate('settings.music===.35&&settings.sfx===.72'))
  # Pointer up/click is a real trusted event, including on touch-sensitive policies.
  page.locator('#title h1').tap();wait(page,"__brawler.audio.ctx?.state==='running'&&__brawler.audio.music.currentTime>.15")
  a=state(page);check('Trusted title gesture starts native music and WebAudio',not a['musicPaused'] and a['volume']>0 and a['context']=='running',a)
  first=a['time'];page.wait_for_timeout(350);check('Title music clock advances',state(page)['time']>first)
  page.locator('#startButton').tap();wait(page,'__brawler.scenes().active&&!__brawler.scenes().loading');skip_story(page)
  wait(page,"__brawler.game.mode==='play'&&__brawler.audio.trackKey==='broadway'&&!__brawler.audio.music.paused")
  wait(page,'__brawler.audio.loaded');check('All thirteen original SFX decode',page.evaluate('Object.keys(__brawler.audio.buffers).length===13'))
  # Observe actual downstream samples. Extra branch is silent, not a fake source.
  measured=page.evaluate('''async()=>{const a=__brawler.audio,an=a.ctx.createAnalyser(),silent=a.ctx.createGain();silent.gain.value=0;a.bus.connect(an);an.connect(silent);silent.connect(a.ctx.destination);an.fftSize=256;let peak=0;const data=new Float32Array(256);a.event({type:'hit',sound:'heavy'});for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,10));an.getFloatTimeDomainData(data);for(const v of data)peak=Math.max(peak,Math.abs(v));}a.bus.disconnect(an);an.disconnect();silent.disconnect();return {peak,played:a.played.heavy,bus:a.bus.gain.value};}''')
  check('Hit SFX reaches the real nonzero audio bus',measured['peak']>0 and measured['played']>0 and measured['bus']>0,measured)
  page.locator('#soundBtn').tap();check('Mute stops music',page.evaluate('__brawler.audio.muted&&__brawler.audio.music.paused'))
  page.locator('#soundBtn').tap();wait(page,'!__brawler.audio.music.paused');check('Unmute recovers playback',not state(page)['musicPaused'])
  page.locator('#pauseBtn').tap();check('Pause stops music',state(page)['musicPaused']);page.locator('#resumeButton').tap();wait(page,'!__brawler.audio.music.paused');check('Resume plays again',not state(page)['musicPaused'])
  transitions=page.evaluate('''async()=>{const a=__brawler.audio;for(let i=0;i<16;i++){await a.playMusic(['subway','rooftop','cinema','broadcast'][i%4]);await new Promise(r=>setTimeout(r,25));}return {track:a.trackKey,paused:a.music.paused,nodes:a.musicNodes.size};}''');check('Rapid stage/cutscene tracks finish without native deadlock',transitions['track']=='broadcast' and not transitions['paused'] and transitions['nodes']<=8,transitions)
  t=state(page)['time'];page.wait_for_timeout(300);check('Changed stage music advances',state(page)['time']>t)
  page.reload();wait(page,'__brawler.ready()');page.locator('#continueButton').tap();skip_story(page);wait(page,"__brawler.audio.ctx?.state==='running'&&!__brawler.audio.music.paused");check('Reload and Continue recover from another trusted gesture',state(page)['context']=='running',state(page))
  fresh=browser.new_context(viewport={'width':915,'height':412},has_touch=True);start_page=fresh.new_page();start_page.goto(url);wait(start_page,'__brawler.ready()');start_page.locator('#startButton').tap();wait(start_page,"__brawler.audio.ctx?.state==='running'&&__brawler.audio.music.currentTime>.15");check('Press Start as the first gesture unlocks music and SFX together',state(start_page)['context']=='running' and not state(start_page)['musicPaused'],state(start_page));fresh.close()
  check('No JavaScript console crash',not errors,errors)
 except Exception as e:check('Native browser lifecycle completed',False,{'error':str(e),'audio':state(page),'activation':page.evaluate('({active:navigator.userActivation?.isActive,ever:navigator.userActivation?.hasBeenActive,visibility:document.visibilityState})')})
 finally:
  report={'engine':args.engine,'url':url,'browserVersion':browser.version,'tests':results,'passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),'boundary':'Native headless playback and measured SFX bus; physical speaker output not heard.'}
  Path(__file__).with_name('v9-audio-'+args.engine+'-results.json').write_text(json.dumps(report,indent=2)+'\n');browser.close()
raise SystemExit(1 if report['failed'] else 0)
