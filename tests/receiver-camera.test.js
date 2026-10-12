'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),cp=require('node:child_process'),{createRequire}=require('node:module'),B=require('../engine');
const ctx={module:{exports:{}},require:createRequire(require.resolve('../engine'))};vm.createContext(ctx);vm.runInContext(cp.execFileSync('git',['show','9d51a5a:engine.js'],{encoding:'utf8'}),ctx);const Old=ctx.module.exports;
const json=x=>JSON.parse(JSON.stringify(x));
function fixture(Type,route,width){const g=new Type.Game();g.franklinUnlocked=true;g.start(null,route);g.stage=6;g.resetWorld();g.viewWidth=width;g.activeGate=g.nextGate=2;g.p.x=2250;g.p.y=407;g.spawnBoss();g.mode='play';g.camera=Math.max(0,2850-width);g.drain();return g;}
for(const route of ['hero','franklin'])for(const width of [760,915/412*540,1440]){
 const g=fixture(B,route,width),old=fixture(Old,route,width),phases=new Set();let complete=false,maxDelta=0;
 for(let ticks=0;ticks<120*360;ticks++){
  const p=g.p,targets=g.enemies.filter(e=>e.hp>0&&(e.kind!=='broadcast-rig'||e.targetable)).sort((a,b)=>Math.hypot(a.x-p.x,(a.y-p.y)*2)-Math.hypot(b.x-p.x,(b.y-p.y)*2));let input={};
  if(targets.length){const e=targets[0],dx=e.x-p.x,dy=e.y-p.y;input={mx:Math.abs(dx)>62?Math.sign(dx)*(Math.abs(dx)>150?1:.4):0,my:Math.abs(dy)>8?Math.sign(dy)*.55:0,attackPressed:Math.abs(dx)<122&&Math.abs(dy)<25&&ticks%12===0,attackHeld:Math.abs(dx)<116&&Math.abs(dy)<27};if(p.meter>=100&&targets.length>1&&!p.action)input.specialPressed=true;}
  else input.mx=1;
  // Existing screen-relative entrance marks legitimately depend on the displayed camera.
  old.camera=g.camera;const before=g.camera;g.step(1/120,input);old.step(1/120,input);g.drain();old.drain();maxDelta=Math.max(maxDelta,Math.abs(g.camera-before));
  assert.deepEqual(json(g.p),json(old.p),'camera must not affect player');assert.deepEqual(json(g.enemies),json(old.enemies),'combat must remain identical');assert.deepEqual(json(g.broadcastSummons),json(old.broadcastSummons));
  phases.add(g.broadcastSummons.phase);
  if(g.mode==='confrontation'){complete=true;assert.equal(g.receiverCamera(),null);break;}
  assert.notEqual(g.mode,'gameover');
 }
 assert(complete,'real Receiver combat completes');assert(phases.has('relocating')&&phases.has('vulnerable'));assert(maxDelta<35);
 console.log('PASS real combat unchanged through destruction/handoff',route,width,[...phases],maxDelta);
 // Both directions, actual current position, safe player edge and resting exposure.
 for(const x of [2010,2330,2650])for(const px of [1800,2200,2700]){
  const f=fixture(B,route,width),core=f.enemies[0];core.x=x;f.p.x=px;const aim=f.receiverCamera();assert(px-aim>=89&&px-aim<=width-89);if(Math.max(x+82,px+40)-Math.min(x-82,px-40)<=width-100)assert(x-82-aim>=0&&x+82-aim<=width);
 }
 const f=fixture(B,route,width);for(const mode of ['pause','cutscene','confrontation']){f.mode=mode;assert.equal(f.receiverCamera(),null);}f.mode='play';f.broadcastSummons.active=false;assert.equal(f.receiverCamera(),null);
 for(const stage of [3,4,6]){const a=fixture(B,route,width),b=fixture(Old,route,width);for(const h of [a,b]){h.stage=stage;h.machineDefeated=true;h.enemies=[];h.broadcastSummons.active=false;if(stage===6)h.finishDukeConfrontation(false);h.p.inv=100;}for(let n=0;n<120;n++){a.step(1/120,{mx:.3});b.step(1/120,{mx:.3});assert.equal(a.camera,b.camera);assert.deepEqual(json(a.p),json(b.p));}}
}
console.log('PASS Receiver bounds/ownership; unchanged Theater, Palace and physical Duke camera traces');
