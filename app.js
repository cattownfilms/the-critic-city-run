/* Offline browser shell, radial analog input, embedded-audio sampling, and menus. */
(function(){'use strict';
const $=id=>document.getElementById(id),conf=window.BRAWLER_CONFIG,inline=window.BRAWLER_ASSETS;
const canonicalText=s=>String(s||'').replace(/Shermometer\s*\/\s*Punch|Punch Shermometer/g,'Shermometer v1').replace(/Shermometer\s*\/\s*Shove|Shove Shermometer/g,'Shermometer v2').replace(/Shermometer\s*\/\s*Slam|Slam Shermometer/g,'Shermometer v3').replace(/Striped Claw/g,'Fred K').replace(/Snooty Pipe Raptor/g,'JP Raptor Esq');
const clamp=Brawler.clamp;window.settings={music:.35,sfx:.72,reducedMotion:false,vibration:false};
let pad=null,scenes=null,sceneReturnMode='play';
const stageMusic=()=>Brawler.STAGES[game.stage]?.music||['broadway','subway','rooftop','theater','theater','broadway','rooftop'][game.stage]||'title';
const validSave=s=>[2,3,4,5].includes(s?.version)&&(!s.complete||(s.version<4&&s.stage===3)||(s.version===4&&s.stage===6))?s:null;
let storageOK=true;function readStore(k){try{return JSON.parse(localStorage.getItem(k)||'null');}catch(e){storageOK=false;return null;}}
function store(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){storageOK=false;$('saveNote').textContent='Browser storage unavailable. The game still plays; keep this tab open.';return false;}}
const stored=readStore(conf.settingsKey);if(stored){for(const key of ['music','sfx'])if((typeof stored[key]==='number'||typeof stored[key]==='string'&&stored[key].trim()!=='')&&Number.isFinite(+stored[key]))settings[key]=clamp(+stored[key],0,1);settings.reducedMotion=!!stored.reducedMotion;settings.vibration=!!stored.vibration;}
let save=validSave(readStore(conf.saveKey)||readStore(conf.legacySaveKey));
let profile=readStore(conf.profileKey)||{};if(typeof profile!=='object')profile={};profile.franklinUnlocked=profile.franklinUnlocked===true||save?.franklinUnlocked===true;let selected=profile.selected==='franklin'&&profile.franklinUnlocked?'franklin':'hero';
$('continueButton').hidden=!save;$('musicVolume').value=Math.round(settings.music*100);$('sfxVolume').value=Math.round(settings.sfx*100);$('reducedMotion').checked=settings.reducedMotion;$('vibration').checked=settings.vibration;
function toast(s){$('toast').textContent=s;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,3500);}
function fatal(s){$('fatal').textContent='The game could not finish loading. '+s+' Reload after the download has finished, or use the included local launcher.';$('fatal').hidden=false;}
const cachedURLs=new Map(),rawSrc=name=>inline?inline.files[name]:(conf.assetBase+name+'?v='+encodeURIComponent(conf.version));
const src=name=>cachedURLs.get(name)||rawSrc(name);
$('titleArt').src=src('title.png');$('portrait').src=src('icon.png');
class Input{
 constructor(){this.pointers=new Map();this.keys=new Set();this.physicalKeys=new Set();this.blockedKeys=new Set();this.down={attack:false,jump:false,guard:false,special:false};this.edges={attack:false,jump:false,guard:false,special:false};this.mx=0;this.my=0;this.stickId=null;this.pressure=null;
  const st=$('stick');st.addEventListener('pointerdown',e=>this.pointerDown(e,'stick'));
  for(const el of document.querySelectorAll('[data-action]'))el.addEventListener('pointerdown',e=>this.pointerDown(e,el.dataset.action));
  window.addEventListener('pointermove',e=>this.pointerMove(e),{passive:false});window.addEventListener('pointerup',e=>this.pointerUp(e));window.addEventListener('pointercancel',e=>this.pointerUp(e));
  document.querySelectorAll('#controls button,#stick').forEach(el=>el.addEventListener('lostpointercapture',e=>this.pointerUp(e)));
  window.addEventListener('keydown',e=>{this.physicalKeys.add(e.code);if(scenes?.active){scenes.key(e);return;}if(this.blockedKeys.has(e.code))return;if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(e.code!=='Escape'&&e.code!=='KeyP'&&document.querySelector('.screen:not([hidden])')){if(e.code==='Enter'&&e.target.tagName!=='BUTTON'&&game.mode==='title'&&ready){e.preventDefault();start(false);}return;}const map={KeyJ:'attack',KeyX:'attack',Space:'jump',KeyZ:'jump',KeyK:'guard',KeyC:'guard',KeyL:'special',KeyV:'special'};if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();if(e.repeat)return;this.keys.add(e.code);if(map[e.code])this.edges[map[e.code]]=true;if(e.code==='Escape'||e.code==='KeyP'){if(game.mode==='play')pause();else if(game.mode==='pause'&&$('gallery').hidden)resume();}if(e.code==='Enter'&&game.mode==='title'&&ready)start(false);});
  window.addEventListener('keyup',e=>{this.physicalKeys.delete(e.code);this.blockedKeys.delete(e.code);this.keys.delete(e.code);});
 }
 pointerDown(e,role){e.preventDefault();if(game.mode!=='play'||!$('gallery').hidden)return;if(role==='stick'&&this.stickId!==null)return;audio.unlock();try{e.currentTarget.setPointerCapture(e.pointerId);}catch(_){}
  this.pointers.set(e.pointerId,role);if(role==='stick'){this.stickId=e.pointerId;this.updateStick(e);}else{this.down[role]=true;this.edges[role]=true;$(role).classList.add('down');}
 }
 updateStick(e){const b=$('stick').getBoundingClientRect(),radius=b.width*.35;const dx=e.clientX-(b.left+b.width/2),dy=e.clientY-(b.top+b.height/2),raw=Math.hypot(dx,dy),mag=Math.min(1,raw/radius),dead=.12;
  const amount=mag<=dead?0:Math.pow((mag-dead)/(1-dead),1.05);this.mx=raw?dx/raw*amount:0;this.my=raw?dy/raw*amount:0;
  // Force values are recorded for diagnostics only. Radius is the consistent control
  // signal on ordinary touchscreens, which may report constant pressure=.5.
  this.pressure=typeof e.pressure==='number'?e.pressure:null;
  $('knob').style.transform=`translate(-50%,-50%) translate(${raw?dx/raw*Math.min(raw,radius):0}px,${raw?dy/raw*Math.min(raw,radius):0}px)`;$('stick').classList.toggle('running',mag>.79);
 }
 pointerMove(e){if(this.stickId===e.pointerId){e.preventDefault();this.updateStick(e);}}
 pointerUp(e){const role=this.pointers.get(e.pointerId);if(!role)return;this.pointers.delete(e.pointerId);if(role==='stick'){this.stickId=null;this.mx=this.my=0;this.pressure=null;$('knob').style.transform='translate(-50%,-50%)';$('stick').classList.remove('running');}else{this.down[role]=[...this.pointers.values()].includes(role);$(role).classList.toggle('down',this.down[role]);}}
 clear(){this.blockedKeys=new Set(this.physicalKeys);if(pad)pad.suspend();this.pointers.clear();this.stickId=null;this.mx=this.my=0;this.pressure=null;this.keys.clear();Object.keys(this.down).forEach(k=>{this.down[k]=false;this.edges[k]=false;$(k).classList.remove('down');});$('knob').style.transform='translate(-50%,-50%)';$('stick').classList.remove('running');}
 snapshot(consume=true){const gp=pad?pad.snapshot(consume):null;const k=this.keys;let mx=this.mx,my=this.my;if(this.stickId===null&&Math.hypot(mx,my)<.001&&gp){mx=gp.mx;my=gp.my;}if(k.has('KeyA')||k.has('ArrowLeft'))mx=-1;if(k.has('KeyD')||k.has('ArrowRight'))mx=1;if(k.has('KeyW')||k.has('ArrowUp'))my=-1;if(k.has('KeyS')||k.has('ArrowDown'))my=1;const m=Math.hypot(mx,my);if(m>1){mx/=m;my/=m;}
  const o={mx,my,attackPressed:this.edges.attack||!!gp?.pressed.attack,jumpPressed:this.edges.jump||!!gp?.pressed.jump,guardPressed:this.edges.guard||!!gp?.pressed.guard,specialPressed:this.edges.special||!!gp?.pressed.special,attackHeld:this.down.attack||!!gp?.held.attack||k.has('KeyJ')||k.has('KeyX'),guardHeld:this.down.guard||!!gp?.held.guard||k.has('KeyK')||k.has('KeyC')};if(consume)Object.keys(this.edges).forEach(k=>this.edges[k]=false);return o;}
}
class AudioSystem{
 constructor(){this.music=new Audio();this.music.loop=true;this.music.preload='none';this.music.volume=settings.music;this.trackKey='title';this.musicNodes=new Map([['title',this.music]]);this.outgoing=null;this.fade=1;this.wantMusic=false;this.musicSerial=0;this.ctx=null;this.buffers={};this.bytes=new Map();this.active=new Set();this.loaded=false;this.ready=null;this.muted=false;this.lastVoice=-9;this.duck=0;this.played={};this.errors=[];this.cueNames=['swish','backhand','bear-call','bear-hit','hit','heavy','hippo-hit','slam','step1','step2','elder-strike','elder-hit','fall'];}
 async unlock(){if(!window.AudioContext&&!window.webkitAudioContext)return;try{if(!this.ctx){this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.bus=this.ctx.createGain();this.bus.gain.value=settings.sfx;const comp=this.ctx.createDynamicsCompressor();comp.threshold.value=-14;comp.knee.value=20;comp.ratio.value=4;this.bus.connect(comp);comp.connect(this.ctx.destination);this.ready=this.decode();}if(this.ctx.state==='suspended'||this.ctx.state==='interrupted'){if(!this.resuming)this.resuming=this.ctx.resume();const pending=this.resuming;try{await pending;}finally{if(this.resuming===pending)this.resuming=null;}}}catch(e){this.errors.push(String(e));}}
 async decode(){const load=async name=>{const data=this.bytes.get(name+'.wav');if(!data||this.buffers[name])return;try{this.buffers[name]=await this.ctx.decodeAudioData(data.slice(0));}catch(e){this.errors.push(name+': '+e);}};await Promise.all(this.cueNames.map(load));this.loaded=Object.keys(this.buffers).length===this.cueNames.length;}
 chooseTrack(key){
  key=conf.music[key]?key:'title';const item=conf.music[key];if(key===this.trackKey){if(!this.music.getAttribute('src')&&cachedURLs.has(item.file))this.music.src=src(item.file);return;}
  if(!cachedURLs.has(item.file))return;
  // Keep one prepared player per supplied track. Resetting/destroying native
  // media with load() during rapid scene transitions can deadlock WebKit.
  if(this.outgoing)this.outgoing.pause();
  this.outgoing=this.music;let next=this.musicNodes.get(key);
  if(!next){next=new Audio(src(item.file));next.loop=true;next.preload='none';this.musicNodes.set(key,next);}
  else next.currentTime=0;
  this.music=next;this.music.volume=0;this.fade=0;this.trackKey=key;
 }
 gesture(){
  // All policy-sensitive calls occur synchronously within the trusted event.
  this.unlock();
  if(this.muted)return;
  for(const [key,item] of Object.entries(conf.music)){
   if(!cachedURLs.has(item.file))continue;
   let node=this.musicNodes.get(key);
   if(!node){node=new Audio(src(item.file));node.loop=true;node.preload='auto';this.musicNodes.set(key,node);}
   if(!node.getAttribute('src'))node.src=src(item.file);
   if(node===this.music)continue;
   if(this.primed?.has(node))continue;
   node.volume=0;
   try{const pending=node.play();Promise.resolve(pending).then(()=>{(this.primed||(this.primed=new Set())).add(node);if(node!==this.music&&node!==this.outgoing)node.pause();},e=>{this.lastPrimeError=String(e);});}catch(e){this.lastPrimeError=String(e);}
  }
  if(this.wantMusic&&this.music.paused)this.playMusic(this.trackKey);
 }
 async playMusic(key){
  key=key||stageMusic();this.chooseTrack(key);this.wantMusic=true;const serial=++this.musicSerial,node=this.music;this.unlock();
  if(!this.wantMusic||serial!==this.musicSerial||this.muted||settings.music<=0)return;
  if(!node.getAttribute('src'))return;
  try{const pending=node.play();await pending;this.lastBlocked=null;if(!this.wantMusic||node!==this.music||this.muted)node.pause();}
  catch(e){if(this.wantMusic&&serial===this.musicSerial){this.lastBlocked=String(e);this.errors.push('music: '+e);toast('Tap the sound button to enable audio.');}}
 }
 sample(name,vol=.65,rate=1){if(this.muted||!this.ctx||this.ctx.state!=='running'||!this.buffers[name]||this.active.size>=10)return;const b=this.ctx.createBufferSource(),g=this.ctx.createGain();b.buffer=this.buffers[name];b.playbackRate.value=rate;g.gain.value=vol;b.connect(g);g.connect(this.bus);this.bus.gain.value=settings.sfx;b.start();this.active.add(b);this.played[name]=(this.played[name]||0)+1;b.onended=()=>{this.active.delete(b);b.disconnect();g.disconnect();};}
 event(e){if(e.type==='swing')this.sample(e.sound,.22,1.05);if(e.type==='hit'){this.sample(e.sound,.72,.94+Math.random()*.12);this.duck=.18;}
  if(e.type==='footstep')this.sample(Math.random()<.5?'step1':'step2',.13,.95+Math.random()*.12);if(e.type==='land'||e.type==='entryLand')this.sample('step2',.23,.9);if(e.type==='jump')this.sample('swish',.10,1.3);
  if(e.type==='enemySwing'){this.sample(e.kind==='franklin'?'elder-strike':'backhand',.23,1);}
  if(e.type==='slam')this.sample('slam',.55,.94);if(e.type==='block'||e.type==='parry')this.sample(e.type==='parry'?'elder-strike':'hit',.37,1.25);if(e.type==='break')this.sample('slam',.26,1.4);
  if(e.type==='playerHit')this.sample('hit',.62,.78);if(e.type==='playerDeath')this.sample('fall',.66,.9);
  if(e.type==='ko'&&performance.now()/1000-this.lastVoice>.9){this.lastVoice=performance.now()/1000;this.sample(this.buffers[e.kind+'-hit']?e.kind+'-hit':e.kind==='franklin'?'elder-hit':'hit',.42,1);}
  if(e.type==='encounter'){this.sample('bear-call',.28,1.0);}if(e.type==='special'){this.sample('backhand',.60,.70);this.duck=.5;}
 }
 pause(){this.wantMusic=false;this.musicSerial++;this.music.pause();if(this.outgoing)this.outgoing.pause();for(const n of this.active){try{n.stop();}catch(_){}}this.active.clear();}
 update(dt){
  this.duck=Math.max(0,this.duck-dt);if(this.wantMusic&&!this.music.paused)this.fade=Math.min(1,this.fade+dt/.9);
  const level=this.muted?0:settings.music*(this.duck>0?.62:1);this.music.volume=level*Math.sin(this.fade*Math.PI/2);
  if(this.outgoing){this.outgoing.volume=level*Math.cos(this.fade*Math.PI/2);if(this.fade>=1){this.outgoing.pause();this.outgoing=null;}}
  if(this.bus)this.bus.gain.value=this.muted?0:settings.sfx;
 }
 toggle(){if(this.lastBlocked&&this.music.paused&&!this.muted){this.gesture();this.playMusic(this.trackKey);toast('Retrying audio');return;}this.muted=!this.muted;if(this.muted){this.music.pause();if(this.outgoing)this.outgoing.pause();}else if(['play','stageclear','complete','title','cutscene'].includes(game.mode))this.playMusic(game.mode==='cutscene'?scenes?.scene?.music||stageMusic():['title','complete'].includes(game.mode)?'title':undefined);toast(this.muted?'Audio muted':'Audio on');}

}
const game=new Brawler.Game(),audio=new AudioSystem(),input=new Input();game.franklinUnlocked=profile.franklinUnlocked;let renderer,meta,ready=false,last=performance.now(),acc=0,fromGallery='title',galleryTime=0,galleryPlaying=true,completeTime=0,tipTime=0,clearTime=0,presentationPaused=false,openingArrival=null;
pad=new CriticGamepad.Hub({storage:{getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)},onDisconnect:()=>{input.clear();if(scenes?.active){scenes.togglePause(true);toast('Controller disconnected. Resume with touch, keyboard, or the reconnected pad.');}if(game.mode==='play'){pause();toast('Controller disconnected. Reconnect or use touch / keyboard, then Resume.');}},onMapped:()=>toast('Controller mapping saved. Release controls to continue.')});

