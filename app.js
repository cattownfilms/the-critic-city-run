/* Offline browser shell, radial analog input, embedded-audio sampling, and menus. */
(function(){'use strict';
const $=id=>document.getElementById(id),conf=window.BRAWLER_CONFIG,inline=window.BRAWLER_ASSETS;
const clamp=Brawler.clamp;window.settings={music:.35,sfx:.72,reducedMotion:false,vibration:false};
let pad=null;
let storageOK=true;function readStore(k){try{return JSON.parse(localStorage.getItem(k)||'null');}catch(e){storageOK=false;return null;}}
function store(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){storageOK=false;$('saveNote').textContent='Browser storage unavailable. The game still plays; keep this tab open.';return false;}}
const stored=readStore(conf.settingsKey);if(stored){settings.music=clamp(+stored.music||0,0,1);settings.sfx=clamp(+stored.sfx||0,0,1);settings.reducedMotion=!!stored.reducedMotion;settings.vibration=!!stored.vibration;}
let save=readStore(conf.saveKey)||readStore(conf.legacySaveKey);if(![2,3].includes(save?.version)||save.complete)save=null;
let profile=readStore(conf.profileKey)||{};if(typeof profile!=='object')profile={};profile.franklinUnlocked=profile.franklinUnlocked===true;let selected=profile.selected==='franklin'&&profile.franklinUnlocked?'franklin':'hero';
$('continueButton').hidden=!save;$('musicVolume').value=Math.round(settings.music*100);$('sfxVolume').value=Math.round(settings.sfx*100);$('reducedMotion').checked=settings.reducedMotion;$('vibration').checked=settings.vibration;
function toast(s){$('toast').textContent=s;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,3500);}
function fatal(s){$('fatal').textContent='The game could not finish loading. '+s+' Reload after the download has finished, or use the included local launcher.';$('fatal').hidden=false;}
const src=name=>inline?inline.files[name]:(conf.assetBase+name);
$('titleArt').src=src('title.png');$('portrait').src=src('icon.png');
class Input{
 constructor(){this.pointers=new Map();this.keys=new Set();this.down={attack:false,jump:false,guard:false,special:false};this.edges={attack:false,jump:false,guard:false,special:false};this.mx=0;this.my=0;this.stickId=null;this.pressure=null;
  const st=$('stick');st.addEventListener('pointerdown',e=>this.pointerDown(e,'stick'));
  for(const el of document.querySelectorAll('[data-action]'))el.addEventListener('pointerdown',e=>this.pointerDown(e,el.dataset.action));
  window.addEventListener('pointermove',e=>this.pointerMove(e),{passive:false});window.addEventListener('pointerup',e=>this.pointerUp(e));window.addEventListener('pointercancel',e=>this.pointerUp(e));
  document.querySelectorAll('#controls button,#stick').forEach(el=>el.addEventListener('lostpointercapture',e=>this.pointerUp(e)));
  window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(e.code!=='Escape'&&e.code!=='KeyP'&&document.querySelector('.screen:not([hidden])')){if(e.code==='Enter'&&e.target.tagName!=='BUTTON'&&game.mode==='title'&&ready){e.preventDefault();start(false);}return;}const map={KeyJ:'attack',KeyX:'attack',Space:'jump',KeyZ:'jump',KeyK:'guard',KeyC:'guard',KeyL:'special',KeyV:'special'};if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();if(e.repeat)return;this.keys.add(e.code);if(map[e.code])this.edges[map[e.code]]=true;if(e.code==='Escape'||e.code==='KeyP'){if(game.mode==='play')pause();else if(game.mode==='pause'&&$('gallery').hidden)resume();}if(e.code==='Enter'&&game.mode==='title'&&ready)start(false);});
  window.addEventListener('keyup',e=>this.keys.delete(e.code));
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
 clear(){if(pad)pad.suspend();this.pointers.clear();this.stickId=null;this.mx=this.my=0;this.pressure=null;this.keys.clear();Object.keys(this.down).forEach(k=>{this.down[k]=false;this.edges[k]=false;$(k).classList.remove('down');});$('knob').style.transform='translate(-50%,-50%)';$('stick').classList.remove('running');}
 snapshot(consume=true){const gp=pad?pad.snapshot(consume):null;const k=this.keys;let mx=this.mx,my=this.my;if(this.stickId===null&&Math.hypot(mx,my)<.001&&gp){mx=gp.mx;my=gp.my;}if(k.has('KeyA')||k.has('ArrowLeft'))mx=-1;if(k.has('KeyD')||k.has('ArrowRight'))mx=1;if(k.has('KeyW')||k.has('ArrowUp'))my=-1;if(k.has('KeyS')||k.has('ArrowDown'))my=1;const m=Math.hypot(mx,my);if(m>1){mx/=m;my/=m;}
  const o={mx,my,attackPressed:this.edges.attack||!!gp?.pressed.attack,jumpPressed:this.edges.jump||!!gp?.pressed.jump,guardPressed:this.edges.guard||!!gp?.pressed.guard,specialPressed:this.edges.special||!!gp?.pressed.special,attackHeld:this.down.attack||!!gp?.held.attack||k.has('KeyJ')||k.has('KeyX'),guardHeld:this.down.guard||!!gp?.held.guard||k.has('KeyK')||k.has('KeyC')};if(consume)Object.keys(this.edges).forEach(k=>this.edges[k]=false);return o;}
}
class AudioSystem{
 constructor(){this.music=new Audio(src('theme.mp3'));this.music.loop=true;this.music.preload='none';this.music.volume=settings.music;this.trackKey='title';this.outgoing=null;this.fade=1;this.wantMusic=false;this.musicSerial=0;this.ctx=null;this.buffers={};this.active=new Set();this.loaded=false;this.ready=null;this.muted=false;this.lastVoice=-9;this.duck=0;this.played={};this.errors=[];this.cueNames=['swish','backhand','bear-call','bear-hit','hit','heavy','hippo-hit','slam','step1','step2','elder-strike','elder-hit','fall'];}
 async unlock(){if(!window.AudioContext&&!window.webkitAudioContext)return;try{if(!this.ctx){this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.bus=this.ctx.createGain();this.bus.gain.value=settings.sfx;const comp=this.ctx.createDynamicsCompressor();comp.threshold.value=-14;comp.knee.value=20;comp.ratio.value=4;this.bus.connect(comp);comp.connect(this.ctx.destination);this.ready=this.decode();}if(this.ctx.state==='suspended'||this.ctx.state==='interrupted')await this.ctx.resume();}catch(e){this.errors.push(String(e));}}
 async decode(){const load=async name=>{try{let data;if(inline){const val=inline.files[name+'.wav'].split(',')[1];const str=atob(val),bytes=new Uint8Array(str.length);for(let i=0;i<str.length;i++)bytes[i]=str.charCodeAt(i);data=bytes.buffer;}else data=await(await fetch(src(name+'.wav'))).arrayBuffer();this.buffers[name]=await this.ctx.decodeAudioData(data);}catch(e){this.errors.push(name+': '+e);}};await Promise.all(this.cueNames.map(load));this.loaded=Object.keys(this.buffers).length===this.cueNames.length;}
 chooseTrack(key){
  const item=conf.music[key]||conf.music.title;if(key===this.trackKey)return;
  if(this.outgoing){this.outgoing.pause();this.outgoing.removeAttribute('src');this.outgoing.load();}
  this.outgoing=this.music;this.music=new Audio(src(item.file));this.music.loop=true;this.music.preload='none';this.music.volume=0;this.fade=0;this.trackKey=key;
 }
 async playMusic(key){
  key=key||['broadway','subway','rooftop','theater'][game.stage];this.chooseTrack(key);this.wantMusic=true;const serial=++this.musicSerial,node=this.music;await this.unlock();
  if(!this.wantMusic||serial!==this.musicSerial||this.muted||settings.music<=0)return;
  try{await node.play();if(!this.wantMusic||serial!==this.musicSerial||this.muted)node.pause();}
  catch(e){if(this.wantMusic&&serial===this.musicSerial){this.errors.push('music: '+e);toast('Tap the sound button to enable audio.');}}
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
 pause(){this.wantMusic=false;this.musicSerial++;this.music.pause();if(this.outgoing)this.outgoing.pause();for(const n of this.active){try{n.stop();}catch(_){}}this.active.clear();if(this.ctx?.state==='running')this.ctx.suspend().catch(()=>{});}
 update(dt){
  this.duck=Math.max(0,this.duck-dt);if(this.wantMusic&&!this.music.paused)this.fade=Math.min(1,this.fade+dt/.9);
  const level=this.muted?0:settings.music*(this.duck>0?.62:1);this.music.volume=level*Math.sin(this.fade*Math.PI/2);
  if(this.outgoing){this.outgoing.volume=level*Math.cos(this.fade*Math.PI/2);if(this.fade>=1){this.outgoing.pause();this.outgoing.removeAttribute('src');this.outgoing.load();this.outgoing=null;}}
  if(this.bus)this.bus.gain.value=this.muted?0:settings.sfx;
 }
 toggle(){this.muted=!this.muted;if(this.muted){this.music.pause();if(this.outgoing)this.outgoing.pause();}else if(['play','stageclear','complete','title'].includes(game.mode))this.playMusic(['title','complete'].includes(game.mode)?'title':undefined);toast(this.muted?'Audio muted':'Audio on');}

}
const game=new Brawler.Game(),audio=new AudioSystem(),input=new Input();game.franklinUnlocked=profile.franklinUnlocked;let renderer,meta,ready=false,last=performance.now(),acc=0,fromGallery='title',galleryTime=0,galleryPlaying=true,completeTime=0,tipTime=0,clearTime=0,presentationPaused=false;
pad=new CriticGamepad.Hub({storage:{getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)},onDisconnect:()=>{input.clear();if(game.mode==='play'){pause();toast('Controller disconnected. Reconnect or use touch / keyboard, then Resume.');}},onMapped:()=>toast('Controller mapping saved. Release controls to continue.')});
window.__brawler={game,input,audio,controller:pad,ready:()=>ready,renderer:()=>renderer,meta:()=>meta,start:()=>start(false),pause,resume,getInput:()=>input.snapshot(false),getSave:()=>readStore(conf.saveKey),getProfile:()=>({...profile}),restartStage4};
function show(id,on){$(id).hidden=!on;}
function screen(which){if(pad)pad.suspend();for(const id of ['title','pause','gameover','complete','gallery','stageclear'])show(id,id===which);const play=which===null;show('hud',play);show('controls',play);if(!play){show('targetHud',false);show('comboHud',false);show('tip',false);show('bossHud',false);}}
function start(cont){input.clear();game.franklinUnlocked=profile.franklinUnlocked;const who=cont&&save?.playerKind?save.playerKind:selected;game.start(cont?save:null,who);updatePortrait();screen(null);audio.playMusic();completeTime=0;tipTime=9;$('tip').textContent='Push farther to run. HIT chains a combo. JUMP + HIT = jump kick.';show('tip',true);}
function pause(){if(game.mode!=='play')return;game.pause();input.clear();audio.pause();screen('pause');$('resumeButton').hidden=false;$('restartStage4').hidden=game.stage!==3;}
function resume(){if(game.mode!=='pause')return;game.resume();input.clear();screen(null);audio.playMusic();}
function title(){game.mode='title';input.clear();audio.playMusic('title');screen('title');save=readStore(conf.saveKey)||readStore(conf.legacySaveKey);if(save?.complete)save=null;updateRoster();$('continueButton').hidden=!save;}
function updatePortrait(){$('portrait').src=src(game.playerKind==='franklin'?'franklin-icon.png':'icon.png');$('playerName').textContent=game.playerKind==='franklin'?'FRANKLIN':'THE CRITIC';}
function updateRoster(){const o=$('playerSelect').querySelector('[value="franklin"]');o.disabled=!profile.franklinUnlocked;o.textContent=profile.franklinUnlocked?'Franklin':'Franklin · LOCKED';$('playerSelect').value=selected;$('rosterNote').textContent=profile.franklinUnlocked?'Franklin unlocked. Choose your character, then Press Start.':'Unlock Franklin: defeat him and finish Stage 4 without dying.';}
function restartStage4(){if(!game.restartStage4())return;input.clear();screen(null);updatePortrait();audio.playMusic();tipTime=5;$('tip').textContent='Fresh Stage 4 attempt. Fight your way to the exit.';}
$('playerSelect').onchange=()=>{selected=$('playerSelect').value==='franklin'&&profile.franklinUnlocked?'franklin':'hero';profile.selected=selected;store(conf.profileKey,profile);updateRoster();};
$('restartStage4').onclick=restartStage4;$('retryStage4Reward').onclick=restartStage4;$('playFranklin').onclick=()=>{if(!profile.franklinUnlocked)return;selected='franklin';profile.selected=selected;store(conf.profileKey,profile);updateRoster();start(false);};
updateRoster();
function openGallery(){fromGallery=game.mode;if(game.mode==='play'){game.pause();fromGallery='pause';}input.clear();audio.pause();game.mode='gallery';screen('gallery');fillAnimations();}
function fillAnimations(){const who=$('characterSelect').value;const a=meta.characters[who];$('animSelect').replaceChildren();for(const [key,an] of Object.entries(a)){const o=document.createElement('option');o.value=key;o.textContent=an.label;$('animSelect').appendChild(o);}galleryTime=0;galleryInfo();}
function galleryInfo(){const who=$('characterSelect').value,an=meta.characters[who][$('animSelect').value];$('galleryInfo').textContent=`${an.frames.length} frames · ${(an.ms/1000).toFixed(2)}s source duration · ${an.loop?'Loop':'One-shot'}${an.sourceDescription?' · '+an.sourceDescription:''}`;}
function closeGallery(){input.clear();game.mode=fromGallery;screen(fromGallery==='pause'?'pause':fromGallery==='complete'?'complete':'title');if(fromGallery==='complete'||fromGallery==='title')audio.playMusic('title');}
$('startButton').onclick=()=>start(false);$('continueButton').onclick=()=>start(true);$('movesButton').onclick=()=>{input.clear();screen('pause');$('resumeButton').hidden=true;$('restartStage4').hidden=true;};$('pauseBtn').onclick=pause;$('resumeButton').onclick=resume;$('titleButton').onclick=title;$('overTitle').onclick=title;$('completeTitle').onclick=title;$('againButton').onclick=()=>start(false);
$('retryButton').onclick=()=>{game.retry(true);input.clear();screen(null);audio.playMusic();};$('galleryButton').onclick=openGallery;$('pauseGallery').onclick=openGallery;$('completeGallery').onclick=openGallery;$('closeGallery').onclick=closeGallery;$('characterSelect').onchange=fillAnimations;$('animSelect').onchange=()=>{galleryTime=0;galleryInfo();};
function nextAnim(d){let s=$('animSelect');s.selectedIndex=(s.selectedIndex+d+s.options.length)%s.options.length;galleryTime=0;galleryInfo();}
$('prevAnim').onclick=()=>nextAnim(-1);$('nextAnim').onclick=()=>nextAnim(1);$('playAnim').onclick=()=>{galleryPlaying=!galleryPlaying;$('playAnim').textContent=galleryPlaying?'Pause':'Play';};$('soundBtn').onclick=()=>audio.toggle();
$('fullBtn').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.webkitFullscreenElement&&document.webkitExitFullscreen)document.webkitExitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else if(document.documentElement.webkitRequestFullscreen)document.documentElement.webkitRequestFullscreen();else toast('Fullscreen is unavailable in this browser view.');}catch(e){toast('Open in your browser to use fullscreen.');}};
for(const id of ['musicVolume','sfxVolume','reducedMotion','vibration'])$(id).oninput=()=>{settings.music=+$('musicVolume').value/100;settings.sfx=+$('sfxVolume').value/100;settings.reducedMotion=$('reducedMotion').checked;settings.vibration=$('vibration').checked;store(conf.settingsKey,settings);if(settings.music>0&&!audio.muted&&audio.music.paused&&['play','stageclear','complete'].includes(game.mode))audio.playMusic(game.mode==='complete'?'title':undefined);};
window.addEventListener('blur',()=>{input.clear();if(game.mode==='play')pause();else if(['stageclear','complete','title'].includes(game.mode)){presentationPaused=true;audio.pause();}});
window.addEventListener('focus',()=>{if(presentationPaused&&!document.hidden){presentationPaused=false;if(['stageclear','complete'].includes(game.mode))audio.playMusic(game.mode==='complete'?'title':undefined);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){input.clear();if(game.mode==='play')pause();else{presentationPaused=true;audio.pause();}}else if(presentationPaused){presentationPaused=false;if(['stageclear','complete'].includes(game.mode))audio.playMusic(game.mode==='complete'?'title':undefined);}});
window.addEventListener('resize',()=>{input.clear();if(renderer)game.viewWidth=renderer.resize().w;});window.addEventListener('contextmenu',e=>e.preventDefault());
async function load(){try{if(!window.fetch&&!inline)throw new Error('This browser does not support asset loading.');meta=inline?inline.sprites:await(await fetch(src('sprites.json'))).json();const images=[];let loaded=0,cursor=0;const worker=async()=>{while(cursor<meta.pages.length){const j=cursor++;images[j]=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Image '+meta.pages[j].file));im.src=src(meta.pages[j].file);});loaded++;$('loadbar').firstElementChild.style.width=(loaded/meta.pages.length*100)+'%';$('loadtext').textContent=`Loading the cast · ${Math.round(loaded/meta.pages.length*100)}%`;}};await Promise.all([worker(),worker()]);renderer=new CityRenderer($('game'),meta,images);game.viewWidth=renderer.rect.w;ready=true;$('startButton').disabled=false;$('galleryButton').disabled=false;$('startButton').textContent='PRESS START';$('loadtext').textContent='Ready.';$('loadbar').hidden=true;requestAnimationFrame(loop);}catch(e){fatal(String(e));}}
function handle(e){if(renderer)renderer.emit(e);audio.event(e);if(settings.vibration&&navigator.vibrate&&['hit','parry','playerHit'].includes(e.type))navigator.vibrate(e.type==='hit'?12:22);
 if(e.type==='save'){save=e.save;store(conf.saveKey,e.save);}
 if(e.type==='unlock'){profile.franklinUnlocked=true;game.franklinUnlocked=true;store(conf.profileKey,profile);updateRoster();toast('FRANKLIN UNLOCKED');}
 if(e.type==='bossEnter'){tipTime=3;$('tip').textContent=e.kind==='franklin'?'FRANKLIN. Watch his windup.':'SHERMOMETER / SLAM. Watch the overhead attack.';show('tip',true);}
 if(e.type==='stageDeath'&&e.stage===3&&game.playerKind!=='franklin'&&!profile.franklinUnlocked){toast('Stage 4 death recorded. Restart Stage 4 for a fresh unlock attempt.');}
 if(e.type==='stage'){audio.playMusic();screen(null);input.clear();tipTime=2.5;$('tip').textContent=Brawler.STAGES[game.stage].name;}
 if(e.type==='stageClear'){clearTime=0;presentationPaused=false;input.clear();screen('stageclear');$('clearHeading').textContent=Brawler.STAGES[e.stage].name+' cleared';$('clearNext').textContent='Next: '+Brawler.STAGES[e.next].name;$('clearContinue').disabled=true;$('clearTrack').textContent='Next track: '+conf.music[['broadway','subway','rooftop','theater'][e.next]].label;}
 if(e.type==='gameover'){screen('gameover');audio.pause();input.clear();}
 if(e.type==='complete'){
  const replay=game.playerKind==='franklin';
  $('rewardHeading').textContent=replay?'FRANKLIN TAKES THE CITY':game.lastUnlockEarned?'FRANKLIN UNLOCKED':'FOUR DISTRICTS CLEARED';
  $('rewardText').textContent=replay?'The Slam Shermometer is down. Your city-wide review is complete.':game.lastUnlockEarned?'Stage 4 cleared without dying. Franklin is now selectable.':profile.franklinUnlocked?'Franklin remains unlocked. Choose either character for another run.':'Franklin defeated. Clear Stage 4 without dying to unlock him.';
  $('playFranklin').hidden=!profile.franklinUnlocked||replay;$('retryStage4Reward').hidden=profile.franklinUnlocked||replay;
  completeTime=0;presentationPaused=false;screen('complete');input.clear();audio.playMusic('title');
  $('results').innerHTML=`<div><b>${String(game.score).padStart(6,'0')}</b><span>SCORE</span></div><div><b>${game.stats.maxCombo}</b><span>BEST COMBO</span></div><div><b>${game.stats.kos}</b><span>KNOCKOUTS</span></div><div><b>${Math.floor(game.t/60)}:${String(Math.floor(game.t%60)).padStart(2,'0')}</b><span>RUN TIME</span></div>`;
 }
 if(e.type==='clear'){tipTime=2.8;$('tip').textContent=game.stage===3&&game.bossDefeated?'Boss defeated. Head right to finish your run.':game.nextGate===3?'Block clear. Head right to the next district.':'Block clear. Health restored. Keep moving right.';show('tip',true);}
 if(e.type==='retry'){screen(null);tipTime=3;$('tip').textContent='Back on your feet. This block is your checkpoint.';}
 if(e.type==='parry'){tipTime=1.2;$('tip').textContent='PARRY! HIT now for a two-palm counter.';show('tip',true);}
}
function hud(){const p=game.p,boss=game.enemies.find(e=>e.boss&&e.hp>0&&!e.hidden&&(!e.entry||e.entry.phase==='settle'));show('bossHud',game.mode==='play'&&!!boss);if(boss){$('bossName').textContent=boss.name.toUpperCase();$('bossFill').style.width=100*boss.hp/boss.maxHp+'%';$('bossMove').textContent=boss.state==='windup'?boss.move?.name||'READY':'FINAL BILL';$('unlockStatus').textContent=game.playerKind==='franklin'?'FINAL ENCOUNTER':profile.franklinUnlocked?'FRANKLIN ALREADY UNLOCKED':game.stage4Eligible&&game.deathsByStage[3]===0?'UNLOCK RUN: NO DEATHS IN STAGE 4':'UNLOCK RUN MISSED / RESTART STAGE 4 TO RETRY';}$('healthFill').style.width=p.hp+'%';$('meterFill').style.width=p.meter+'%';$('lives').textContent=p.lives+' '+(p.lives===1?'LIFE':'LIVES');$('score').textContent=String(game.score||0).padStart(6,'0');$('stageName').textContent=`${game.stage+1}/4 · ${Brawler.STAGES[game.stage].name}`;$('specialValue').textContent=p.meter>=100?'READY':Math.floor(p.meter)+'%';$('special').classList.toggle('ready',p.meter>=100);show('comboHud',game.mode==='play'&&p.combo>1);$('comboNum').textContent=p.combo;$('comboText').textContent=p.combo>=10?'CRITICAL ACCLAIM':'HIT COMBO';const t=game.target;show('targetHud',game.mode==='play'&&!boss&&!!t&&t.hp>0&&game.targetT>0&&p.z<35);if(t){$('targetName').textContent=t.name.toUpperCase();$('targetFill').style.width=100*t.hp/t.maxHp+'%';}}
function drawGallery(dt){
 if(galleryPlaying)galleryTime+=dt;const c=$('galleryCanvas'),w=c.clientWidth,h=c.clientHeight;if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
 const ctx=c.getContext('2d');ctx.clearRect(0,0,w,h);const who=$('characterSelect').value,name=$('animSelect').value,a=meta.characters[who][name];
 const minY=Math.min(...a.frames.map(f=>f.oy)),maxY=Math.max(0,...a.frames.map(f=>f.oy+f.h)),minX=Math.min(...a.frames.map(f=>f.ox)),maxX=Math.max(...a.frames.map(f=>f.ox+f.w));
 const sc=Math.min(1.08,(h-38)/(maxY-minY),(w-35)/(maxX-minX)),t=galleryTime%(a.ms/1000+.65),x=w/2-(minX+maxX)*sc/2,y=h-22-Math.max(0,maxY)*sc;
 renderer.shadow(ctx,who,name,x,y,1,t,0,sc,0,.38);renderer.sprite(ctx,who,name,x,y,1,t,0,{scale:sc,loop:false});
}
function continueDistrict(){if(game.mode!=='stageclear'||clearTime<.4)return;input.clear();game.finishStageClear();for(const e of game.drain())handle(e);screen(null);}
$('clearContinue').onclick=continueDistrict;
function loop(now){let dt=Math.min(.07,(now-last)/1000||.016);last=now;if(!document.hidden)controllerUI.tick(now);audio.update(dt);
 if(game.mode==='play'){acc+=dt;let steps=0;while(acc>=1/120&&steps++<9){game.step(1/120,input.snapshot(true));acc-=1/120;for(const e of game.drain())handle(e);if(game.mode!=='play')break;}tipTime=Math.max(0,tipTime-dt);show('tip',tipTime>0);}else{acc=0;input.snapshot(true);}
 if(game.mode==='stageclear'){if(!presentationPaused)clearTime+=dt;$('clearContinue').disabled=clearTime<.4;renderer.showcase($('clearCanvas'),game,clearTime);if(clearTime>=4&&!presentationPaused)continueDistrict();}
 if(game.mode==='complete'){if(!presentationPaused)completeTime+=dt;renderer.showcase($('victoryCanvas'),game,completeTime);game.p.anim=completeTime<.7?'dance-enter':'dance-loop';game.p.animT=completeTime<.7?completeTime:completeTime-.7;game.p.animDuration=completeTime<.7?.7:0;}
 if(game.mode==='title'){game.p.anim='idle';game.p.animT+=dt;}
 renderer.draw(game,game.mode==='pause'?0:dt);if(game.mode==='gallery')drawGallery(dt);hud();requestAnimationFrame(loop);
}
const controllerUI=CriticControllerUI({hub:pad,game,input,ready:()=>ready,pause,resume,title,start:()=>start(false),closeGallery,continueDistrict});
function gestureAudio(){audio.unlock();if(audio.wantMusic&&audio.music.paused&&!audio.muted&&settings.music>0)audio.playMusic(audio.trackKey);}
document.addEventListener('pointerdown',gestureAudio,{passive:true});
document.addEventListener('keydown',gestureAudio);
if(!storageOK)$('saveNote').textContent='Browser storage unavailable. Gameplay works, but this session cannot save progress.';
if(!document.createElement('canvas').getContext('2d'))fatal('Canvas 2D is unavailable.');else load();
})();
