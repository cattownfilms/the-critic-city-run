// Explicit encounter fixtures for tests whose old setup assumed an unshielded core.
const assert=require('node:assert/strict');
function defeatMachine(g){const core=g.enemies.find(e=>e.kind==='broadcast-rig');for(let round=1;round<=3;round++){if(!g.broadcastSummons.waveStarted)g.updateBroadcastSummons(.01);assert.equal(g.broadcastSummons.wave,round);for(const e of g.enemies.filter(e=>e.broadcastSummon&&e.hp>0))g.registerHit(e,{damage:9999,kb:0});g.updateBroadcastSummons(.01);assert.equal(g.broadcastSummons.phase,'vulnerable');g.registerHit(core,{damage:9999,kb:0});}assert(g.machineDefeated);}
function clearProjection(g){for(let i=0;i<3;i++)g.disableCircuit(i);}
module.exports={defeatMachine,clearProjection};
