"""Pass 1 startup footprint and short frame-pacing observations, not a device benchmark."""
import sys,json,time
from pathlib import Path
sys.path.insert(0,str(Path.cwd()/'tests'))
from browser_support import source_site,launch_options,skip_story,wait_scene
from playwright.sync_api import sync_playwright
out=Path(sys.argv[1] if len(sys.argv)>1 else "tests/pass1-browser-results.json");results=[];errors=[]
with source_site() as url,sync_playwright() as pw:
 b=pw.chromium.launch(**launch_options());c=b.new_context(viewport={'width':915,'height':412},has_touch=True);p=c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.add_init_script('performance.setResourceTimingBufferSize(2000)')
 t=time.monotonic();p.goto(url);p.wait_for_function('__brawler.ready()',timeout=180000)
 results.append({'loadSeconds':time.monotonic()-t,'startup':p.evaluate('__brawler.loading()'),'decodedRGBAEstimate':p.evaluate('()=>{const r=__brawler.renderer();return [...new Set([...r.images,...r.art.values()])].filter(x=>x&&x.naturalWidth).reduce((s,x)=>s+x.naturalWidth*x.naturalHeight*4,0)}'),'resources':p.evaluate('performance.getEntriesByType("resource").reduce((s,r)=>({count:s.count+1,encodedBytes:s.encodedBytes+r.encodedBodySize,transferBytes:s.transferBytes+r.transferSize}),{count:0,encodedBytes:0,transferBytes:0})')})
 p.locator('#startButton').tap();wait_scene(p);skip_story(p)
 for size in [{'width':915,'height':412},{'width':412,'height':915}]:
  p.set_viewport_size(size);p.wait_for_timeout(250)
  data=p.evaluate('''async()=>{const t=[];let last=performance.now();for(let i=0;i<120;i++){await new Promise(requestAnimationFrame);const now=performance.now();t.push(now-last);last=now;}t.sort((a,b)=>a-b);return {median:t[60],p95:t[114],max:t[119],heap:performance.memory?.usedJSHeapSize,mode:__brawler.game.mode,specialRect:document.querySelector('#special').getBoundingClientRect().toJSON()}}''');assert data['specialRect']['left']>=0 and data['specialRect']['right']<=size['width'], data
  assert p.locator('#special').inner_text().startswith('SPECIAL')
  results.append({'viewport':size,**data})
 b.close()
out.write_text(json.dumps({'results':results,'errors':errors},indent=2));print(out);assert not errors,errors
