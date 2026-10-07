"""Bulk startup, cached story/gallery/audio, recovery and facing in a real browser.

Network stalls and corrupt image responses are deliberate fixtures. Story facing
fixtures exercise the shared resolver; the canonical ending is also inspected.
The audio recovery fixture suspends the real context once, then delegates every
native resume/stop call while checking concurrent unlocks and silent pause.
No gameplay health, score, flags or enemies are changed by this suite.
"""
import argparse
from collections import Counter
import json
from pathlib import Path
import time
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright
from browser_support import source_site, launch_options, trace_native_audio

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
    page.wait_for_function(expression, timeout=120000, polling=50)


def scene_trace(page, scene_id, operation):
    state = page.evaluate('''({active:__brawler.scenes().active,
      scene:__brawler.scenes().scene?.id, loading:__brawler.scenes().loading,
      track:__brawler.audio.trackKey, fade:__brawler.audio.fade,
      outgoing:!!__brawler.audio.outgoing, paused:__brawler.audio.music.paused,
      context:__brawler.audio.ctx?.state, resuming:!!__brawler.audio.resuming})''')
    trace = {'scene': scene_id, 'operation': operation, 'state': state}
    print('CACHE SCENE TRACE ' + json.dumps(trace), flush=True)
    return trace


audio_probe = """window.__decodeCount=0;window.__audioSuspendCount=0;window.__cueStopCount=0;
  window.__audioResumeCount=0;window.__audioResumePending=0;window.__audioResumeMaxPending=0;
  const AudioCtor=window.AudioContext||window.webkitAudioContext;
  if(AudioCtor){const original=AudioCtor.prototype.decodeAudioData;
    AudioCtor.prototype.decodeAudioData=function(...args){window.__decodeCount++;return original.apply(this,args)};
    const suspend=AudioCtor.prototype.suspend;
    AudioCtor.prototype.suspend=function(...args){window.__audioSuspendCount++;return suspend.apply(this,args)};
    const resume=AudioCtor.prototype.resume;
    AudioCtor.prototype.resume=function(...args){window.__audioResumeCount++;window.__audioResumePending++;
      window.__audioResumeMaxPending=Math.max(window.__audioResumeMaxPending,window.__audioResumePending);
      const result=resume.apply(this,args);result.then(()=>window.__audioResumePending--,()=>window.__audioResumePending--);return result;};}
  if(window.AudioBufferSourceNode){const stop=AudioBufferSourceNode.prototype.stop;
    AudioBufferSourceNode.prototype.stop=function(...args){window.__cueStopCount++;return stop.apply(this,args)};}
"""

