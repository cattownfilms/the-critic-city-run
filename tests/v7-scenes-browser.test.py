"""Rendered pixel staging, fixed mobile anchors and route-specific dialogue.

Opening is watched through real keyboard/touch controls in normal browser time.
Additional scenes are explicitly identified presentation fixtures. These tests
complement visual inspection rather than claiming pixel art quality from data.
"""
from pathlib import Path
import argparse
import json
from playwright.sync_api import sync_playwright
from browser_support import source_site, launch_options

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--engine', choices=['chromium', 'firefox', 'webkit'], default='chromium')
parser.add_argument('--url', default='local')
parser.add_argument('--output', type=Path)
parser.add_argument('--screenshots', type=Path)
args = parser.parse_args()
results, errors, openings = [], [], []
EXPECTED = [
    ('DUKE', 'Ratings are low. I need you to give this a glowing review, Sherman!'),
    ('JAY', 'It Stinks!'),
    ('DUKE', 'I thought you might say that... Allow me to give you a little motivation...'),
    ('MARTY', 'Dad!'), ('JAY', 'Marty!'),
    ('DUKE', "If television can't bring the audience to us, perhaps we'll just bring the television to the audience!"),
    ('JAY', 'Hatchi Matchi!!!'),
]


def check(name, passed, details=None):
    results.append({'name': name, 'passed': bool(passed), 'details': details})
    print('PASS' if passed else 'FAIL', name, details or '', flush=True)


def wait(page, expression, arg=None):
    page.wait_for_function(expression, arg=arg, timeout=60000, polling=50)


def state(page):
    return page.evaluate('__brawler.scenes().state()')


def shot_ready(page):
    wait(page, '__brawler.scenes().active&&!__brawler.scenes().loading')