window.__brawler={game,input,audio,controller:pad,ready:()=>ready,renderer:()=>renderer,meta:()=>meta,start:()=>start(false),pause,resume,getInput:()=>input.snapshot(false),getSave:()=>readStore(conf.saveKey),getProfile:()=>({...profile}),restartStage4,scenes:()=>scenes,continueDistrict,handleEvent:handle,openingArrival:()=>openingArrival?{...openingArrival}:null};
function show(id,on){$(id).hidden=!on;}
function screen(which){if(pad)pad.suspend();for(const id of ['title','pause','gameover','complete','gallery','stageclear'])show(id,id===which);const play=which===null;show('hud',play);show('controls',play);if(!play){show('targetHud',false);show('comboHud',false);show('tip',false);show('bossHud',false);}}
function beginGame(cont){if(scenes?.active)return;openingArrival=null;input.clear();game.franklinUnlocked=profile.franklinUnlocked;const who=cont&&save?.playerKind?save.playerKind:selected;game.start(cont?save:null,who);if(game.franklinUnlocked&&!profile.franklinUnlocked){profile.franklinUnlocked=true;store(conf.profileKey,profile);updateRoster();}updatePortrait();screen(null);audio.playMusic();completeTime=0;tipTime=9;$('tip').textContent='Push farther to run. HIT chains a combo. JUMP + HIT = jump kick.';show('tip',true);ensureStageAssets();if(!cont)playScene('opening');else if(save?.version<4&&save.complete)playScene('stage-05-intro');}
// The watched studio launch hands off to the real street canvas. The accepted
// player gravity and landing code owns this short fall; it is never a scene sprite.
function beginOpeningArrival(){
 if(openingArrival?.started||game.stage!==0)return false;
 const p=game.p;input.clear();p.z=210;p.vz=-110;p.vx=p.vy=0;p.face=1;p.action=null;p.guard=false;p.attackBuffer=p.jumpBuffer=0;p.cosmetic=null;p.airUsed=false;p.landTimer=0;p.anim='fall';p.animT=0;p.animDuration=.2;
 openingArrival={started:true,active:true,landed:false,character:game.playerKind,stage:0,canvas:'game',startedAt:game.t};return true;
}
function pause(){if(game.mode!=='play')return;game.pause();input.clear();audio.pause();screen('pause');$('resumeButton').hidden=false;$('restartStage4').hidden=game.stage!==3;}
function resume(){if(game.mode!=='pause')return;game.resume();input.clear();screen(null);audio.playMusic();}
function title(){if(openingArrival?.active){game.p.z=game.p.vz=0;openingArrival.active=false;}game.mode='title';input.clear();audio.playMusic('title');screen('title');save=validSave(readStore(conf.saveKey)||readStore(conf.legacySaveKey));updateRoster();$('continueButton').hidden=!save;updateDestinationButtons();}
function updatePortrait(){$('portrait').src=src(game.playerKind==='franklin'?'franklin-icon.png':'icon.png');$('playerName').textContent=game.playerKind==='franklin'?'FRANKLIN':'JAY SHERMAN';}
function updateRoster(){const o=$('playerSelect').querySelector('[value="franklin"]');o.disabled=!profile.franklinUnlocked;o.textContent=profile.franklinUnlocked?'Franklin':'Franklin · LOCKED';$('playerSelect').value=selected;$('rosterNote').textContent=profile.franklinUnlocked?'Franklin unlocked. Choose your character, then Press Start.':'Unlock Franklin: defeat him and finish Stage 4 without dying.';}
function restartStage4(){if(!game.restartStage4())return;input.clear();screen(null);updatePortrait();audio.playMusic();tipTime=5;$('tip').textContent='Fresh Stage 4 attempt. Fight your way to the exit.';}
$('playerSelect').onchange=()=>{selected=$('playerSelect').value==='franklin'&&profile.franklinUnlocked?'franklin':'hero';profile.selected=selected;store(conf.profileKey,profile);updateRoster();prepareSelectedRoute();};
$('restartStage4').onclick=restartStage4;$('retryStage4Reward').onclick=restartStage4;$('playFranklin').onclick=()=>{if(!profile.franklinUnlocked)return;selected='franklin';profile.selected=selected;store(conf.profileKey,profile);updateRoster();start(false);};
updateRoster();
async function openGallery(){if(!meta||!ready||destinationBusy||scenes?.active)return;fromGallery=game.mode;if(game.mode==='play'){game.pause();fromGallery='pause';}input.clear();audio.pause();game.mode='gallery';screen('gallery');fillAnimations();}
function fillAnimations(){if(!meta||!ready)return;const who=$('characterSelect').value,a=meta.characters[who];if(!a)return;gallerySerial++;$('animSelect').replaceChildren();for(const [key,an] of Object.entries(a)){const o=document.createElement('option');o.value=key;o.textContent=canonicalText(an.label);$('animSelect').appendChild(o);}galleryTime=0;galleryReady=true;$('galleryCanvas').hidden=false;for(const id of ['characterSelect','animSelect','prevAnim','nextAnim','playAnim'])$(id).disabled=false;galleryInfo();}

