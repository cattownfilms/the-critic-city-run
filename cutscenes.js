/* Small data-driven arcade scene player. No combat or campaign rules live here. */
(function(root){'use strict';
class ScenePlayer{
 constructor(o){this.o=o;this.active=false;this.paused=false;this.queue=[];this.serial=0;this.index=0;this.time=0;this.totalTime=0;this.imageCache=new Map();this.assetErrors=[];this.completed=new Set();this._build();}
 _build(){
  const section=document.createElement('section');section.id='cutscene';section.className='screen';section.hidden=true;section.setAttribute('aria-label','Story cutscene');
  section.innerHTML='<div class="scene-frame"><img class="scene-background" alt=""><img class="scene-previous" alt="" hidden><img class="scene-foreground" alt=""><canvas id="sceneSprites" aria-label="Character reactions"></canvas><div class="scene-shade"></div><div class="scene-flash"></div><div class="scene-fade"></div></div><div class="scene-topline"><span class="scene-chapter"></span><div class="scene-tools"><button id="scenePause" aria-label="Pause cutscene">PAUSE</button><button id="sceneSkip">SKIP</button></div></div><div class="scene-copy"><div id="sceneSpeaker"></div><p id="sceneDialogue" aria-live="polite"></p><div class="scene-bottomline"><span id="scenePosition"></span><button id="sceneAdvance" class="primary">CONTINUE</button></div></div><div class="scene-paused" hidden>INTERMISSION<br><small>Select RESUME or press P / controller Start.</small></div>';
  document.body.appendChild(section);this.el=section;this.frame=section.querySelector('.scene-frame');this.bg=section.querySelector('.scene-background');this.previous=section.querySelector('.scene-previous');this.fg=section.querySelector('.scene-foreground');this.canvas=section.querySelector('canvas');this.flash=section.querySelector('.scene-flash');this.fade=section.querySelector('.scene-fade');this.chapter=section.querySelector('.scene-chapter');this.speaker=section.querySelector('#sceneSpeaker');this.dialogue=section.querySelector('#sceneDialogue');this.position=section.querySelector('#scenePosition');this.next=section.querySelector('#sceneAdvance');this.pauseButton=section.querySelector('#scenePause');this.pausedLabel=section.querySelector('.scene-paused');
  this.bg.onerror=()=>{this.assetErrors.push(this.scene?.id+': '+this.bg.src);this.bg.hidden=true;this.el.classList.add('scene-gamebackdrop');};this.fg.onerror=()=>{this.assetErrors.push(this.scene?.id+': '+this.fg.src);this.fg.hidden=true;};
  this.next.onclick=()=>this.advance();section.querySelector('#sceneSkip').onclick=()=>this.skip();this.pauseButton.onclick=()=>this.togglePause();
  section.addEventListener('pointerdown',e=>e.stopPropagation());
 }
 play(scene,onComplete){
  if(!scene||!Array.isArray(scene.shots)){if(onComplete)onComplete({missing:true});return false;}
  const entry={scene,onComplete,done:false};if(this.active){this.queue.push(entry);return true;}this._begin(entry);return true;
 }
 _begin(entry){
  this.entry=entry;this.scene=entry.scene;this.shots=this.scene.shots.filter(s=>!s.routes||s.routes.includes(this.o.character()));this.index=0;this.time=this.totalTime=0;this.paused=false;this.active=true;this.serial++;this.el.hidden=false;this.chapter.textContent=this.scene.title||this.scene.id;this.pauseButton.textContent='PAUSE';this.pausedLabel.hidden=true;this.next.disabled=false;this.o.clearInput();if(this.o.onOpen)this.o.onOpen(this.scene);if(this.scene.music)this.o.music(this.scene.music);
  // Only this scene's dependencies are warmed. Optional gallery assets stay untouched.
  for(const shot of this.shots){for(const name of [shot.background||this.scene.background,shot.foreground])if(name&&!this.imageCache.has(name)){const im=new Image();im.src=this.o.resolve(name);this.imageCache.set(name,im);}}
  if(!this.shots.length){this.finish(false);return;}this._shot();
 }
 _shot(){
  const s=this.shots[this.index];if(s.crossfade&&this.bg.src&&!this.bg.hidden){this.previous.src=this.bg.src;this.previous.style.objectPosition=this.bg.style.objectPosition;this.previous.style.transform=this.bg.style.transform;this.previous.style.transformOrigin=this.bg.style.transformOrigin;this.previous.hidden=false;}else this.previous.hidden=true;this.time=0;this.shot=s;
  const bg=s.background||this.scene.background,fg=s.foreground;this.el.classList.toggle('scene-gamebackdrop',!bg);
  this.bg.hidden=!bg;if(bg){this.bg.src=this.o.resolve(bg);this.bg.style.objectPosition=(s.camera?.x??50)+'% '+(s.camera?.y??45)+'%';this.bg.style.transformOrigin=this.bg.style.objectPosition;}
  this.fg.hidden=!fg;if(fg){this.fg.src=this.o.resolve(fg);this.fg.className='scene-foreground'+(s.foregroundStyle==='portrait'?' scene-portrait':'');}
  this.speaker.textContent=s.speaker||'';this.dialogue.textContent=s.dialogue||s.caption||'';this.position.textContent=(this.index+1)+' / '+this.shots.length;this.next.textContent='CONTINUE';this.next.disabled=this.paused;this.o.clearInput();if(s.music)this.o.music(s.music);if(s.sound)this.o.sound(s.sound);this.update(0);
 }
 advance(){if(!this.active||this.paused||this.time<.12)return false;this.index++;if(this.index>=this.shots.length)this.finish(false);else this._shot();return true;}
 skip(){if(!this.active)return false;this.finish(true);return true;}
 finish(skipped){
  const entry=this.entry;if(!entry||entry.done)return;entry.done=true;this.active=false;this.paused=false;this.el.hidden=true;this.o.clearInput();this.completed.add(entry.scene.id);if(entry.onComplete)entry.onComplete({id:entry.scene.id,skipped:!!skipped});
  if(this.queue.length)this._begin(this.queue.shift());else if(this.o.onIdle)this.o.onIdle();
 }
 togglePause(force){if(!this.active)return;this.paused=typeof force==='boolean'?force:!this.paused;this.pauseButton.textContent=this.paused?'RESUME':'PAUSE';this.pausedLabel.hidden=!this.paused;this.next.disabled=this.paused;this.o.clearInput();if(this.o.onPause)this.o.onPause(this.paused,this.scene.music);}
 key(e){
  if(!this.active)return false;
  const advance=['Enter','Space','KeyJ','KeyX','KeyZ'],skip=['Escape','Backspace'],pause=['KeyP'];
  if(!advance.includes(e.code)&&!skip.includes(e.code)&&!pause.includes(e.code))return false;e.preventDefault();if(e.repeat)return true;
  if(skip.includes(e.code))this.skip();else if(pause.includes(e.code))this.togglePause();else if(e.target.id==='sceneSkip')this.skip();else if(e.target.id==='scenePause')this.togglePause();else this.advance();return true;
 }
 controller(s){if(!this.active)return;if(s.pressed.back)this.skip();else if(s.pressed.pause)this.togglePause();else if(s.pressed.confirm||s.pressed.attack)this.advance();}
 update(dt){
  if(!this.active)return;const s=this.shot;if(!s)return;if(!this.paused){this.time+=dt;this.totalTime+=dt;}
  const motion=!this.o.settings().reducedMotion,t=this.time,c=s.camera||{},z=(c.zoom||1)+(motion?(s.zoom||0)*Math.min(t,8):0),pan=motion?s.pan||{}:{};
  const overscan=Math.max(0,(z-1)/z),px=Brawler.clamp((pan.x||0)*Math.min(t,8),-overscan*(100-(c.x??50)),overscan*(c.x??50)),py=Brawler.clamp((pan.y||0)*Math.min(t,8),-overscan*(100-(c.y??45)),overscan*(c.y??45));this.bg.style.transform='scale('+z+') translate('+px+'%, '+py+'%)';
  const shake=motion&&s.shake&&t<s.shake?Math.sin(t*71)*Math.max(0,1-t/s.shake)*5:0;this.frame.style.transform='translate('+shake+'px,'+(-shake*.6)+'px)';
  this.previous.style.opacity=s.crossfade?Math.max(0,1-t/s.crossfade):0;this.flash.style.opacity=motion&&s.flash?Math.max(0,1-t/s.flash):0;this.fade.style.opacity=s.fade?Math.max(0,1-t/s.fade):0;
  this._sprites(s.sprites||[]);
  if(s.auto&&!this.paused&&t>=s.auto){this.index++;if(this.index>=this.shots.length)this.finish(false);else this._shot();}
 }
 _sprites(sprites){
  const w=this.el.clientWidth,h=this.el.clientHeight,dpr=Math.min(2,window.devicePixelRatio||1),c=this.canvas;const r=this.o.renderer();if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);}
  const ctx=c.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);if(!r)return;
  for(const overlay of sprites){const who=overlay.character==='selected'?this.o.character():overlay.character,bank=r.meta?.characters?.[who]||this.o.meta()?.characters?.[who];if(!bank)continue;let animation=overlay.animation||'idle';if(who==='franklin')animation=Brawler.playerAnimation(who,animation);if(!bank[animation])animation=bank.idle?'idle':Object.keys(bank)[0];const scale=(overlay.scale||.7)*Math.min(w/1000,h/560),x=(overlay.x??.24)*w,y=(overlay.y??.76)*h;
   r.shadow(ctx,who,animation,x,y,overlay.face||1,this.totalTime,0,scale,0,.32);r.sprite(ctx,who,animation,x,y,overlay.face||1,this.totalTime,0,{scale,loop:!!bank[animation].loop});
  }
 }
 state(){return {active:this.active,paused:this.paused,id:this.scene?.id||null,index:this.index,queued:this.queue.length,completed:[...this.completed],assetErrors:[...this.assetErrors]};}
}
root.CriticScenePlayer=ScenePlayer;
})(typeof globalThis!=='undefined'?globalThis:this);
