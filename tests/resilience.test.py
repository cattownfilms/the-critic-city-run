"""Optional browser APIs may be absent; gameplay must remain available."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
from load_helper import load_html
from browser_support import standalone_path, launch_options
R=Path(__file__).resolve().parents[1];out=[];errors=[]
def ck(name,value,details=None):out.append({'name':name,'passed':bool(value),'details':details});print('PASS' if value else 'FAIL',name,flush=True)
fixture='''Object.defineProperty(navigator,'getGamepads',{configurable:true,value:undefined});window.AudioContext=undefined;window.webkitAudioContext=undefined;document.documentElement.requestFullscreen=undefined;document.documentElement.webkitRequestFullscreen=undefined;'''
html=standalone_path().read_text().replace('<head>','<head><script>'+fixture+'</script>')
with sync_playwright() as pw:
 b=pw.chromium.launch(**launch_options())
 p=b.new_page(viewport={'width':915,'height':412},has_touch=True);p.on('pageerror',lambda e:errors.append(str(e)))
 load_html(p,html)
 ck('Game loads when Gamepad API and Web Audio are unavailable',p.evaluate('__brawler.ready()&&!__brawler.controller.supported'))
 p.locator('#movesButton').click();p.locator('#controllerEnabled').check();p.wait_for_timeout(100)
 ck('Unavailable gamepad status is explicit and nonfatal','unavailable' in p.locator('#controllerStatus').inner_text().lower())
 p.locator('#titleButton').click();p.locator('#startButton').click();p.wait_for_timeout(150);p.locator('#sceneSkip').click();p.wait_for_timeout(800)
 ck('Normal gameplay still begins without optional APIs',p.evaluate('__brawler.game.mode==="play"'))
 ck('Music can play without the optional sampled-SFX audio context',p.evaluate('!__brawler.audio.ctx&&!__brawler.audio.music.paused'))
 p.keyboard.down('ArrowRight');p.wait_for_timeout(200);p.keyboard.up('ArrowRight');ck('Keyboard movement survives missing gamepad and audio contexts',p.evaluate('__brawler.game.p.x>190'))
 p.locator('#fullBtn').click();ck('Unsupported fullscreen produces a message, not a crash','fullscreen' in p.locator('#toast').inner_text().lower() and p.evaluate('__brawler.game.mode==="play"'))
 p.locator('#pauseBtn').click();p.locator('#resumeButton').click();p.wait_for_timeout(120);ck('Pause and resume survive missing optional browser APIs',p.evaluate('__brawler.game.mode==="play"'))
 ck('No unhandled JS errors in degraded browser feature mode',not errors,errors)
 b.close()
report={'tests':out,'passed':sum(x['passed'] for x in out),'failed':sum(not x['passed'] for x in out),'boundary':'Chromium feature-removal fixtures. This does not emulate every old browser or every Safari restriction.'}
(R/'tests/resilience-results.json').write_text(json.dumps(report,indent=2))
if report['failed']:raise SystemExit(1)
