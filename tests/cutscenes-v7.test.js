/* Scene authoring constraints and completion lifecycle, independent of browser fixtures. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const C=require('../data/cutscenes.js'),meta=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/sprites.json'),'utf8'));
const expected=[['DUKE','Ratings are low. I need you to give this a glowing review, Sherman!'],['JAY','It Stinks!'],['DUKE','I thought you might say that... Allow me to give you a little motivation...'],['MARTY','Dad!'],['JAY','Marty!'],['DUKE',"If television can't bring the audience to us, perhaps we'll just bring the television to the audience!"],['JAY','Hatchi Matchi!!!']];
for(const kind of ['hero','franklin']){
 const opening=C.resolveScene(C.scenes.opening,kind);
 assert.deepEqual(opening.shots.filter(s=>s.dialogue).map(s=>[s.speaker,s.dialogue]),expected);
 for(const s of opening.shots.slice(0,3)){assert.ok(!s.actors.some(a=>a.character==='marty'));assert.ok(!s.cage);assert.ok(s.actors.some(a=>a.id==='jay'));assert.ok(s.actors.some(a=>a.character==='duke'));}
 const seated=opening.shots[0].actors.find(a=>a.id==='jay');assert.equal(seated.image,'cutscenes/jay-seated.webp');assert.equal(seated.imageHeight,224);assert.deepEqual(seated.imagePivot,{x:128,y:208});
 assert.ok(opening.shots[0].actors.find(a=>a.character==='duke').motion);
 assert.ok(opening.shots.find(s=>s.id==='marty-reveal').cage);assert.equal(opening.shots.find(s=>s.id==='marty-reveal').actors.find(a=>a.character==='marty').animation,'v11-captive-idle');
 const emergence=opening.shots.find(s=>s.id==='screen-emergence');assert.deepEqual(emergence.emissions.map(e=>e.character),C.cast);assert.ok(emergence.emissions.every(e=>Number.isInteger(e.screen)&&e.duration>0));
 assert.ok(opening.shots.find(s=>s.id==='window-launch').actors.find(a=>a.id==='jay').motion.toX<0);
 assert.equal(opening.shots.at(-1).id,'street-recovery');
 if(kind==='franklin')assert.ok(opening.shots[0].actors.some(a=>a.character==='franklin'&&a.routes.includes(kind)));
 for(const [id,scene] of Object.entries(C.scenes)){
  if(id==='opening'||id==='ending')continue;
  for(const shot of C.resolveScene(scene,kind).shots){if(!shot.routeDialogue)continue;if(shot.speaker==='DUKE'){assert.equal(id,'boss-broadcast-intro');assert.equal(shot.portrait,'duke');assert.ok(shot.dialogue.includes(kind==='franklin'?'Franklin':'Jay'));continue;}assert.equal(shot.speaker,kind==='franklin'?'FRANKLIN':'JAY');assert.equal(shot.portrait,kind==='franklin'?'franklin':'jay');if(kind==='franklin')assert.ok(!/my son|my boy|Marty!/i.test(shot.dialogue));}
 }
 for(let stage=2;stage<=7;stage++){const intro=C.scenes['stage-0'+stage+'-intro'];assert.ok(intro);assert.ok(intro.shots.some(s=>s.cage&&s.actors.some(a=>a.character==='duke'&&a.motion)&&s.actors.some(a=>a.character==='marty')));}
 const ending=C.resolveScene(C.scenes.ending,kind);const reunion=ending.shots.find(s=>s.speaker==='MARTY').actors.filter(a=>!a.routes||a.routes.includes(kind));const father=reunion.find(a=>a.character==='hero'||kind==='hero'&&a.character==='selected');assert.equal(father.x,280);if(kind==='franklin')assert.equal(reunion.find(a=>a.character==='selected').x,155);
 const deps=C.dependencies('opening',kind,meta);assert.ok(deps.images.includes('cutscenes/jay-seated.webp'));assert.ok(deps.banks.includes('duke'));assert.ok(deps.animations['sherm-punch'].includes('idle'));assert.ok(!Object.values(deps.animations).flat().includes('arrival-v4'));assert.ok(!Object.values(deps.animations).flat().includes('double-take'));assert.ok(!Object.values(deps.animations).flat().includes('startled-hop'));assert.equal(deps.banks.includes('franklin'),kind==='franklin');
}
const portrait=C.portraitFrames(meta,'jay','neutral');assert.ok(portrait.length);assert.ok(portrait.every(f=>f.image.startsWith('portraits/jay/')&&!f.image.startsWith('assets/')));
assert.ok(C.scenes['boss-broadcast-defeat']);assert.ok(C.scenes['boss-duke-intro']);assert.ok(C.scenes['boss-duke-defeat']);
const sandbox={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../cutscenes.js'),'utf8'),sandbox);
let rewards=0,idle=0,clears=0;const p=Object.create(sandbox.CriticScenePlayer.prototype);Object.assign(p,{active:true,paused:false,loading:false,entry:{done:false,scene:{id:'test'},onComplete:()=>rewards++},el:{hidden:false},completed:new Set(),queue:[],o:{clearInput:()=>clears++,onIdle:()=>idle++}});
p.finish(true);p.finish(true);assert.equal(rewards,1);assert.equal(idle,1);assert.equal(clears,1);
Object.assign(p,{active:true,entry:{done:false,scene:{id:'machine'},onComplete:()=>{p.active=true;p.entry={done:false,scene:{id:'duke'}};}},el:{hidden:false}});p.finish(true);assert.equal(idle,1);assert.equal(p.entry.scene.id,'duke');assert.equal(p.active,true);
const keys=Object.create(sandbox.CriticScenePlayer.prototype),events=[];Object.assign(keys,{active:true,skip:()=>events.push('skip'),togglePause:()=>events.push('pause'),advance:()=>events.push('advance')});for(const [code,id] of [['KeyP','sceneSkip'],['KeyJ','scenePause'],['Enter','sceneSkip'],['Space','scenePause']])keys.key({code,target:{id},repeat:false,preventDefault(){}});assert.deepEqual(events,['pause','advance','skip','pause']);
console.log('PASS v7 opening canon/staging/real-cast origin, both route dialogue tables, cage transitions, portrait dependencies, idempotent skip and scene reentry lifecycle');
