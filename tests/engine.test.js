'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');const B=require('../engine.js');const results=[];
function test(name,fn){try{const details=fn();results.push({name,passed:true,details});console.log('PASS',name);}catch(e){results.push({name,passed:false,error:String(e.stack)});console.error('FAIL',name,e.message);}}
function sandbox(){const g=new B.Game();g.start();g.nextGate=3;g.activeGate=-1;g.p.x=500;g.enemies=[];g.p.cosmetic=null;g.props=[];g.events=[];return g;}
function enemy(g,kind='bear',x=g.p.x+68,y=g.p.y,hp=999){const e={id:7,kind,name:kind,elite:false,x,y,z:0,face:-1,hp,maxHp:hp,speed:0,state:'seek',timer:0,cooldown:999,anim:'idle',animT:0,animDuration:0,hit:false,kb:0,side:1,variant:0,flashes:0};g.enemies.push(e);return e;}
function tick(g,n,inp={}){for(let i=0;i<n;i++)g.step(1/120,typeof inp==='function'?inp(i):inp);}
test('Movement accelerates continuously from partial to full analog deflection',()=>{let a=sandbox(),b=sandbox();tick(a,120,{mx:.25});tick(b,120,{mx:1});assert(b.p.x-500>(a.p.x-500)*3);assert(!a.p.run&&b.p.run);return {partial:a.p.x-500,full:b.p.x-500};});
test('Depth movement stays within the pavement lane',()=>{let g=sandbox();tick(g,1500,{my:1});assert.equal(g.p.y,B.YMAX);tick(g,1500,{my:-1});assert.equal(g.p.y,B.YMIN);});
test('Releasing the pad decelerates without drift',()=>{let g=sandbox();tick(g,80,{mx:1});tick(g,100,{});assert(Math.abs(g.p.vx)<.01);});
test('Jab > cross > kick > palm is an ordered, four-step held combo',()=>{let g=sandbox(),e=enemy(g);g.step(1/120,{attackPressed:true,attackHeld:true});const seen=[];for(let i=0;i<260;i++){let a=g.p.action?.name;if(a&&seen[seen.length-1]!==a)seen.push(a);g.step(1/120,{attackHeld:true});}assert.deepEqual(seen,['jab','cross','kick','palm']);assert(g.stats.hits>=3);return {moves:seen,hits:g.stats.hits,damage:999-e.hp};});
test('Repeated button edges advance the combo rather than restarting jab',()=>{let g=sandbox();enemy(g);let seen=new Set();tick(g,230,i=>{if(g.p.action)seen.add(g.p.action.name);return {attackPressed:i%12===0};});assert(seen.has('cross')&&seen.has('kick')&&seen.has('palm'));});
test('An attack damages a target only once per strike',()=>{let g=sandbox(),e=enemy(g);g.setAction('jab');tick(g,40);assert.equal(e.hp,989);assert.equal(g.stats.hits,1);});
test('Enemies in another depth lane cannot be hit by a normal punch',()=>{let g=sandbox(),e=enemy(g,'bear',568,326);g.setAction('jab');tick(g,40);assert.equal(e.hp,999);});
test('A normal strike does not hit behind the facing direction',()=>{let g=sandbox(),e=enemy(g,'bear',420);g.p.face=1;g.setAction('jab');tick(g,40);assert.equal(e.hp,999);});
test('A combo tap is retained during hitstop',()=>{let g=sandbox();enemy(g);g.setAction('jab');g.hitstop=.06;g.step(1/120,{attackPressed:true});assert(g.p.attackBuffer>0);tick(g,48);assert.equal(g.p.action?.name,'cross');});
test('Jump applies one physics arc and lands on its lane',()=>{let g=sandbox();const y=g.p.y;g.step(1/120,{jumpPressed:true});let maxZ=0;for(let i=0;i<150;i++){maxZ=Math.max(maxZ,g.p.z);g.step(1/120,{});}assert(maxZ>80&&maxZ<115);assert.equal(g.p.z,0);assert.equal(g.p.y,y);return {apex:maxZ};});
test('Airborne attack selects the supplied kick and hits a nearby target',()=>{let g=sandbox(),e=enemy(g,'bear',565);g.step(1/120,{jumpPressed:true});tick(g,15);g.step(1/120,{attackPressed:true});assert.equal(g.p.action.name,'air');tick(g,75);assert(e.hp<999);assert.equal(g.p.z,0);});
test('Standing far outside the target lane cannot jump-kick it',()=>{let g=sandbox(),e=enemy(g,'hippo',568,326);g.step(1/120,{jumpPressed:true});tick(g,12);g.step(1/120,{attackPressed:true});tick(g,110);assert.equal(e.hp,999);});
test('Guard blocks a frontal attack without health damage',()=>{let g=sandbox(),e=enemy(g);g.p.guard=true;g.p.guardAge=.5;const hp=g.p.hp;g.damagePlayer(e);assert.equal(g.p.hp,hp);assert(g.p.guardMeter<100);});
test('Guard does not block an attack from behind',()=>{let g=sandbox(),e=enemy(g,'sherm-punch',430);e.face=1;g.p.guard=true;g.p.guardAge=.5;g.damagePlayer(e);assert(g.p.hp<100);});
test('Precisely timed guard parries and arms the two-palm counter',()=>{let g=sandbox(),e=enemy(g);g.p.guard=true;g.p.guardAge=.1;g.damagePlayer(e);assert.equal(g.stats.parries,1);assert(g.p.counter>0);g.hitstop=0;g.p.guard=false;g.beginAttack(0);assert.equal(g.p.action.name,'counter1');tick(g,40);assert.equal(g.p.action.name,'counter2');});
test('Move plus guard slips and can cancel into a rising elbow',()=>{let g=sandbox();g.step(1/120,{mx:.8,guardPressed:true,guardHeld:true});assert.equal(g.p.action.name,'dodge');tick(g,20,{mx:.8});g.step(1/120,{attackPressed:true});assert.equal(g.p.action.name,'elbow');});
test('Full-deflection sprint attack uses charge entry then standing rush punch',()=>{let g=sandbox();tick(g,40,{mx:1});g.step(1/120,{mx:1,attackPressed:true});assert.equal(g.p.action.name,'charge');tick(g,24);assert.equal(g.p.action.name,'dash');});
test('Special cannot fire without a full meter',()=>{let g=sandbox();g.p.meter=99;assert.equal(g.special(),false);assert.equal(g.p.meter,99);});
test('Full review executes backfist, low chamber and rising-palm finisher',()=>{let g=sandbox();enemy(g);g.p.meter=100;g.special();let names=[];tick(g,190,()=>{const a=g.p.action?.name;if(a&&names[names.length-1]!==a)names.push(a);return {};});assert.deepEqual(names,['spin','specialWind','specialPalm']);return {moves:names};});
test('Cosmetic gestures cancel immediately on movement',()=>{let g=sandbox();g.cosmetic('head-scratch',2);g.step(1/120,{mx:.5});assert.equal(g.p.cosmetic,null);assert.equal(g.p.anim,'walk');});
test('Cosmetic gestures cannot delay an attack',()=>{let g=sandbox();g.cosmetic('sigh',2);g.step(1/120,{attackPressed:true});assert.equal(g.p.action.name,'jab');});
test('Enemy telegraphs precede active hits',()=>{let g=sandbox(),e=enemy(g,'hippo',570);e.cooldown=0;g.step(1/120,{});assert.equal(e.state,'windup');const hp=g.p.hp;tick(g,50);assert.equal(g.p.hp,hp);tick(g,80);assert(g.p.hp<hp);});
test('Damage grants a grace window against immediate stun-lock',()=>{let g=sandbox(),a=enemy(g),b=enemy(g,'sherm-punch',565);g.damagePlayer(a);const hp=g.p.hp;g.damagePlayer(b);assert.equal(g.p.hp,hp);});
test('Pause freezes physics and resume retains the scene',()=>{let g=sandbox();g.pause();const x=g.p.x,t=g.t;tick(g,120,{mx:1});assert.equal(g.p.x,x);assert.equal(g.t,t);g.resume();tick(g,100,{mx:1});assert(g.p.x>x);});
test('Breakable prop drops a health pickup',()=>{let g=sandbox();g.props=[{id:1,x:555,y:g.p.y,hp:10,kind:'bin'}];g.setAction('palm');tick(g,55);assert(g.props[0].hp<=0);assert(g.pickups.length===1);});
test('A nearby pickup restores health and disappears once',()=>{let g=sandbox();g.p.hp=40;g.pickups=[{x:g.p.x,y:g.p.y,kind:'coffee',age:0}];g.step(1/120,{});assert.equal(g.p.hp,58);assert.equal(g.pickups.length,0);});
test('Checkpoint snapshots restore stage and cleared encounter only',()=>{let g=new B.Game();g.start({version:2,stage:2,nextGate:1,score:321,lives:2,meter:80,maxCombo:7,time:100});assert.equal(g.stage,2);assert.equal(g.nextGate,1);assert.equal(g.p.hp,100);assert.equal(g.p.lives,2);assert.equal(g.score,321);assert(g.p.x>B.GATES[0]);});
test('Zero health causes life loss then checkpoint recovery, not a stuck corpse',()=>{let g=new B.Game();g.start();g.p.hp=0;tick(g,285);assert.equal(g.p.lives,2);assert.equal(g.p.hp,100);assert.equal(g.mode,'play');});
test('Last life reaches game-over and retry restores three lives',()=>{let g=new B.Game();g.start();g.p.lives=1;g.p.hp=0;tick(g,285);assert.equal(g.mode,'gameover');g.retry(true);assert.equal(g.mode,'play');assert.equal(g.p.lives,3);});
// Full run uses normal input through all gates. No position/health editing once started.
test('A normal-input driver clears the seven-stage campaign and reaches the resolved finale',()=>{const g=new B.Game();g.start();let tickN=0,visits=new Set(),retries=0;const anims=new Set();for(;tickN<120*1500&&g.mode!=='complete';tickN++){
 if(g.mode==='confrontation')g.finishDukeConfrontation();if(g.mode==='gameover'){retries++;g.retry(true);}
 if(g.mode==='stageclear')g.finishStageClear();
 if(g.mode!=='play')continue;visits.add(g.stage);anims.add(g.p.anim);
 const p=g.p,live=g.enemies.filter(e=>e.hp>0).concat(g.props.filter(o=>o.kind==='circuit'&&o.hp>0)).sort((a,b)=>Math.hypot(a.x-p.x,(a.y-p.y)*2)-Math.hypot(b.x-p.x,(b.y-p.y)*2));let input={};
 if(live.length){const e=live[0],dx=e.x-p.x,dy=e.y-p.y;input.mx=Math.abs(dx)>62?Math.sign(dx)*(Math.abs(dx)>150?1:.4):0;input.my=Math.abs(dy)>8?Math.sign(dy)*.55:0;
  input.attackPressed=Math.abs(dx)<122&&Math.abs(dy)<25&&tickN%12===0;input.attackHeld=Math.abs(dx)<116&&Math.abs(dy)<27;
  if(p.meter>=100&&live.length>1&&!p.action)input.specialPressed=true;
 }else input.mx=1;
 g.step(1/120,input);g.drain();
 }
 assert.equal(g.mode,'complete');assert.equal(visits.size,7);assert(g.stats.kos>=35);assert(retries<5);return {seconds:g.t,ticks:tickN,retries,stages:[...visits],kos:g.stats.kos,bestCombo:g.stats.maxCombo,animations:[...anims]};});
test('Jump-kick active contact retimes to the extended-foot source pose',()=>{const g=sandbox();g.p.z=80;g.setAction('air');g.p.action.t=B.HITS.air.hit;g.chooseAnimation(0,0);assert.equal(g.p.anim,'held-front-kick');const sourceFraction=g.p.animT/g.p.animDuration;assert(sourceFraction>.56&&sourceFraction<.60);return {sourceFraction};});
fs.writeFileSync(path.join(__dirname,'engine-results.json'),JSON.stringify({tests:results,passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length},null,2));if(results.some(r=>!r.passed))process.exitCode=1;