with source_site(args.url) as url, sync_playwright() as pw:
    browser = None
    report = {'engine': args.engine, 'tests': results}
    try:
        browser = getattr(pw, args.engine).launch(**launch_options(args.engine))
        report['browserVersion'] = browser.version
        context = browser.new_context(viewport={'width': 412, 'height': 915}, has_touch=True)
        context.add_init_script(audio_probe)
        page = context.new_page()
        trace_native_audio(page)
        page.on('pageerror', lambda error: errors.append(error.stack or str(error)))
        requests, held = [], []
        stall = {'on': True}

        def gate(route):
            path = urlparse(route.request.url).path
            requests.append(path)
            if stall['on'] and '/assets/dependency/' in path:
                held.append(route)
            else:
                route.continue_()

        page.route('**/assets/**', gate)
        started = time.monotonic()
        page.goto(url, wait_until='domcontentloaded')
        wait(page, '!!__brawler.meta()&&__brawler.loading().activeWorkers===4')
        check('Title and options shell remains usable while bulk atlases are stalled',
              page.locator('#title').is_visible() and page.locator('#movesButton').is_enabled())
        check('Every playable and Animation Room destination is disabled during bulk loading',
              page.evaluate("['startButton','continueButton','againButton','playFranklin','galleryButton','pauseGallery','completeGallery'].every(id=>document.getElementById(id).disabled)&&!__brawler.ready()"))
        check('Audio remains undecoded before the first actual input gesture',
              page.evaluate('__brawler.audio.ctx===null&&window.__decodeCount===0'))
        state = page.evaluate('__brawler.loading()')
        check('Startup progress reports its complete file plan and bounded four-worker pool',
              state['totalFiles'] > state['totalAtlasPages'] and state['completedFiles'] >= 1 and
              state['activeWorkers'] == 4 and ' / ' in page.locator('#loadtext').inner_text(), state)
        page.locator('#movesButton').tap()
        check('Options work during the stalled startup', page.locator('#musicVolume').is_visible())
        page.evaluate("()=>{for(const id of ['galleryButton','pauseGallery','completeGallery'])document.getElementById(id).onclick();__brawler.start()}")
        check('Handler guards refuse partial gameplay and gallery entry',
              page.evaluate("document.getElementById('gallery').hidden&&__brawler.game.mode==='title'"))
        stall['on'] = False
        for route in list(held):
            route.continue_()
        held.clear()
        wait(page, '__brawler.ready()||__brawler.loading().phase==="error"')
        state = page.evaluate('__brawler.loading()')
        report['startup'] = {**state, 'wallSecondsIncludingDeliberateStall': round(time.monotonic()-started, 3)}
        check('Readiness requires every file and decoded atlas, including optional banks',
              state['ready'] and state['completedFiles'] == state['totalFiles'] and
              state['decodedAtlasPages'] == state['totalAtlasPages'] and not state['failures'], state)
        check('All five music files and thirteen effects are cached before gameplay',
              state['cachedMusicFiles'] == 5 and state['cachedAudioFiles'] == 13)
        wait(page, 'window.__decodeCount===13||__brawler.audio.errors.length>0')
        decoded = page.evaluate('({calls:window.__decodeCount,buffers:Object.keys(__brawler.audio.buffers).length,state:__brawler.audio.ctx?.state,errors:__brawler.audio.errors})')
        if args.engine == 'firefox' and decoded['state'] == 'suspended':
            report['audioLimitation'] = 'Headless Firefox keeps AudioContext suspended after actual touch and keyboard gestures. All 13 WAV byte buffers are cached and 13 decode requests are submitted; audible playback is not claimed.'
            check('Suspended Firefox audio preserves all cue bytes and defers real playback honestly',
                  decoded['calls'] == 13 and state['cachedAudioFiles'] == 13 and not decoded['errors'], decoded)
        else:
            wait(page, '__brawler.audio.loaded||__brawler.audio.errors.length>0')
            decoded = page.evaluate('({calls:window.__decodeCount,buffers:Object.keys(__brawler.audio.buffers).length,state:__brawler.audio.ctx?.state,errors:__brawler.audio.errors})')
            check('All thirteen real cues decode after an actual options input gesture',
                  decoded['calls'] == 13 and decoded['buffers'] == 13 and not decoded['errors'], decoded)
        resume_recovery = page.evaluate('''async()=>{
          const audio=__brawler.audio;
          if(audio.ctx.state==='running')await audio.ctx.suspend();
          const before=__audioResumeCount, pending=[];
          for(let i=0;i<6;i++){audio.unlock();pending.push(audio.resuming);}
          return {before,after:__audioResumeCount,maxPending:__audioResumeMaxPending,
            shared:!!pending[0]&&pending.every(p=>p===pending[0]),state:audio.ctx.state};
        }''')
        check('Concurrent audio unlock requests share one real native resume operation',
              resume_recovery['after'] >= 1 and resume_recovery['after'] - resume_recovery['before'] <= 1 and
              resume_recovery['maxPending'] <= 1 and resume_recovery['shared'], resume_recovery)
        page.locator('#titleButton').tap()
        request_boundary = len(requests)
        page.locator('#galleryButton').tap()
        check('Animation Room opens immediately with no later loading overlay',
              page.locator('#gallery').is_visible() and page.locator('#contentLoading').is_hidden())
        banks = page.evaluate('Object.keys(__brawler.meta().characters)')
        for bank in banks:
            page.select_option('#characterSelect', bank)
            wait(page, 'document.getElementById("animSelect").options.length>0')
        check('Every retained bank is available through the actual Animation Room selector',
              set(banks) <= set(page.locator('#characterSelect option').evaluate_all('(els)=>els.map(el=>el.value)')),
              {'banks': len(banks)})
        page.locator('#closeGallery').tap()
        # Establish a valid initialized run through the real menu before using
        # isolated scene fixtures. Initial title Game.stats is not a campaign.
        page.locator('#startButton').tap()
        wait(page, '__brawler.scenes().active&&!__brawler.scenes().loading')
        page.evaluate('__brawler.scenes().skip()')
        before_pause = page.evaluate('()=>{__brawler.audio.sample("bear-call");return {suspends:__audioSuspendCount,stops:__cueStopCount,active:__brawler.audio.active.size}}')
        page.keyboard.press('Escape')
        paused_audio = page.evaluate('({musicPaused:__brawler.audio.music.paused,outgoingPaused:!__brawler.audio.outgoing||__brawler.audio.outgoing.paused,active:__brawler.audio.active.size,wantMusic:__brawler.audio.wantMusic,suspends:__audioSuspendCount,stops:__cueStopCount,contextState:__brawler.audio.ctx?.state})')
        check('Pause stops music and active cues without explicitly suspending the audio context',
              paused_audio['musicPaused'] and paused_audio['outgoingPaused'] and not paused_audio['wantMusic'] and
              paused_audio['active'] == 0 and paused_audio['suspends'] == before_pause['suspends'] and
              (before_pause['active'] == 0 or paused_audio['stops'] > before_pause['stops']),
              {'before': before_pause, 'paused': paused_audio})
        page.locator('#titleButton').tap()
        check('A fresh New Game story checkpoint enables Continue immediately on returning to Title',
              page.locator('#continueButton').is_visible() and page.locator('#continueButton').is_enabled() and
              page.evaluate('__brawler.getSave().storyFlags.opening===true'))
        page.locator('#continueButton').tap()
        wait(page, '__brawler.game.mode==="play"')
        check('Continue resumes the new checkpoint without replaying the opening',
              page.evaluate('__brawler.game.playerKind==="hero"&&!__brawler.scenes().active&&__brawler.game.storyFlags.opening===true'))
        report['cachedSceneTraversal'] = []
        for scene_id in page.evaluate('Object.keys(CriticCutscenes.scenes)'):
            report['cachedSceneTraversal'].append(scene_trace(page, scene_id, 'play begin'))
            page.evaluate('(id)=>__brawler.scenes().play(CriticCutscenes.scenes[id])', scene_id)
            page.wait_for_function('__brawler.scenes().active&&!__brawler.scenes().loading', timeout=10000, polling=50)
            report['cachedSceneTraversal'].append(scene_trace(page, scene_id, 'decoded'))
            # This is a dependency-cache traversal, not a zero-time media stress
            # test. Let the real .9-second crossfade and scene animation run as
            # they do between player inputs. Audio remains native and enabled.
            page.wait_for_timeout(1100)
            report['cachedSceneTraversal'].append(scene_trace(page, scene_id, 'skip begin'))
            page.locator('#sceneSkip').tap()
            page.wait_for_function('!__brawler.scenes().active', timeout=10000, polling=50)
            page.wait_for_timeout(1100)
            report['cachedSceneTraversal'].append(scene_trace(page, scene_id, 'skip settled'))
        # A blocked AudioContext resume may remain pending in headless Firefox.
        # The production UI deliberately does not await this optional audio call.
        page.evaluate('()=>{__brawler.audio.playMusic("subway")}')
        page.wait_for_timeout(200)
        check('All scene starts, gallery banks and track changes use cached assets with zero later HTTP',
              len(requests) == request_boundary,
              {'laterRequests': requests[request_boundary:]})

        # Actual shared scene renderer, with simple explicit resolver fixtures.
        facing_cases = [
            ({'face': -1, 'lookAt': 850, 'motion': {'fromX': 200, 'toX': 400, 'duration': 1}}, -1, 'explicit'),
            ({'lookAt': 'duke'}, 1, 'lookAt'),
            ({'lookAt': 100}, -1, 'lookAt'),
            ({'lookAt': {'x': 100}}, -1, 'lookAt'),
            ({'motion': {'fromX': 200, 'toX': 100, 'duration': 1}}, -1, 'motion'),
            ({}, 1, 'speaker'),
        ]
        for extra, face, reason in facing_cases:
            data = {'id': 'resolver-fixture', 'environment': 'studio', 'shots': [{'speaker': 'DUKE', 'dialogue': 'Facing fixture', 'actors': [
                {'id': 'marty', 'character': 'marty', 'x': 200, 'y': 318, 'animation': 'idle', **extra},
                {'id': 'duke', 'character': 'duke', 'x': 700, 'y': 318, 'animation': 'idle'}]}]}
            page.evaluate('(s)=>__brawler.scenes().play(s)', data)
            wait(page, '__brawler.scenes().active&&!__brawler.scenes().loading')
            actor = page.evaluate('__brawler.scenes().state().actors.find(a=>a.id==="marty")')
            check('Scene facing resolves ' + reason + ' priority ' + str(extra),
                  actor['resolvedFace'] == face and actor['faceReason'] == reason, actor)
            page.evaluate('__brawler.scenes().skip()')
        page.evaluate('__brawler.scenes().play(CriticCutscenes.scenes.ending)')
        wait(page, '__brawler.scenes().active&&!__brawler.scenes().loading')
        actor = page.evaluate('__brawler.scenes().state().actors.find(a=>a.id==="marty")')
        check('Canonical Marty rescue run faces toward Jay on the left',
              actor['resolvedFace'] == -1 and actor['faceReason'] in ['lookAt', 'motion'], actor)
        page.evaluate('__brawler.scenes().skip()')
        emissions = {'id': 'emission-facing-fixture', 'environment': 'broadcast',
                     'screens': [{'x': 400, 'y': 60, 'w': 100, 'h': 80}, {'x': 700, 'y': 60, 'w': 100, 'h': 80}],
                     'shots': [{'emissions': [{'id': 'left', 'character': 'sherm-punch', 'screen': 0, 'toX': 200, 'toY': 318},
                                               {'id': 'right', 'character': 'sherm-shove', 'screen': 1, 'toX': 850, 'toY': 318}]}]}
        page.evaluate('(s)=>__brawler.scenes().play(s)', emissions)
        wait(page, '__brawler.scenes().active&&!__brawler.scenes().loading')
        actors = page.evaluate('__brawler.scenes().state().emergingCast')
        check('Screen emissions face their actual left or right travel direction',
              {a['id']: a['resolvedFace'] for a in actors} == {'left': -1, 'right': 1}, actors)
        page.evaluate('__brawler.scenes().skip()')

        # Hold J through a real cutscene skip and observe the gameplay-input barrier.
        page.keyboard.press('Escape')
        page.locator('#titleButton').tap()
        page.locator('#startButton').tap()
        wait(page, '__brawler.scenes().active&&!__brawler.scenes().loading')
        page.keyboard.down('KeyJ')
        page.keyboard.press('Escape')
        wait(page, '__brawler.game.mode==="play"')
        check('Held dialogue input is cleared and blocked when the scene ends',
              page.evaluate('__brawler.input.blockedKeys.has("KeyJ")&&!__brawler.getInput().attackHeld&&!__brawler.getInput().attackPressed'))
        page.keyboard.up('KeyJ')
        page.keyboard.down('KeyJ')
        page.wait_for_timeout(80)
        check('A fresh press remains usable after releasing the blocked held key',
              page.evaluate('__brawler.getInput().attackHeld&&!__brawler.input.blockedKeys.has("KeyJ")'))
        page.keyboard.up('KeyJ')

        # Corrupt one optional atlas. Continue and Gallery must remain disabled;
        # Retry downloads only the failed file and retains every valid decode.
        retry_context = browser.new_context(viewport={'width': 1000, 'height': 560})
        retry_context.add_init_script("localStorage.setItem('cattown.critic.brawler.v3.save',JSON.stringify({version:5,stage:6,nextGate:2,lives:3,meter:35,score:3456,playerKind:'hero',franklinUnlocked:true,machineDefeated:true,dukeDefeated:false,storyFlags:{}}))")
        retry_page = retry_context.new_page()
        trace_native_audio(retry_page)
        retry_page.on('pageerror', lambda error: errors.append(error.stack or str(error)))
        target_file = page.evaluate('__brawler.meta().pages[__brawler.meta().pages.length-1].file')
        attempt = {'fail': True}
        retry_requests = []

        def invalid_atlas(route):
            path = urlparse(route.request.url).path
            retry_requests.append(path)
            if attempt['fail'] and path.endswith('/' + target_file):
                route.fulfill(status=200, content_type='image/webp', body=b'not a decodable WebP')
            else:
                route.continue_()

        retry_page.route('**/assets/**', invalid_atlas)
        retry_page.goto(url, wait_until='domcontentloaded')
        wait(retry_page, '__brawler.loading().phase==="error"')
        failed_state = retry_page.evaluate('__brawler.loading()')
        check('A corrupt optional atlas keeps every destination safely disabled with Retry',
              not failed_state['ready'] and len(failed_state['failures']) == 1 and
              retry_page.locator('#initialLoadRetry').is_visible() and retry_page.evaluate("['startButton','continueButton','galleryButton'].every(id=>document.getElementById(id).disabled)"), failed_state)
        good_counts = Counter(path for path in retry_requests if not path.endswith('/' + target_file))
        retry_page.locator('#movesButton').click()
        check('The options overlay keeps accurate bulk progress and its own Retry control',
              retry_page.locator('#bulkLoadStatusOptions').inner_text() == retry_page.locator('#loadtext').inner_text() and
              retry_page.locator('#bulkLoadRetryOptions').is_visible())
        attempt['fail'] = False
        retry_page.locator('#bulkLoadRetryOptions').click()
        wait(retry_page, '__brawler.ready()')
        recovered_state = retry_page.evaluate('__brawler.loading()')
        check('Retry retains successful downloads and decodes rather than reloading the library',
              good_counts == Counter(path for path in retry_requests if not path.endswith('/' + target_file)) and
              sum(path.endswith('/' + target_file) for path in retry_requests) == 2 and
              recovered_state['completedFiles'] == recovered_state['totalFiles'], recovered_state)
        check('Old save and Continue survive the failed startup and recovery',
              retry_page.locator('#continueButton').is_enabled() and retry_page.evaluate('__brawler.getSave().score===3456&&__brawler.getSave().franklinUnlocked===true'))
        check('No JavaScript page errors occur in bulk loading, cached scenes, or retry', not errors, errors)
        print("CLEANUP TRACE retry context begin",flush=True)
        retry_context.close()
        print("CLEANUP TRACE retry context end",flush=True)
        print("CLEANUP TRACE primary context begin",flush=True)
        context.close()
        print("CLEANUP TRACE primary context end",flush=True)
    except Exception as error:
        check('Browser suite completed', False, str(error))
    finally:
        if browser:
            print("CLEANUP TRACE browser begin",flush=True)
            browser.close()
            print("CLEANUP TRACE browser end",flush=True)
    report['passed'] = sum(test['passed'] for test in results)
    report['failed'] = sum(not test['passed'] for test in results)
    report['pageErrors'] = errors
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'engine': args.engine, 'passed': report['passed'], 'failed': report['failed']}))
    raise SystemExit(1 if report['failed'] else 0)
