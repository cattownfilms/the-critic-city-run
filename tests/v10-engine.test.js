'use strict';
const assert=require('node:assert/strict'),B=require('../engine.js');
function setup(kind,id=1){const g=new B.Game();g.start();g.p.x=500;g.p.y=400;g.camera=0;g.activeGate=0;g.enemies=[];const k=B.EINFO[kind],e={id,kind,x:620,y:400,hp:k.hp,maxHp:k.hp,speed:k.speed,state:'seek',timer:0,animT:0,cooldown:0,kb:0,variant:0,flashes:0,signatureCooldown:0};g.enemies=[e];return {g,e};}
function step(g,e,n,inspect=()=>{}){for(let i=0;i<n;i++){const x=e.x;e.timer+=1/120;g.updateIdentity(e,1/120);inspect(x);}}
{
 const {g,e}=setup('raptor');let states=new Set(),speed=0;
 step(g,e,650,x=>{states.add(e.state);speed=Math.max(speed,Math.abs(e.x-x)*120);assert(Math.abs(e.x-x)<=510/120+.001);});
 for(const s of ['raptor-flank','raptor-tell','raptor-charge','raptor-recover','seek'])assert(states.has(s),s);
 assert(speed>500);assert(e.signatureCooldown>0);assert(e.x<g.p.x-120,'committed charge overshoots rather than homing');
 const other={...e,id:2,state:'seek',signatureCooldown:0};g.enemies.push(other);e.state='raptor-tell';assert.equal(g.updateIdentity(other,.01),false);
 console.log('PASS Raptor physical flank, telegraph, charge, overshoot, recovery and stagger');
}
{
 const {g,e}=setup('striped');let states=new Set();
 step(g,e,430,()=>{states.add(e.state);if(e.state==='fred-vanish'){assert(e.hidden);assert.equal(e.targetable,false);}if(e.state==='fred-reappear'){assert(!e.hidden);assert(e.targetable);assert(Math.abs(e.x-g.p.x)>=130);}});
 for(const s of ['fred-tell','fred-vanish','fred-reappear','fred-claw','fred-recover','seek'])assert(states.has(s),s);
 assert(e.signatureCooldown>0);assert.equal(e.hidden,false);console.log('PASS Fred tell, invulnerable absence, safe reappearance, claw, recovery and cooldown');
}
function arena(stage){const g=new B.Game();g.start();g.stage=stage;g.activeGate=g.nextGate=2;g.camera=1820;g.p.x=2200;g.p.y=407;g.enemies=[];g.props=[];g.events=[];return g;}
{
 const g=arena(4);g.configureProjection();
 for(let phase=0;phase<3;phase++){
  let count=0,eyes=0,remote;
  for(let i=0;i<10000&&!remote;i++){
   g.updateProjection(1/120);if(g.projection.phase==='shadow')eyes+=1/120;
   for(const ev of g.drain())if(ev.type==='projectile'&&ev.kind==='reel')count++;
   remote=g.props.find(o=>o.hp>0&&o.kind==='remote');
  }
  assert.equal(count,3+phase);assert(eyes>=1);assert(remote);assert(remote.flight);assert.equal(remote.x,g.projection.booths[g.projection.window].x+g.projection.face*26);
  const x=remote.x;g.updateProps(.4);assert.notEqual(remote.x,x);assert(remote.z>0);
  for(let i=0;i<180;i++)g.updateProps(1/120);assert.equal(remote.z,0);
  assert(g.enemies.length<=3);assert.equal(g.props.filter(o=>o.hp>0).length,1);g.disableCircuit(remote.circuitId);
 }
 assert(g.projection.disabled);console.log('PASS Projectionist eyes, 3/4/5 reels, bounded supports, visible radio trajectory, landing and three circuits');
}
{
 const g=arena(6);g.spawnBoss();const core=g.enemies[0];
 for(let round=1;round<=3;round++){
  for(let i=0;i<800&&(!g.broadcastSummons.waveStarted||g.broadcastSummons.phase!=='shielded');i++){
   const x=core.x;g.updateMachine(core,1/120);g.updateBroadcastSummons(1/120);assert(Math.abs(core.x-x)<=170/120+.001);
  }
  assert.equal(g.broadcastSummons.wave,round);assert.equal(g.broadcastSummons.phase,'shielded');assert.equal(g.registerHit(core,{damage:30,kb:0}),false);
  const live=g.enemies.filter(e=>e.broadcastSummon&&e.hp>0);assert.equal(live.length,round+1);
  // Charge follows until lock, then cannot snap onto a dodging player.
  core.timer=10;g.updateMachine(core,.01);assert(core.telegraph);g.updateMachine(core,.85);const lane=core.telegraph.y;g.p.y=lane===407?355:407;g.updateMachine(core,.51);assert(core.telegraph.firing);assert.equal(core.telegraph.y,lane);assert.equal(g.p.hp,100);
  for(const e of live)g.registerHit(e,{damage:999,kb:0});g.updateBroadcastSummons(.01);assert.equal(g.broadcastSummons.phase,'crashing');assert(core.z>0);
  for(let i=0;i<150;i++){g.updateMachine(core,1/120);g.updateBroadcastSummons(1/120);}
  assert.equal(g.broadcastSummons.phase,'vulnerable');assert.equal(core.z,0);assert(core.targetable);g.registerHit(core,{damage:999,kb:0});
 }
 assert(g.machineDefeated);assert(!g.resolveBroadcast());for(let i=0;i<481;i++)g.updateMachine(core,1/120);assert(g.resolveBroadcast());assert.equal(g.mode,'confrontation');console.log('PASS Broadcast physical side travel, shield, locked laser, actual wave kills, crash, three rounds and four-second defeat gate');
}
{
 const g=arena(6);g.machineDefeated=true;g.finishDukeConfrontation(false);const e=g.enemies[0];e.entry=null;e.state='seek';e.x=2400;e.y=407;let pools=[];
 for(const ratio of [1,.6,.3]){e.hp=e.maxHp*ratio;const names=new Set();let repeats=0,last;
  for(let i=0;i<600;i++){g.p.x=e.x-(i%2?180:70);const m=g.chooseBossMove(e,B.BOSS_DEFINITIONS.duke.moves);names.add(m.name);if(last===m.name)repeats++;last=m.name;assert(m.wind>=.6);assert((m.recovery||B.BOSS_DEFINITIONS.duke.recovery)>=.7);}
  assert(repeats<150);pools.push(names.size);
 }
 assert.deepEqual(pools,[3,6,7]);e.move=B.BOSS_DEFINITIONS.duke.moves.find(m=>m.retreat);e.state='attack';e.timer=0;e.hitIndex=0;e.face=-1;const x=e.x;g.updateBoss(e,.2);assert(e.x>x);g.updateBoss(e,.25);assert(e.x<x+30);console.log('PASS Duke phase pools 3/6/7, repetition suppression, physical retreat/re-engage and readable openings');
}
