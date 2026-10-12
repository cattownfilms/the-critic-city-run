"""Final Duke presentation and shared memorial, using actual decoded scene fixtures."""
from pathlib import Path
import argparse,json
from playwright.sync_api import sync_playwright
from browser_support import source_site,launch_options,wait_scene
p=argparse.ArgumentParser();p.add_argument('--engine',default='chromium');p.add_argument('--url',default='local');a=p.parse_args()
results=[];errors=[];out=Path('tests/screenshots-final-visual');out.mkdir(exist_ok=True)
text='Jay and Marty Sherman perished on September 11, 2001.\n\nNever forget.\n\nTHE END.'
def check(name,value,details=None):
 results.append(dict(name=name,passed=bool(value),details=details));print('PASS' if value else 'FAIL',name,flush=True)
with source_site(a.url) as url,sync_playwright() as pw:
 browser=getattr(pw,a.engine).launch(**launch_options(a.engine,audio=True));page=browser.new_page(viewport=dict(width=915,height=412),has_touch=True);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(url);page.wait_for_function('__brawler.ready()',timeout=120000);page.locator('#startButton').tap();wait_scene(page);page.evaluate(' __brawler.scenes().skip()');page.wait_for_function('!__brawler.scenes().active')
  page.evaluate(Path('tests/final-visual-fixture.js').read_text())
  for width,height in [(915,412),(360,800)]:
   page.set_viewport_size(dict(width=width,height=height))
   for route in ['hero','franklin']:
    key=f'{a.engine}-{route}-{width}x{height}'
    page.evaluate('route=>FinalVisual.duke(route)',route);wait_scene(page);page.evaluate('FinalVisual.freeze();FinalVisual.tick()')
    check(key+' dialogue scale',page.evaluate("__brawler.game.enemies.find(e=>e.kind==='duke').renderScale===1.35"));page.screenshot(path=str(out/(key+'-dialogue.png')))
    page.evaluate("FinalVisual.restore();__brawler.game.mode='pause';document.querySelectorAll('.screen').forEach(e=>e.hidden=true)")
    poses=page.evaluate('FinalVisual.attacks()')
    check(key+' every performance shares sprite/shadow scale and grounded pivot',all(q['visible'] and q['scale']==1.35 and q['draws'] and q['shadows'] and all(d['scale']==1.35 and abs(d['y']-407)<.001 and d['face']==q['face'] for d in q['draws']) and all(d['scale']==1.35 and abs(d['y']-407)<.001 for d in q['shadows']) and 407+q['bounds']['minY']*1.35>0 for q in poses),poses)
    page.screenshot(path=str(out/(key+'-combat.png')))
    page.evaluate("const g=__brawler.game;g.dukeDefeated=g.machineDefeated=true;g.mode='complete';__brawler.handleEvent({type:'complete',ending:'ending'})");wait_scene(page)
    card=page.evaluate('FinalVisual.memorial()');page.wait_for_timeout(450)
    check(key+' exact full-image memorial and transparent panel',card['text']==text and card['panel']=='rgba(0, 0, 0, 0)' and card['size']>=17 and abs(card['image']['width']/card['image']['height']-16/9)<.01 and all(l['y']>=card['image']['y'] and l['bottom']<=card['image']['bottom']+.1 for l in card['lines']),{k:v for k,v in card.items() if k!='canvas'})
    check(key+' piano ending plays',page.evaluate("__brawler.audio.trackKey==='ending'&&!__brawler.audio.music.loop&&!__brawler.audio.music.paused&&__brawler.audio.music.currentTime>0"));page.screenshot(path=str(out/(key+'-memorial.png')))
    page.locator('#sceneAdvance').tap();page.locator('#complete').wait_for(state='visible');page.wait_for_timeout(80)
    result=page.evaluate("FinalVisual.composition('#resultsMemorial')")
    check(key+' results reuse text and visual treatment',all(result[k]==card[k] for k in ['text','font','size','weight','lineHeight','shadow','gradient']) and abs(result['image']['width']/result['image']['height']-16/9)<.01 and all(l['y']>=result['image']['y'] and l['bottom']<=result['image']['bottom']+.1 for l in result['lines']))
    page.screenshot(path=str(out/(key+'-results.png')))
    check(key+' statistics retained',all(label in page.locator('#results').inner_text() for label in ['SCORE','BEST COMBO','KNOCKOUTS','RUN TIME']))
    for action in ['againButton','completeGallery','completeTitle']:
     page.locator('#'+action).scroll_into_view_if_needed();check(key+' reachable '+action,page.locator('#'+action).is_visible() and page.locator('#'+action).bounding_box()['height']>=40)
    page.screenshot(path=str(out/(key+'-actions.png')))
    # The completion save is written by the real game lifecycle; reopen with Continue.
    page.locator('#completeTitle').tap();page.locator('#continueButton').tap();page.locator('#complete').wait_for(state='visible')
    check(key+' completed save reopens same memorial',page.locator('#resultsMemorial').text_content()==text and page.evaluate('__brawler.getSave().version===5&&__brawler.getSave().complete'))
    page.evaluate('FinalVisual.restore();__brawler.handleEvent({type:"complete",ending:"ending"})');wait_scene(page);page.locator('#sceneSkip').tap();page.locator('#complete').wait_for(state='visible');check(key+' skip reaches results',True)
  check('No browser errors',not errors,errors)
 except Exception as e:check('Final visual fixture completed',False,str(e))
 finally:
  report=dict(engine=a.engine,results=results,failed=sum(not q['passed'] for q in results));Path(f'tests/final-visual-{a.engine}-results.json').write_text(json.dumps(report,indent=2));browser.close()
raise SystemExit(bool(report['failed']))