function galleryInfo(){const who=$('characterSelect').value,an=meta.characters[who][$('animSelect').value];$('galleryInfo').textContent=`${an.frames.length} frames · ${(an.ms/1000).toFixed(2)}s source duration · ${an.loop?'Loop':'One-shot'}${an.sourceDescription?' · '+canonicalText(an.sourceDescription):''}`;}
function closeGallery(){gallerySerial++;galleryReady=false;input.clear();game.mode=fromGallery;screen(fromGallery==='pause'?'pause':fromGallery==='complete'?'complete':'title');if(fromGallery==='complete'||fromGallery==='title')audio.playMusic('title');}
$('startButton').onclick=()=>start(false);$('continueButton').onclick=()=>start(true);$('movesButton').onclick=()=>{input.clear();screen('pause');$('resumeButton').hidden=true;$('restartStage4').hidden=true;};$('pauseBtn').onclick=pause;$('resumeButton').onclick=resume;$('titleButton').onclick=title;$('overTitle').onclick=title;$('completeTitle').onclick=title;$('againButton').onclick=()=>start(false);
$('retryButton').onclick=()=>{game.retry(true);input.clear();screen(null);audio.playMusic();};$('galleryButton').onclick=openGallery;$('pauseGallery').onclick=openGallery;$('completeGallery').onclick=openGallery;$('closeGallery').onclick=closeGallery;$('characterSelect').onchange=fillAnimations;$('animSelect').onchange=()=>{galleryTime=0;galleryInfo();};
function nextAnim(d){let s=$('animSelect');s.selectedIndex=(s.selectedIndex+d+s.options.length)%s.options.length;galleryTime=0;galleryInfo();}
$('prevAnim').onclick=()=>nextAnim(-1);$('nextAnim').onclick=()=>nextAnim(1);$('playAnim').onclick=()=>{galleryPlaying=!galleryPlaying;$('playAnim').textContent=galleryPlaying?'Pause':'Play';};$('soundBtn').onclick=()=>audio.toggle();
$('fullBtn').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.webkitFullscreenElement&&document.webkitExitFullscreen)document.webkitExitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else if(document.documentElement.webkitRequestFullscreen)document.documentElement.webkitRequestFullscreen();else toast('Fullscreen is unavailable in this browser view.');}catch(e){toast('Open in your browser to use fullscreen.');}};
for(const id of ['musicVolume','sfxVolume','reducedMotion','vibration'])$(id).oninput=()=>{settings.music=+$('musicVolume').value/100;settings.sfx=+$('sfxVolume').value/100;settings.reducedMotion=$('reducedMotion').checked;settings.vibration=$('vibration').checked;store(conf.settingsKey,settings);if(settings.music>0&&!audio.muted&&audio.music.paused&&['play','stageclear','complete'].includes(game.mode))audio.playMusic(game.mode==='complete'?'title':undefined);};
window.addEventListener('blur',()=>{input.clear();input.physicalKeys.clear();input.blockedKeys.clear();if(scenes?.active){scenes.togglePause(true);return;}if(game.mode==='play')pause();else if(['stageclear','complete','title'].includes(game.mode)){presentationPaused=true;audio.pause();}});
window.addEventListener('focus',()=>{if(presentationPaused&&!document.hidden){presentationPaused=false;if(['stageclear','complete'].includes(game.mode))audio.playMusic(game.mode==='complete'?'title':undefined);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){input.clear();input.physicalKeys.clear();input.blockedKeys.clear();if(scenes?.active){scenes.togglePause(true);return;}if(game.mode==='play')pause();else{presentationPaused=true;audio.pause();}}else if(presentationPaused){presentationPaused=false;if(['stageclear','complete'].includes(game.mode))audio.playMusic(game.mode==='complete'?'title':undefined);}});
window.addEventListener('resize',()=>{input.clear();if(renderer)game.viewWidth=renderer.resize().w;});window.addEventListener('contextmenu',e=>e.preventDefault());
// A single bounded startup download owns all current runtime dependencies. Optional
// source performances remain available, but no destination opens on partial data.
let assetImages=[],assetPending=false,assetError='',stageAssetsPromise=Promise.resolve(),destinationBusy=false,galleryReady=false,gallerySerial=0,scenePreparing=false;
const sceneQueue=[],imageCache=new Map(),fileJobs=new Map(),completedFiles=new Set();
const bulk={policy:'all-runtime-at-startup',phase:'metadata',totalFiles:1,completedFiles:0,downloadedBytes:0,decodedImages:0,activeWorkers:0,failures:[],error:'',ready:false};
let bulkRunning=false,bulkPlan=[];
const assetScreen=document.createElement('section');assetScreen.id='contentLoading';assetScreen.className='screen';assetScreen.hidden=true;assetScreen.innerHTML='<div class="panel"><p class="eyebrow">COMING ATTRACTIONS</p><h2>Preparing the game.</h2><p id="contentLoadStatus" role="status">Loading required artwork…</p><button id="contentLoadRetry" class="primary full" hidden>RETRY DOWNLOAD</button></div>';document.body.appendChild(assetScreen);
const initialRetry=document.createElement('button');initialRetry.id='initialLoadRetry';initialRetry.className='full';initialRetry.textContent='RETRY DOWNLOAD';initialRetry.hidden=true;$('loadtext').insertAdjacentElement('afterend',initialRetry);
const optionsProgress=document.createElement('p');optionsProgress.id='bulkLoadStatusOptions';optionsProgress.className='small';optionsProgress.setAttribute('role','status');$('saveNote').insertAdjacentElement('afterend',optionsProgress);
const optionsRetry=document.createElement('button');optionsRetry.id='bulkLoadRetryOptions';optionsRetry.className='full';optionsRetry.textContent='RETRY DOWNLOAD';optionsRetry.hidden=true;optionsProgress.insertAdjacentElement('afterend',optionsRetry);
function pageIdsForBank(who,scope='all'){const bank=meta?.characters?.[who];if(scope==='gameplay'&&meta?.loading?.gameplay?.[who])return meta.loading.gameplay[who];return bank?[...new Set(Object.values(bank).flatMap(a=>a.frames.map(f=>f.p)))]:[];}
function pageIdsForAnimation(who,name){return [...new Set((meta?.characters?.[who]?.[name]?.frames||[]).map(f=>f.p))];}
function stagePageIds(stageIndex,who){const stage=Brawler.STAGES[stageIndex]||Brawler.STAGES[0],banks=[who,...stage.waves.flat(),stage.boss?.kind,'trash-can',...(stageIndex>=4?['turkey-dinner']:[])];if(stageIndex===6)banks.push('duke','marty');return [...new Set(banks.filter(Boolean).flatMap(bank=>pageIdsForBank(bank,'gameplay')))];}
function loadingState(){return {...bulk,failures:[...bulk.failures],totalAtlasPages:meta?.pages.length||0,decodedAtlasPages:assetImages.filter(Boolean).length,cachedAudioFiles:audio.bytes.size,cachedMusicFiles:new Set(Object.values(conf.music).map(item=>item.file).filter(file=>cachedURLs.has(file))).size,cachedImages:imageCache.size};}
window.__brawler.loading=loadingState;
function progress(){bulk.completedFiles=completedFiles.size;const percentage=Math.floor(100*bulk.completedFiles/Math.max(1,bulk.totalFiles));$('loadbar').firstElementChild.style.width=percentage+'%';$('loadtext').textContent=bulk.error?'Download paused. '+bulk.completedFiles+' / '+bulk.totalFiles+' files ready. Retry to finish.':ready?'All game files ready. No scene downloads.':'Loading all game files · '+bulk.completedFiles+' / '+bulk.totalFiles+' · '+percentage+'% · '+(bulk.downloadedBytes/1048576).toFixed(1)+' MB · '+bulk.decodedImages+' images decoded';optionsProgress.textContent=$('loadtext').textContent;optionsRetry.hidden=!bulk.error;}
function updateDestinationButtons(){const blocked=!ready||destinationBusy||scenePreparing;$('startButton').disabled=blocked;$('continueButton').disabled=blocked||!save;for(const id of ['againButton','playFranklin'])$(id).disabled=blocked;for(const id of ['galleryButton','pauseGallery','completeGallery']){$(id).disabled=blocked;$(id).title=blocked?'All required game files are loading.':'';}$('startButton').textContent=!ready?'LOADING ALL FILES…':'PRESS START';$('continueButton').textContent=!ready?'Continue · loading':'Continue';}
function prepareSelectedRoute(){updateDestinationButtons();}
async function start(cont){if(!ready||destinationBusy||scenes?.active||scenePreparing||cont&&!save)return;input.clear();beginGame(cont);}
async function readBytes(name){if(inline){const value=inline.files[name];if(!value)throw new Error('Missing bundled file: '+name);const comma=value.indexOf(','),str=atob(value.slice(comma+1)),data=new Uint8Array(str.length);for(let i=0;i<str.length;i++)data[i]=str.charCodeAt(i);return {data:data.buffer,type:value.slice(5,value.indexOf(';'))};}const response=await fetch(rawSrc(name));if(!response.ok)throw new Error(name+' (HTTP '+response.status+')');return {data:await response.arrayBuffer(),type:response.headers.get('content-type')||'application/octet-stream'};}
async function loadFile(job){if(completedFiles.has(job.name))return;let promise=fileJobs.get(job.name);if(!promise){promise=(async()=>{const bytes=await readBytes(job.name);bulk.downloadedBytes+=bytes.data.byteLength;progress();if(job.kind==='wav'){audio.bytes.set(job.name,bytes.data);}else{const url=URL.createObjectURL(new Blob([bytes.data],{type:bytes.type}));cachedURLs.set(job.name,url);if(job.kind==='image'){const image=new Image();try{await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('Invalid image: '+job.name));image.src=url;});if(typeof image.decode==='function')await image.decode();if(!image.naturalWidth)throw new Error('Empty image: '+job.name);imageCache.set(job.name,image);if(job.page!==undefined)assetImages[job.page]=image;renderer.art.set(job.name,image);scenes?.imageCache.set(job.name,image);scenes?.imageJobs.set(job.name,Promise.resolve(image));bulk.decodedImages++;}catch(error){URL.revokeObjectURL(url);cachedURLs.delete(job.name);throw error;}}}completedFiles.add(job.name);progress();})();fileJobs.set(job.name,promise);}try{await promise;}catch(error){fileJobs.delete(job.name);throw error;}}
async function loadPages(ids){for(const id of new Set(ids)){if(!assetImages[id])throw new Error('Required atlas is not ready: '+meta.pages[id]?.file);}}
function ensureStageAssets(){return ready?Promise.resolve():Promise.reject(new Error('Startup files are still loading.'));}
function showAssetLoading(){assetScreen.hidden=false;$('contentLoadStatus').textContent='Required game files are loading. Return to the title to retry.';}
function makePlan(){const jobs=new Map(),add=(name,kind='image',page)=>{if(name&&!jobs.has(name))jobs.set(name,{name,kind,page});};meta.pages.forEach((page,index)=>add(page.file,'image',index));for(const speaker of Object.values(meta.portraits?.speakers||{}))for(const expression of Object.values(speaker.expressions||{}))for(const frame of expression.frames||[])add(String(frame.image||frame.file||'').replace(/^assets\//,''));for(const id of Object.keys(CriticCutscenes.scenes))for(const route of ['hero','franklin'])for(const name of CriticCutscenes.dependencies(id,route,meta).images)add(name);for(const name of ['title.png','icon.png','franklin-icon.png','environments/pizzeria.webp','environments/broadcast.webp','environments/cinema.webp','story/projection-woman-pixel.webp'])add(name);for(const item of Object.values(conf.music))add(item.file,'music');for(const name of audio.cueNames)add(name+'.wav','wav');return [...jobs.values()];}
async function load(){if(bulkRunning||ready)return;bulkRunning=true;bulk.error='';bulk.failures=[];initialRetry.hidden=true;updateDestinationButtons();progress();try{if(!meta){if(!window.fetch&&!inline)throw new Error('This browser does not support asset loading.');if(inline)meta=inline.sprites;else{const response=await fetch(rawSrc('sprites.json'));if(!response.ok)throw new Error('Sprite manifest (HTTP '+response.status+')');const bytes=await response.arrayBuffer();bulk.downloadedBytes+=bytes.byteLength;meta=JSON.parse(new TextDecoder().decode(bytes));}completedFiles.add('sprites.json');renderer=new CityRenderer($('game'),meta,assetImages);renderer.onMissingAnimation=(who,name)=>{const ids=pageIdsForAnimation(who,name);if(ids.some(id=>!assetImages[id]))console.error('Required atlas missing after startup:',who,name);};game.viewWidth=renderer.rect.w;requestAnimationFrame(loop);bulkPlan=makePlan();bulk.totalFiles=bulkPlan.length+1;}bulk.phase='bulk';progress();const pending=bulkPlan.filter(job=>!completedFiles.has(job.name));let cursor=0;const failures=[];const worker=async()=>{bulk.activeWorkers++;try{while(cursor<pending.length){const job=pending[cursor++];try{await loadFile(job);}catch(error){failures.push({file:job.name,error:String(error)});}}}finally{bulk.activeWorkers--;}};await Promise.all(Array.from({length:Math.min(4,pending.length)},worker));if(failures.length){bulk.failures=failures;throw new Error(failures.length+' file'+(failures.length===1?'':'s')+' could not load.');}ready=true;bulk.ready=true;bulk.phase='ready';bulk.error='';$('titleArt').src=src('title.png');updatePortrait();audio.chooseTrack('title');if(audio.ctx)audio.ready=audio.decode();initialRetry.hidden=true;$('loadbar').hidden=true;progress();updateDestinationButtons();if(audio.wantMusic)audio.playMusic(audio.trackKey);}catch(error){bulk.error=String(error);bulk.phase='error';initialRetry.hidden=false;progress();updateDestinationButtons();}finally{bulkRunning=false;}}
initialRetry.onclick=load;optionsRetry.onclick=load;$('contentLoadRetry').onclick=load;

function handle(e){if(e.type==='land'&&openingArrival?.active){openingArrival.active=false;openingArrival.landed=true;openingArrival.landedAt=game.t;game.knockdown(0,'cinematic-landing',.72);}if(renderer)renderer.emit(e);audio.event(e);if(settings.vibration&&navigator.vibrate&&['hit','parry','playerHit'].includes(e.type))navigator.vibrate(e.type==='hit'?12:22);
 if(e.type==='save'){save=e.save;store(conf.saveKey,e.save);updateDestinationButtons();}
 if(e.type==='unlock'){profile.franklinUnlocked=true;game.franklinUnlocked=true;store(conf.profileKey,profile);updateRoster();toast('FRANKLIN UNLOCKED');}
 if(e.type==='bossEnter'){tipTime=3;$('tip').textContent=(e.name||'BOSS')+'. Watch the windup, then punish the recovery.';show('tip',!scenes?.active);}
 if(e.type==='stageDeath'&&e.stage===3&&game.playerKind!=='franklin'&&!profile.franklinUnlocked){toast('Stage 4 death recorded. Restart Stage 4 for a fresh unlock attempt.');}
 if(e.type==='story'){playScene(e.id);}
 if(e.type==='stage'){ensureStageAssets();audio.playMusic();if(scenes?.active){sceneReturnMode='play';screen('cutscene');}else if(!assetPending)screen(null);input.clear();tipTime=2.5;$('tip').textContent=Brawler.STAGES[game.stage].name;}
 if(e.type==='stageClear'){clearTime=0;presentationPaused=false;input.clear();if(scenes?.active||scenePreparing||sceneQueue.length){sceneReturnMode='stageclear';screen('cutscene');}else screen('stageclear');$('clearHeading').textContent=Brawler.STAGES[e.stage].name+' cleared';$('clearNext').textContent='Next: '+Brawler.STAGES[e.next].name;$('clearContinue').disabled=true;$('clearTrack').textContent='Next track: '+(conf.music[Brawler.STAGES[e.next]?.music]||conf.music[['broadway','subway','rooftop','theater','theater','broadway','rooftop'][e.next]]||conf.music.title).label;}
 if(e.type==='gameover'){screen('gameover');audio.pause();input.clear();}
 if(e.type==='complete'){prepareResults();if(scenes?.active||scenePreparing)sceneReturnMode='complete';playScene(e.ending||'ending','complete');}
 if(e.type==='clear'){tipTime=2.8;$('tip').textContent=game.stage===3&&game.bossDefeated?'Boss defeated. Head right to the exit.':game.nextGate===3?'Block clear. Head right to the next district.':'Block clear. Health restored. Keep moving right.';show('tip',true);}
 if(e.type==='retry'){screen(null);tipTime=3;$('tip').textContent='Back on your feet. This block is your checkpoint.';}
 if(e.type==='runBlocked'){audio.sample('heavy',.48,.83);tipTime=1.8;$('tip').textContent='RUN ATTACK BLOCKED · USE PUNCHES / KICKS';show('tip',true);}
 if(e.type==='parry'){tipTime=1.2;$('tip').textContent='PARRY! HIT now for a two-palm counter.';show('tip',true);}
}
function hud(){const p=game.p,boss=game.enemies.find(e=>e.boss&&e.hp>0&&!e.hidden&&(!e.entry||e.entry.phase==='settle'));const circuitFight=game.stage===4&&game.props.some(o=>o.kind==='circuit')&&!game.projection.disabled,off=game.projection.circuits.filter(c=>!c.active).length;show('bossHud',game.mode==='play'&&(!!boss||circuitFight));if(boss){$('bossName').textContent=boss.name.toUpperCase();$('bossFill').style.width=100*boss.hp/boss.maxHp+'%';$('bossMove').textContent=boss.state==='windup'?boss.move?.name||'READY':'FINAL BILL';$('unlockStatus').textContent=circuitFight?'DISABLE THE 3 PROJECTION CIRCUITS · '+off+'/3 OFF':game.stage!==3?'RESCUE MARTY / STOP THE BROADCAST':game.playerKind==='franklin'?'STAGE 4 CHALLENGE':profile.franklinUnlocked?'FRANKLIN ALREADY UNLOCKED':game.stage4Eligible&&game.deathsByStage[3]===0?'UNLOCK RUN: NO DEATHS IN STAGE 4':'UNLOCK RUN MISSED / RESTART STAGE 4 TO RETRY';}else if(circuitFight){$('bossName').textContent='PROJECTION BOOTH';$('bossMove').textContent=off+'/3 CIRCUITS OFF';const circuits=game.props.filter(o=>o.kind==='circuit');$('bossFill').style.width=100*circuits.reduce((sum,o)=>sum+Math.max(0,o.hp),0)/(circuits.length*45)+'%';$('unlockStatus').textContent='DISABLE THE 3 PROJECTION CIRCUITS';}$('healthFill').style.width=p.hp+'%';$('meterFill').style.width=p.meter+'%';$('lives').textContent=p.lives+' '+(p.lives===1?'LIFE':'LIVES');$('score').textContent=String(game.score||0).padStart(6,'0');$('stageName').textContent=`${game.stage+1}/${Brawler.STAGES.length} · ${Brawler.STAGES[game.stage].name}`;$('specialValue').textContent=p.meter>=100?'READY':Math.floor(p.meter)+'%';$('special').classList.toggle('ready',p.meter>=100);show('comboHud',game.mode==='play'&&p.combo>1);$('comboNum').textContent=p.combo;$('comboText').textContent=p.combo>=10?'CRITICAL ACCLAIM':'HIT COMBO';const t=game.target;show('targetHud',game.mode==='play'&&!boss&&!!t&&t.hp>0&&game.targetT>0&&p.z<35);if(t){$('targetName').textContent=t.name.toUpperCase();$('targetFill').style.width=100*t.hp/t.maxHp+'%';}}
function drawGallery(dt){
 if(galleryPlaying)galleryTime+=dt;const c=$('galleryCanvas'),w=c.clientWidth,h=c.clientHeight;if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
 const ctx=c.getContext('2d');ctx.clearRect(0,0,w,h);const who=$('characterSelect').value,name=$('animSelect').value,a=meta.characters[who][name];
 const nativeFace=f=>renderer.nativeFacing(who,name,f,a);
 const minY=Math.min(...a.frames.map(f=>f.oy)),maxY=Math.max(0,...a.frames.map(f=>f.oy+f.h)),minX=Math.min(...a.frames.map(f=>nativeFace(f)===-1?-f.ox-f.w:f.ox)),maxX=Math.max(...a.frames.map(f=>nativeFace(f)===-1?-f.ox:f.ox+f.w));
 const sc=Math.min(1.08,(h-38)/(maxY-minY),(w-35)/(maxX-minX)),t=galleryTime%(a.ms/1000+.65),x=w/2-(minX+maxX)*sc/2,y=h-22-Math.max(0,maxY)*sc;
 renderer.shadow(ctx,who,name,x,y,1,t,0,sc,0,.38);renderer.sprite(ctx,who,name,x,y,1,t,0,{scale:sc,loop:false});
}
function continueDistrict(){if(game.mode!=='stageclear'||clearTime<.4)return;input.clear();game.finishStageClear();for(const e of game.drain())handle(e);if(scenes?.active)screen('cutscene');else if(!assetPending)screen(null);}
$('clearContinue').onclick=continueDistrict;
function loop(now){let dt=Math.min(.07,(now-last)/1000||.016);last=now;if(!document.hidden){if(scenes?.active){pad.poll(now);scenes.controller(pad.snapshot(true));}else controllerUI.tick(now);}audio.update(dt);if(scenes?.active)scenes.update(dt);
 if(game.mode==='play'){acc+=dt;let steps=0;while(acc>=1/120&&steps++<9){game.step(1/120,input.snapshot(true));acc-=1/120;for(const e of game.drain())handle(e);if(game.mode!=='play')break;}tipTime=Math.max(0,tipTime-dt);show('tip',tipTime>0);}else{acc=0;input.snapshot(true);}
 if(game.mode==='stageclear'){if(!presentationPaused)clearTime+=dt;$('clearContinue').disabled=clearTime<.4;renderer.showcase($('clearCanvas'),game,clearTime);if(clearTime>=4&&!presentationPaused)continueDistrict();}
 if(game.mode==='complete'){if(!presentationPaused)completeTime+=dt;renderer.showcase($('victoryCanvas'),game,completeTime);game.p.anim=completeTime<.7?'dance-enter':'dance-loop';game.p.animT=completeTime<.7?completeTime:completeTime-.7;game.p.animDuration=completeTime<.7?.7:0;}
 if(game.mode==='title'){game.p.anim='idle';game.p.animT+=dt;}
 renderer.draw(game,['pause','cutscene','loading','confrontation'].includes(game.mode)?0:dt);if(game.mode==='gallery'&&galleryReady)drawGallery(dt);hud();requestAnimationFrame(loop);
}
function prepareResults(){
 const replay=game.playerKind==='franklin';
 $('rewardHeading').textContent=replay?'FRANKLIN / THE FINAL CURTAIN':'MARTY IS HOME';
 $('rewardText').textContent=replay?'Franklin helped bring the broadcast to an end. Marty is safe.':profile.franklinUnlocked?'Marty is safe and Duke’s broadcast is stopped. Franklin is available for another run.':'Marty is safe and Duke’s broadcast is stopped. Clear Stage 4 without dying to unlock Franklin.';
 $('playFranklin').hidden=!profile.franklinUnlocked||replay;$('retryStage4Reward').hidden=true;
 completeTime=0;presentationPaused=false;input.clear();
 $('results').innerHTML=`<div><b>${String(game.score).padStart(6,'0')}</b><span>SCORE</span></div><div><b>${game.stats.maxCombo}</b><span>BEST COMBO</span></div><div><b>${game.stats.kos}</b><span>KNOCKOUTS</span></div><div><b>${Math.floor(game.t/60)}:${String(Math.floor(game.t%60)).padStart(2,'0')}</b><span>RUN TIME</span></div>`;
}
function playScene(id,returnMode){
 const scene=window.CriticCutscenes?.scenes[id];if(!scene||!scenes)return false;
 const resumeMode=returnMode||(['loading','confrontation','cutscene'].includes(game.mode)?'play':game.mode);
 sceneQueue.push({id,scene,returnMode:resumeMode});pumpScenes();return true;
}
async function pumpScenes(){
 if(scenePreparing||scenes?.active||!sceneQueue.length)return;scenePreparing=true;updateDestinationButtons();
 const task=sceneQueue.shift();sceneReturnMode=task.returnMode;game.mode='cutscene';input.clear();screen('cutscene');
 try{
 const deps=window.CriticCutscenes.dependencies?.(task.id,game.playerKind,meta)||{banks:[]},ids=[...(deps.banks||[]).filter(who=>!deps.animations?.[who]).flatMap(who=>meta?.loading?.scenes?.[who]||pageIdsForBank(who,'gameplay'))];
 for(const [who,names] of Object.entries(deps.animations||{}))for(const name of names)ids.push(...pageIdsForAnimation(who,name));
 await Promise.all([stageAssetsPromise,loadPages(ids),scenes.prepare?.(task.scene)||Promise.resolve()]);
 scenePreparing=false;updateDestinationButtons();assetScreen.hidden=true;
 scenes.play(task.scene,result=>{
 if(task.completed)return;task.completed=true;
 if(task.id==='opening'&&!result?.skipped&&result?.reason==='gameplayEntry')beginOpeningArrival();
 game.storyFlags=game.storyFlags||{};game.storyFlags[task.id]=true;
 if(task.id==='boss-broadcast-defeat'&&typeof game.finishDukeConfrontation==='function'){game.dukeStaged=game.storyActors?.find(a=>a.kind==='duke');game.finishDukeConfrontation();game.storyActors=(game.storyActors||[]).filter(a=>a.kind!=='duke');for(const event of game.drain())handle(event);}
 if(game.checkpoint)game.checkpoint={...game.checkpoint,storyFlags:{...game.storyFlags}};
 if(typeof game.snapshot==='function'){save={...game.snapshot(),complete:sceneReturnMode==='complete'};store(conf.saveKey,save);}
 });
 }catch(e){scenePreparing=false;updateDestinationButtons();sceneQueue.unshift(task);assetError=String(e);$('contentLoadStatus').textContent='Required story files could not load. Your checkpoint is safe.';$('contentLoadRetry').hidden=false;game.mode='loading';}
}

function beginWorldScene(scene){
 if(!scene.worldStage)return;
 game.storyActors=game.storyActors||[];
 // A live boss owns its single entrance. The overlay never creates a second copy.
 game.sceneClock=0;
}
function drawWorldScene(s){
 const dt=s.paused||s.loading?0:Math.max(0,Math.min(.05,s.totalTime-(game.sceneClock||0)));game.sceneClock=s.totalTime;
 s.actorStates=[];
 if(s.shot.booth&&game.stage===4){const a=game.projection,booth=game.projection.booths.find(b=>b.x>=game.camera+70&&b.x<=game.camera+renderer.rect.w-70);if(booth){a.window=booth.id;a.visible=s.shot.booth.phase!=='off';a.phase=s.shot.booth.phase==='shadow'?'shadow':'reveal';a.timer=s.time;s.boothState={phase:s.shot.booth.phase,active:booth.id};}}
 const realBoss=game.enemies.find(e=>e.boss&&e.kind!=='broadcast-rig');
 if(realBoss?.entry){game.updateEntry(realBoss,dt);}
 if(realBoss&&realBoss.hp<=0){realBoss.timer+=dt;realBoss.anim='death';realBoss.animT=realBoss.timer;}
 const active=new Set();
 for(const a of s.shot.actors||[]){
  if(a.hidden||a.routes&&!a.routes.includes(game.playerKind))continue;
  const who=a.character==='selected'?game.playerKind:a.character,isPlayer=a.id==='player',isBoss=realBoss?.kind===who;
  let body=isPlayer?game.p:isBoss?realBoss:game.storyActors.find(e=>e.id===a.id);
  if(!body){body={id:a.id,kind:who,x:game.camera+Math.min(renderer.rect.w-100,a.x),y:who==='duke'&&game.stage===6?324:407,face:-1,anim:'idle',animT:0,renderScale:a.scale||1};game.storyActors.push(body);}
  active.add(a.id);
  if(!isBoss){
   const key=s.index+':'+a.id;
   if(!s.worldActors.has(key))s.worldActors.set(key,{x:body.x,y:body.y});
   const origin=s.worldActors.get(key),m=a.motion;
   if(m){const u=Brawler.clamp((s.time-(m.start||0))/(m.duration||1),0,1);const dx=(m.toX??a.x)-(m.fromX??a.x);body.x=origin.x+dx*u;body.face=dx<0?-1:1;body.anim=u<1?(a.animation||'walk'):'idle';}
   else{body.anim=a.animation==='death'?'death':a.animation||'idle';if(a.face)body.face=a.face;}
   body.animT=body.anim==='death'?1.7:s.time;body.animDuration=body.anim==='death'?1.7:0;
  }
  s.actorStates.push({id:a.id,character:who,x:body.x,y:body.y,animation:body.anim,visible:true,resolvedFace:body.face,faceReason:a.motion?'motion':a.face?'explicit':'world-continuity'});
 }
 game.storyActors=game.storyActors.filter(a=>active.has(a.id));const boy=game.storyActors.find(a=>a.kind==='marty');game.storyCage=s.shot.cage&&boy?{x:boy.x,y:boy.y,open:!!s.shot.cage.open}:null;
}
scenes=window.CriticScenePlayer?new CriticScenePlayer({beginWorldScene,drawWorldScene,resolve:src,character:()=>game.playerKind,renderer:()=>renderer,meta:()=>meta,settings:()=>settings,clearInput:()=>input.clear(),sound:name=>audio.sample(name,.45),music:key=>audio.playMusic(key),onOpen:()=>{assetScreen.hidden=true;game.mode='cutscene';input.clear();screen('cutscene');if(document.hidden)scenes.togglePause(true);},onPause:on=>{if(on)audio.pause();else audio.playMusic(scenes?.scene?.music||stageMusic());},onIdle:()=>{if(sceneQueue.length){pumpScenes();return;}if(scenePreparing)return;if(assetPending){showAssetLoading();return;}game.storyActors=[];game.storyCage=null;if(game.stage===4&&!game.projection.active){game.projection.visible=false;game.projection.phase='waiting';game.projection.timer=0;}game.mode=sceneReturnMode;input.clear();screen(game.mode==='play'?null:game.mode);audio.playMusic(game.mode==='complete'?'title':stageMusic());}}):null;
const controllerUI=CriticControllerUI({hub:pad,game,input,ready:()=>ready,pause,resume,title,start:()=>start(false),closeGallery,continueDistrict});
function gestureAudio(){audio.gesture();if(ready&&game.mode==='title'&&!audio.wantMusic)audio.playMusic('title');if(audio.wantMusic&&audio.music.paused&&!audio.muted&&settings.music>0)audio.playMusic(audio.trackKey);}
document.addEventListener('pointerdown',gestureAudio,{capture:true,passive:true});
document.addEventListener('pointerup',gestureAudio,{capture:true,passive:true});
document.addEventListener('click',gestureAudio,{capture:true,passive:true});
document.addEventListener('keydown',gestureAudio,{capture:true});
if(!storageOK)$('saveNote').textContent='Browser storage unavailable. Gameplay works, but this session cannot save progress.';
if(!document.createElement('canvas').getContext('2d'))fatal('Canvas 2D is unavailable.');else load();
})();
