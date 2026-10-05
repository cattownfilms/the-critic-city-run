/* Optional physical-controller adapter. No engine, touch, or gameplay constants are changed. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.CriticGamepad=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const ACTIONS=['left','right','up','down','attack','jump','guard','special','pause','confirm','back'];
  const BUTTONS=['attack','jump','guard','special','pause','confirm','back'];
  const KEY='cattown.critic.brawler.v5.gamepad';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const finite=n=>typeof n==='number'&&Number.isFinite(n);
  const copy=v=>JSON.parse(JSON.stringify(v));
  const empty=()=>({mx:0,my:0,held:Object.fromEntries(BUTTONS.map(k=>[k,false])),pressed:Object.fromEntries(BUTTONS.map(k=>[k,false]))});
  const button=index=>({type:'button',index});
  const axis=(index,sign)=>({type:'axis',index,sign});
  function standard(){return {
    left:[axis(0,-1),button(14)],right:[axis(0,1),button(15)],up:[axis(1,-1),button(12)],down:[axis(1,1),button(13)],
    attack:[button(2)],jump:[button(0)],guard:[button(1),button(4)],special:[button(3)],
    pause:[button(9)],confirm:[button(0)],back:[button(1)]
  };}
  function identity(p){return [String(p.id||'Unnamed controller').slice(0,200),p.mapping||'',p.buttons?.length||0,p.axes?.length||0].join('|');}
  function validBinding(b){return b&&Number.isInteger(b.index)&&b.index>=0&&b.index<64&&
    (b.type==='button'||(b.type==='axis'&&(b.sign===1||b.sign===-1))||(b.type==='value'&&finite(b.value)&&Math.abs(b.value)<5));}
  function cleanMap(map){if(!map||typeof map!=='object')return null;const out={};for(const k of ACTIONS){
    if(!Array.isArray(map[k])||!map[k].length||map[k].length>3||!map[k].every(validBinding))return null;
    out[k]=map[k].map(b=>b.type==='button'?button(b.index):b.type==='axis'?axis(b.index,b.sign):{type:'value',index:b.index,value:b.value});
  }return out;}
  function val(p,b){
    if(b.type==='button'){const v=p.buttons?.[b.index];return typeof v==='number'?clamp(v,0,1):v?.pressed?1:finite(v?.value)?clamp(v.value,0,1):0;}
    const v=p.axes?.[b.index];if(!finite(v))return 0;
    if(b.type==='value')return Math.abs(v-b.value)<.13?1:0;
    return clamp(v*b.sign,0,1);
  }
  function rawState(p,map,dead=.15){
    const amount=k=>Math.max(0,...(map[k]||[]).map(b=>val(p,b)));
    let x=amount('right')-amount('left'),y=amount('down')-amount('up'),m=Math.hypot(x,y);
    if(m<=dead)x=y=0;else{const s=Math.pow((Math.min(1,m)-dead)/(1-dead),1.05);x=x/m*s;y=y/m*s;}
    return {mx:x,my:y,held:Object.fromEntries(BUTTONS.map(k=>[k,amount(k)>.5]))};
  }
  function format(b){return b.map(x=>x.type==='button'?'Button '+x.index:x.type==='axis'?'Axis '+x.index+(x.sign<0?' -':' +'):'Hat '+x.index+' @ '+x.value.toFixed(2)).join(' / ');}
  class Hub{
    constructor(opts={}){
      this.getPads=opts.getPads||(()=>typeof navigator!=='undefined'&&navigator.getGamepads?navigator.getGamepads():[]);
      this.supported=opts.supported===undefined?(typeof navigator!=='undefined'&&typeof navigator.getGamepads==='function'):!!opts.supported;
      this.storage=opts.storage||null;this.onDisconnect=opts.onDisconnect||(()=>{});this.onMapped=opts.onMapped||(()=>{});
      this.enabled=false;this.deadzone=.15;this.profiles=Object.create(null);this.storageOK=true;
      this.pads=[];this.active=null;this.preferred=null;this.key='';this.mapping=null;this.error='';this.state=empty();this.blocked=true;this.previous=empty().held;
      this.capture=null;this.captureMessage='';this.lastPoll=0;this.mappingOrigin='';this.lastActivity=0;
      try{const saved=JSON.parse(this.storage?.getItem(KEY)||'null');if(saved?.version===1){
        this.enabled=saved.enabled===true;this.deadzone=finite(saved.deadzone)?clamp(saved.deadzone,.05,.4):.15;
        if(saved.profiles&&typeof saved.profiles==='object')for(const [k,v] of Object.entries(saved.profiles).slice(0,12)){const m=cleanMap(v);if(m)this.profiles[k]=m;}
      }}catch(_){this.storageOK=false;}
    }
    save(){try{this.storage?.setItem(KEY,JSON.stringify({version:1,enabled:this.enabled,deadzone:this.deadzone,profiles:this.profiles}));}catch(_){this.storageOK=false;}}
    setEnabled(on){this.enabled=!!on;this.cancelMapping();this.suspend();this.save();}
    setDeadzone(n){this.deadzone=finite(+n)?clamp(+n,.05,.4):.15;this.suspend();this.save();}
    select(index){this.preferred=Number(index);this.active=null;this.key='';this.cancelMapping();this.suspend();}
    suspend(){this.blocked=true;this.state=empty();this.previous=empty().held;}
    status(){
      if(!this.supported)return 'Gamepad API unavailable. Use a current browser over HTTPS or localhost. Touch and keyboard still work.';
      if(this.error)return this.error;
      if(!this.enabled)return 'Controller support is off. Enable it here to use a physical pad.';
      if(!this.active)return 'Press a button on the connected controller while this page is focused.';
      if(this.capture)return this.captureMessage;
      if(!this.mapping)return 'Nonstandard layout. Select Map controller, then follow the prompts with your left stick and buttons.';
      return (this.mappingOrigin==='custom'?'Saved custom mapping':'Standard browser mapping')+(this.blocked?' / release controls to continue':' / ready');
    }
    poll(now=0){
      this.lastPoll=now;
      let pads=[];this.error='';
      try{if(this.supported)pads=Array.from(this.getPads()||[]).filter(p=>p&&p.connected!==false);}
      catch(_){this.error='Controller access is blocked by this browser or page. Open the HTTPS site directly; keyboard and touch remain available.';}
      this.pads=pads;
      let p=null;
      if(this.enabled){p=pads.find(p=>p.index===this.preferred)||pads.find(p=>this.active&&p.index===this.active.index&&identity(p)===this.key)||pads[0]||null;}
      const key=p?identity(p):'';
      const changed=key!==this.key||p?.index!==this.active?.index;
      if(changed){
        const lost=this.active;this.active=p;this.key=key;this.suspend();this.cancelMapping();
        this.mapping=p?(this.profiles[key]||((p.mapping==='standard')?standard():null)):null;
        this.mappingOrigin=p&&this.profiles[key]?'custom':p?.mapping==='standard'?'standard':'';
        if(lost)this.onDisconnect(lost);
      }else this.active=p;
      if(!p||!this.enabled){this.state=empty();return this.state;}
      if(this.capture){this.readCapture(p,now);this.state=empty();return this.state;}
      if(!this.mapping){this.state=empty();return this.state;}
      const s=rawState(p,this.mapping,this.deadzone);
      if(this.blocked){
        if(Math.hypot(s.mx,s.my)<.001&&!Object.values(s.held).some(Boolean))this.blocked=false;
        this.previous={...s.held};this.state=empty();return this.state;
      }
      this.state.mx=s.mx;this.state.my=s.my;this.state.held=s.held;
      for(const k of BUTTONS){this.state.pressed[k]=this.state.pressed[k]||s.held[k]&&!this.previous[k];}
      this.previous={...s.held};
      if(Math.hypot(s.mx,s.my)>.05||Object.values(s.held).some(Boolean))this.lastActivity=now;
      return this.state;
    }
    snapshot(consume=true){const r={mx:this.state.mx,my:this.state.my,held:{...this.state.held},pressed:{...this.state.pressed}};if(consume)for(const k of BUTTONS)this.state.pressed[k]=false;return r;}
    defaults(){if(!this.active)return;delete this.profiles[this.key];this.mapping=this.active.mapping==='standard'?standard():null;this.mappingOrigin=this.mapping?'standard':'';this.cancelMapping();this.suspend();this.save();}
    beginMapping(){
      if(!this.active||!this.enabled)return false;
      this.suspend();
      this.capture={step:0,map:{},neutral:null,armed:false,releaseUntil:0,started:this.lastPoll,axisBase:[],lastBinding:null};
      this.captureMessage='Release every button and center the sticks, then select Ready to map.';return true;
    }
    armMapping(){
      if(!this.capture||!this.active)return;
      const c=this.capture;c.axisBase=Array.from(this.active.axes||[]);c.neutral=Array.from(this.active.buttons||[]).map(b=>typeof b==='number'?b:b.value||0);
      // Do not capture a button still held when Ready was clicked.
      c.armed=false;c.releaseUntil=this.lastPoll+250;c.lastBinding=null;
      this.captureMessage='Release controls, then '+this.instruction();
    }
    instruction(){const k=ACTIONS[this.capture?.step||0];return ['left','right','up','down'].includes(k)?'move the LEFT STICK '+k.toUpperCase():'press the button for '+({attack:'HIT',jump:'JUMP',guard:'GUARD',special:'REVIEW',pause:'PAUSE / START',confirm:'MENU CONFIRM',back:'MENU BACK'}[k]);}
    cancelMapping(){this.capture=null;this.captureMessage='';}
    readCapture(p,now){
      const c=this.capture;if(!c||!c.neutral)return;
      const btns=Array.from(p.buttons||[]).map((b,i)=>val(p,button(i))),axes=Array.from(p.axes||[]);
      const allButtonsUp=btns.every(v=>v<.3);
      const centered=axes.every((v,i)=>!finite(v)||Math.abs(v-(c.axisBase[i]||0))<.25);
      if(!c.armed){
        if(allButtonsUp&&centered&&now>=c.releaseUntil){c.armed=true;this.captureMessage=(c.step+1)+'/'+ACTIONS.length+': '+this.instruction();}
        return;
      }
      let binding=null;
      for(let i=0;i<btns.length;i++)if(btns[i]>.7){binding=button(i);break;}
      const key=ACTIONS[c.step];
      if(!binding&&c.step<4){
        let largest=.6,chosen=-1;
        axes.forEach((v,i)=>{const delta=Math.abs(v-(c.axisBase[i]||0));if(finite(v)&&delta>largest){largest=delta;chosen=i;}});
        if(chosen>=0){const base=c.axisBase[chosen]||0,v=axes[chosen];binding=Math.abs(base)<.35&&Math.abs(v)<=1.01?axis(chosen,v<0?-1:1):{type:'value',index:chosen,value:v};}
      }
      if(!binding)return;
      // Gameplay actions must be distinct. Menu confirm/back may reuse face buttons.
      if(c.step<9&&Object.entries(c.map).some(([k,bs])=>k!==key&&JSON.stringify(bs[0])===JSON.stringify(binding))){
        this.captureMessage='Already assigned. Release and choose a different input for '+key.toUpperCase()+'.';c.armed=false;c.releaseUntil=now+180;return;
      }
      c.map[key]=[binding];c.step++;c.armed=false;c.releaseUntil=now+250;
      if(c.step>=ACTIONS.length){
        this.mapping=cleanMap(c.map);if(this.mapping){this.profiles[this.key]=this.mapping;this.mappingOrigin='custom';this.save();}
        this.cancelMapping();this.suspend();this.onMapped();
      }else this.captureMessage='Saved. Release controls, then '+this.instruction();
    }
    diagnostics(){return {enabled:this.enabled,supported:this.supported,status:this.status(),id:this.active?.id||'',mapping:this.active?.mapping||'',index:this.active?.index??null,deadzone:this.deadzone,profile:this.mappingOrigin,storageAvailable:this.storageOK};}
  }
  return {Hub,standard,cleanMap,rawState,identity,format,ACTIONS,BUTTONS,KEY};
});
