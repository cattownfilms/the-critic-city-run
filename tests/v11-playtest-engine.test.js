'use strict';
const assert=require('node:assert/strict'),B=require('../engine.js');
function cinema(){const g=new B.Game();g.start();g.stage=4;g.events=[];g.enemies=[];g.props=[];g.viewWidth=960;return g;}
{
 const g=cinema();for(let phase=0;phase<3;phase++){
  g.p.x=[520,1380,2280][phase];g.camera=[200,1065,1900][phase];g.spawnFight(phase);assert.equal(g.projection.window,phase);assert.equal(g.projection.booths[phase].x,[640,1500,2450][phase]);
  g.p.x=0;g.step(.01);assert(g.p.x>=[240,1100,2000][phase]);assert(g.camera>=[205,1065,1900][phase]);
  const score=g.score,support=g.enemies.find(e=>e.projectionSupport);assert(support);
  g.disableCircuit(phase);assert.equal(g.score,score);assert.equal(g.disableCircuit(phase),false);
  if(phase<2){assert.equal(g.activeGate,-1);assert(!g.projection.active);assert.equal(g.nextGate,phase+1);const save=g.snapshot(),h=new B.Game();h.start(save);assert.equal(h.nextGate,phase+1);assert.equal(h.projection.circuits[phase].active,false);}
  else{assert(g.projection.disabled);assert(g.enemies.every(e=>!e.projectionSupport||e.hp===0&&e.anim==='death'&&!e.hidden));assert.equal(g.drain().filter(e=>e.type==='projectionDisabled').length,1);}
 }
 console.log('PASS spatial booths, local lock, release, checkpoint and one visible support shutdown without rewards');
}
for(const x of [520,640,780])for(const y of [350,407,465]){
 const g=cinema();g.activeGate=0;g.camera=200;g.p.x=x;g.p.y=y;g.configureProjection();const a=g.projection;a.visible=true;a.phase='reveal';a.timer=99;g.updateProjection(.01);const target={...a.telegraph};g.p.x+=100;g.p.y=465;g.updateProjection(2);const q=g.projectiles[0];assert(q);assert.equal(q.targetX,target.x);assert.equal(q.targetY,target.y);assert.equal(Math.abs(q.sourceX-640),26);assert.equal(q.y,315);g.updateProjectiles(q.duration/2);assert(q.y>315&&q.y<target.y);g.updateProjectiles(3);assert(q.done);assert.equal(q.bounces,3);
}
console.log('PASS booth-origin frozen target, depth flight and three bounces across nine player positions');
{
 const g=cinema();g.activeGate=2;g.projection.disabled=true;g.p.x=2250;g.spawnBoss();const e=g.enemies.find(e=>e.kind==='pizzeria-boss');let last=e.x;for(let i=0;i<300&&e.entry;i++){g.updateEntry(e,1/120);assert(Math.abs(e.x-last)<10);last=e.x;if(!e.hidden)assert.equal(e.face,-1);}assert(!e.entry);assert.equal(g.enemies.filter(e=>e.kind==='pizzeria-boss').length,1);assert.equal(e.y,409);
 console.log('PASS single continuous screen emergence faces player and settles');
}
