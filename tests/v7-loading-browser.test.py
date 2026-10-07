"""Actual delayed HTTP dependencies and menu/gallery destination safety.

Routes deliberately hold image responses. No asset is deleted and no gameplay
state is forced. Initial network/decoded budgets are reported, not inferred from
hot localhost timing. Physical Android/Logitech hardware is outside this test.
"""
from pathlib import Path
from urllib.parse import urlparse
import argparse
import json
import time

from playwright.sync_api import sync_playwright
from browser_support import source_site, launch_options

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--engine', choices=['chromium', 'firefox', 'webkit'], default='chromium')
parser.add_argument('--url', default='local')
parser.add_argument('--output', type=Path)
args = parser.parse_args()
results, errors = [], []


def check(name, passed, details=None):
    results.append({'name': name, 'passed': bool(passed), 'details': details})
    print('PASS' if passed else 'FAIL', name, details or '', flush=True)


def wait(page, expression):
    page.wait_for_function(expression, timeout=60000, polling=50)


with source_site(args.url) as url, sync_playwright() as pw:
    report = {'engine': args.engine, 'tests': results}
    browser = None
    try:
        browser = getattr(pw, args.engine).launch(**launch_options(args.engine))
        report['browserVersion'] = browser.version
        context = browser.new_context(viewport={'width': 412, 'height': 915}, has_touch=True)
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        held, blocked_files = [], set()
        startup_blocked = True

        def gate(route):
            path = urlparse(route.request.url).path
            image = route.request.resource_type == 'image' and '/assets/' in path
            if image and (startup_blocked or any(path.endswith('/' + name) for name in blocked_files)):
                held.append(route)
            else:
                route.continue_()

        def release():
            blocked_files.clear()
            pending = list(held)
            held.clear()
            for route in pending:
                route.continue_()

        page.route('**/assets/**', gate)
        started = time.monotonic()
        page.goto(url, wait_until='domcontentloaded')
        wait(page, '!!window.__brawler?.meta()&&!!__brawler.renderer()')
        check('Title/menu shell exists while required images are stalled',
              page.locator('#title').is_visible() and page.locator('#movesButton').is_enabled())
        check('Start and every Animation Room entry are gated while required images load',
              page.evaluate("['startButton','galleryButton','pauseGallery','completeGallery'].every(id=>document.getElementById(id).disabled)&&!__brawler.ready()"))
        page.locator('#movesButton').tap()
        check('Preserved options remain usable during initial loading',
              page.locator('#musicVolume').is_visible() and page.locator('#controllerSettings').count() == 1)
        # Invoke handlers directly to verify the guard behind the disabled UI.
        page.evaluate("()=>{for(const id of ['galleryButton','pauseGallery','completeGallery'])document.getElementById(id).onclick()}")
        page.wait_for_timeout(100)
        check('All gallery handlers refuse partial entry during startup',
              page.evaluate("document.getElementById('gallery').hidden&&__brawler.game.mode!=='gallery'"))
        check('Loading explanation stays visible and nonfatal',
              'loading' in page.locator('#loadtext').inner_text().lower() or 'preparing' in page.locator('#loadtext').inner_text().lower())
        startup_blocked = False
        release()
        wait(page, '__brawler.ready()')
        page.locator('#titleButton').tap()
        initial = page.evaluate("""()=>{
          const meta=__brawler.meta(),images=__brawler.renderer().images;
          const loaded=images.map((im,index)=>im?index:null).filter(index=>index!==null);
          const resources=performance.getEntriesByType('resource').map(r=>({name:r.name,encoded:r.encodedBodySize,transfer:r.transferSize,decoded:r.decodedBodySize}));
          return {loadedPages:loaded,totalPages:meta.pages.length,
            atlasBytes:loaded.reduce((n,index)=>n+(meta.pages[index].bytes||0),0),
            decodedAtlasRGBABytes:loaded.reduce((n,index)=>n+images[index].naturalWidth*images[index].naturalHeight*4,0),resources};
        }""")
        initial['wallSecondsIncludingDeliberateStall'] = round(time.monotonic() - started, 3)
        report['initialDependencies'] = initial
        check('Usable title decodes only a subset of the retained atlas library',
              0 < len(initial['loadedPages']) < initial['totalPages'], initial)
        # Choose an unrequested full bank before opening the gallery. This is a
        # destination choice, not a gameplay or asset-readiness fixture.
        choice = page.evaluate("""()=>{
          const meta=__brawler.meta(),images=__brawler.renderer().images;
          for(const bank of ['franklin','pizzeria-boss','hero']){
            const pages=[...new Set(Object.values(meta.characters[bank]).flatMap(a=>a.frames.map(f=>f.p)))];
            const files=pages.filter(p=>!images[p]).map(p=>meta.pages[p].file);
            if(files.length)return {bank,files};
          }return null;
        }""")
        check('At least one complete gallery bank remains on demand', choice is not None)
        if choice:
            blocked_files.update(choice['files'])
            page.evaluate('(value)=>document.getElementById("characterSelect").value=value', choice['bank'])
            page.locator('#galleryButton').tap()
            wait(page, '__brawler.game.mode==="loading"')
            check('Animation Room waits for its whole selected bank before entry',
                  page.evaluate("document.getElementById('gallery').hidden&&document.getElementById('contentLoading').hidden===false&&__brawler.game.mode==='loading'"))
            check('Gallery loading cannot open another partially ready destination',
                  page.evaluate("['startButton','galleryButton','pauseGallery','completeGallery'].every(id=>document.getElementById(id).disabled)"))
            page.wait_for_timeout(120)
            check('Stalled gallery stays outside the room with an accurate explanation',
                  'Animation Room' in page.locator('#contentLoadStatus').inner_text() and page.evaluate("document.getElementById('gallery').hidden"))
            release()
            wait(page, '__brawler.game.mode==="gallery"&&!document.getElementById("galleryCanvas").hidden')
            check('Gallery enters only after its selected complete library decodes',
                  page.evaluate("()=>{const images=__brawler.renderer().images,bank=__brawler.meta().characters[document.getElementById('characterSelect').value];return Object.values(bank).every(a=>a.frames.every(f=>images[f.p]?.naturalWidth>0))}"))
            page.locator('#closeGallery').tap()
            check('Closing completed gallery returns to the same valid title',
                  page.locator('#title').is_visible() and page.locator('#startButton').is_enabled())
        # A separate saved-progress fixture aborts a required late-stage image
        # twice, then restores the response. Continue must remain a guarded retry
        # rather than strand the title after the second transient failure.
        retry_file = page.evaluate("__brawler.meta().pages[__brawler.meta().loading.gameplay.duke[0]].file")
        save_key = page.evaluate('BRAWLER_CONFIG.saveKey')
        retry_context = browser.new_context(viewport={'width': 1000, 'height': 560})
        pending_save = {'version': 5, 'stage': 6, 'nextGate': 2, 'lives': 3,
                        'meter': 35, 'score': 3456, 'playerKind': 'hero',
                        'franklinUnlocked': True, 'machineDefeated': True,
                        'dukeDefeated': False, 'storyFlags': {}}
        retry_context.add_init_script('localStorage.setItem(' + json.dumps(save_key) +
                                      ',JSON.stringify(' + json.dumps(pending_save) + '));')
        retry_page = retry_context.new_page()
        retry_page.on('pageerror', lambda error: errors.append(str(error)))
        failures = {'block': True, 'count': 0}

        def transient_failure(route):
            if failures['block']:
                failures['count'] += 1
                route.abort('failed')
            else:
                route.continue_()

        retry_page.route('**/assets/' + retry_file, transient_failure)
        retry_page.goto(url, wait_until='domcontentloaded')
        wait(retry_page, '__brawler.ready()')
        wait(retry_page, 'document.getElementById("continueButton").textContent.includes("retry download")')
        check('Failed Continue prefetch exposes a usable retry action',
              retry_page.locator('#continueButton').is_enabled() and failures['count'] >= 1)
        retry_page.locator('#continueButton').click()
        wait(retry_page, 'document.getElementById("toast").textContent.includes("Required game files could not load")')
        check('Repeated required-image failure preserves Continue retry and saved progress',
              retry_page.locator('#continueButton').is_enabled() and
              retry_page.evaluate('__brawler.game.mode==="title"&&__brawler.getSave().stage===6&&__brawler.getSave().score===3456') and
              failures['count'] >= 2)
        failures['block'] = False
        retry_page.locator('#continueButton').click()
        wait(retry_page, '__brawler.game.mode==="play"&&__brawler.game.stage===6')
        check('Recovered Continue decodes dependencies before resuming exactly one physical Duke',
              retry_page.evaluate("""()=>{
                const g=__brawler.game,m=__brawler.meta(),im=__brawler.renderer().images;
                return g.machineDefeated&&!g.dukeDefeated&&!g.storyFlags.martyRescued&&g.score===3456&&
                  g.enemies.filter(e=>e.kind==='duke'&&e.hp>0).length===1&&
                  m.loading.gameplay.duke.every(id=>im[id]?.naturalWidth>0);
              }"""))
        retry_context.close()
        check('Delayed dependencies cause no uncaught browser errors', not errors, errors)
    except Exception as error:
        check('Loading/menu regression execution completed', False, str(error))
    finally:
        if browser:
            browser.close()
        report.update({'passed': sum(r['passed'] for r in results),
                       'failed': sum(not r['passed'] for r in results),
                       'errors': errors,
                       'boundary': 'Real HTTP source and delayed image-response fixtures in a mobile-sized browser. Atlas bytes are manifest file bytes; decoded budget uses actual image dimensions. Deliberate stalls make reported wall time unsuitable as a speed benchmark. No physical hardware.'})
        output = args.output or ROOT / 'tests' / f'v7-loading-{args.engine}-results.json'
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(report, indent=2) + '\n')
if report['failed']:
    raise SystemExit(1)