def watch_opening(page, route, touch=False):
    records, lines = [], []
    for _ in range(40):
        if not page.evaluate('__brawler.scenes().active'):
            break
        shot_ready(page)
        before = state(page)
        index = before['index']
        automatic = page.evaluate('!!__brawler.scenes().shot.auto')
        # Read moving staging after a visible fraction of its beat, then wait for
        # its author-required minimum. Automatic beats retain their normal clock.
        page.wait_for_timeout(80)
        first = state(page)
        if first['shotId'] == 'duke-approach':
            page.wait_for_timeout(350)
            second = state(page)
            a = next(a for a in first['actors'] if a['id'] == 'duke')
            b = next(a for a in second['actors'] if a['id'] == 'duke')
            check(f'{route}: Duke visibly approaches seated Jay within the shared shot',
                  b['x'] < a['x'] and any(a['id'] == 'jay' for a in first['actors']), [a, b])
        if first['shotId'] == 'screen-emergence':
            page.wait_for_timeout(2350)
        if first['shotId'] == 'window-launch':
            page.wait_for_timeout(850)
        wait(page, 'i=>!__brawler.scenes().active||__brawler.scenes().index!==i||__brawler.scenes().time>=(__brawler.scenes().shot.minTime??.2)', index)
        if not page.evaluate('__brawler.scenes().active'):
            break
        now = state(page)
        if now['index'] != index:
            continue
        now['scrollY'] = page.evaluate('scrollY')
        now['dialogueFits'] = page.locator('#sceneDialogue').evaluate('el=>el.scrollHeight<=el.clientHeight+1')
        now['portraitDecoded'] = page.locator('#scenePortrait').evaluate('el=>el.dataset.empty!=="true"&&el.naturalWidth>0')
        now['portraitRendering'] = page.locator('#scenePortrait').evaluate('el=>getComputedStyle(el).imageRendering')
        records.append(now)
        if now['dialogue']:
            lines.append((now['speaker'], now['dialogue']))
        if args.screenshots and now['shotId'] in ['duke-approach', 'marty-reveal', 'screen-emergence', 'window-launch', 'street-recovery']:
            args.screenshots.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(args.screenshots / f'{args.engine}-{route}-{now["shotId"]}.png'))
        if automatic:
            wait(page, 'i=>!__brawler.scenes().active||__brawler.scenes().index!==i', index)
        elif touch:
            page.locator('#sceneAdvance').tap()
            wait(page, 'i=>!__brawler.scenes().active||__brawler.scenes().index!==i', index)
        else:
            page.keyboard.press('Enter')
            wait(page, 'i=>!__brawler.scenes().active||__brawler.scenes().index!==i', index)
    wait(page, '__brawler.game.mode==="play"&&!__brawler.scenes().active')
    check(f'{route}: approved father/antagonist opening lines remain verbatim', lines == EXPECTED, lines)
    early = [s for s in records if s['shotId'] in ['duke-approach', 'refusal', 'motivation']]
    check(f'{route}: Marty remains hidden through the motivation line', len(early) == 3 and all(not s['martyVisible'] for s in early))
    reveal = next((s for s in records if s['shotId'] == 'marty-reveal'), None)
    check(f'{route}: Marty is visibly revealed after motivation with his own portrait',
          reveal and reveal['martyVisible'] and reveal['portrait']['id'] == 'marty' and reveal['portraitDecoded'])
    if route == 'franklin':
        check('Franklin is visibly an ally in the opening while Jay remains Marty’s father',
              all(any(a['character'] == 'franklin' for a in s['actors']) for s in early)
              and ('JAY', 'Marty!') in lines and ('FRANKLIN', 'Marty!') not in lines)
    emitted = next((s for s in records if s['shotId'] == 'screen-emergence'), None)
    canonical = {'sherm-punch', 'sherm-shove', 'sherm-slam', 'striped', 'raptor', 'bear', 'hippo'}
    check(f'{route}: all seven actual Coming Attractions visibly emerge from specific screens',
          emitted and {a['character'] for a in emitted['emergingCast']} == canonical
          and all(a['source'].startswith('screen-') for a in emitted['emergingCast']))
    launch = next((s for s in records if s['shotId'] == 'window-launch'), None)
    hatchi = next((s for s in records if s['shotId'] == 'hatchi-matchi'), None)
    persistent = [s for s in [hatchi, launch] if s]
    emitted_ids = {a['id'] for a in (emitted or {}).get('emergingCast', [])}
    check(f'{route}: the seven screen creatures persist toward Jay through reaction and launch without crossing Marty’s cage',
          len(persistent) == 2 and len(emitted_ids) == 7 and
          all({a['id'] for a in s['emergingCast']} == emitted_ids and
              all(a['resolvedFace'] == -1 and a['bounds'] and
                  a['bounds']['right'] < next(actor['x'] for actor in s['actors'] if actor['id'] == 'marty') - 58
                  for a in s['emergingCast']) and
              sum(a['character'] == 'sherm-punch' for a in s['actors']) == 1
              for s in persistent) and
          any(a['id'] == 'attraction-0' and a['animation'] == 'attack' for a in (launch or {}).get('emergingCast', [])),
          [{'shot': s['shotId'], 'cast': s['emergingCast']} for s in persistent])
    launched = next((a for a in (launch or {}).get('actors', []) if a['id'] == 'jay'), None)
    wait(page, '__brawler.openingArrival()?.landed===true')
    arrival = page.evaluate('__brawler.openingArrival()')
    check(f'{route}: Jay’s studio launch hands off to the selected player landing on the actual gameplay canvas',
          launched and launched['x'] < 100 and launched['y'] < 250 and
          arrival and arrival['started'] and arrival['landed'] and arrival['character'] == route and
          arrival['canvas'] == 'game' and arrival['stage'] == 0 and
          page.locator('#game').is_visible() and page.locator('#hud').is_visible() and
          page.evaluate('__brawler.game.p.z===0&&__brawler.game.p.hp===100') and
          page.evaluate('__brawler.scenes().state().completion.reason==="gameplayEntry"'),
          {'launch': launched, 'arrival': arrival})
    reference = records[0]['bounds']
    check(f'{route}: viewport, dialogue, portrait and Continue anchors do not bounce between beats',
          all(all(abs(s['bounds'][box][key] - reference[box][key]) <= 1
                  for box in reference for key in reference[box]) and s['scrollY'] == records[0]['scrollY'] for s in records),
          [{'shot': s['shotId'], 'bounds': s['bounds']} for s in records])
    viewport_size=page.viewport_size
    check(f'{route}: scene viewport and anchored UI remain wholly inside the visible screen',
          all(all(b['x']>=-1 and b['y']>=-1 and b['x']+b['width']<=viewport_size['width']+1
                  and b['y']+b['height']<=viewport_size['height']+1 for b in s['bounds'].values()) for s in records))
    check(f'{route}: every spoken opening portrait decodes with pixel rendering',
          all(s['portraitDecoded'] and s['portraitRendering'] == 'pixelated' for s in records if s['speaker']))
    check(f'{route}: every approved opening line fits its allocated dialogue area',
          all(s['dialogueFits'] for s in records), [s['shotId'] for s in records if not s['dialogueFits']])
    return {'route': route, 'lines': lines, 'shots': records}


