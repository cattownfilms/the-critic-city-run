const fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process');
const assert=require('node:assert/strict');
const root=process.cwd(),out=process.env.CRITIC_SCREENSHOTS||path.join(root,'tests/screenshots-playtest/receiver-camera');fs.mkdirSync(out,{recursive:true});
setTimeout(()=>{console.error('Probe timeout');chrome.kill();server.kill();process.exit(1)},300000).unref();
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'critic-layout-'));
const server=cp.spawn('python',['-m','http.server','18792','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
const chrome=cp.spawn('chromium-browser',['--headless','--no-sandbox','--disable-dev-shm-usage','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
let ws,id=0;const pending=new Map();const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function call(method,params={}){return new Promise((res,rej)=>{const n=++id;pending.set(n,{res,rej});ws.send(JSON.stringify({id:n,method,params}));});}
async function ev(expression){const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function until(expr){console.log('WAIT',expr);for(let n=0;n<240;n++){if(await ev(expr))return;await sleep(500);}throw Error('timeout '+expr);}
(async()=>{try{
for(let n=0;n<100&&!fs.existsSync(path.join(profile,'DevToolsActivePort'));n++)await sleep(100);
const port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];
const pages=JSON.parse(cp.execFileSync('python',['-c',"import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:"+port+"/json',timeout=5).read().decode())"],{encoding:'utf8'}));console.log('CDP connected');ws=new WebSocket(pages.find(p=>p.url==='about:blank').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.rej(Error(JSON.stringify(m.error))):p.res(m.result);}};
await call('Page.enable');await call('Emulation.setFocusEmulationEnabled',{enabled:true});await call('Emulation.setDeviceMetricsOverride',{width:915,height:412,deviceScaleFactor:1,mobile:true});await call('Page.navigate',{url:'http://127.0.0.1:18792/'});await until('!!window.__brawler&&__brawler.ready()');
await ev("document.querySelectorAll('.screen').forEach(e=>e.hidden=true);document.getElementById('hud').hidden=false;document.getElementById('controls').hidden=false;__brawler.game.start(null,'hero');__brawler.game.drain();__brawler.game.mode='pause'");
const reports=[];
async function capture(name){const png=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(png.data,'base64'));}
for(const [width,height] of [[915,412],[360,800],[1440,900]]){
 await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1000});
 for(const route of ['hero','franklin'])for(const version of ['before','after']){
  await ev(`(()=>{const b=__brawler,g=b.game;g.franklinUnlocked=true;g.start(null,'${route}');g.stage=6;g.resetWorld();g.makePlayer();g.viewWidth=b.renderer().resize().w;g.activeGate=g.nextGate=2;g.p.x=2300;g.p.y=407;g.p.inv=1000;g.spawnBoss();g.mode='play';g.step(1/120,{});g.camera=Math.max(0,2850-g.viewWidth);g.receiverCamera=${version==='before'?'()=>null':'Brawler.Game.prototype.receiverCamera'};g.mode='pause';g.drain();})()`);
  for(const [phase,x,side] of [['relocating',2650,-1],['relocating',2010,1],['vulnerable',2650,1],['rising',2650,-1]]){
   await ev(`(()=>{const g=__brawler.game,e=g.enemies.find(e=>e.kind==='broadcast-rig');e.x=${x};e.z=${['vulnerable','rising'].includes(phase)?0:185};g.broadcastSummons.phase='${phase}';g.broadcastSummons.side=${side};g.broadcastSummons.timer=0;e.telegraph=null;})()`);
   const trace=[];
   for(let batch=0;batch<8;batch++){
    const frames=await ev(`(()=>{const b=__brawler,g=b.game,r=b.renderer(),frames=[];g.mode='play';for(let i=0;i<60;i++){g.step(1/120,{});g.drain();const e=g.enemies.find(e=>e.kind==='broadcast-rig');frames.push({camera:g.camera,target:g.cameraTrace.target,x:e.x,left:e.x-g.camera-82,right:e.x-g.camera+82,player:g.p.x-g.camera,width:g.viewWidth,phase:g.broadcastSummons.phase});}r.draw(g,0);g.mode='pause';return frames;})()`);
    trace.push(...frames);
    if(width<1000&&[0,3,7].includes(batch))await capture(`${version}-${route}-${width}x${height}-${phase}-${side}-${batch}`);
   }
   for(let i=1;i<trace.length;i++){assert(Math.abs(trace[i].camera-trace[i-1].camera)<12,JSON.stringify({width,height,route,version,phase,i,previous:trace[i-1],current:trace[i]}));assert(trace[i].player>0&&trace[i].player<trace[i].width,'player offscreen');}
   if(version==='after'){for(const t of trace.slice(120))assert(t.left>=0&&t.right<=t.width,'Receiver not framed with feasible spacing');}
   reports.push({width,height,route,version,phase,side,trace});
  }
 }
}
fs.writeFileSync(path.join(out,'receiver-camera-browser.json'),JSON.stringify({passed:true,reports},null,2));console.log('PASS both routes, mobile/desktop, both relocation directions, exposed core and recovery; before/after screenshots and frame traces');
}finally{ws?.close();chrome.kill();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
