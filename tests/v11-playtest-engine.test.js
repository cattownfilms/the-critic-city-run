'use strict';
const assert=require('node:assert/strict'),B=require('../engine.js');
function cinema(){const g=new B.Game();g.start();g.stage=4;g.events=[];g.enemies=[];g.props=[];g.viewWidth=960;return g;}
{
 const g=cinema();for(let phase=0;phase<3;phase++){
  g.p.x=[520,1380,2280][phase];g.camera=[200,1065,1900][phase];g.spawnFight(phase);assert.equal(g.projection.window,phase);assert.equal(g.projection.booths[phase].x,[640,1500,2450][phase]);
  g.p.x=0;g.step(.01);assert(g.p.x>=[240,1100,2000][phase]);assert(g.camera>=[205,1065,1900][phase]);
  g.p.x=9999;for(let i=0;i<240;i++)g.step(1/120,{mx:1});assert(g.projection.booths[phase].x-g.camera>=149.99,'active booth stays visible at forward boundary');
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
{
 const g=new B.Game();g.start();g.stage=5;g.activeGate=2;g.p.x=2200;g.spawnBoss();const e=g.enemies[0];e.x=2600;e.y=407;e.face=-1;const m=B.Campaign?.BOSS_DEFINITIONS?.spike?.moves?.find(m=>m.area==='trash-can')||require('../data/campaign.js').BOSS_DEFINITIONS.spike.moves.find(m=>m.area==='trash-can');const q=g.releaseTrashCan(e,m);assert(Math.abs(q.y-q.z-39*q.renderScale-(e.y-48.77622377622378*q.renderScale))<.001);assert(q.x<e.x);g.updateProjectiles(.1);assert(q.x<q.sourceX);console.log('PASS released can center matches held pose and moves toward player');
}
for(const route of ['hero','franklin']){
 const g=new B.Game();g.franklinUnlocked=true;g.start(null,route);g.stage=6;g.activeGate=g.nextGate=2;g.p.x=2480;g.p.y=407;g.camera=1900;g.spawnBoss();const core=g.enemies[0];g.broadcastSummons.wave=3;g.broadcastSummons.phase='vulnerable';core.targetable=true;g.registerHit(core,{damage:99999,kb:0});g.drain();let last=g.p.x,running=false;
 for(let i=0;i<500&&g.mode==='play';i++){g.step(1/120);assert(g.p.x<=last+.001);assert(last-g.p.x<=260/120+.001);running||=g.p.anim==='run';last=g.p.x;}
 assert(running);assert.equal(g.mode,'confrontation');assert.equal(g.p.hp,100);assert.equal(g.drain().filter(e=>e.type==='story'&&e.id==='boss-broadcast-defeat').length,1);g.dukeStaged={x:2450,y:407,face:-1};g.finishDukeConfrontation();assert.equal(g.enemies[0].x,2450);assert.equal(g.enemies[0].y,407);assert(!g.storyFlags.martyRescued);assert.equal(g.snapshot().version,5);
 console.log('PASS '+route+' physical leftward run during destruction, one Duke handoff, captive Marty, schema 5');
}

{const g=cinema();g.activeGate=g.nextGate=0;g.camera=205;g.p.x=520;g.p.inv=999;g.configureProjection();for(let i=0;i<6000&&g.projection.phase!=='remote';i++){g.step(1/120,{mx:1});g.drain();}assert.equal(g.projection.phase,'remote');const remote=g.props.find(o=>o.kind==='remote'&&o.hp>0);assert(remote.flight.tx<=955);console.log('PASS holding forward cannot hide booth or place radio outside reachable arena');}
