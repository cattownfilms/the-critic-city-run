const assert=require('node:assert/strict'),B=require('../engine'),C=require('../data/cutscenes'),M=require('../assets/sprites.json');
for(const width of [760,1199]){
 const g=new B.Game();g.start();g.stage=4;g.viewWidth=width;g.camera=0;g.p.x=241;g.spawnFight(0);g.p.x=0;g.step(1/60);
 assert(g.p.x>=240);assert(g.camera>0&&g.camera<25);assert.equal(g.cameraTrace.target,g.encounterCamera().x);
 const camera=g.camera;g.disableCircuit(0);assert.equal(g.camera,camera);
 console.log('PASS immediate player lock and continuous camera activation/release',width);
}
const spike=C.scenes['boss-spike-intro'],marks=spike.shots.findIndex(s=>s.id==='tutorial-marks'),held=spike.shots.findIndex(s=>s.actors?.some(a=>a.animation==='overhead-ready'));
assert(marks<held);assert(spike.shots[marks].awaitMarks&&spike.shots[marks].awaitCamera);assert(spike.shots[held+1].spikeTutorial);
const anim=M.characters.spike['overhead-release'];assert.equal(anim.releaseEvent.atMs,167);assert.equal(anim.frames[2].sourceFrame,54);assert.equal(anim.frames[2].w,140);
for(const who of ['hero','franklin']){
 const g=new B.Game();g.franklinUnlocked=true;g.start(null,who);g.stage=5;g.activeGate=2;g.p.x=2200;g.camera=1820;g.spawnBoss();const e=g.enemies[0];e.entry=null;e.x=2600;e.y=407;g.startSpikeTutorial();g.updateSpikeTutorial(.16);assert.equal(g.projectiles.length,0);g.updateSpikeTutorial(.007);const q=g.spikeTutorial.can;assert(q);assert(Math.abs(q.sourceY-39*q.renderScale-(e.y-124*q.renderScale))<.001);assert.equal(e.anim,'overhead-release');
 for(let n=0;n<1000&&!g.spikeTutorial.complete;n++)g.updateSpikeTutorial(1/120);
 assert(g.spikeTutorial.complete);assert.equal(g.projectileId,1);assert.equal(g.p.hp,100);g.finishSpikeTutorial();g.updateSpikeTutorial(1);assert(!g.projectiles.some(q=>q.tutorial));console.log('PASS one overhead release and complete/skip cleanup',who);
}
for(const who of ['hero','franklin']){
 const s=C.resolveScene(C.scenes.ending,who);assert.equal(s.shots.at(-2).id,'skyline-collapse');assert.equal(s.shots.at(-1).caption,'Jay and Marty Sherman perished on September 11, 2001.\n\nNever forget.\n\nTHE END.');assert(!s.shots.at(-1).auto);assert.equal(s.shots.at(-3).dialogue,'Oh my god, is that a plane?!? Hatchi Matchi!');assert(s.shots.slice(0,5).every(s=>s.reunionLayers));
}
console.log('PASS preserved reunion/realization, collapse before one manual definitive card');
