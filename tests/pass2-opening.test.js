'use strict';
const assert=require('node:assert/strict'),cp=require('node:child_process'),vm=require('node:vm');
const current=JSON.parse(JSON.stringify(require('../data/cutscenes').scenes));
const context={};vm.createContext(context);vm.runInContext(cp.execFileSync('git',['show','2ec326005281cd062622e4cdc4e26d8c66088b74:data/cutscenes.js'],{encoding:'utf8'}),context);
const baseline=JSON.parse(JSON.stringify(context.CriticCutscenes.scenes));
let count=0;const animations=new Set();
for(const [i,shot] of current.opening.shots.entries())for(const [j,a] of (shot.actors||[]).entries())if(a.character==='duke'){
 assert.equal(a.scale,1.35);assert.equal(a.y,318);animations.add(a.animation);count++;
 a.scale=baseline.opening.shots[i].actors[j].scale;
}
assert.equal(count,10);for(const name of ['walk','idle','v10-button'])assert(animations.has(name));
assert.deepEqual(current,baseline);
console.log('PASS all 10 opening Duke appearances share scale 1.35; foot positions, animations, timing, dialogue, camera, props and every later scene unchanged');
