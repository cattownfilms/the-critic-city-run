'use strict';
const assert=require('assert'),fs=require('fs'),B=require('../engine.js');
const results=[];
function test(name,fn){try{const details=fn();results.push({name,passed:true,details});console.log('PASS',name,JSON.stringify(details||{}));}catch(e){results.push({name,passed:false,error:String(e.stack)});console.error('FAIL',name,e);process.exitCode=1;}}
test('Pass 2 substitutions preserve wave sizes, roster majority and all original move definitions',()=>{
 const cp=require('child_process'),vm=require('vm'),context={};vm.createContext(context);vm.runInContext(cp.execFileSync('git',['show','d0d1051ee6abd88dc71c2462a6839084089a32ac:data/campaign.js'],{encoding:'utf8'}),context);
 const old=context.CriticCampaign;
 assert(old);assert.deepStrictEqual(B.STAGES.map(s=>s.waves.map(w=>w.length)),JSON.parse(JSON.stringify(old.STAGES.map(s=>s.waves.map(w=>w.length)))));
 for(const key of ['EINFO','BOSS_DEFINITIONS'])assert.deepStrictEqual(B[key],JSON.parse(JSON.stringify(old[key])));
 for(const s of B.STAGES){const w=s.waves.flat();assert(w.filter(k=>k.startsWith('sherm-')).length>w.length/2);}
 assert.equal(B.STAGES[5].waves[0][2],'striped');assert.equal(B.STAGES[6].waves[0][0],'raptor');
});
test('The complete seven-stage story is playable through combat inputs on Jay and Franklin routes',()=>{
 const reports=[];for(const character of ['hero','franklin']){const g=new B.Game();g.franklinUnlocked=character==='franklin';g.start(null,character);let ticks=0,retries=0;const seen=new Set(),bosses=new Set();
  for(;ticks<120*1500&&g.mode!=='complete';ticks++){
   if(g.mode==='confrontation')g.finishDukeConfrontation();if(g.mode==='gameover'){retries++;g.retry(true);}if(g.mode==='stageclear')g.finishStageClear();if(g.mode!=='play')continue;seen.add(g.stage);
   const p=g.p,targets=g.enemies.filter(e=>e.hp>0&&(e.kind!=='broadcast-rig'||e.targetable)).concat(g.props.filter(o=>['circuit','remote'].includes(o.kind)&&o.hp>0)).sort((a,b)=>Math.hypot(a.x-p.x,(a.y-p.y)*2)-Math.hypot(b.x-p.x,(b.y-p.y)*2));let input={};
   if(targets.length){const e=targets[0],dx=e.x-p.x,dy=e.y-p.y;if(e.boss)bosses.add(e.kind);input.mx=Math.abs(dx)>62?Math.sign(dx)*(Math.abs(dx)>150?1:.4):0;input.my=Math.abs(dy)>8?Math.sign(dy)*.55:0;input.attackPressed=Math.abs(dx)<122&&Math.abs(dy)<25&&ticks%12===0;input.attackHeld=Math.abs(dx)<116&&Math.abs(dy)<27;if(p.meter>=100&&targets.length>1&&!p.action)input.specialPressed=true;}else input.mx=1;
   g.step(1/120,input);g.drain();
  }
  assert.equal(g.mode,'complete');assert.equal(seen.size,7);assert(g.stats.kos>=71);assert(retries<5);assert(bosses.has('pizzeria-boss'));assert(bosses.has('spike'));assert(bosses.has('duke'));assert(bosses.has('broadcast-rig'));assert(!bosses.has(character==='franklin'?'franklin':'sherm-slam'));assert(g.storyFlags.martyRescued&&g.storyFlags.broadcastStopped);reports.push({character,seconds:g.t,retries,stages:seen.size,kos:g.stats.kos,bosses:[...bosses]});
 }return reports;
});
fs.writeFileSync('tests/pass2-results.json',JSON.stringify({tests:results},null,2));