with source_site(args.url) as url, sync_playwright() as pw:
    browser = None
    report = {'engine': args.engine, 'tests': results, 'openings': openings}
    try:
        browser = getattr(pw, args.engine).launch(**launch_options(args.engine))
        report['browserVersion'] = browser.version
        context = browser.new_context(viewport={'width': 915, 'height': 412}, has_touch=True)
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(url)
        wait(page, '__brawler.ready()')
        page.locator('#startButton').tap()
        shot_ready(page)
        openings.append(watch_opening(page, 'hero'))
        watched = page.evaluate('({stage:__brawler.game.stage,gate:__brawler.game.nextGate,lives:__brawler.game.p.lives,flags:{...__brawler.game.storyFlags}})')
        page.keyboard.press('Escape')
        page.locator('#titleButton').click()
        page.locator('#startButton').click()
        shot_ready(page)
        page.keyboard.down('KeyJ')
        page.keyboard.press('Escape')
        wait(page, '__brawler.game.mode==="play"')
        check('Skipped rebuilt opening preserves watched progress without held-HIT leakage',
              watched == page.evaluate('({stage:__brawler.game.stage,gate:__brawler.game.nextGate,lives:__brawler.game.p.lives,flags:{...__brawler.game.storyFlags}})')
              and page.evaluate('!__brawler.getInput().attackHeld&&!__brawler.game.p.action'))
        page.keyboard.up('KeyJ')
        page.keyboard.press('Escape')
        page.locator('#titleButton').click()
        # Explicit existing-unlocked profile fixture, no claim this run unlocked it.
        page.evaluate('localStorage.setItem(BRAWLER_CONFIG.profileKey,JSON.stringify({franklinUnlocked:true,selected:"franklin"}))')
        page.reload()
        wait(page, '__brawler.ready()')
        page.set_viewport_size({'width': 412, 'height': 915})
        page.locator('#startButton').tap()
        shot_ready(page)
        openings.append(watch_opening(page, 'franklin', touch=True))
        # Additional stage/encounter presentations are explicit fixtures, using
        # the actual scene player, portraits and selected-route resolver.
        fixture_ids = ['stage-02-intro', 'stage-03-intro', 'stage-04-intro', 'stage-05-intro', 'stage-06-intro', 'stage-07-intro', 'boss-cinema-intro', 'boss-spike-intro', 'boss-broadcast-intro', 'boss-broadcast-defeat', 'boss-duke-intro', 'ending']
        selected_lines = []
        for scene_id in fixture_ids:
            page.evaluate('id=>__brawler.handleEvent({type:"story",id})', scene_id)
            shot_ready(page)
            for _ in range(12):
                if not page.evaluate('__brawler.scenes().active'):
                    break
                shot_ready(page)
                index = page.evaluate('__brawler.scenes().index')
                wait(page, 'i=>!__brawler.scenes().active||__brawler.scenes().index!==i||__brawler.scenes().time>=(__brawler.scenes().shot.minTime??.2)', index)
                if not page.evaluate('__brawler.scenes().active'):
                    break
                s = state(page)
                if s['index'] != index:
                    continue
                if s['speaker']:
                    selected_lines.append({'scene': scene_id, 'speaker': s['speaker'], 'portrait': s['portrait']['id'], 'line': s['dialogue']})
                page.locator('#sceneAdvance').tap()
                wait(page, 'i=>!__brawler.scenes().active||__brawler.scenes().index!==i', index)
        player_lines = [s for s in selected_lines if s['speaker'] in ['JAY', 'FRANKLIN']]
        check('Franklin stage, boss and ending comments use Franklin’s own speaker and portrait',
              player_lines and all(s['speaker'] == 'FRANKLIN' and s['portrait'] == 'franklin' for s in player_lines), player_lines)
        check('All seven required speaker portraits have browser-decodable presentation',
              page.evaluate("async()=>{const meta=__brawler.meta();return (await Promise.all(['jay','duke','marty','franklin','projectionist','pizzeria','spike'].map(id=>new Promise(resolve=>{const im=new Image();im.onload=()=>resolve(im.naturalWidth>0);im.onerror=()=>resolve(false);im.src=BRAWLER_CONFIG.assetBase+CriticCutscenes.portraitPath(meta,id)})))).every(Boolean)}"))
        check('Every scene bitmap requested during the review loaded successfully',
              page.evaluate('__brawler.scenes().state().assetErrors.length===0'),
              page.evaluate('__brawler.scenes().state().assetErrors'))
        check('Rebuilt staging and route scenes have no uncaught browser errors', not errors, errors)
    except Exception as error:
        check('Scene correction regression execution completed', False, str(error))
    finally:
        if browser:
            browser.close()
        report.update({'passed': sum(r['passed'] for r in results),
                       'failed': sum(not r['passed'] for r in results), 'errors': errors,
                       'boundary': 'Actual local/hosted browser HTTP rendering and normal-clock keyboard/touch opening. Extra scene presentations and existing-unlocked profile are explicit fixtures. Visual quality/identity also requires screenshot review. No physical Android/Logitech test.'})
        output = args.output or ROOT / 'tests' / f'v7-scenes-{args.engine}-results.json'
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(report, indent=2) + '\n')
if report['failed']:
    raise SystemExit(1)
