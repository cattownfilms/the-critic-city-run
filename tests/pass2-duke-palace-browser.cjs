const fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process');
const assert=require('node:assert/strict');
const root=process.cwd(),out=process.env.CRITIC_SCREENSHOTS||path.join(root,'tests/screenshots-playtest/pass2-duke-palace');fs.mkdirSync(out,{recursive:true});
setTimeout(()=>{console.error('Probe timeout');chrome.kill();server.kill();process.exit(1)},180000).unref();
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'critic-layout-'));
const server=cp.spawn('python',['-m','http.server','18789','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
const chrome=cp.spawn('chromium-browser',['--headless','--no-sandbox','--disable-dev-shm-usage','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
let ws,id=0;const pending=new Map();const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function call(method,params={}){return new Promise((res,rej)=>{const n=++id;pending.set(n,{res,rej});ws.send(JSON.stringify({id:n,method,params}));});}
async function ev(expression){const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function until(expr){console.log('WAIT',expr);for(let n=0;n<240;n++){if(await ev(expr))return;await sleep(500);}throw Error('timeout '+expr);}
(async()=>{try{
for(let n=0;n<100&&!fs.existsSync(path.join(profile,'DevToolsActivePort'));n++)await sleep(100);
const port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];
const pages=JSON.parse(cp.execFileSync('python',['-c',"import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:"+port+"/json',timeout=5).read().decode())"],{encoding:'utf8'}));console.log('CDP connected');ws=new WebSocket(pages.find(p=>p.url==='about:blank').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.rej(Error(JSON.stringify(m.error))):p.res(m.result);}};
await call('Page.enable');await call('Emulation.setFocusEmulationEnabled',{enabled:true});await call('Emulation.setDeviceMetricsOverride',{width:915,height:412,deviceScaleFactor:1,mobile:true});await call('Page.navigate',{url:'http://127.0.0.1:18789/'});await until('!!window.__brawler&&__brawler.ready()');
await ev("__brawler.game.start(null,'hero');__brawler.game.drain();__brawler.game.mode='pause'");
const reports=[];
async function capture(name){const png=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(png.data,'base64'));}
async function restore(){await ev('(()=>{const s=__brawler.scenes();if(s._probeUpdate){s.update=s._probeUpdate;delete s._probeUpdate;}if(s.active)s.finish(true);})()');}
for(const [width,height] of [[915,412],[360,800]]){
 await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
 for(const route of ['hero','franklin'])for(const scenario of ['watched','skip','already','airborne']){
  await restore();
  await ev(`(()=>{const b=__brawler,g=b.game;g.stage=4;g.resetWorld();g.storyFlags={};g.playerKind='${route}';g.makePlayer();g.viewWidth=b.renderer().resize().w;g.camera=Math.max(0,Math.min(Brawler.LENGTH-g.viewWidth,2450-g.viewWidth/2));g.p.x=${scenario==='already'?'g.camera+g.viewWidth*235/960':'2680'};g.p.y=407;g.p.z=${scenario==='airborne'?70:0};g.p.vz=0;g.mode='pause';g.activeGate=2;g.projection.circuits.forEach((c,i)=>c.active=i===2);g.configureProjection();g.drain();g.disableCircuit(2);const events=g.drain();b.renderer().draw(g,0);g.mode='play';for(const e of events)if(e.type==='story')b.handleEvent(e);})()`);
  await until('__brawler.scenes().active&&!__brawler.scenes().loading');
  const result=await ev(`(()=>{const b=__brawler,g=b.game,s=b.scenes(),trace=[];s._probeUpdate=s.update;s.update=function(){};const camera=g.camera,mark=s.scene.finalCamera+g.viewWidth*235/960,initial=g.p.x;
   for(let i=0;i<300&&s.active;i++){if(i===5&&'${scenario}'==='skip'){s.togglePause(true);s.skip();}s._probeUpdate.call(s,1/60);b.renderer().draw(g,0);trace.push({active:s.active,shot:s.shot.id||'dialogue',dialogue:!!s.shot.dialogue,x:g.p.x,y:g.p.y,z:g.p.z,face:g.p.face,animation:g.p.anim,camera:g.camera,settling:s.cameraState?.active,marks:s.marksComplete});if(s.shot.dialogue)break;}
   return {camera,mark,initial,trace,completion:s.lastCompletion,disabled:g.projection.disabled,reels:g.projectiles.filter(q=>q.kind==='reel').length};})()`);
  assert(result.disabled&&result.reels===0);assert(result.trace.length>0);
  for(const [i,t] of result.trace.entries()){assert(Math.abs(t.camera-result.camera)<.01,'camera moved during final staging');assert(Math.abs(t.x-(i?result.trace[i-1].x:result.initial))<=340/60+.01,'player teleported');if(t.dialogue)assert(t.marks&&!t.settling&&t.z===0&&Math.abs(t.x-result.mark)<5&&t.face===1,'dialogue before staging complete');}
  const end=result.trace.at(-1);assert(Math.abs(end.x-result.mark)<5);
  if(scenario==='skip'){assert(!result.trace.some(t=>t.dialogue));assert.equal(result.completion?.skipped,true);assert(!end.active);}
  else assert(end.dialogue);
  if(scenario==='already')assert(result.trace.every(t=>Math.abs(t.x-result.initial)<.01));
  else assert(result.trace.some(t=>t.animation==='run'&&t.z===0));
  reports.push({width,height,route,scenario,...result});
  if(scenario==='watched'){await ev('__brawler.scenes()._probeUpdate.call(__brawler.scenes(),1/60);__brawler.renderer().draw(__brawler.game,0)');await capture(`duke-palace-after-palace-${route}-${width}x${height}`);}
  const completed=await ev(`(()=>{const s=__brawler.scenes(),g=__brawler.game;if(s.active){s.time=Math.max(s.time,s.shot.minTime||0);s.advance();}return {active:s.active,mode:g.mode,flag:g.storyFlags['boss-projection-defeat'],saved:__brawler.getSave()?.projectionDisabled};})()`);assert(!completed.active&&completed.mode==='play'&&completed.flag&&completed.saved,'normal/skip completion did not restore play/checkpoint');
 }
 // Inspect the actual renderer call order at the first can, without replacing draws.
 await restore();
 await ev(`(()=>{const b=__brawler,g=b.game;g.stage=1;g.resetWorld();g.makePlayer();g.viewWidth=b.renderer().resize().w;g.mode='pause';g.camera=0;b.renderer().draw(g,0);b.scenes().play(CriticCutscenes.scenes['stage-02-intro'],()=>{});})()`);
 await until('__brawler.scenes().active&&!__brawler.scenes().loading');
 await ev(`(()=>{const s=__brawler.scenes();s._probeUpdate=s.update;s.update=function(){};for(let i=0;i<30;i++)s._probeUpdate.call(s,1/60);__brawler.renderer().draw(__brawler.game,0);})()`);
 await capture(`duke-palace-after-cart-entry-${width}x${height}`);
 const cart=await ev(`(()=>{const b=__brawler,g=b.game,s=b.scenes(),r=b.renderer();const trace=[];for(let i=0;i<400;i++){s._probeUpdate.call(s,1/60);const d=g.storyActors.find(a=>a.kind==='duke'),m=g.storyActors.find(a=>a.kind==='marty');trace.push({duke:d.x,marty:m.x,cage:g.storyCage.x,scale:d.renderScale,floor:r.storyActorFloor(g,d)});if(d.x>=900)break;}
  const calls=[],sprite=r.sprite,prop=r.prop;r.sprite=function(...args){calls.push({type:'sprite',who:args[1],y:args[4],scale:args[8]?.scale});return sprite.apply(this,args)};r.prop=function(...args){calls.push({type:'prop',kind:args[1].kind,y:args[3]});return prop.apply(this,args)};try{r.draw(g,0);}finally{r.sprite=sprite;r.prop=prop;}return {trace,calls,props:g.props,sourceDukeBounds:Object.fromEntries(['walk','idle','v11-cart-push','v11-cart-stop','v11-cart-release','v10-button','v11-confrontation'].map(name=>[name,r.animationBounds('duke',name)]))};})()`);
 assert(cart.trace.every(t=>t.scale===1.35&&t.marty===t.cage&&Math.abs(t.marty-t.duke-130)<.01&&Math.abs(t.floor-(407+26*.92))<.01));
 assert(cart.calls.findIndex(c=>c.type==='sprite'&&c.who==='duke')<cart.calls.findIndex(c=>c.type==='prop'&&c.kind==='trash-can'),'can must draw in front of cart');
 assert(cart.props.some(p=>p.kind==='trash-can'&&p.x===900&&p.y===445&&p.hp===20));
 reports.push({width,height,fixture:'cart',...cart});await capture(`duke-palace-after-cart-${width}x${height}`);
 // Actual browser engine and renderer through all three booth locations.
 await restore();
 const booths=await ev(`(()=>{const b=__brawler,g=b.game,r=b.renderer();g.stage=4;g.resetWorld();g.makePlayer();g.viewWidth=r.resize().w;g.p.inv=100;g.mode='pause';const result=[];
  for(let gate=0;gate<3;gate++){g.activeGate=gate;g.configureProjection();g.drain();g.camera=g.encounterCamera().x;g.p.x=g.camera+g.viewWidth*.65;g.enemies=[];const fixed=g.camera;g.mode='play';const lock=[];for(let i=0;i<60;i++){g.step(1/120,{mx:i%2?-.1:.1});lock.push(g.camera);g.drain();}g.disableCircuit(gate);g.drain();const travel=[];if(gate<2)for(let i=0;i<900&&g.activeGate<0;i++){g.step(1/120,{mx:1});travel.push(g.camera);g.drain();}g.mode='pause';r.draw(g,0);result.push({gate,fixed,lock,travel});}return result;})()`);
 for(const booth of booths){assert(booth.lock.every(c=>Math.abs(c-booth.fixed)<.01));for(let i=1;i<booth.travel.length;i++){assert(booth.travel[i]>=booth.travel[i-1]-.001);assert(booth.travel[i]-booth.travel[i-1]<=3.01);}}
 reports.push({width,height,fixture:'booths',booths});
}
await restore();
fs.writeFileSync(path.join(out,'duke-palace-focused-results.json'),JSON.stringify({passed:true,reports},null,2));console.log('PASS 16 final-staging cases, both routes/skip/already-positioned/airborne, two mobile layouts, cart depth/coupling, and all three booth cameras');
}finally{ws?.close();chrome.kill();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
