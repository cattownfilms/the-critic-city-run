// Exercise the actual AudioSystem class with deterministic native-media timing.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const source = fs.readFileSync(process.env.CRITIC_AUDIO_SOURCE || path.join(__dirname, '../app.js'), 'utf8');
const start = source.indexOf('class AudioSystem{');
const code = source.slice(start, source.indexOf('\nconst game=', start));
const results = [];
function fixture(windowOverride={}) {
  const nodes = [];
  class Audio {
    constructor(src) { this.src = src || ''; this.paused = true; this.volume = 1; this.currentTime = 0; this.resets = 0; this.clears = 0; nodes.push(this); }
    getAttribute(name) { return name === 'src' ? this.src : null; }
    removeAttribute(name) { if (name === 'src') { this.src = ''; this.clears++; } }
    load() { this.resets++; }
    play() { this.paused = false; if (this.deferNext) { this.deferNext = false; return new Promise(resolve => { this.finishPlay = resolve; }); } return Promise.resolve(); }
    pause() { this.paused = true; }
  }
  const music = Object.fromEntries(['title', 'broadway', 'subway', 'cinema', 'final'].map(k => [k, { file: k + '.mp3' }]));
  const settings = { music: .5, sfx: .7 };
  const ctx = { setTimeout, clearTimeout, Audio, settings, conf: { music }, cachedURLs: new Map(Object.values(music).map(x => [x.file, 'blob:' + x.file])), src: n => 'blob:' + n, window: windowOverride, stageMusic: () => 'broadway', toast() {}, performance: { now: () => 1000 } };
  const System = vm.runInNewContext(code + '\nAudioSystem', ctx);
  return { audio: new System(), nodes, settings, keys: Object.keys(music) };
}
async function check(name, fn) {
  try { await fn(); results.push({ name, passed: true }); console.log('PASS', name); }
  catch (error) { results.push({ name, passed: false, details: error.stack }); console.log('FAIL', name, error.message); }
}
(async () => {
  await check('Repeated track transitions retain prepared media without native load/reset or unbounded players', async () => {
    const { audio, nodes, keys } = fixture();
    for (let i = 0; i < 100; i++) { await audio.playMusic(keys[i % keys.length]); audio.update(1); }
    assert.equal(nodes.reduce((n, a) => n + a.resets + a.clears, 0), 0);
    assert.equal(nodes.length, keys.length);
    assert.equal(audio.music.src, 'blob:final.mp3');
  });
  await check('Track changes retain the existing crossfade, restart incoming music, and stop the outgoing player', async () => {
    const { audio, settings } = fixture();
    await audio.playMusic('title'); const title = audio.music; title.currentTime = 17;
    await audio.playMusic('broadway'); const street = audio.music;
    audio.update(.45);
    assert.ok(Math.abs(street.volume - settings.music / Math.sqrt(2)) < 1e-10);
    assert.ok(Math.abs(title.volume - settings.music / Math.sqrt(2)) < 1e-10);
    audio.update(.45); assert.equal(title.paused, true); assert.equal(audio.outgoing, null);
    await audio.playMusic('title'); assert.equal(audio.music, title); assert.equal(title.currentTime, 0);
  });
  await check('Pause stops music and cues while same-track resume retains playback position', async () => {
    const { audio } = fixture();
    await audio.playMusic('title'); await audio.playMusic('broadway');
    const node = audio.music; node.currentTime = 12; let stopped = 0;
    audio.active.add({ stop() { stopped++; } }); audio.pause();
    assert.equal(node.paused, true); assert.equal(audio.outgoing.paused, true);
    assert.equal(stopped, 1); assert.equal(audio.active.size, 0);
    await audio.playMusic('broadway'); assert.equal(audio.music, node);
    assert.equal(node.currentTime, 12); assert.equal(node.paused, false);
  });
  await check('Late native play completion cannot pause a newer request reusing the same track', async () => {
    const { audio } = fixture(); const title = audio.music; title.deferNext = true;
    const old = audio.playMusic('title'); await Promise.resolve();
    assert.equal(typeof title.finishPlay, 'function');
    await audio.playMusic('broadway'); await audio.playMusic('title');
    assert.equal(audio.music, title); title.finishPlay(); await old;
    assert.equal(title.paused, false);
    title.deferNext = true; const pending = audio.playMusic('title'); await Promise.resolve();
    audio.pause(); title.finishPlay(); await pending;
    assert.equal(title.paused, true);
  });
  await check('Native music play is called in the gesture turn without waiting for context resume',async()=>{
    let resolveResume,resumes=0;
    class Context {constructor(){this.state='suspended';}createGain(){return {gain:{value:0},connect(){}};}createDynamicsCompressor(){return {threshold:{},knee:{},ratio:{},connect(){}};}resume(){resumes++;return new Promise(r=>{resolveResume=()=>{this.state='running';r();};});}}
    const {audio}=fixture({AudioContext:Context});const pending=audio.playMusic('title');
    assert.equal(audio.music.paused,false);assert.equal(audio.ctx.state,'suspended');audio.unlock();assert.equal(resumes,1);
    resolveResume();await pending;assert.equal(audio.ctx.state,'running');
  });
  await check('Trusted gesture primes all configured players and retries a blocked current player',async()=>{
    const {audio,nodes,keys}=fixture();await audio.playMusic('title');audio.music.pause();audio.gesture();await Promise.resolve();
    assert.equal(audio.music.paused,false);assert.equal(nodes.length,keys.length);assert(nodes.filter(n=>n!==audio.music).every(n=>n.volume===0));
  });
  await check('A failed inactive-track prime cannot turn mute into a retry',async()=>{
    const {audio}=fixture();await audio.playMusic('title');audio.gesture();await new Promise(setImmediate);
    const other=audio.musicNodes.get('cinema');audio.primed.delete(other);other.play=()=>Promise.reject(new Error('prime rejected'));
    audio.gesture();await new Promise(setImmediate);assert.equal(audio.lastBlocked,null);assert.match(audio.lastPrimeError,/prime rejected/);
    audio.lastBlocked='stale earlier failure';audio.toggle();assert.equal(audio.muted,true);assert.equal(audio.music.paused,true);
  });
  await check('Pointer down/up/click share one pending prime and pause stops every prepared player',async()=>{
    const {audio}=fixture();await audio.playMusic('title');audio.gesture();await new Promise(setImmediate);
    const node=audio.musicNodes.get('cinema');audio.primed.delete(node);let calls=0,finish;
    node.play=()=>{calls++;node.paused=false;return new Promise(r=>{finish=r;});};
    audio.gesture();audio.gesture();audio.gesture();assert.equal(calls,1);
    audio.pause();assert([...audio.musicNodes.values()].every(n=>n.paused));
    finish();await new Promise(setImmediate);assert.equal(node.paused,true);assert.equal(audio.priming.size,0);
  });
  await check('A fresh explicit gesture replaces only a terminally failed music player',async()=>{
    const {audio}=fixture();await audio.playMusic('title');const failed=audio.music;
    failed.error={code:4};failed.pause();audio.lastBlocked='NotSupportedError';audio.gesture();await new Promise(setImmediate);
    assert.notEqual(audio.music,failed);assert.equal(audio.music.src,'blob:title.mp3');assert.equal(audio.music.paused,false);
    const recovered=audio.music;audio.music.readyState=0;audio.lastBlocked='still preparing';audio.toggle();assert.equal(audio.muted,false);audio.gesture();await new Promise(setImmediate);assert.equal(audio.music,recovered);
  });
  await check('Early unlock, delayed WAV arrival and failed decode recover all thirteen buffers without duplicate jobs',async()=>{
    let calls=0,starts=0,fail=true;class Context {
      constructor(){this.state='suspended';this.destination={};}
      createGain(){return {gain:{value:0},connect(){},disconnect(){}};}
      createDynamicsCompressor(){return {threshold:{},knee:{},ratio:{},connect(){}};}
      resume(){this.state='running';return Promise.resolve();}
      decodeAudioData(){calls++;if(fail){fail=false;return Promise.reject(new Error('temporary decoder interruption'));}return Promise.resolve({duration:1});}
      createBufferSource(){return {playbackRate:{},connect(){},disconnect(){},start(){starts++;},stop(){this.onended?.();}};}
    }
    const {audio,settings}=fixture({AudioContext:Context});await audio.unlock();await audio.ready;assert(!audio.loaded);assert.equal(audio.lastSfx.reason,'bytes-not-ready');
    for(const name of audio.cueNames)audio.bytes.set(name+'.wav',new ArrayBuffer(8));
    await audio.unlock();await audio.ready;assert.equal(Object.keys(audio.buffers).length,12);await audio.unlock();await audio.ready;assert(audio.loaded);assert.equal(calls,14);
    audio.gesture();audio.gesture();await audio.ready;assert.equal(calls,14);
    for(const name of audio.cueNames){audio.active.clear();assert(audio.sample(name));}assert.equal(starts,13);
    audio.ctx.state='interrupted';await audio.unlock();assert.equal(audio.ctx.state,'running');audio.active.clear();assert(audio.sample('hit'));
    settings.sfx=0;assert(!audio.sample('hit'));assert.equal(audio.lastSfx.reason,'effects-volume-zero');settings.sfx=.7;audio.muted=true;assert(!audio.sample('hit'));assert.equal(audio.lastSfx.reason,'muted');audio.muted=false;
    audio.pause();assert.equal(audio.active.size,0);assert(audio.sample('step1'));assert(!audio.sample('unknown'));assert.equal(audio.lastSfx.reason,'unknown-cue');
  });
  const report = { tests: results, passed: results.filter(x => x.passed).length, failed: results.filter(x => !x.passed).length, boundary: 'Actual AudioSystem class; synthetic native media/promise fixtures. Native browser validation remains required.' };
  fs.writeFileSync(path.join(__dirname, 'audio-lifecycle-results.json'), JSON.stringify(report, null, 2) + '\n');
  process.exitCode = report.failed ? 1 : 0;
})();
