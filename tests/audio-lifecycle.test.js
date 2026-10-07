// Exercise the actual AudioSystem class with deterministic native-media timing.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const source = fs.readFileSync(process.env.CRITIC_AUDIO_SOURCE || path.join(__dirname, '../app.js'), 'utf8');
const start = source.indexOf('class AudioSystem{');
const code = source.slice(start, source.indexOf('\nconst game=', start));
const results = [];
function fixture() {
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
  const ctx = { Audio, settings, conf: { music }, cachedURLs: new Map(Object.values(music).map(x => [x.file, 'blob:' + x.file])), src: n => 'blob:' + n, window: {}, stageMusic: () => 'broadway', toast() {}, performance: { now: () => 1000 } };
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
  const report = { tests: results, passed: results.filter(x => x.passed).length, failed: results.filter(x => !x.passed).length, boundary: 'Actual AudioSystem class; synthetic native media/promise fixtures. Native browser validation remains required.' };
  fs.writeFileSync(path.join(__dirname, 'audio-lifecycle-results.json'), JSON.stringify(report, null, 2) + '\n');
  process.exitCode = report.failed ? 1 : 0;
})();
