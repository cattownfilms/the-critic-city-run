"""Fresh browser with denied storage; confirms no persistence promise is required for play."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
from load_helper import load_html
R=Path(__file__).resolve().parents[1];res=[];err=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':960,'height':480},has_touch=True,is_mobile=True);p.on('pageerror',lambda e:err.append(str(e)))
 load_html(p,(R/'The-Critic-City-Brawler-v5.html').read_text(),storage=False)
 res.append({'name':'Exact final build loads when browser storage is denied','passed':p.evaluate('__brawler.ready()')})
 p.locator('#startButton').tap();p.wait_for_timeout(1300)
 res.append({'name':'Denied-storage fallback remains playable with district music','passed':p.evaluate('__brawler.game.mode==="play"&&!__brawler.audio.music.paused&&__brawler.audio.trackKey==="broadway"')})
 p.evaluate('()=>{const g=__brawler.game;g.enemies=[];g.nextGate=3;g.activeGate=-1;g.p.x=2810;g.p.z=0;g.p.hp=100;}');p.wait_for_timeout(600)
 res.append({'name':'Failed checkpoint persistence is nonfatal and surfaced to the player','passed':not err and p.evaluate('__brawler.game.mode==="stageclear"') and 'storage unavailable' in p.locator('#saveNote').inner_text().lower()})
 report={'tests':res,'passed':sum(t['passed'] for t in res),'failed':sum(not t['passed'] for t in res),'boundary':'Browser storage denied by explicit fixture. Final standalone bytes loaded with bounded document.write. No physical Android test.'}
 (R/'tests/v4-storage-results.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2));b.close()
if report['failed']:raise SystemExit(1)
