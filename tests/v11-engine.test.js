'use strict';
const assert=require('node:assert/strict'),B=require('../engine.js'),C=require('../data/cutscenes.js');
function arena(stage,kind='hero'){const g=new B.Game();g.franklinUnlocked=true;g.start(null,kind);g.stage=stage;g.activeGate=g.nextGate=2;g.camera=1820;g.p.x=2200;g.p.y=407;g.enemies=[];g.props=[];g.events=[];return g;}
for(const kind of ['hero','franklin']){
 const g=arena(5,kind);g.spawnBoss();const e=g.enemies.find(e=>e.kind==='spike');e.entry=null;e.hidden=false;e.x=2600;e.y=407;g.startSpikeTutorial();const t=g.spikeTutorial;let under=false,flight=false,bounce=false;
 for(let i=0;i<1200&&!t.complete;i++){const before=g.p.hp;g.updateSpikeTutorial(1/120);assert.equal(g.p.hp,before);if(t.can){flight||=t.can.phase==='flight';bounce||=t.can.bounces===1;if(Math.abs(t.can.x-g.p.x)<38){assert(g.p.z>58,'real jump must clear actual hit height');under=true;}}}
 assert(t.complete&&t.jumped&&flight&&bounce&&under);assert(t.can.done);assert.equal(g.p.z,0);assert.equal(g.playerKind,kind);g.finishSpikeTutorial();assert.equal(g.spikeTutorial,null);assert(!g.projectiles.some(q=>q.tutorial));
 g.p.inv=0;g.launchProjectile('trash-can',g.p.x-190,270,g.p.x,g.p.y,19,38,.9);for(let i=0;i<120;i++)g.updateProjectiles(1/120);assert.equal(g.p.hp,81);assert.equal(g.p.action.name,'knockdown');
 for(const delay of [0,.5,1.2,2]){const h=arena(5,kind);h.spawnBoss();h.enemies[0].entry=null;h.enemies[0].x=2600;h.startSpikeTutorial();for(let n=0;n<delay*120;n++)h.updateSpikeTutorial(1/120);h.finishSpikeTutorial();assert.equal(h.p.hp,100);assert.equal(h.p.z,0);assert.equal(h.p.action,null);assert(!h.projectiles.some(q=>q.tutorial));}
 console.log('PASS '+kind+' real release, bounce, airborne underpass, exit, landing, skip and dangerous later can');
}
for(const stage of [4,5]){const g=arena(stage);g.projection.disabled=true;g.spawnBoss();const e=g.enemies[0];e.entry=null;g.drain();g.registerHit(e,{damage:9999,kb:0});const hp=g.p.hp;g.launchProjectile('trash-can',g.p.x-190,270,g.p.x,g.p.y,19,38,.9);for(let n=0;n<100;n++)g.updateProjectiles(1/120);assert.equal(g.p.hp,hp,'settled defeat must not expose a locked player to leftover hazards');assert(!g.drain().some(e=>e.type==='story'));g.advanceStage();assert.equal(g.mode,'play');for(let i=0;i<200;i++)g.step(1/120);assert(!g.drain().some(e=>e.type==='story'&&e.id.endsWith('defeat')));for(let i=0;i<100;i++)g.step(1/120);const events=g.drain().filter(e=>e.type==='story'&&e.id.endsWith('defeat'));assert.equal(events.length,1);console.log('PASS settled boss fall precedes one punchline stage '+stage);}
{
 const g=arena(4);g.activeGate=g.nextGate=0;g.camera=200;g.configureProjection();assert.equal(g.projection.active,true);assert.equal(g.projection.booths.length,3);assert.equal(g.projection.windowY,92);
 for(let phase=0;phase<3;phase++){g.activeGate=phase;g.camera=[200,1065,1660][phase];g.configureProjection();let widths=[];for(let i=0;i<6000&&g.projection.phase!=='remote';i++){g.updateProjection(1/120);widths.push(...g.drain().filter(e=>e.type==='projectionVolley').map(e=>e.width));}assert.deepEqual(widths,[1+2*phase,1+2*phase,1+2*phase]);assert.equal(g.projection.window,phase);assert.equal(g.props.filter(o=>o.hp>0&&o.kind==='remote').length,1);g.disableCircuit(phase);if(phase<2){assert.equal(g.activeGate,-1);assert.equal(g.nextGate,phase+1);assert(!g.projection.active);}}
 console.log('PASS screen-area trigger and left/center/right 1/3/5 spread volleys');
}
assert(C.scenes.ending.shots.every(s=>s.reunionLayers));assert(C.scenes['boss-spike-intro'].shots.at(-1).spikeTutorial);
assert.equal(B.RUN_ATTACKS.franklin.dur,.56);assert.equal(B.RUN_ATTACKS.hero.dur,.43);assert.equal(B.RUN_ATTACKS.franklin.sourceImpact,11/26);
const lines=Object.values(C.scenes).flatMap(s=>s.shots.map(q=>q.routeDialogue?.hero?.dialogue||q.dialogue||''));assert.equal(lines.filter(s=>s.includes('credits')).length,1);
console.log('PASS retained cartwheel source contact, selective retiming, tutorial staging, reunion layer metadata and unique credits joke');
