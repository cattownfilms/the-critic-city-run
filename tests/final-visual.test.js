'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),cp=require('child_process'),B=require('../engine.js');
const baseline='79c80a7dcfa22cbee446cbecb3e2d156baa78b2c',context={module:{exports:{}},require:require('module').createRequire(require('path').resolve('engine.js'))};vm.createContext(context);vm.runInContext(cp.execFileSync('git',['show',baseline+':engine.js'],{encoding:'utf8'}),context);const Old=context.module.exports;
assert.deepEqual(B.EINFO,Old.EINFO);assert.deepEqual(B.BOSS_DEFINITIONS,Old.BOSS_DEFINITIONS);
const clean=g=>JSON.parse(JSON.stringify(g.snapshot()));
for(const route of ['hero','franklin']){
 const games=[B,Old].map(api=>{const g=new api.Game();g.franklinUnlocked=true;g.start(null,route);g.stage=6;g.resetWorld();g.makePlayer();g.machineDefeated=true;g.dukeStaged={x:2450,y:407,face:-1};g.finishDukeConfrontation(false);g.drain();return g;});
 assert.equal(games[0].enemies[0].renderScale,1.35);assert.equal(games[1].enemies[0].renderScale,1.1);
 for(let i=0;i<2400;i++){for(const g of games){g.step(1/120,{mx:i%240<120?1:-1,attackPressed:i%24===0,guard:i%120<30});g.drain();}assert.deepEqual(clean(games[0]),clean(games[1]),'visual change altered simulation');}
 const save=games[1].snapshot(),g=new B.Game();g.start(save,route);assert.equal(g.snapshot().version,5);
}
const source=require('../assets/sprites.json').characters.duke,heights={};for(const [name,a] of Object.entries(source)){heights[name]=Math.max(...a.frames.map(f=>f.oy+f.h))-Math.min(...a.frames.map(f=>f.oy));}
assert.equal(heights.idle,186);assert.equal(B.DUKE_FOREGROUND_SCALE*heights.idle,251.10000000000002);
fs.writeFileSync('tests/final-visual-core-results.json',JSON.stringify({passed:true,baseline,scale:B.DUKE_FOREGROUND_SCALE,sourceHeights:heights,routes:2,simulationTicks:2400},null,2));console.log('PASS final Duke presentation, unchanged combat trace on both routes, schema 5 compatibility, source bounds');
