/* The Critic: Coming Attractions. Deterministic, renderer-independent combat. */
(function(root){'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t, sign=v=>v<0?-1:1;
const Campaign=typeof module!=='undefined'?require('./data/campaign.js'):root.CriticCampaign;
if(!Campaign)throw new Error('Campaign definitions must load before the combat engine.');
const {STAGES,EINFO,BOSS_DEFINITIONS,ITEMS,PROPS,PROJECTION}=Campaign;
const GATES=[520,1380,2280],LENGTH=2860,YMIN=350,YMAX=465;
const HITS={
 jab:{anim:'jab',dur:.25,hit:.095,end:.20,damage:10,range:84,kb:18,sound:'hit',label:'JAB'},
 cross:{anim:'cross',dur:.34,hit:.14,end:.27,damage:15,range:89,kb:24,sound:'hit',label:'CROSS'},
 kick:{anim:'front-kick',dur:.48,hit:.21,end:.38,damage:22,range:113,kb:42,sound:'heavy',label:'KICK'},
 palm:{anim:'palm-strike',dur:.49,hit:.21,end:.49,damage:29,range:103,kb:150,sound:'heavy',label:'PALM FINISH'},
 elbow:{anim:'rising-elbow',dur:.44,hit:.17,end:.44,damage:25,range:90,kb:95,sound:'heavy',label:'RISING ELBOW'},
 counter1:{anim:'lead-palm-impact',dur:.26,hit:.115,end:.23,damage:25,range:108,kb:10,sound:'hit',label:'COUNTER'},
 counter2:{anim:'rear-palm-impact',dur:.38,hit:.14,end:.38,damage:35,range:111,kb:175,sound:'heavy',label:'COUNTER FINISH'},
 dash:{anim:'attack',dur:.43,hit:.18,end:.43,damage:24,range:102,kb:120,sound:'heavy',label:'RUSH PUNCH'},
 air:{anim:'held-front-kick',dur:.48,hit:.115,end:.48,damage:26,range:114,kb:130,sound:'heavy',label:'JUMP KICK'},
 spin:{anim:'spinning-backfist',dur:.52,hit:.19,end:.52,damage:32,range:140,kb:55,sound:'heavy',label:'FULL REVIEW',all:true},
 specialWind:{anim:'low-finisher-windup',dur:.18,hit:9,end:.18,damage:0,range:0,kb:0,label:'WINDUP'},
 specialPalm:{anim:'rising-palm-impact',dur:.33,hit:.12,end:.33,damage:42,range:145,kb:230,sound:'heavy',label:'FINAL VERDICT',all:true}
};
const CHAIN=['jab','cross','kick','palm'];
// Route-specific RUN + HIT reuses the accepted dash window. The old rush remains available.
const RUN_ATTACKS={
 hero:{...HITS.dash,anim:'belly-bash',kb:1000,launch:.4,label:'BELLY BASH',sourceImpact:.3844},
 franklin:{...HITS.dash,dur:.56,hit:.24,end:.56,anim:'cartwheel-run',kb:1000,launch:.4,label:'CARTWHEEL',sourceImpact:11/26}
};
const IDLES=['anxious-fidget','vest-adjust','heel-toe-shuffle','toe-tap','head-scratch','shoulder-roll','knee-bounce','lean-peek','shiver','balance-wobble','double-take'];
const BOSS_MOVES=[
 {name:'ONE-TWO',anim:'attack',wind:.65,duration:.66,hits:[.27,.49],reach:110,lane:31,damage:13},
 {name:'FRONT KICK',anim:'front-kick',wind:.60,duration:.65,hits:[.29],reach:122,lane:33,damage:15},
 {name:'SPIN KICK',anim:'spin-kick',wind:.72,duration:.80,hits:[.35],reach:132,lane:44,damage:16,all:true},
 {name:'LEAP / SLAM',anim:'leap-slam',wind:.78,duration:1.15,hits:[.70],reach:138,lane:48,damage:18,all:true},
 {name:'POWER PUNCH',anim:'power-punch',wind:.67,duration:.66,hits:[.31],reach:120,lane:33,damage:17}
];
// Visual mappings only. Hero input, HITS damage/timing and movement remain unchanged.
const FRANKLIN_ANIMS={
 'palm-strike':'power-punch','rising-elbow':'rear-punch','lead-palm-impact':'lead-punch','rear-palm-impact':'rear-punch',
 'spinning-backfist':'spin-kick','low-finisher-windup':'slam-windup','rising-palm-impact':'ground-slam',
 'high-block':'guard','mid-guard':'guard','charge-entry':'run','cross-impact':'cross','exerted-guard':'recover',
 'vest-adjust':'taunt','wave-off':'victory','shoulder-roll':'taunt','nose-pinch':'taunt','dance-enter':'victory','dance-loop':'dance',
 'panic-tremble':'guard','grumpy-idle':'idle','startled-hop':'taunt','double-take':'taunt',
 'anxious-fidget':'idle','heel-toe-shuffle':'dance','toe-tap':'idle','head-scratch':'taunt','knee-bounce':'dance',
 'lean-peek':'taunt','shiver':'guard','balance-wobble':'idle','panic-settle':'recover','sigh':'recover','disgust-grimace':'taunt'
};
const HERO_V4={rise:'rise-v4',apex:'apex-v4',fall:'fall-v4',land:'land-v4','held-front-kick':'air-kick-v4'};
function playerAnimation(kind,name){return kind==='franklin'?(FRANKLIN_ANIMS[name]||name):(HERO_V4[name]||name);}
function enemyAttackAnimation(e){
 if(e.kind==='bear')return ['attack','swipe','overhead','backhand'][e.variant%4];
 if(e.kind==='hippo')return e.variant%2?'double-punch':'attack';
 if(e.kind==='sherm-punch')return e.variant%2?'swat-alt':'attack';
 if(e.kind==='sherm-slam')return e.variant%2?'slam-overhead-alt':'attack';
 if(e.kind==='raptor')return e.variant%2?'jaw-sweep-alt':'attack';
 return 'attack';
}

class Game{
 constructor(){this.playerKind='hero';this.franklinUnlocked=false;this.deathsByStage=STAGES.map(()=>0);this.stage4Eligible=true;this.mode='title';this.events=[];this.seed=317;this.viewWidth=1000;this.stage=0;this.storyFlags={};this.best=0;this.t=0;this.stats={};this.makePlayer();this.resetWorld();}
 rng(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 emit(type,data={}){this.events.push({type,...data});}
 story(id){if(!id||this.storyFlags[id])return false;this.storyFlags[id]=true;this.emit('story',{id,stage:this.stage});return true;}
 storyCompleted(id){if(id)this.storyFlags[id]=true;}
 drain(){const a=this.events;this.events=[];return a;}
 makePlayer(){this.p={x:170,y:407,z:0,vx:0,vy:0,vz:0,face:1,hp:100,lives:3,meter:35,inv:0,action:null,anim:'idle',animT:0,animDuration:0,idleT:0,cosmetic:null,cosmeticT:0,combo:0,comboClock:0,chainIndex:0,attackBuffer:0,jumpBuffer:0,guard:false,guardAge:10,guardMeter:100,counter:0,run:false,airUsed:false,landTimer:0,deadT:0,lastHit:0,footT:0,exertion:0};}
 resetWorld(){this.storyActors=[];this.settlingBoss=null;this.spikeTutorial=null;this.storyCage=null;this.bossSpawned=false;this.bossDefeated=false;this.finalPhase='machine';this.machineDefeated=false;this.dukeDefeated=false;this.lastUnlockEarned=false;this.stageClearT=0;this.entranceId=0;this.enemies=[];this.corpses=[];this.effects=[];this.pickups=[];this.props=Campaign.propsFor(this.stage);this.projectiles=[];this.projectileId=0;this.broadcastSummons={active:false,timer:0,wave:0};this.projection={active:false,disabled:false,visible:false,phase:'waiting',window:-1,timer:0,windowXs:[...PROJECTION.windowXs],booths:PROJECTION.windowXs.map((x,id)=>({id,x,circuitId:id%3})),windowY:92,telegraph:null,circuits:PROJECTION.colors.map((color,id)=>({id,color,active:true}))};this.nextGate=0;this.activeGate=-1;this.cleared=0;this.camera=0;this.waveWait=0;this.shake=0;this.hitstop=0;this.stageBanner=3;this.banner='';this.bannerT=0;this.target=null;this.targetT=0;this.enemyId=0;this.attackTicketT=0;}
 updateProps(dt){for(const o of this.props)if(o.kind==='remote'&&o.hp>0){
  if(o.flight){const f=o.flight;f.age+=dt;const u=clamp(f.age/.85,0,1);o.x=lerp(f.x,f.tx,u);o.y=f.ty;o.z=(f.ty-f.y)*(1-u)+65*Math.sin(Math.PI*u);if(u===1){o.flight=null;o.vz=95;o.z=.1;this.emit('projectileImpact',{kind:'remote',x:o.x,y:o.y});}}
  else if(o.z>0){o.vz=(o.vz||0)-1000*dt;o.z=Math.max(0,o.z+o.vz*dt);if(o.z===0)this.emit('projectileImpact',{kind:'remote',x:o.x,y:o.y});}
 }}
 attackSpec(name){return name==='dash'?(RUN_ATTACKS[this.playerKind]||RUN_ATTACKS.hero):HITS[name];}
 start(save=null,character=save?.playerKind||this.playerKind||'hero'){
  this.franklinUnlocked=this.franklinUnlocked||save?.franklinUnlocked===true;
  this.playerKind=(character==='franklin'&&this.franklinUnlocked)?'franklin':'hero';
  this.stage=0;this.makePlayer();this.resetWorld();this.mode='play';this.t=0;this.score=0;this.deathsByStage=STAGES.map(()=>0);this.stage4Eligible=true;this.storyFlags={};
  this.stats={hits:0,maxCombo:0,kos:0,parries:0,damage:0,attackStarts:0,used:{}};
  if(save&&[2,3,4,5].includes(save.version)){
   this.stage=clamp(Math.floor(+save.stage||0),0,save.version<4?3:STAGES.length-1);this.nextGate=clamp(Math.floor(+save.nextGate||0),0,3);
   this.score=clamp(+save.score||0,0,99999999);this.p.lives=clamp(+save.lives||3,1,3);this.p.meter=clamp(Number.isFinite(+save.meter)?+save.meter:35,0,100);this.stats.maxCombo=clamp(+save.maxCombo||0,0,9999);this.t=Math.max(0,+save.time||0);
   if(save.version>=3){this.deathsByStage=STAGES.map((_,i)=>Math.max(0,Math.floor(+save.deathsByStage?.[i]||0)));this.stage4Eligible=save.stage4Eligible!==false;this.bossDefeated=!!save.bossDefeated&&!!STAGES[this.stage].boss;this.bossSpawned=this.bossDefeated;this.storyFlags=save.storyFlags&&typeof save.storyFlags==='object'&&!Array.isArray(save.storyFlags)?{...save.storyFlags}:{};}
   else if(this.stage===3){this.stage4Eligible=false;}
   // A completed four-district save resumes the expanded campaign at the cinema.
   if(save.version<4&&save.complete&&this.stage===3){this.stage=4;this.nextGate=0;this.bossDefeated=this.bossSpawned=false;this.storyFlags['stage4-clear']=true;}
   if(STAGES[this.stage].boss&&this.nextGate===3&&!this.bossDefeated)this.nextGate=2;
   this.props=Campaign.propsFor(this.stage);this.projection.disabled=!!save.projectionDisabled&&this.stage===4;
   if(this.stage===4){this.projection.circuits=PROJECTION.colors.map((color,id)=>({id,color,active:this.projection.disabled?false:save.projectionCircuits?.[id]!==false}));if(this.projection.circuits.every(c=>!c.active))this.projection.disabled=true;}
   if(STAGES[this.stage].projection&&!this.projection.disabled)this.nextGate=Math.min(this.nextGate,this.projection.circuits.find(c=>c.active).id);
   if(this.stage===STAGES.length-1){
    this.machineDefeated=save.version<5?!!save.bossDefeated:!!save.machineDefeated;this.dukeDefeated=save.version>=5&&!!save.dukeDefeated&&this.machineDefeated;this.finalPhase=this.dukeDefeated?'resolved':this.machineDefeated?'duke':'machine';this.bossDefeated=this.dukeDefeated;this.bossSpawned=this.machineDefeated;
    if(!this.dukeDefeated){delete this.storyFlags.martyRescued;delete this.storyFlags.ending;}
    if(this.finalPhase==='duke')this.nextGate=2;else if(this.finalPhase==='resolved')this.nextGate=3;
   }
   this.cleared=this.nextGate;this.p.x=this.nextGate?GATES[this.nextGate-1]+440:170;this.p.x=Math.min(this.p.x,LENGTH-140);this.camera=clamp(this.p.x-this.viewWidth*.36,0,LENGTH-this.viewWidth);
   if(this.finalPhase==='duke'){this.activeGate=2;this.p.x=2170;this.finishDukeConfrontation(false);this.camera=clamp(this.p.x-this.viewWidth*.36,0,LENGTH-this.viewWidth);}
  }
  this.checkpoint=this.snapshot();this.emit('start');this.emit('music');this.cosmetic('vest-adjust',.65);
 }
 snapshot(){return {version:5,buildVersion:11,finalBossKind:'duke',stage:this.stage,nextGate:this.nextGate,score:this.score,lives:this.p.lives,meter:this.p.meter,maxCombo:this.stats.maxCombo||0,time:this.t,playerKind:this.playerKind,franklinUnlocked:this.franklinUnlocked,deathsByStage:[...this.deathsByStage],stage4Eligible:this.stage4Eligible,bossDefeated:this.bossDefeated,finalPhase:this.finalPhase,machineDefeated:this.machineDefeated,dukeDefeated:this.dukeDefeated,projectionDisabled:this.projection.disabled,projectionCircuits:this.projection.circuits.map(c=>c.active),storyFlags:{...this.storyFlags}};}
 checkpointSave(){this.checkpoint=this.snapshot();this.emit('save',{save:this.checkpoint});}
 recordDeath(){if(this.p.deathCounted)return;this.p.deathCounted=true;this.deathsByStage[this.stage]++;if(this.stage===3)this.stage4Eligible=false;
  // Persist failure immediately, without moving the checkpoint forward. Reload cannot erase a death.
  if(this.checkpoint){this.checkpoint={...this.checkpoint,deathsByStage:[...this.deathsByStage],stage4Eligible:this.stage4Eligible};this.emit('save',{save:this.checkpoint});}this.emit('stageDeath',{stage:this.stage});
 }
 restartStage4(){if(this.stage!==3)return false;const old=this.snapshot();old.nextGate=0;old.bossDefeated=false;old.deathsByStage[3]=0;old.stage4Eligible=true;old.lives=3;old.meter=35;this.start(old,this.playerKind);this.checkpointSave();this.emit('stageRetry');return true;}
 spawnFranklin(){
  this.bossSpawned=true;this.waveWait=0;
  const kind=this.playerKind==='franklin'?'sherm-slam':'franklin',k=EINFO[kind];
  const e={id:++this.enemyId,kind,name:k.name,boss:true,elite:false,x:0,y:409,z:0,face:-1,hp:420,maxHp:420,speed:k.speed,state:'entry',timer:0,cooldown:.4,anim:'walk',animT:0,animDuration:0,hit:false,kb:0,side:1,variant:0,flashes:0,moveIndex:0,move:null,hitIndex:0};
  this.setupEntry(e,0,1,true);this.enemies=[e];this.target=e;this.targetT=3;
 }
 spawnBoss(){
  const spec=STAGES[this.stage].boss;if(!spec||this.bossSpawned)return false;
  if(this.stage===3){this.spawnFranklin();return true;}if(this.stage===4&&!this.projection.disabled){if(!this.projection.active)this.configureProjection();return false;}
  this.bossSpawned=true;this.waveWait=0;const kind=spec.kind,k=EINFO[kind];
  const e={id:++this.enemyId,kind,name:k.name,boss:true,elite:false,x:0,y:409,z:0,face:-1,hp:spec.hp,maxHp:spec.hp,speed:k.speed,renderScale:k.renderScale||1,state:'entry',timer:0,cooldown:.6,anim:'walk',animT:0,animDuration:0,hit:false,kb:0,side:1,variant:0,flashes:0,moveIndex:0,move:null,hitIndex:0,telegraph:null};
  this.setupEntry(e,0,1,true);this.enemies=[e];this.target=e;this.targetT=3;
  if(STAGES[this.stage].projection&&!this.projection.disabled)this.spawnBoothCircuits();
  if(kind==='broadcast-rig'){this.broadcastSummons={active:true,timer:0,wave:0,phase:'shielded',waveStarted:false};e.entry=null;e.state='seek';e.hidden=false;e.targetable=false;e.x=2450;e.y=380;}
  this.story(spec.intro);return true;
 }
 finishDukeConfrontation(announce=true){
  if(this.stage!==STAGES.length-1||!this.machineDefeated||this.dukeDefeated||this.enemies.some(e=>e.hp>0&&e.kind!=='broadcast-rig'))return false;
  const spec=STAGES[this.stage].finalBoss,kind=spec.kind,k=EINFO[kind];this.finalPhase='duke';this.mode='play';this.activeGate=this.nextGate=2;this.bossSpawned=true;this.bossDefeated=false;this.waveWait=0;this.projectiles=[];
  const e={id:++this.enemyId,kind,name:k.name,boss:true,elite:false,x:2630,y:324,z:0,face:-1,hp:spec.hp,maxHp:spec.hp,speed:k.speed,renderScale:k.renderScale||1,state:'entry',timer:0,cooldown:.65,anim:'walk',animT:0,animDuration:0,hit:false,kb:0,side:1,variant:0,flashes:0,moveIndex:0,move:null,hitIndex:0,telegraph:null};
  if(this.dukeStaged){e.x=this.dukeStaged.x;e.y=this.dukeStaged.y;e.face=this.dukeStaged.face;e.entry=null;e.state='seek';e.hidden=false;e.targetable=true;this.dukeStaged=null;}else this.setupEntry(e,0,1,true);this.enemies=[e];this.target=e;this.targetT=3;this.p.action=null;this.p.attackBuffer=this.p.jumpBuffer=0;this.p.guard=false;this.p.vx=this.p.vy=0;
  if(announce)this.story(spec.intro);else this.storyFlags[spec.intro]=true;
  this.emit('finalPhase',{phase:'duke'});this.checkpointSave();return true;
 }
 spawnBoothCircuits(){if(this.projection.disabled)return false;this.configureProjection();return true;}
 dropRemote(circuitId){if(this.props.some(o=>o.kind==='remote'&&o.hp>0))return false;
  const a=this.projection,c=a.circuits[circuitId],booth=a.booths[a.window]||a.booths.find(b=>b.circuitId===circuitId),x=booth.x+(a.face||1)*26,y=a.windowY-6,tx=clamp(this.p.x+85,this.camera+70,this.camera+this.viewWidth-70);this.props.push({id:50+circuitId,kind:'remote',circuitId,color:c.color,x,y:this.p.y,hp:20,maxHp:20,z:this.p.y-y,vz:0,flight:{x,y,tx,ty:this.p.y,age:0},drop:null});
  this.projection.phase='remote';this.projection.telegraph=null;this.banner='SMASH THE REMOTE';this.bannerT=3;this.emit('remoteDrop',{circuitId});return true;
 }
 configureProjection(){
  if(!STAGES[this.stage].projection||this.projection.disabled||this.activeGate<0||!this.projection.circuits[this.activeGate]?.active)return;
  this.story('boss-projection-intro');const a=this.projection;a.shots=0;a.window=this.activeGate;a.active=true;a.visible=false;a.phase='waiting';a.timer=0;a.windowXs=[...PROJECTION.windowXs];a.booths=PROJECTION.windowXs.map((x,id)=>({id,x,circuitId:id%3}));a.telegraph=null;if(a.window>=0&&!a.circuits[a.booths[a.window]?.circuitId]?.active)a.window=-1;
 }
 visibleBooths(){const a=this.projection;return a.booths.filter(b=>b.id===this.activeGate&&a.circuits[b.circuitId].active&&b.x>=this.camera+70&&b.x<=this.camera+this.viewWidth-70);}
 startJump(){const p=this.p;if(p.z>0||p.hp<=0)return false;p.vz=585;p.z=.1;p.jumpBuffer=0;p.airUsed=false;p.landTimer=0;p.guard=false;this.emit('jump');return true;}
 updateJump(dt){const p=this.p;if(p.z>0||p.vz>0){p.vz-=1700*dt;p.z+=p.vz*dt;if(p.z<=0){p.z=p.vz=0;p.landTimer=.12;p.airUsed=false;if(p.action?.name==='air')p.action=null;this.emit('land');}}else p.landTimer=Math.max(0,p.landTimer-dt);}
 releaseTrashCan(e,m,options={}){const p=this.p,scale=e.renderScale||1;return this.launchProjectile('trash-can',e.x+e.face*Math.min(59.50699300699301*scale,Math.abs(p.x-e.x)*.5),e.y+(39-48.77622377622378)*scale,p.x,p.y,m.damage,m.radius,m.flight,null,{ownerKind:'spike',renderScale:scale,low:!!m.low,...options});}
 startSpikeTutorial(){if(this.spikeTutorial)return;const e=this.enemies.find(e=>e.kind==='spike'&&e.hp>0);if(!e)return;const m=BOSS_DEFINITIONS.spike.moves.find(m=>m.area==='trash-can');this.spikeTutorial={time:0,released:false,jumped:false,complete:false,boss:e,move:m};this.p.action=null;this.p.vx=this.p.vy=0;e.face=sign(this.p.x-e.x);this.p.face=-e.face;this.p.y=e.y;}
 updateSpikeTutorial(dt){const t=this.spikeTutorial;if(!t||t.complete)return;const e=t.boss,m=t.move;t.time+=dt;e.anim=t.time<m.wind?(m.windAnim||'idle'):m.anim;const age=Math.max(0,t.time-m.wind),contact=m.hits[0];e.animT=t.time<m.wind?t.time:clamp(age<=contact?m.sourceImpact*age/contact:m.sourceImpact+(1-m.sourceImpact)*(age-contact)/(m.duration-contact),0,1)*m.duration;e.animDuration=t.time<m.wind?m.wind:m.duration;
  if(!t.released&&t.time>=m.wind+m.hits[0]){t.can=this.releaseTrashCan(e,m,{tutorial:true});t.released=true;}
  const q=t.can;if(q&&!t.jumped&&q.phase==='rolling'&&Math.abs(q.x-this.p.x)<155){this.startJump();t.jumped=true;}
  this.updateJump(dt);this.updateProjectiles(dt);this.chooseAnimation(dt,0);
  if(t.time>m.wind+m.duration)e.anim='idle';
  if(t.released&&q.done&&t.jumped&&this.p.z===0){t.complete=true;this.emit('spikeTutorialComplete',{character:this.playerKind});}
 }
 finishSpikeTutorial(){this.projectiles=this.projectiles.filter(q=>!q.tutorial);const t=this.spikeTutorial,e=t?.boss||this.enemies.find(e=>e.kind==='spike'&&e.hp>0);if(e){e.state='seek';e.timer=0;e.cooldown=1;e.anim='idle';e.animT=0;e.face=sign(this.p.x-e.x);this.p.face=-e.face;}this.spikeTutorial=null;const p=this.p;p.z=p.vz=p.vx=p.vy=p.attackBuffer=p.jumpBuffer=0;p.action=null;p.anim='idle';}
 launchProjectile(kind,sourceX,sourceY,targetX,targetY,damage=9,radius=32,duration=.7,circuitId=null,options={}){
  const q={id:++this.projectileId,kind,circuitId,color:circuitId===null?null:this.projection.circuits[circuitId]?.color,sourceX,sourceY,targetX,targetY,x:sourceX,y:kind==='reel'?YMIN-35:targetY,sourceDepth:kind==='reel'?YMIN-35:targetY,z:(kind==='reel'?YMIN-35:targetY)-sourceY,age:0,duration,damage,radius,face:sign(targetX-sourceX),bounces:0,bounce:0,phase:'flight',contacted:false,...options};this.projectiles.push(q);this.emit('projectile',{kind,circuitId,x:sourceX,y:sourceY});return q;
 }
 projectileContact(q){
  if(q.tutorial&&this.spikeTutorial)return false;
  const p=this.p;if(q.done||q.contacted||p.z>(q.kind==='trash-can'?58:43)||Math.abs(p.x-q.x)>=q.radius||Math.abs(p.y-q.y)>=26||q.z>43)return false;
  // The incoming side changes when a reel reflects. Never guard against its old booth position.
  q.contacted=true;const hit=this.damagePlayer({kind:q.kind==='trash-can'?'spike':'projection-woman',x:q.x-q.face*65,y:q.y,face:q.face,hitHeight:q.kind==='trash-can'?58:43,attackDamage:q.damage});
  if(hit&&(q.kind==='reel'||q.kind==='trash-can')&&p.hp>0)this.knockdown(q.face,q.kind);return hit;
 }
 updateProjectiles(dt){
  for(const q of this.projectiles){
   if(q.done)continue;
   if(q.kind==='trash-can'){
    q.age+=dt;
    if(q.phase==='flight'){const u=clamp(q.age/.36,0,1);q.x=q.sourceX+q.face*100*u;q.y=q.targetY;q.z=(q.targetY-q.sourceY)*(1-u);if(u===1){q.phase='rolling';q.age=0;q.bounces=1;this.emit('projectileImpact',{kind:q.kind,x:q.x,y:q.y});}}
    else{q.x+=q.face*430*dt;q.z=q.age<.34?22*Math.sin(q.age/.34*Math.PI):0;this.projectileContact(q);}
    if(q.x<this.camera-110||q.x>this.camera+this.viewWidth+110||q.age>8)q.done=true;
    continue;
   }
   let remaining=dt;
   while(remaining>0&&!q.done){
    const span=q.phase==='bounce'?.3:q.duration,part=Math.min(remaining,Math.max(0,span-q.age));q.age+=part;remaining-=part;const u=clamp(q.age/span,0,1);
    if(q.phase==='flight'){q.x=lerp(q.sourceX,q.targetX,u);q.y=lerp(q.sourceDepth??q.targetY,q.targetY,u);q.z=((q.sourceDepth??q.targetY)-q.sourceY)*(1-u)+(q.low?28:55)*Math.sin(Math.PI*u);}
    else {q.x=lerp(q.hopFrom,q.hopTo,u);q.z=36*Math.sin(Math.PI*u);this.projectileContact(q);}
    if(q.age+1e-9<span)break;
    this.projectileContact(q);this.emit('projectileImpact',{kind:q.kind,x:q.x,y:q.y,bounces:q.bounces});
    if(q.kind!=='reel'||q.phase==='bounce'&&++q.bounces>=3){q.bounce=q.bounces;q.done=true;break;}
    q.bounce=q.bounces;q.phase='bounce';q.age=0;q.hopFrom=q.x;
    const lo=this.activeGate>=0?Math.max(35,GATES[this.activeGate]-485):35,hi=this.activeGate>=0?Math.min(LENGTH-40,GATES[this.activeGate]+495):LENGTH-45;
    const next=q.x+q.face*62;if(next<lo||next>hi)q.face*=-1;q.hopTo=clamp(q.x+q.face*62,lo,hi);this.emit('projectileBounce',{kind:q.kind,x:q.x,y:q.y,face:q.face,bounce:q.bounces+1});
    if(part===0&&remaining===0)break;
   }
  }
  this.projectiles=this.projectiles.filter(q=>!q.done);
 }
 updateProjection(dt){
  const a=this.projection;if(!a.active||a.disabled||this.activeGate<0||this.p.hp<=0){a.visible=false;return;}
  this.updateProjectionSupport(dt);const activeBooth=a.booths[a.window];if(activeBooth)a.face=sign(this.p.x-activeBooth.x);
  if(a.phase==='remote')return;const booth=a.booths[a.window];if(a.visible&&(!booth||!a.circuits[booth.circuitId].active||booth.x<this.camera+70||booth.x>this.camera+this.viewWidth-70)){a.visible=false;a.phase='waiting';a.timer=PROJECTION.cooldown;a.telegraph=null;}
  a.timer+=dt;
  if(a.phase==='waiting'&&a.timer>=PROJECTION.cooldown){const active=this.visibleBooths();if(!a.circuits.some(c=>c.active)){this.disableProjection();return;}if(!active.length)return;const circuit=a.circuits.find(c=>c.active).id;const next=active.find(b=>b.circuitId===circuit)||active[0];a.window=next.id;a.visible=true;a.phase='shadow';a.timer=0;a.telegraph=null;this.emit('projectionShadow',{window:a.window,circuitId:next.circuitId});}
  else if(a.phase==='shadow'&&a.timer>=PROJECTION.shadow){a.phase='reveal';a.timer=0;this.emit('projectionReveal',{window:a.window,circuitId:booth.circuitId,color:a.circuits[booth.circuitId].color});}
  else if(a.phase==='reveal'&&a.timer>=PROJECTION.reveal){a.phase='telegraph';a.remoteReady=(a.shots||0)>=3;a.timer=0;a.telegraph={x:this.p.x,y:this.p.y,t:0,duration:PROJECTION.wind,radius:32,color:a.circuits[booth.circuitId].color};this.emit('projectionTell',{x:a.telegraph.x,y:a.telegraph.y,window:a.window});}
  else if(a.phase==='telegraph'){a.telegraph.t=a.timer;if(a.timer>=a.telegraph.duration){if(a.remoteReady){this.dropRemote(a.circuits.find(c=>c.active).id);}else{const width=1+2*a.circuits.filter(c=>!c.active).length;for(let i=0;i<width;i++)this.launchProjectile('reel',booth.x+(a.face||1)*26,a.windowY,a.telegraph.x+(i-(width-1)/2)*90,a.telegraph.y,11,26,PROJECTION.flight,booth.circuitId);this.emit('projectionVolley',{width,circuitId:booth.circuitId});a.shots=(a.shots||0)+1;a.phase='throw';}a.timer=0;}}
  else if(a.phase==='throw'&&a.timer>=PROJECTION.flight){a.phase='recover';a.timer=0;a.telegraph=null;}
  else if(a.phase==='recover'&&a.timer>=.7){a.phase='waiting';a.timer=0;a.visible=false;}
 }
 updateProjectionSupport(dt){const a=this.projection;a.supportTimer=(a.supportTimer||0)+dt;
  const limit=a.circuits.filter(c=>!c.active).length>=2?3:2;
  if(a.supportTimer<8||this.enemies.filter(e=>e.hp>0).length>=limit)return;
  a.supportTimer=0;const kind='sherm-punch',k=EINFO[kind],x=clamp(this.camera+(this.enemyId%2?80:this.viewWidth-80),35,LENGTH-35);
  this.enemies.push({id:++this.enemyId,kind,name:k.name,projectionSupport:true,x,y:410,z:0,face:sign(this.p.x-x),hp:k.hp,maxHp:k.hp,speed:k.speed,state:'seek',timer:0,cooldown:1,anim:'walk',animT:0,kb:0,variant:0,flashes:0,targetable:true});const support=this.enemies[this.enemies.length-1];this.setupEntry(support,0,support.x>this.p.x?1:-1);support.state='entry';this.emit('projectionSupport');
 }
 disableCircuit(id){
  const c=this.projection.circuits[id];if(!c?.active)return false;c.active=false;for(const o of this.props)if((o.kind==='remote'||o.kind==='circuit')&&o.circuitId===id)o.hp=0;this.projectiles=this.projectiles.filter(q=>q.kind!=='reel'||q.circuitId!==id);const a=this.projection;a.shots=0;a.phase='waiting';a.timer=0;a.visible=false;const remaining=a.circuits.filter(x=>x.active).length;
  if(a.booths[a.window]?.circuitId===id){a.visible=false;a.telegraph=null;a.phase='waiting';a.timer=Math.max(0,PROJECTION.cooldown-.6);}
  this.emit('circuitDisabled',{circuitId:id,color:c.color,remaining});this.banner=`PROJECTION CIRCUITS: ${3-remaining} / 3`;this.bannerT=2;
  if(!remaining)this.disableProjection();else{a.active=false;a.visible=false;this.nextGate=this.cleared=Math.max(this.nextGate,id+1);this.activeGate=-1;this.waveWait=0;}this.checkpointSave();return true;
 }
 updateBroadcastSummons(dt){
  const a=this.broadcastSummons;if(!a.active||this.machineDefeated||this.mode!=='play'||this.p.hp<=0)return;
  const core=this.enemies.find(e=>e.kind==='broadcast-rig'&&e.hp>0);if(!core)return;
  a.timer+=dt;const live=this.enemies.filter(e=>e.broadcastSummon&&e.hp>0);
  if(!a.waveStarted){a.waveStarted=true;a.wave=(a.wave||0)+1;a.timer=0;a.phase='relocating';core.targetable=false;a.side=a.wave%2?1:-1;
   const kinds=['sherm-punch','sherm-shove','sherm-slam'];
   for(let j=0;j<a.wave+1;j++){const kind=kinds[(j+a.wave-1)%3],k=EINFO[kind],x=j%2?2680:2070;
    const e={id:++this.enemyId,kind,name:k.name,broadcastSummon:true,x,y:365+j%3*35,z:0,face:sign(this.p.x-x),hp:k.hp,maxHp:k.hp,speed:k.speed,state:'seek',timer:0,cooldown:.8,anim:'walk',animT:0,kb:0,variant:0,flashes:0,targetable:true};this.enemies.push(e);this.setupEntry(e,j,j%2?1:-1);e.state='entry';e.hidden=false;Object.assign(e.entry,{route:'broadcast',phase:'emerge',sourceX:x,sourceY:230,goalY:e.y,duration:.85});e.x=x;e.y=230;this.emit('broadcastSpawn',{kind,wave:a.wave});
   }this.banner='BROADCAST ROUND '+a.wave+' / 3';this.bannerT=2;this.emit('broadcastWave',{wave:a.wave,count:a.wave+1});return;
  }
  if(!live.length&&a.phase==='shielded'){a.phase='crashing';a.timer=0;core.targetable=false;core.telegraph=null;this.emit('machineCrash',{round:a.wave});}
  if(a.phase==='vulnerable'&&a.timer>9){a.phase='rising';a.wave--;a.timer=0;core.targetable=false;}
 }
 updateMachine(e,dt){const a=this.broadcastSummons;e.anim='idle';e.kb=0;e.timer+=dt;
  if(e.hp<=0){e.state='dead';e.telegraph=null;const before=a.defeatTime||0;a.defeatTime=before+dt;for(const beat of [.8,2.3])if(before<beat&&a.defeatTime>=beat){this.emit('slam',{x:e.x,y:e.y});this.shake=beat>2?5:3;}e.z=Math.max(0,(e.z||0)-100*dt);return;}
  e.state='seek';e.y=407;
  if(a.phase==='rising'){e.z=Math.min(185,(e.z||0)+150*dt);if(e.z>=185){a.waveStarted=false;a.phase='relocating';}return;}
  if(a.phase==='relocating'){
   e.z=Math.min(185,(e.z||0)+150*dt);const tx=a.side>0?2650:2010,dx=tx-e.x;e.x+=sign(dx)*Math.min(Math.abs(dx),170*dt);
   if(Math.abs(dx)<2&&e.z>=185){a.phase='shielded';a.timer=0;e.timer=0;}return;
  }
  if(a.phase==='crashing'){
   e.telegraph=null;e.z=Math.max(0,185*(1-Math.pow(clamp(a.timer/1.1,0,1),2)));
   if(a.timer>=1.1){a.phase='vulnerable';a.timer=0;e.targetable=true;this.shake=5;this.banner='HIT THE EXPOSED CORE';this.bannerT=3;this.emit('coreExposed',{round:a.wave});}return;
  }
  if(a.phase!=='shielded'){e.telegraph=null;e.timer=0;return;}
  const interval=3.8-(a.wave||1)*.35;
  if(!e.telegraph&&e.timer>interval){e.telegraph={kind:'lane',x:e.x,y:this.p.y,face:a.side>0?-1:1,range:750,lane:24,duration:1.35,firing:false,contacted:false};e.timer=0;this.emit('tell',{kind:'broadcast-rig',x:e.x,y:e.y});}
  else if(e.telegraph){const beam=e.telegraph;if(e.timer<.8)beam.y=this.p.y;
   if(e.timer>=1.35){if(!beam.firing)this.emit('signalSweep',{x:e.x,y:beam.y,face:beam.face});beam.firing=true;const dx=(this.p.x-beam.x)*beam.face;
    if(!beam.contacted&&dx>=0&&dx<=beam.range&&Math.abs(this.p.y-beam.y)<beam.lane&&this.p.z<70){beam.contacted=true;this.damagePlayer({kind:'broadcast-rig',x:e.x,y:beam.y,face:beam.face,hitHeight:70,attackDamage:20+(a.wave||1)*3});}
   }
   if(e.timer>=2.05){e.telegraph=null;e.timer=0;}
  }
 }
 stopBroadcastSummons(){this.broadcastSummons.active=false;this.projectiles=this.projectiles.filter(q=>q.kind!=='signal');this.emit('broadcastStopped');return true;}
 resolveBroadcast(){if(!this.machineDefeated||(this.broadcastSummons.defeatTime||0)<4||this.storyFlags['boss-broadcast-defeat']||this.enemies.some(e=>e.hp>0))return false;this.mode='confrontation';this.p.action=null;this.p.vx=this.p.vy=0;this.story('boss-broadcast-defeat');return true;}
 updateKnockback(e,dt){
  if(e.launchTimer>0){const elapsed=Math.min(dt,e.launchTimer);e.x+=e.launchVelocity*elapsed;e.launchVelocity*=Math.exp(-1.5*elapsed);e.launchTimer=Math.max(0,e.launchTimer-dt);e.kb=0;return;}
  if(Math.abs(e.kb)>1){e.x+=e.kb*dt;e.kb*=Math.exp(-8*dt);}
 }
 disableProjection(){
  if(this.projection.disabled)return false;this.projection.disabled=true;this.projection.circuits.forEach(c=>c.active=false);this.projection.active=this.projection.visible=false;this.projection.telegraph=null;this.projectiles=this.projectiles.filter(q=>q.kind!=='reel');for(const e of this.enemies){if(e.projectionSupport&&e.hp>0){e.hp=0;e.state='dead';e.anim='death';e.timer=e.animT=0;e.animDuration=1.7;e.entry=null;e.hidden=false;e.targetable=false;e.kb=0;}}this.projection.shutdown=true;this.emit('slam',{x:this.p.x,y:this.p.y});this.banner='PROJECTION BOOTH DISABLED';this.bannerT=2.3;this.emit('projectionDisabled');this.story('boss-projection-defeat');return true;
 }
 setupEntry(e,index,side,boss=false){
  const sewer=!boss&&e.kind.startsWith('sherm-')&&((index+this.stage+this.activeGate)%2===0)&&![2,4,6].includes(this.stage);
  const center=GATES[Math.max(0,this.activeGate)],left=this.camera,right=left+this.viewWidth;
  const goal=clamp(side>0?Math.min(center+190+index*32,right-145):Math.max(center-210,left+140),Math.max(45,center-440),Math.min(LENGTH-60,center+430));
  e.entry={route:sewer?'sewer':'walk',phase:'waiting',delay:index*.22,elapsed:0,goal,side,boss};e.hidden=true;e.targetable=false;e.entryDepth=0;e.x=sewer?goal:(side>0?right+230:left-230);e.face=-side;
  if(boss&&e.kind==='pizzeria-boss'){Object.assign(e.entry,{route:'screen',sourceX:2450,sourceY:325,goal:2520,goalY:409,duration:1.25});e.x=2450;e.y=316;this.emit('bossEntrance',{kind:e.kind,source:'cinema-screen',x:2450,y:316});}
  if(boss&&e.kind==='spike'){Object.assign(e.entry,{route:'door',sourceX:2630,sourceY:324});e.x=2630;e.y=407;this.emit('bossEntrance',{kind:e.kind,source:'pizzeria-door',x:2630,y:407});}
  if(boss&&e.kind==='duke'){Object.assign(e.entry,{route:'stairs',sourceX:2630,sourceY:324,goalY:409,duration:1.2});e.x=2630;e.y=324;this.emit('bossEntrance',{kind:e.kind,source:'broadcast-controls',x:2630,y:324});}
 }
 updateEntry(e,dt){
  const a=e.entry;if(!a)return false;a.elapsed+=dt;
  if(a.phase==='waiting'){
   if(a.elapsed<a.delay){e.hidden=true;return true;}
   a.phase=a.route==='sewer'?'rise':a.route==='door'?'door-open':a.route==='stairs'?'descend':a.route==='screen'?'emerge':'walk';a.elapsed=0;e.animT=0;
   e.x=a.route==='sewer'?a.goal:a.sourceX??(a.side>0?this.camera+this.viewWidth+230:this.camera-230);if(a.sourceY!==undefined)e.y=a.sourceY;e.hidden=false;
  }
  if(a.phase==='emerge'){const u=clamp(a.elapsed/a.duration,0,1);e.x=lerp(a.sourceX,a.goal,u);e.y=lerp(a.sourceY,a.goalY,u);e.z=0;e.entryScale=(a.route==='screen'?.46:.4)+(a.route==='screen'?.54:.6)*u;e.face=a.route==='screen'?sign(this.p.x-e.x):sign(a.goal-a.sourceX);e.anim='walk';e.animDuration=0;e.targetable=u>=.94;if(u>=1){e.entryScale=1;a.phase='settle';a.elapsed=0;e.animT=0;e.face=sign(this.p.x-e.x);this.emit('entryLand',{kind:e.kind,x:e.x,y:e.y});}}
  else if(a.phase==='door-open'){e.anim='idle';e.animDuration=.38;e.targetable=false;if(a.elapsed>=.38){a.phase='walk';a.elapsed=0;}}
  else if(a.phase==='descend'){const u=clamp(a.elapsed/a.duration,0,1);e.x=lerp(a.sourceX,a.goal,u);e.y=lerp(a.sourceY,a.goalY,u);e.z=0;e.anim='walk';e.targetable=u>=.94;if(u>=1){a.phase='settle';a.elapsed=0;e.animT=0;e.face=sign(this.p.x-e.x);}}
  else if(a.phase==='walk'){
   const delta=a.goal-e.x;e.face=sign(delta);e.anim=e.kind==='spike'?'v10-walk':'walk';e.animDuration=0;
   e.x+=sign(delta)*Math.min(Math.abs(delta),Math.max(155,e.speed*1.3)*dt);
   e.targetable=e.x>this.camera+45&&e.x<this.camera+this.viewWidth-45;
   if(Math.abs(a.goal-e.x)<3){a.phase='settle';a.elapsed=0;e.animT=0;e.face=sign(this.p.x-e.x);}
  }else if(a.phase==='rise'){
   const u=clamp(a.elapsed/.8,0,1);e.entryDepth=210*(1-u*u*(3-2*u));e.anim='arrival-v4';e.animDuration=0;e.animT=0;e.face=sign(this.p.x-e.x);e.targetable=u>=.88;
   if(u>=1){a.phase='settle';a.elapsed=0;e.animT=0;e.entryDepth=0;this.emit('entryLand',{kind:e.kind,x:e.x,y:e.y});}
  }else if(a.phase==='settle'){
   const dur=a.boss?.85:(e.kind==='striped'?.42:.34);e.anim=a.boss?(e.kind==='franklin'?'taunt':e.kind.startsWith('sherm-')?'arrival-v4':'idle'):'arrival-v4';e.animT=a.elapsed;e.animDuration=dur;e.targetable=true;
   if(a.boss&&!a.announced){a.announced=true;this.banner=e.name.toUpperCase();this.bannerT=1.6;this.emit('bossEnter',{kind:e.kind,name:e.name});}
   if(a.elapsed>=dur){e.state='seek';e.timer=e.animT=0;e.entry=null;e.entryDepth=0;e.hidden=false;e.targetable=true;e.cooldown=Math.max(e.cooldown,.3);}
  }
  return true;
 }
 updateFranklin(e,dt){const p=this.p;e.timer+=dt;e.animT+=dt;if(e.state==='entry'&&e.hp>0&&e.entry){this.updateEntry(e,dt);return;}e.flashes=Math.max(0,e.flashes-dt);e.cooldown=Math.max(0,e.cooldown-dt);this.updateKnockback(e,dt);e.x=clamp(e.x,1825,2750);e.y=clamp(e.y,YMIN+3,YMAX-3);
  if(e.hp<=0){e.state='dead';e.anim='death';e.animDuration=1.7;return;}
  if(e.state==='entry'){e.anim='taunt';e.animDuration=1.3;if(e.timer>1.45){e.state='seek';e.timer=e.animT=0;}return;}
  if(e.state==='hurt'){e.anim='hurt';e.animDuration=.48;if(e.timer>.49){e.state='seek';e.timer=0;e.cooldown=.26;}return;}
  if(p.hp<=0){e.anim=e.kind==='franklin'?'guard':'idle';return;}
  if(e.state==='windup'){e.anim=e.kind==='franklin'?'guard':'idle';e.animDuration=.6;e.face=sign(p.x-e.x);if(e.timer>=e.move.wind){e.state='attack';e.timer=e.animT=0;e.hitIndex=0;e.anim=e.move.anim;e.animDuration=e.move.duration;this.emit('enemySwing',{kind:e.kind});}return;}
  if(e.state==='attack'){
   const m=e.move;e.anim=m.anim;e.animDuration=m.duration;
   while(e.hitIndex<m.hits.length&&e.timer>=m.hits[e.hitIndex]){e.hitIndex++;const dx=p.x-e.x,dy=Math.abs(p.y-e.y);e.attackDamage=e.kind==='franklin'?Math.round(m.damage*1.12):m.damage;if(dy<m.lane&&(m.all?Math.abs(dx)<m.reach:dx*e.face>-22&&dx*e.face<m.reach))this.damagePlayer(e);if(m.anim==='leap-slam')this.emit('slam',{x:e.x,y:e.y});}
   if(e.timer>=m.duration){e.state='recover';e.timer=e.animT=0;e.anim=e.kind==='franklin'?'recover':'idle';e.animDuration=.5;}return;
  }
  if(e.state==='recover'){e.anim=e.kind==='franklin'?'recover':'idle';e.animDuration=.5;if(e.timer>.48*(1-this.bossPhase(e)*.08)){e.state='seek';e.timer=0;e.cooldown=.55*(1-this.bossPhase(e)*.17);}return;}
  e.face=sign(p.x-e.x);const dx=p.x-e.x,dy=p.y-e.y;
  if(Math.abs(dx)<94&&Math.abs(dy)<26&&e.cooldown<=0){e.move=e.kind==='franklin'?this.chooseBossMove(e,BOSS_MOVES):this.chooseBossMove(e,[{name:'SLAM',anim:'attack',wind:.70,duration:.65,hits:[.27],reach:117,lane:45,damage:16},{name:'OVERHEAD SLAM',anim:'slam-overhead-alt',wind:.82,duration:.72,hits:[.32],reach:117,lane:45,damage:18}]);e.state='windup';e.timer=e.animT=0;this.emit('tell',{kind:e.kind,x:e.x,y:e.y});return;}
  const tx=p.x-e.face*77,ddx=tx-e.x,ddy=p.y-e.y,d=Math.hypot(ddx,ddy/.6);if(d>7){const speed=e.speed*(1+this.bossPhase(e)*.06)*Math.min(1,d/34);e.x+=ddx/d*speed*dt;e.y+=ddy/d*speed*dt;e.anim=e.kind==='spike'?'v10-walk':Math.abs(dx)>220?'run':'walk';e.animDuration=0;}else{e.anim=e.kind==='franklin'?'guard':'idle';e.animDuration=0;}
 }
 bossPhase(e){return e.hp<e.maxHp*.35?2:e.hp<e.maxHp*.65?1:0;}
 chooseBossMove(e,moves){const p=this.p,dx=Math.abs(p.x-e.x),dy=Math.abs(p.y-e.y),phase=this.bossPhase(e);
  const choices=moves.filter(m=>(m.minPhase||0)<=phase).map((m,i)=>{let w=1;if(m.name===e.lastMove)w*=.12;
   if(m.retreat)w*=dx<130?2:.3;
   if(m.rush)w*=dx>130&&dy<38?3:dx<80?.35:1;
   if(m.all)w*=p.guard?2.5:1.2;if(p.guard&&m.damage>=18)w*=2;if(p.z>43&&m.wind<.65)w*=.5;
   if(m.hits.length>1)w*=p.action?1.7:1;
   if(m.area==='trash-can'){w*=dx>150&&p.z<15?2.5:.4;if(this.projectiles.some(q=>q.kind==='trash-can'&&!q.done))w=0;}
   if(!m.area&&!m.rush&&dx>(m.reach||120)+50)w*=.15;
   if(p.z>43&&m.all)w*=.3;
   if(e.x<1870&&e.face<0||e.x>2700&&e.face>0)if(m.rush)w*=.1;
   if(phase&&m.hits.length>1)w*=1.4;
   return {m,w};});let pick=this.rng()*choices.reduce((n,c)=>n+c.w,0),chosen=choices[choices.length-1].m;
  for(const c of choices){pick-=c.w;if(pick<=0){chosen=c.m;break;}}e.lastMove=chosen.name;e.moveIndex++;return chosen;
 }
 updateBoss(e,dt){
  const p=this.p,def=BOSS_DEFINITIONS[e.kind];if(!def){this.updateFranklin(e,dt);return;}if(def.stationary){this.updateMachine(e,dt);return;}
  e.timer+=dt;e.animT+=dt;e.flashes=Math.max(0,e.flashes-dt);e.cooldown=Math.max(0,e.cooldown-dt);
  if(e.hp<=0){e.state='dead';e.anim=e.kind==='duke'?'v10-defeat':'death';e.animDuration=e.kind==='duke'?3:1.7;e.telegraph=null;if(e.kind==='duke'){this.dukeDefeatTime=(this.dukeDefeatTime||0)+dt;if(this.dukeDefeatTime>=3.5)this.story('boss-duke-defeat');}return;}
  if(e.state==='entry'&&e.entry){this.updateEntry(e,dt);return;}
  if(def.stationary){e.x=2450;e.y=409;e.kb=0;}else{this.updateKnockback(e,dt);e.x=clamp(e.x,1825,2750);e.y=e.y<YMIN+3?Math.min(YMIN+3,e.y+85*dt):clamp(e.y,YMIN+3,YMAX-3);}
  if(e.state==='hurt'){e.anim=e.kind==='spike'?'v10-recoil':'hurt';e.animDuration=.48;e.telegraph=null;if(e.timer>(def.hurtRecovery||.48)){e.state='seek';e.timer=0;e.cooldown=0;}return;}
  if(p.hp<=0){e.anim='idle';return;}
  if(e.state==='windup'){
   e.anim=e.move.windAnim||'idle';e.animDuration=e.move.wind;
   if(!def.stationary&&!e.move.rush&&e.move.area!=='trash-can')e.face=sign(p.x-e.x);
   if(e.timer>=e.move.wind){e.state='attack';e.timer=e.animT=0;e.hitIndex=0;e.anim=e.move.anim;e.animDuration=e.move.duration;this.emit('enemySwing',{kind:e.kind});}return;
  }
  if(e.state==='attack'){
   const m=e.move;e.anim=m.secondAnim&&e.timer>=m.switchAt?m.secondAnim:m.anim;e.animT=m.secondAnim&&e.timer>=m.switchAt?e.timer-m.switchAt:e.timer;e.animDuration=m.secondAnim?(e.timer>=m.switchAt?m.duration-m.switchAt:m.switchAt):m.duration;if(m.sourceImpact!==undefined){const contact=m.hits[0],u=e.timer<=contact?m.sourceImpact*e.timer/contact:m.sourceImpact+(1-m.sourceImpact)*(e.timer-contact)/(m.duration-contact);e.animT=clamp(u,0,1)*m.duration;}if(m.rush&&e.timer<.55)e.x=clamp(e.x+e.face*m.rush*dt,1825,2750);if(m.retreat){const retreat=e.timer<.38;e.x=clamp(e.x+e.face*(retreat?-150:e.timer<.85?240:0)*dt,1825,2750);e.anim=retreat?'v11-cautious-retreat':'v10-shoulder';}
   while(e.hitIndex<m.hits.length&&e.timer>=m.hits[e.hitIndex]){
    e.hitIndex++;e.attackDamage=e.kind==='franklin'?Math.round(m.damage*1.12):m.damage;
    if(m.area==='trash-can'){e.face=sign(p.x-e.x);this.releaseTrashCan(e,m);}
    else if(m.area==='projectile')this.launchProjectile('signal',e.x,e.y-190,e.telegraph.x,e.telegraph.y,m.damage,m.radius,.7);
    else if(m.area==='spot'){if(Math.abs(p.x-e.telegraph.x)<m.radius&&Math.abs(p.y-e.telegraph.y)<32)this.damagePlayer(e);this.emit('slam',{x:e.telegraph.x,y:e.telegraph.y});}
    else if(m.area==='lane'){const dx=p.x-e.x;if(Math.abs(p.y-e.telegraph.y)<m.lane&&dx*e.face>-22&&dx*e.face<m.reach)this.damagePlayer(e);this.emit('signalSweep',{x:e.x,y:e.telegraph.y,face:e.face});}
    else{const dx=p.x-e.x;if(Math.abs(p.y-e.y)<m.lane&&(m.all?Math.abs(dx)<m.reach:dx*e.face>-22&&dx*e.face<m.reach))this.damagePlayer(e);if(m.all)this.emit('slam',{x:e.x,y:e.y});}
   }
   if(e.timer>=m.duration){e.state='recover';e.timer=e.animT=0;e.anim='idle';e.animDuration=m.recovery||def.recovery;e.telegraph=null;}return;
  }
  if(e.state==='recover'){e.anim='idle';if(e.timer>(e.move?.recovery||def.recovery)*(1-this.bossPhase(e)*.1)){e.state='seek';e.timer=0;e.cooldown=(def.cooldown||.65)*(1-this.bossPhase(e)*.18);}return;}
  e.face=sign(p.x-e.x);const dx=p.x-e.x,dy=p.y-e.y;
  if(e.cooldown<=0&&(def.stationary||Math.abs(dx)<(def.attackDistance||98)&&Math.abs(dy)<28)){
   e.move=this.chooseBossMove(e,def.moves);e.state='windup';e.timer=e.animT=0;const m=e.move;
   e.telegraph=m.area?{kind:m.area==='lane'?'lane':'spot',x:m.area==='lane'?e.x:p.x,y:p.y,face:e.face,range:m.reach||0,lane:m.lane||0,radius:m.radius||0}:null;
   this.emit('tell',{kind:e.kind,x:e.x,y:e.y});return;
  }
  if(def.stationary){e.anim='idle';return;}
  const tx=p.x-e.face*(def.preferredDistance||77),vx=tx-e.x,vy=p.y-e.y,d=Math.hypot(vx,vy/.6);
  if(d>7){const speed=e.speed*(1+this.bossPhase(e)*.09)*Math.min(1,d/34);e.x+=vx/d*speed*dt;e.y+=vy/d*speed*dt;e.anim=e.kind==='spike'?'v10-walk':Math.abs(dx)>220?'run':'walk';e.animDuration=0;}else{e.anim='idle';e.animDuration=0;}
 }
 pause(){if(this.mode==='play'){this.mode='pause';this.p.vx=this.p.vy=0;this.p.guard=false;this.p.attackBuffer=0;this.emit('pause');}}
 resume(){if(this.mode==='pause'){this.mode='play';this.emit('resume');}}
 cosmetic(name,dur=1){this.p.cosmetic={name,dur};this.p.cosmeticT=0;}
 setAction(name,idx=0){const s=HITS[name];this.p.action={name,t:0,idx,hits:[],confirmed:false};this.p.chainIndex=idx;this.p.attackBuffer=0;this.p.cosmetic=null;this.p.idleT=0;this.p.guard=false;this.stats.attackStarts++;this.emit('swing',{sound:name==='spin'?'backhand':'swish'});}
 nearby(max=460){const p=this.p;return this.enemies.filter(e=>e.hp>0&&!e.hidden&&Math.abs(e.x-p.x)<max);}
 beginAttack(mag=0){const p=this.p;if(p.hp<=0)return;
  if(p.z>14){if(!p.airUsed){p.airUsed=true;this.setAction('air');}return;}
  if(p.counter>0){p.counter=0;this.setAction('counter1');return;}
  if(p.action?.name==='dodge'||p.guard){this.setAction('elbow');return;}
  const near=this.enemies.filter(e=>e.hp>0&&!e.hidden&&e.targetable!==false&&Math.abs(e.y-p.y)<38).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
  if(near&&Math.abs(near.x-p.x)<155)p.face=sign(near.x-p.x);
  if(p.run&&mag>.76&&Math.abs(p.vx)>145){p.action={name:'charge',t:0,dur:.16,hits:[]};p.attackBuffer=0;this.emit('swing',{sound:'swish'});}
  else this.setAction('jab',0);
 }
 special(){const p=this.p;if(p.meter<100||p.hp<=0||p.z>0||p.action&&p.action.name!=='dodge')return false;p.meter=0;p.inv=Math.max(p.inv,.95);p.comboClock=2;this.setAction('spin');this.emit('special');return true;}
 spawnFight(i){this.activeGate=i;this.nextGate=i;const wave=STAGES[this.stage].waves[i],p=this.p;const center=GATES[i],carry=this.stage===4?this.enemies.filter(e=>e.projectionSupport&&e.hp>0):[];this.enemies=[];
  wave.forEach((text,j)=>{const [kind,elite]=text.split(':');const k=EINFO[kind],side=j===wave.length-1&&wave.length>2?-1:1;const ex=side>0?Math.max(p.x+260,center+150)+j*62:Math.min(p.x-225,center-285);
   this.enemies.push({id:++this.enemyId,kind,name:elite?'Headliner':k.name,elite:!!elite,x:clamp(ex,40,LENGTH-40),y:358+(j%3)*40,z:0,face:-side,hp:k.hp*(elite?1.75:1),maxHp:k.hp*(elite?1.75:1),speed:k.speed*(elite?1.08:1),renderScale:k.renderScale||1,state:'entry',timer:0,cooldown:.5+j*.35,anim:'idle',animT:0,animDuration:0,hit:false,kb:0,side,variant:0,flashes:0});
  });this.enemies.forEach((e,j)=>{this.setupEntry(e,j,e.side);if(this.stage===4)e.projectionSupport=true;});this.enemies.push(...carry);this.configureProjection();this.banner=`${i===2?'LAST CALL':'STREET FIGHT'}  ${i+1} / 3`;this.bannerT=1.6;if(i===2&&STAGES[this.stage].projection&&this.bossDefeated)this.spawnBoothCircuits();this.emit('encounter',{wave:i+1});if(this.nearby(180).length===0)this.cosmetic(wave.some(s=>s.includes('elite'))?'startled-hop':'double-take',.65);}
 registerHit(e,s){if(!e||e.hp<=0||e.state==='fred-vanish')return false;const p=this.p;if(e.entry){e.entry=null;e.entryDepth=0;e.hidden=false;e.targetable=true;}
  const machine=e.kind==='broadcast-rig';if(machine&&this.broadcastSummons.phase!=='vulnerable')return false;const committed=BOSS_DEFINITIONS[e.kind]&&['windup','attack'].includes(e.state),oldState=e.state;
  if(machine&&committed||e.move?.guarded&&e.state==='windup'&&(p.x-e.x)*e.face>=0&&s.kb<80)s={...s,damage:Math.max(2,Math.round(s.damage*(machine?.35:.55)))};
  if(machine){const floor=e.maxHp*(3-this.broadcastSummons.wave)/3;s={...s,damage:Math.min(s.damage,Math.max(0,e.hp-floor))};}e.hp=Math.max(0,e.hp-s.damage);e.state=e.hp<=0?'dead':committed&&(machine||s.kb<80)?oldState:'hurt';if(e.state!==oldState||e.state==='hurt'&&!e.boss){e.timer=0;e.animT=0;}e.kb=machine?0:(s.all?sign(e.x-p.x):p.face)*s.kb;e.cooldown=.4+(s.kb>90?.35:0);e.flashes=.1;if(s.launch&&!machine){e.launchTimer=s.launch;e.launchVelocity=(s.all?sign(e.x-p.x):p.face)*(e.boss?Math.min(550,s.kb):s.kb);e.kb=0;this.emit('launch',{kind:e.kind,x:e.x,y:e.y,face:p.face});}
  p.combo++;p.comboClock=2.0;p.meter=clamp(p.meter+(s.all?2:6),0,100);this.score+=Math.round(s.damage*(1+Math.min(p.combo,20)*.04));this.stats.hits++;this.stats.maxCombo=Math.max(this.stats.maxCombo,p.combo);this.hitstop=Math.max(this.hitstop,s.launch?.075:s.kb>80?.068:.04);this.shake=Math.max(this.shake,s.kb>80?6:2.5);this.target=e;this.targetT=3;
  this.emit('hit',{x:e.x,y:e.y-88,z:e.z||0,damage:s.damage,heavy:s.kb>80,sound:s.sound||'hit',kind:e.kind,combo:p.combo});
  if(machine&&e.hp>0&&e.hp<=e.maxHp*(3-this.broadcastSummons.wave)/3+.001){this.broadcastSummons.phase='rising';this.broadcastSummons.timer=0;e.targetable=false;}
  if(e.hp<=0){if(s.kb>80){e.deathAnim=({'sherm-punch':'fall-alt','sherm-slam':'spill-collapse-alt',raptor:'death-alt'})[e.kind]||'death';}if(e.boss){this.bossDefeated=!machine;this.emit('bossDefeated',{kind:e.kind});if(['pizzeria-boss','spike'].includes(e.kind)){this.settlingBoss={id:e.id,scene:e.kind==='spike'?'boss-spike-defeat':'boss-cinema-defeat',time:0};p.inv=Math.max(p.inv,2.1);}if(machine){this.stopBroadcastSummons();this.machineDefeated=true;this.broadcastSummons.defeatTime=0;this.finalPhase='duke';this.projectiles=[];this.p.attackBuffer=this.p.jumpBuffer=0;this.waveWait=0;this.resolveBroadcast();}if(e.kind==='duke'){this.dukeDefeated=true;this.finalPhase='resolved';this.dukeDefeatTime=0;this.hitstop=.16;}}this.score+=EINFO[e.kind].score*(e.elite?3:1);this.stats.kos++;this.emit('ko',{kind:e.kind,x:e.x,y:e.y});if(e.kind==='hippo'||e.kind==='sherm-slam')this.pickups.push({x:e.x,y:e.y,kind:'coffee',age:0});if(machine||e.kind==='duke')this.checkpointSave();}return true;
 }
 knockdown(face,kind='impact',duration=.88){const p=this.p;if(p.hp<=0||p.action?.name==='knockdown')return false;
  p.action={name:'knockdown',t:0,dur:duration};p.combo=p.comboClock=p.chainIndex=p.counter=p.attackBuffer=p.jumpBuffer=0;p.guard=false;p.cosmetic=null;p.vx=face*320;p.vy=0;p.inv=Math.max(p.inv,duration+.2);p.z=p.vz=0;
  this.emit('playerKnockdown',{kind,x:p.x,y:p.y});return true;
 }
 blockRun(e){const p=this.p;if(!this.knockdown(-p.face,e.kind))return;this.hitstop=Math.max(this.hitstop,.055);this.shake=Math.max(this.shake,4);this.emit('runBlocked',{kind:e.kind,x:e.x,y:e.y,playerKind:this.playerKind});}
 hitTest(s,a){const p=this.p;if(p.hp<=0)return;const ordered=a.name==='dash'?[...this.enemies].sort((a,b)=>(a.x-p.x)*p.face-(b.x-p.x)*p.face):this.enemies;for(const e of ordered){if(e.kind==='broadcast-rig'&&e.hp>0&&e.targetable===false&&!a.hits.includes(e.id)&&Math.abs(e.x-p.x)<s.range+40&&Math.abs(e.y-p.y)<33&&(e.z||0)<45){a.hits.push(e.id);e.flashes=.12;this.emit('block',{x:e.x,y:e.y-50});}if(e.hp<=0||e.hidden||e.targetable===false||a.hits.includes(e.id))continue;const dx=e.x-p.x,dy=Math.abs(e.y-p.y);if(dy>(s.all?60:33))continue;if(!s.all&&(dx*p.face<-20||dx*p.face>s.range+EINFO[e.kind].radius*.55))continue;if(s.all&&Math.abs(dx)>s.range+18)continue;if(a.name==='air'&&(p.z>125||p.z<7))continue;
   a.hits.push(e.id);if(a.name==='dash'&&(e.kind==='bear'||e.kind==='hippo'||e.kind==='pizzeria-boss')){this.blockRun(e);return;}a.confirmed=true;this.registerHit(e,s);
  }
  for(const o of this.props){if(o.hp<=0||o.z>15||a.hits.includes('o'+o.id))continue;const dx=o.x-p.x;if(Math.abs(o.y-p.y)>42||(!s.all&&(dx*p.face<-14||dx*p.face>s.range))||(s.all&&Math.abs(dx)>s.range))continue;o.hp-=s.damage;a.hits.push('o'+o.id);this.emit('break',{x:o.x,y:o.y,broken:o.hp<=0,kind:o.kind,circuitId:o.circuitId,color:o.color});if(o.hp<=0){const drop=o.drop===undefined?'coffee':o.drop;if(drop)this.pickups.push({x:o.x,y:o.y,kind:drop,age:0});this.score+=40;if(o.kind==='remote'||o.kind==='circuit')this.disableCircuit(o.circuitId??o.id-50);}}
 }
 damagePlayer(e){const p=this.p,k=EINFO[e.kind];if(p.hp<=0||p.inv>0||p.z>(e.hitHeight||43)||p.action?.name==='dodge')return false;let dmg=(e.attackDamage||k.damage)*(e.elite?1.2:1);
   const facing=(e.x-p.x)*p.face>-8;
   if(p.guard&&facing){if(p.guardAge<.20){p.counter=1.4;p.meter=clamp(p.meter+18,0,100);e.state='hurt';e.timer=0;e.cooldown=1;e.kb=-e.face*65;this.stats.parries++;this.hitstop=.075;this.emit('parry',{x:p.x+p.face*32,y:p.y-100});this.cosmetic('high-block',.25);return false;}
    p.guardMeter=Math.max(0,p.guardMeter-24);this.emit('block',{x:p.x+p.face*35,y:p.y-80});this.hitstop=.026;if(p.guardMeter>0){p.inv=.15;return false;}dmg*=.65;p.guard=false;
   }
   p.hp=Math.max(0,p.hp-dmg);p.inv=.86;p.combo=0;p.comboClock=0;p.counter=0;p.action={name:'hurt',t:0,dur:.34};p.attackBuffer=0;p.cosmetic=null;p.vx=e.face*140;p.lastHit=this.t;p.exertion=0;this.stats.damage+=dmg;this.shake=5;this.emit('playerHit',{hp:p.hp});if(p.hp<=0){p.action=null;p.deadT=0;p.guard=false;this.emit('playerDeath');}return true;
 }
 updateAction(dt,input){const p=this.p,a=p.action;if(!a)return;const old=a.t;a.t+=dt;
   if(a.name==='hurt'||a.name==='run-stun'||a.name==='knockdown'){if(a.name!=='hurt')p.attackBuffer=p.jumpBuffer=0;p.vx*=Math.exp(-10*dt);if(a.t>=a.dur){p.action=null;p.exertion=.2;}return;}
   if(a.name==='dodge'){p.x+=a.dx*280*dt;p.y+=a.dy*135*dt;if(p.attackBuffer>0&&a.t>.13){this.setAction('elbow');return;}if(a.t>.32)p.action=null;return;}
   if(a.name==='charge'){p.x+=p.face*250*dt;if(a.t>=.16)this.setAction('dash');return;}
   const s=this.attackSpec(a.name);if(!s){p.action=null;return;}
   if(a.name==='dash'&&a.t<.26)p.x+=p.face*205*dt;
   if(a.name==='air'&&p.z<=0){p.action=null;p.landTimer=.11;return;}
   if(a.t>=s.hit&&a.t<=s.hit+(a.name==='air'?.21:.13))this.hitTest(s,a);
   if(p.action!==a)return;
   if(a.t>=s.end&&p.attackBuffer>0){if(CHAIN.includes(a.name)&&a.idx<3){this.setAction(CHAIN[a.idx+1],a.idx+1);return;}}
   if(a.t>=s.dur){
     if(a.name==='counter1'){this.setAction('counter2');return;}
     if(a.name==='spin'){this.setAction('specialWind');return;}
     if(a.name==='specialWind'){this.setAction('specialPalm');return;}
     p.action=null;
     if(CHAIN.includes(a.name)&&a.idx<3&&(input.attackHeld||p.attackBuffer>0)){this.setAction(CHAIN[a.idx+1],a.idx+1);return;}
     if(a.name==='palm'||a.name==='specialPalm'||a.name==='counter2'){p.exertion=.26;p.attackBuffer=0;this.cosmetic('exerted-guard',.3);}
   }
 }
 // Signature enemy actions own their timer and use only current observed position.
 updateIdentity(e,dt){
  const p=this.p;if(p.hp<=0)return false;
  e.signatureCooldown=Math.max(0,(e.signatureCooldown??(2+e.id*.47))-dt);
  const special=e.state.startsWith('raptor-')||e.state.startsWith('fred-');
  if(!special){
   if(e.state!=='seek'||e.signatureCooldown>0)return false;
   if(e.kind==='raptor'){
    // Reserve one charge at a time; other Raptors retain ordinary attacks.
    if(this.enemies.some(o=>o!==e&&o.hp>0&&o.state.startsWith('raptor-')))return false;
    e.state='raptor-flank';e.flankX=clamp(p.x+(e.id%2?1:-1)*300,Math.max(35,this.camera+45),Math.min(LENGTH-45,this.camera+this.viewWidth-45));
   }else if(e.kind==='striped')e.state='fred-tell';else return false;
   e.timer=e.animT=0;e.hit=false;
  }
  if(e.state==='raptor-flank'){
   const dx=e.flankX-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy);e.face=sign(dx);e.anim='run';e.animDuration=0;
   if(d>8){const step=Math.min(d,210*dt);e.x+=dx/d*step;e.y+=dy/d*step;}
   if(d<=8||e.timer>2.2){e.state='raptor-tell';e.timer=0;e.face=sign(p.x-e.x);e.chargeFace=e.face;e.chargeLane=p.y;e.anim='idle';this.emit('tell',{kind:e.kind,x:e.x,y:e.y});}
  }else if(e.state==='raptor-tell'){
   e.anim=enemyAttackAnimation(e);e.animDuration=1;e.animT=.05;if(e.timer>=.65){e.state='raptor-charge';e.timer=e.animT=0;e.hit=false;}
  }else if(e.state==='raptor-charge'){
   e.face=e.chargeFace;e.anim='attack';e.animDuration=.85;e.x=clamp(e.x+e.face*510*dt,35,LENGTH-35);
   if(!e.hit&&Math.abs(p.x-e.x)<65&&Math.abs(p.y-e.y)<27){e.hit=true;e.attackDamage=18;this.damagePlayer(e);}
   if(e.timer>=.85||e.x<=35||e.x>=LENGTH-35){e.state='raptor-recover';e.timer=0;}
  }else if(e.state==='raptor-recover'){
   e.anim='idle';if(e.timer>=.85){e.state='seek';e.timer=0;e.signatureCooldown=5.5;e.attackDamage=null;}
  }else if(e.state==='fred-tell'){
   e.anim='idle';e.flashes=.08;if(e.timer>=.65){e.state='fred-vanish';e.timer=0;e.hidden=true;e.targetable=false;this.emit('fredVanish',{x:e.x,y:e.y});}
  }else if(e.state==='fred-vanish'){
   if(e.timer>=.5){const side=p.x>LENGTH-180?-1:p.x<180?1:(e.id%2?1:-1);e.x=clamp(p.x+side*135,35,LENGTH-35);e.y=clamp(p.y,YMIN+3,YMAX-3);e.face=sign(p.x-e.x);e.hidden=false;e.targetable=true;e.state='fred-reappear';e.timer=e.animT=0;this.emit('tell',{kind:e.kind,x:e.x,y:e.y});}
  }else if(e.state==='fred-reappear'){
   e.anim='attack';e.animDuration=1.1;if(e.timer>=.6){e.state='fred-claw';e.timer=0;e.hit=false;}
  }else if(e.state==='fred-claw'){
   e.anim='attack';if(!e.hit&&e.timer>=.2){e.hit=true;e.attackDamage=14;if((p.x-e.x)*e.face>-15&&(p.x-e.x)*e.face<150&&Math.abs(p.y-e.y)<32)this.damagePlayer(e);}
   if(e.timer>=.5){e.state='fred-recover';e.timer=0;}
  }else if(e.state==='fred-recover'){
   e.anim='idle';if(e.timer>=.85){e.state='seek';e.timer=0;e.signatureCooldown=6.5;e.attackDamage=null;}
  }
  return true;
 }
 updateEnemies(dt){const p=this.p;let attackers=this.enemies.filter(e=>e.hp>0&&(e.state==='windup'||e.state==='attack')).length;const maxAttackers=this.stage>=2?2:1;
   for(const e of this.enemies){if(e.boss||e.kind==='franklin'){this.updateBoss(e,dt);continue;}const k=EINFO[e.kind];e.timer+=dt;e.animT+=dt;if(e.state==='entry'&&e.hp>0&&e.entry){this.updateEntry(e,dt);continue;}e.flashes=Math.max(0,e.flashes-dt);e.cooldown=Math.max(0,e.cooldown-dt);this.updateKnockback(e,dt);e.x=clamp(e.x,30,LENGTH-30);e.y=clamp(e.y,YMIN+3,YMAX-3);
    if(e.hp<=0){e.state='dead';e.anim=e.deathAnim||'death';e.animDuration=1.7;continue;}
    if(e.state==='entry'){e.anim='idle';e.animDuration=.5;if(e.timer>.55){e.state='seek';e.timer=0;}continue;}
    if(e.state==='hurt'){e.anim='hurt';e.animDuration=.48;if(e.timer>.5+e.cooldown*.25){e.state='seek';e.timer=0;e.cooldown=.26;}continue;}
    if(this.updateIdentity(e,dt))continue;
    if(e.state==='windup'){
     e.face=sign(p.x-e.x);e.anim=enemyAttackAnimation(e);e.animDuration=k.wind+k.attack;
     if(e.timer>k.wind*(e.elite?.85:1)){e.state='attack';e.timer=0;e.hit=false;this.emit('enemySwing',{kind:e.kind});}continue;
    }
    if(e.state==='attack'){
     
     if(!e.hit&&e.timer>=k.hit){e.hit=true;const dy=Math.abs(e.y-p.y),dx=(p.x-e.x)*e.face;if(dy<((e.kind==='hippo'||e.kind==='sherm-slam')?45:29)&&dx>-22&&dx<k.range){this.damagePlayer(e);}if((e.kind==='hippo'&&e.variant!==1)||e.kind==='sherm-slam')this.emit('slam',{x:e.x+e.face*50,y:e.y});}
     if(e.timer>k.attack){e.z=0;e.state='recover';e.timer=0;e.cooldown=.55+(1-this.stage*.06)*this.rng()*.5;}continue;
    }
    if(e.state==='recover'){e.anim='idle';e.animDuration=0;if(e.timer>.34){e.state='seek';e.timer=0;}continue;}
    if(p.hp<=0){e.anim='idle';continue;}
    e.face=sign(p.x-e.x);const dx=p.x-e.x,dy=p.y-e.y,dist=Math.abs(dx);const attackDist=k.range-24;
    if(dist<attackDist&&Math.abs(dy)<23&&e.cooldown<=0&&attackers<maxAttackers){e.state='windup';e.timer=e.animT=0;e.variant=(e.variant+1)%(e.kind==='bear'?4:3);e.hit=false;attackers++;this.emit('tell',{kind:e.kind,x:e.x,y:e.y});continue;}
    let targetY=p.y+((e.id%3)-1)*7, targetX=p.x-e.face*(attackDist-6);
    if(attackers>=maxAttackers&&dist<175){targetX=p.x-e.face*(155+(e.id%3)*24);targetY=p.y+((e.id%3)-1)*30;}
    const vx=targetX-e.x,vy=targetY-e.y,d=Math.hypot(vx,vy/.60),factor=d>6?Math.min(1,d/32):0;
    if(factor){const speed=e.speed*(dist>240?1.3:1)*factor;e.x+=vx/Math.max(d,1)*speed*dt;e.y+=vy/Math.max(d,1)*speed*dt;e.anim=dist>200?'run':'walk';e.animDuration=0;}
    else{e.anim='idle';e.animDuration=0;}
   }
   // Body spacing prevents piles without teleporting or blocking hitboxes.
   const live=this.enemies.filter(e=>e.hp>0&&e.state==='seek');for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++){const a=live[i],b=live[j],dx=b.x-a.x,dy=b.y-a.y;if(Math.abs(dy)<24&&Math.abs(dx)<48){const d=(48-Math.abs(dx))*.5;a.x-=sign(dx)*d*dt*6;b.x+=sign(dx)*d*dt*6;}}
 }
 chooseAnimation(dt,mag){const p=this.p;let name='idle',dur=0,t=null;
  if(p.hp<=0){name='death';dur=1.7;t=p.deadT;}
  else if(p.action){const a=p.action;if(a.name==='dodge'){name='duck';dur=.2;t=Math.min(a.t,.2);}else if(a.name==='hurt'||a.name==='run-stun'){name='hurt';dur=a.dur||.34;t=a.t;}else if(a.name==='knockdown'){name=a.t<.65?'v10-fall':'v10-recover';dur=a.t<.65?.65:.23;t=a.t<.65?a.t:a.t-.65;}else if(a.name==='charge'){name='charge-entry';dur=.16;t=a.t;}else {const spec=this.attackSpec(a.name);name=spec.anim;dur=spec.dur;t=a.t;if(a.name==='dash'){const u=a.t<=spec.hit?spec.sourceImpact*a.t/spec.hit:spec.sourceImpact+(1-spec.sourceImpact)*(a.t-spec.hit)/(spec.dur-spec.hit);t=clamp(u,0,1)*spec.dur;}if(a.confirmed&&(a.name==='jab'||a.name==='cross'))name=a.name+'-impact';if(a.name==='air'){const u=a.t<=spec.hit?.16+.42*a.t/spec.hit:a.t<=.32?.58+.10*(a.t-spec.hit)/(.32-spec.hit):.68+.32*(a.t-.32)/(spec.dur-.32);t=clamp(u,0,1)*spec.dur;}}}
  else if(p.z>0){name=p.vz>90?'rise':p.vz< -90?'fall':'apex';dur=.20;}
  else if(p.landTimer>0){name='land';dur=.12;t=.12-p.landTimer;}
  else if(p.guard){name=p.guardAge<.2?'high-block':'mid-guard';dur=p.guardAge<.2?.2:.85;t=p.guardAge<.2?p.guardAge:Math.min(.85,p.guardAge-.2);}
  else if(mag>.08){name=p.run?'run':'walk';}
  else if(p.cosmetic){name=p.cosmetic.name;dur=p.cosmetic.dur;t=p.cosmeticT;}
  else if(this.nearby(450).length){if(p.anim!=='guard'&&p.anim!=='guard-enter'){this.cosmetic('guard-enter',.26);name='guard-enter';dur=.26;t=0;}else name='guard';}
  else if(p.hp<28){name='panic-tremble';}
  else if(p.hp<55){name='grumpy-idle';}
  if(p.anim!==name){p.anim=name;p.animT=0;}else p.animT+=dt;if(t!==null)p.animT=t;p.animDuration=dur;
  this.stats.used[name]=(this.stats.used[name]||0)+dt;
 }
 step(dt,input={}){
  dt=Math.min(.034,Math.max(0,dt));if(this.mode!=='play')return;const p=this.p;
  if(this.settlingBoss||this.stage===6&&(this.dukeDefeated||this.machineDefeated&&!this.enemies.some(e=>e.hp>0))){input={};p.attackBuffer=p.jumpBuffer=0;p.action=null;p.vx=p.vy=0;const fallen=this.enemies.find(e=>e.kind==='duke')||this.enemies.find(e=>e.kind==='broadcast-rig');if(fallen)p.face=sign(fallen.x-p.x);}
  // Buffers are ingested even during hitstop, so a tap cannot disappear in a freeze.
  if(input.attackPressed)p.attackBuffer=.30;if(input.jumpPressed)p.jumpBuffer=.16;
  if(input.specialPressed)this.special();
  if(this.hitstop>0){this.hitstop=Math.max(0,this.hitstop-dt);return;}
  this.t+=dt;this.stageBanner=Math.max(0,this.stageBanner-dt);this.bannerT=Math.max(0,this.bannerT-dt);this.targetT=Math.max(0,this.targetT-dt);this.shake*=Math.exp(-11*dt);
  p.inv=Math.max(0,p.inv-dt);p.attackBuffer=Math.max(0,p.attackBuffer-dt);p.jumpBuffer=Math.max(0,p.jumpBuffer-dt);p.counter=Math.max(0,p.counter-dt);p.exertion=Math.max(0,p.exertion-dt);p.comboClock-=dt;if(p.comboClock<=0)p.combo=0;
  let mx=clamp(Number(input.mx)||0,-1,1),my=clamp(Number(input.my)||0,-1,1),mag=Math.hypot(mx,my);if(mag>1){mx/=mag;my/=mag;mag=1;}
  if(p.hp<=0){this.recordDeath();p.deadT+=dt;if(p.z>0||p.vz>0){p.vz-=1700*dt;p.z=Math.max(0,p.z+p.vz*dt);if(p.z===0)p.vz=0;}p.x=clamp(p.x+p.vx*dt,35,LENGTH-45);p.vx*=Math.exp(-8*dt);p.vy=0;this.updateEnemies(dt);this.chooseAnimation(dt,0);if(p.deadT>2.25){p.lives--;if(p.lives>0)this.retry(false);else{this.mode='gameover';this.emit('gameover');}}return;}
  const wasGuard=p.guard;p.guard=!!input.guardHeld&&!p.action&&p.z===0&&p.guardMeter>0;if(p.guard){p.guardAge=wasGuard?p.guardAge+dt:0;p.guardMeter=Math.max(0,p.guardMeter-dt*3);}else{p.guardAge=10;p.guardMeter=Math.min(100,p.guardMeter+dt*20);}
  if(input.guardPressed&&mag>.52&&!p.action&&p.z<=0){p.action={name:'dodge',t:0,dx:mx/(mag||1),dy:my/(mag||1),dur:.32};p.inv=Math.max(p.inv,.24);p.guard=false;this.emit('dodge');}
  if(mag>.10||p.attackBuffer>0||p.guard||p.jumpBuffer>0){p.cosmetic=null;p.idleT=0;}else{p.idleT+=dt;}
  if(p.cosmetic){p.cosmeticT+=dt;if(p.cosmeticT>=p.cosmetic.dur)p.cosmetic=null;}
  if(!p.action&&p.jumpBuffer>0&&p.z===0){this.startJump();}
  if(!p.action&&p.attackBuffer>0&&p.exertion<=0)this.beginAttack(mag);
  if(p.action?.name==='dodge'&&p.attackBuffer>0&&p.action.t>.12)this.setAction('elbow');
  this.updateAction(dt,input);
  let allow=!p.action||p.action.name==='air';const running=mag>(p.run?.68:.79);p.run=running;
  if(!p.action&&Math.abs(mx)>.12)p.face=sign(mx);
  const speed=260*Math.pow(mag,1.08)*(p.guard?.23:1),nx=mag?mx/mag:0,ny=mag?my/mag:0;
  const targetX=allow?nx*speed:0,targetY=allow?ny*speed*.62:0,acc=1-Math.exp(-(p.z>0?8:18)*dt);
  if(!['hurt','run-stun','knockdown'].includes(p.action?.name)){p.vx=lerp(p.vx,targetX,acc);p.vy=lerp(p.vy,targetY,acc);}p.x+=p.vx*dt;p.y+=p.vy*dt;
  this.updateJump(dt);
  const lo=this.stage===4&&this.projection.active&&this.activeGate>=0?GATES[this.activeGate]-280:this.activeGate>=0?Math.max(35,GATES[this.activeGate]-485):35,hi=this.activeGate>=0?Math.min(LENGTH-40,GATES[this.activeGate]+495):LENGTH-45;
  p.x=clamp(p.x,lo,hi);p.y=clamp(p.y,YMIN,YMAX);
  if(mag>.2&&p.z===0&&!p.action){p.footT+=dt*speed/170;if(p.footT>.31){p.footT=0;this.emit('footstep');}}
  if(!p.action&&p.z===0&&p.idleT>3.2&&!p.cosmetic&&this.nearby(400).length===0){
   let an=IDLES[Math.floor(this.rng()*IDLES.length)];if(p.hp<25)an=this.rng()<.5?'panic-settle':'sigh';else if(this.stage===1)an=['disgust-grimace','nose-pinch','wave-off','shiver'][Math.floor(this.rng()*4)];this.cosmetic(an,1.25);p.idleT=0;
  }
  if(this.stage===6&&!this.bossSpawned&&this.storyCage){const target=clamp(p.x+430,0,2700),dx=target-this.storyCage.x,step=Math.sign(dx)*Math.min(Math.abs(dx),150*dt);if(dx>0){this.storyCage.x+=step;for(const a of this.storyActors){if(a.kind==='marty'||a.kind==='duke'){a.x+=step;a.anim=a.kind==='duke'?'walk':'scared-idle';a.animT=(a.animT||0)+dt;}}}}
  this.updateProps(dt);this.updateEnemies(dt);if(this.settlingBoss){this.settlingBoss.time+=dt;if(this.settlingBoss.time>=2.05){const scene=this.settlingBoss.scene;this.settlingBoss=null;this.story(scene);return;}}this.updateBroadcastSummons(dt);this.updateProjection(dt);this.updateProjectiles(dt);
  for(const c of this.pickups){c.age+=dt;if(!c.got&&Math.abs(c.x-p.x)<42&&Math.abs(c.y-p.y)<30&&p.z<16){const item=ITEMS[c.kind]||ITEMS.coffee;c.got=true;p.hp=Math.min(100,p.hp+item.health);p.meter=Math.min(100,p.meter+item.meter);this.score+=item.score;this.emit('pickup',{x:c.x,y:c.y,kind:c.kind,heal:item.health});}}
  this.pickups=this.pickups.filter(c=>!c.got);
  if(this.machineDefeated&&!this.dukeDefeated&&this.resolveBroadcast())return;
  if(this.activeGate>=0&&!this.settlingBoss&&this.enemies.every(e=>e.hp<=0)&&!(this.stage===4&&this.projection.active)&&!(this.stage===6&&(this.machineDefeated&&!this.dukeDefeated||this.dukeDefeated&&(this.dukeDefeatTime||0)<3.5))){
   this.waveWait+=dt;if(this.waveWait>.75&&STAGES[this.stage].boss&&this.activeGate===2&&!this.bossSpawned){this.spawnBoss();}else if(this.waveWait>.75&&!(STAGES[this.stage].projection&&this.activeGate===2&&(!this.projection.disabled||!this.bossDefeated))){this.cleared=this.activeGate+1;this.nextGate=this.cleared;this.activeGate=-1;this.waveWait=0;this.projection.active=this.projection.visible=false;this.projection.telegraph=null;this.projectiles=[];this.banner='BLOCK CLEAR';this.bannerT=1.8;p.hp=Math.min(100,p.hp+10);this.cosmetic(this.cleared===3?'wave-off':'vest-adjust',.9);this.checkpointSave();this.emit('clear',{last:this.cleared===3});}
  }else this.waveWait=0;
  if(this.activeGate<0&&this.nextGate<3&&p.x>GATES[this.nextGate]-280)this.spawnFight(this.nextGate);
  if(this.activeGate<0&&this.nextGate===3&&(p.x>LENGTH-150||STAGES[this.stage].boss&&this.bossDefeated)){this.advanceStage();}
  this.chooseAnimation(dt,mag);
  const cameraMin=this.stage===4&&this.projection.active&&this.activeGate>=0?Math.min(Math.max(0,GATES[this.activeGate]-315),Math.max(0,LENGTH-this.viewWidth)):0;
  const aim=clamp(p.x-this.viewWidth*.43+p.face*45,cameraMin,Math.max(0,LENGTH-this.viewWidth));this.camera=Math.max(cameraMin,lerp(this.camera,aim,1-Math.exp(-5*dt)));
 }
 advanceStage(){
  if(this.mode!=='play'||this.settlingBoss)return;
  if(this.stage===STAGES.length-1&&(!this.dukeDefeated||this.enemies.some(e=>e.kind==='duke')&&(this.dukeDefeatTime||0)<3.5))return;
  if(STAGES[this.stage].boss&&!this.bossDefeated)return;
  if(STAGES[this.stage].projection&&!this.projection.disabled)return;
  if(this.stage===3){
   const eligible=this.playerKind!=='franklin'&&this.stage4Eligible&&this.deathsByStage[3]===0;
   this.lastUnlockEarned=eligible&&!this.franklinUnlocked;
   if(this.lastUnlockEarned){this.franklinUnlocked=true;this.emit('unlock',{character:'franklin'});}
   this.story('stage4-clear');
  }
  if(this.stage===STAGES.length-1){
   this.storyFlags.martyRescued=true;this.storyFlags.broadcastStopped=true;this.mode='complete';this.p.action=null;this.p.vx=this.p.vy=this.p.vz=this.p.z=0;this.p.attackBuffer=this.p.jumpBuffer=0;this.p.guard=false;this.p.anim='dance-enter';this.p.animT=0;this.score+=1000;this.emit('complete',{score:this.score,boss:'duke',ending:'ending',playerKind:this.playerKind});this.emit('save',{save:{...this.snapshot(),complete:true}});return;
  }
  this.mode='stageclear';this.stageClearT=0;this.p.action=null;this.p.vx=this.p.vy=this.p.vz=this.p.z=0;this.p.attackBuffer=this.p.jumpBuffer=0;this.p.guard=false;this.checkpointSave();this.emit('stageClear',{stage:this.stage,next:this.stage+1});
 }
 finishStageClear(){
  if(this.mode!=='stageclear')return false;
  const hp=this.p.hp,lives=this.p.lives,meter=this.p.meter;this.stage++;this.resetWorld();this.makePlayer();this.mode='play';
  if(this.stage===3){this.stage4Eligible=true;this.deathsByStage[3]=0;}
  this.p.hp=Math.min(100,hp+25);this.p.lives=lives;this.p.meter=meter;this.emit('stage',{stage:this.stage});this.story(STAGES[this.stage].intro);this.checkpointSave();this.cosmetic(this.stage===1?'nose-pinch':'shoulder-roll',.8);return true;
 }
 retry(resetLives=true){const lives=resetLives?3:this.p.lives,save={...this.checkpoint,lives},stats=this.stats;this.start(save);this.stats=stats;this.p.lives=lives;this.p.inv=2;this.stageBanner=1;this.emit('retry');}
}
const API={Game,STAGES,HITS,RUN_ATTACKS,CHAIN,GATES,LENGTH,YMIN,YMAX,clamp,lerp,EINFO,BOSS_MOVES,BOSS_DEFINITIONS,ITEMS,PROPS,PROJECTION,playerAnimation};if(typeof module!=='undefined')module.exports=API;else root.Brawler=API;
})(typeof window!=='undefined'?window:globalThis);
