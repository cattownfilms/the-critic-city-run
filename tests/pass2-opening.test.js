'use strict';
const assert=require('node:assert/strict'),cp=require('node:child_process'),vm=require('node:vm'),fs=require('node:fs');
const data=require('../data/cutscenes'),current=JSON.parse(JSON.stringify(data.scenes));
const context={};vm.createContext(context);vm.runInContext(cp.execFileSync('git',['show','24a6d1c:data/cutscenes.js'],{encoding:'utf8'}),context);
const baseline=JSON.parse(JSON.stringify(context.CriticCutscenes.scenes));
let dukes=0,changed=0;
for(const [i,shot] of current.opening.shots.entries()){
 for(const a of shot.actors||[])if(a.character==='duke'){assert.equal(a.scale,1.35);assert.equal(a.y,318);dukes++;}
 if(!shot.emissions)continue;
 assert(['screen-emergence','hatchi-matchi','window-launch'].includes(shot.id));
 assert.equal(shot.emissions.length,7);
 for(const [j,e] of shot.emissions.entries()){
  const old=baseline.opening.shots[i].emissions[j];assert.equal(e.scale,old.scale);
  // Only the opening floor/approach marks may change; approved sizes are locked.
  e.scale=old.scale;e.toX=old.toX;e.toY=old.toY;e.approach.toX=old.approach.toX;
 }
 changed++;
}
assert.equal(dukes,10);assert.equal(changed,3);assert.deepEqual(current,baseline);
// Exercise the real emission renderer across shot boundaries and the full exit.
vm.runInContext(fs.readFileSync(require.resolve('../cutscenes.js'),'utf8'),context);
const s=Object.create(context.CriticScenePlayer.prototype),draws=[];
Object.assign(s,{scene:data.scenes.opening,emissionTimelines:new Map([['opening-attractions',0]]),_sprite(c,r,who,anim,x,y,face,age,scale){draws.push({who,x,y,scale});}});
const canvas={save(){},restore(){},beginPath(){},rect(){},clip(){},fillRect(){}};
function frame(id,time,total){s.shot=s.scene.shots.find(x=>x.id===id);s.time=time;s.totalTime=total;s.actorStates=[];draws.length=0;s._emissions(canvas,s.shot.emissions,null);return draws.map(x=>({...x}));}
const a=frame('screen-emergence',4.1,4.1),b=frame('hatchi-matchi',0,4.1);assert.deepEqual(a,b);
const c=frame('hatchi-matchi',1,5.1),d=frame('window-launch',0,5.1);assert.deepEqual(c,d);
const meta=require('../assets/sprites.json');
for(const total of [3.32,4.1,5.1,6,6.9]){
 const exit=total>5.1,cast=frame(exit?'window-launch':'hatchi-matchi',exit?total-5.1:0,total);
 assert.equal(cast.length,7);
 for(const e of s.shot.emissions){const draw=cast.find(a=>a.who===e.character);assert.equal(draw.y,e.toY);assert(Math.abs(draw.scale-e.scale)<1e-9);
  for(const f of meta.characters[e.character].walk.frames){const face=-1*(f.canonicalFacing??meta.characters[e.character].walk.canonicalFacing??1);const left=draw.x+(face<0?-f.ox-f.w:f.ox)*draw.scale;assert(left>=0,e.character+' clipped on exit');assert(e.toY+(f.oy+f.h)*e.scale<360);}
 }
 assert(cast.every((v,i)=>!i||cast[i-1].y<=v.y),'floor depth order');
}
console.log('PASS opening mob: approved sizes and Duke 1.35, TV origins/timing, continuous approach/exit, depth order; all other scenes unchanged');

const emissions=data.scenes.opening.shots.find(s=>s.id==='screen-emergence').emissions;
const landing=emissions.map(e=>e.toX),settled=emissions.map(e=>e.approach.toX);
assert(Math.max(...settled)-Math.min(...settled)<Math.max(...landing)-Math.min(...landing),'mob closes ranks');
assert.equal(Math.min(...settled),settled[0],'lead Shermometer stays closest to Jay');
let previous=new Map();
for(let t=0;t<=7.1;t+=1/120){
 const id=t<4.1?'screen-emergence':t<5.3?'hatchi-matchi':'window-launch',local=t-(t<4.1?0:t<5.3?4.1:5.3);
 const crowd=frame(id,local,t);
 for(const draw of crowd){
  const e=emissions.find(e=>e.character===draw.who),age=t-e.start;
  if(age>=e.duration){
   assert(draw.x>300,draw.who+' crossed Jay');assert.equal(draw.y,e.toY);
   const old=previous.get(draw.who);if(old){assert(draw.x<=old.x+.001,draw.who+' reversed away from Jay');assert(old.x-draw.x<1.6,draw.who+' jumped between marks');}
   previous.set(draw.who,draw);
  }
 }
 // Neighbouring floor lanes keep their left/right ordering while closing ranks.
 for(let i=0;i<emissions.length;i++)for(let j=i+1;j<emissions.length;j++){
  const a=emissions[i],b=emissions[j];if(Math.abs(a.toY-b.toY)>30)continue;
  const x=previous.get(a.character),y=previous.get(b.character);if(!x||!y)continue;
  assert(Math.sign(x.x-y.x)===Math.sign(a.toX-b.toX),'same-depth enemies crossed paths');
 }
}
console.log('PASS full 120Hz entrance/approach/launch sweep: every landing stays right of Jay, no grounded reversals or same-lane crossings, formation tightens');
