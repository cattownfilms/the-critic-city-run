'use strict';
const assert=require('node:assert/strict'),cp=require('node:child_process'),vm=require('node:vm'),{createRequire}=require('node:module');
const B=require('../engine'),D=require('../data/cutscenes');
function old(file){const c={module:{exports:{}},require:createRequire(require.resolve('../engine'))};vm.createContext(c);vm.runInContext(cp.execFileSync('git',['show','a9b45d4:'+file],{encoding:'utf8'}),c);return c.module.exports;}
const before=old('data/cutscenes.js'),Old=old('engine.js'),json=x=>JSON.parse(JSON.stringify(x));
const opening=json(D.scenes.opening),oldOpening=json(before.scenes.opening);
for(const [i,shot] of opening.shots.entries())for(const [j,e] of (shot.emissions||[]).entries()){const old=oldOpening.shots[i].emissions[j];e.toX=old.toX;e.toY=old.toY;e.approach.toX=old.approach.toX;}
assert.deepEqual(opening,oldOpening); // The separate opening test checks mob blocking.
for(let n=1;n<=7;n++)assert.equal(D.scenes[`stage-0${n}-intro`].shots[0].actors.find(a=>a.character==='duke').scale,1.35);
for(const id of ['boss-cinema-intro','stage4-clear','stage-04-intro']){const a=json(D.scenes[id]),b=json(before.scenes[id]);if(id==='stage-04-intro')a.shots[0].actors.find(a=>a.character==='duke').scale=1;assert.deepEqual(a,b);}
const shot=D.scenes['boss-projection-defeat'].shots[0];assert(shot.awaitMarks&&shot.awaitCamera&&shot.projectionStaging);assert.deepEqual(json(D.scenes['boss-projection-defeat'].shots[1]),json(before.scenes['boss-projection-defeat'].shots[1]));
console.log('PASS approved opening, dialogue, Rabbi entrance and Theater staging preserved; seven stage carts at 1.35');
for(const route of ['hero','franklin'])for(const width of [760,1200]){
 const g=new B.Game();g.start(null,route);g.stage=4;g.resetWorld();g.viewWidth=width;g.mode='play';g.p.inv=100;
 for(let gate=0;gate<3;gate++){
  g.activeGate=gate;g.configureProjection();g.camera=g.encounterCamera().x;g.p.x=g.camera+width*.65;g.enemies=[];
  const locked=g.camera;for(let i=0;i<20;i++){g.p.face=i%2?1:-1;g.step(1/120,{});assert.equal(g.camera,locked);}
  g.disableCircuit(gate);assert(!g.projection.active);assert(!g.projectiles.some(q=>q.kind==='reel'));
  if(gate<2){let last=g.camera;for(let i=0;i<240&&g.activeGate<0;i++){g.p.face=i%2?1:-1;g.step(1/120,{mx:1});assert(g.camera>=last-1e-8,'Palace camera reversed after booth');assert(Math.abs(g.camera-last)<12,'Palace camera snapped');last=g.camera;}}
  else {assert(g.projection.disabled);assert.equal(g.encounterCamera().x,locked);const save=g.snapshot(),resumed=new B.Game();resumed.start(save);assert(resumed.projection.disabled);assert(resumed.projection.circuits.every(c=>!c.active));resumed.retry(false);assert(resumed.projection.disabled);assert(!resumed.projectiles.some(q=>q.kind==='reel'));assert.deepEqual(Object.keys(save),Object.keys(new Old.Game().snapshot()));}
 }
}
console.log('PASS both routes: three fixed booths, smooth forward handoffs, final attack shutdown, checkpoint and retry');
for(const route of ['hero','franklin']){
 const a=new B.Game(),b=new Old.Game();for(const g of [a,b]){g.start(null,route);g.stage=3;g.resetWorld();g.viewWidth=960;g.p.x=200;g.mode='play';g.p.inv=100;}
 for(let i=0;i<300;i++){const input={mx:i<160?1:-1};a.step(1/120,input);b.step(1/120,input);assert.equal(a.camera,b.camera);assert.deepEqual(json(a.p),json(b.p));}
}
console.log('PASS Theater District camera/player trace identical to previous HEAD on both routes');
