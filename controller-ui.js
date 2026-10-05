/* Controller settings and menu focus. Optional and independent of touchscreen controls. */
(function(){'use strict';
window.CriticControllerUI=function(o){
 const hub=o.hub,$=id=>document.getElementById(id);let listKey='',mapKey='',menuKey='',menuDir='',nextNav=0,lastRefresh=-999;
 const box=$('controllerSettings');
 $('controllerEnabled').checked=hub.enabled;$('controllerDeadzone').value=Math.round(hub.deadzone*100);
 $('controllerEnabled').onchange=()=>{hub.setEnabled($('controllerEnabled').checked);refresh(true);};
 $('controllerDevice').onchange=()=>{hub.select($('controllerDevice').value);refresh(true);};
 $('controllerDeadzone').oninput=()=>{hub.setDeadzone(+$('controllerDeadzone').value/100);refresh(true);};
 $('controllerMap').onclick=()=>{if(hub.beginMapping())refresh(true);};
 $('controllerMapReady').onclick=()=>{hub.armMapping();refresh(true);};
 $('controllerMapCancel').onclick=()=>{hub.cancelMapping();hub.suspend();refresh(true);};
 $('controllerDefault').onclick=()=>{hub.defaults();refresh(true);};
 $('controllerTest').onclick=()=>{const d=hub.diagnostics();$('controllerDiagnostics').textContent=JSON.stringify(d,null,2);$('controllerDiagnostics').hidden=!$('controllerDiagnostics').hidden;};
 function refresh(force=false){
  if(!force&&hub.lastPoll-lastRefresh<120)return;lastRefresh=hub.lastPoll;
  $('controllerStatus').textContent=hub.status();$('controllerDeadzoneValue').textContent=Math.round(hub.deadzone*100)+'%';
  const k=hub.pads.map(p=>p.index+':'+p.id+':'+p.mapping).join('|')+':'+hub.active?.index;
  if(k!==listKey){listKey=k;const s=$('controllerDevice');s.replaceChildren();
   for(const p of hub.pads){const option=document.createElement('option');option.value=p.index;option.textContent=p.id+' ('+(p.mapping||'unmapped')+')';s.appendChild(option);}
   if(!s.options.length){const option=document.createElement('option');option.value='';option.textContent='No controller exposed yet';s.appendChild(option);}if(hub.active)s.value=hub.active.index;
  }
  const mapping=JSON.stringify(hub.mapping);
  if(mapping!==mapKey){mapKey=mapping;const target=$('controllerMapping');target.replaceChildren();
   if(hub.mapping){for(const key of ['attack','jump','guard','special','pause','confirm','back']){
    const row=document.createElement('div'),b=document.createElement('b'),span=document.createElement('span');b.textContent={attack:'HIT',jump:'JUMP',guard:'GUARD',special:'REVIEW',pause:'PAUSE',confirm:'MENU CONFIRM',back:'MENU BACK'}[key];span.textContent=CriticGamepad.format(hub.mapping[key]);row.append(b,span);target.appendChild(row);
   }}
  }
  $('controllerMap').disabled=!hub.enabled||!hub.active||!!hub.capture;
  $('controllerDefault').disabled=!hub.active||!!hub.capture;
  $('controllerDevice').disabled=!hub.enabled||hub.pads.length<2||!!hub.capture;
  $('controllerMapReady').hidden=!hub.capture||!!hub.capture.neutral;$('controllerMapCancel').hidden=!hub.capture;
  $('controllerLive').textContent=hub.active?'Stick '+hub.state.mx.toFixed(2)+', '+hub.state.my.toFixed(2)+' | '+Object.keys(hub.state.held).filter(k=>hub.state.held[k]).join(', '):'';
  $('controllerEnabled').checked=hub.enabled;
 }
 function currentScreen(){return [...document.querySelectorAll('.screen')].find(e=>!e.hidden);}
 function controls(screen){return [...screen.querySelectorAll('button,select,input,a[href]')].filter(e=>!e.disabled&&!e.hidden&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');}
 function focus(el){if(!el)return;document.body.classList.add('controller-nav');try{el.focus({preventScroll:true});el.scrollIntoView({block:'nearest',inline:'nearest'});}catch(_){el.focus();}}
 function actionBack(screen){
  if(screen.id==='gallery')o.closeGallery();else if(screen.id==='pause'){if(o.game.mode==='pause')o.resume();else o.title();}
 }
 function tick(now){
  hub.poll(now);refresh();if(!hub.enabled||!hub.active||!hub.mapping||hub.capture||document.hidden)return;
  const screen=currentScreen(),s=hub.snapshot(!(!screen&&o.game.mode==='play'));
  if(!screen&&o.game.mode==='play'){
   if(s.pressed.pause){hub.snapshot(true);o.pause();}
   return;
  }
  if(!screen)return;
  if(menuKey!==screen.id){menuKey=screen.id;menuDir='';nextNav=0;}
  const els=controls(screen);if(!els.length)return;let focused=els.includes(document.activeElement)?document.activeElement:null;
  const dir=s.my<-.55?'up':s.my>.55?'down':s.mx<-.55?'left':s.mx>.55?'right':'';
  if(!dir){menuDir='';nextNav=0;}
  if(dir&&(dir!==menuDir||now>=nextNav)){
   const first=dir!==menuDir;menuDir=dir;nextNav=now+(first?380:140);
   if(focused&&(dir==='left'||dir==='right')&&(focused.tagName==='SELECT'||focused.type==='range')){
    const delta=dir==='right'?1:-1;
    if(focused.tagName==='SELECT'){
     const options=[...focused.options].filter(x=>!x.disabled),i=options.indexOf(focused.selectedOptions[0]);focused.value=options[(i+delta+options.length)%options.length].value;focused.dispatchEvent(new Event('change',{bubbles:true}));
    }else{const step=+focused.step||1;focused.value=Math.max(+focused.min||0,Math.min(+focused.max||100,+focused.value+delta*step*5));focused.dispatchEvent(new Event('input',{bubbles:true}));}
   }else{let i=focused?els.indexOf(focused):-1;const d=dir==='up'||dir==='left'?-1:1;i=i<0?(d>0?0:els.length-1):(i+d+els.length)%els.length;focused=els[i];focus(focused);}
  }
  if(s.pressed.back){actionBack(screen);return;}
  if(s.pressed.pause){
   if(screen.id==='title'&&o.ready())o.start();else if(screen.id==='pause')actionBack(screen);else if(screen.id==='stageclear')o.continueDistrict();else if(screen.id==='gallery')o.closeGallery();
   return;
  }
  if(s.pressed.confirm){
   if(!focused){focused=screen.querySelector('button.primary:not([disabled]):not([hidden])')||els[0];focus(focused);}
   if(focused.tagName==='SELECT'){const options=[...focused.options].filter(x=>!x.disabled);focused.value=options[(options.indexOf(focused.selectedOptions[0])+1)%options.length].value;focused.dispatchEvent(new Event('change',{bubbles:true}));}
   else if(focused.type==='checkbox'){focused.checked=!focused.checked;focused.dispatchEvent(new Event('change',{bubbles:true}));focused.dispatchEvent(new Event('input',{bubbles:true}));}
   else if(focused.type!=='range')focused.click();
  }
 }
 // Pointer/keyboard input continues normally; no hidden touch-pad mode is introduced.
 document.addEventListener('pointerdown',()=>document.body.classList.remove('controller-nav'),{passive:true});
 document.addEventListener('keydown',()=>document.body.classList.remove('controller-nav'));
 refresh(true);return {tick,refresh};
};
})();
