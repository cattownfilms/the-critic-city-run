// Explicit encounter fixtures for tests whose old setup assumed an unshielded core.
const assert=require('node:assert/strict');
function advanceDevice(g,condition,max=1500){const core=g.enemies.find(e=>e.kind==='broadcast-rig');for(let i=0;i<max&&!condition();i++){g.updateMachine(core,1/120);g.updateBroadcastSummons(1/120);}assert(condition(),'device phase deadline');}
function defeatMachine(g){const core=g.enemies.find(e=>e.kind==='broadcast-rig');for(let round=1;round<=3;round++){
 advanceDevice(g,()=>g.broadcastSummons.waveStarted&&g.broadcastSummons.phase==='shielded');assert.equal(g.broadcastSummons.wave,round);
 for(const e of g.enemies.filter(e=>e.broadcastSummon&&e.hp>0))g.registerHit(e,{damage:9999,kb:0});
 advanceDevice(g,()=>g.broadcastSummons.phase==='vulnerable');g.registerHit(core,{damage:9999,kb:0});
 }assert(g.machineDefeated);advanceDevice(g,()=>g.broadcastSummons.defeatTime>=4);assert(g.resolveBroadcast());return core;}
function clearProjection(g){for(let i=0;i<3;i++){g.activeGate=g.nextGate=i;g.disableCircuit(i);}}
module.exports={defeatMachine,clearProjection,advanceDevice};
