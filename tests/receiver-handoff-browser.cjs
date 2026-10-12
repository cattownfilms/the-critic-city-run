const fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process');
const assert=require('node:assert/strict');
const root=process.cwd(),out=process.env.CRITIC_SCREENSHOTS||path.join(root,'tests/screenshots-playtest/receiver-camera');fs.mkdirSync(out,{recursive:true});
setTimeout(()=>{console.error('Probe timeout');chrome.kill();server.kill();process.exit(1)},300000).unref();
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'critic-layout-'));
const server=cp.spawn('python',['-m','http.server','18791','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
const chrome=cp.spawn('chromium-browser',['--headless','--no-sandbox','--disable-dev-shm-usage','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
let ws,id=0;const pending=new Map();const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function call(method,params={}){return new Promise((res,rej)=>{const n=++id;pending.set(n,{res,rej});ws.send(JSON.stringify({id:n,method,params}));});}
async function ev(expression){const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function until(expr){console.log('WAIT',expr);for(let n=0;n<240;n++){if(await ev(expr))return;await sleep(500);}throw Error('timeout '+expr);}
(async()=>{try{
for(let n=0;n<100&&!fs.existsSync(path.join(profile,'DevToolsActivePort'));n++)await sleep(100);
const port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];
const pages=JSON.parse(cp.execFileSync('python',['-c',"import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:"+port+"/json',timeout=5).read().decode())"],{encoding:'utf8'}));console.log('CDP connected');ws=new WebSocket(pages.find(p=>p.url==='about:blank').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.rej(Error(JSON.stringify(m.error))):p.res(m.result);}};
await call('Page.enable');await call('Emulation.setFocusEmulationEnabled',{enabled:true});await call('Emulation.setDeviceMetricsOverride',{width:915,height:412,deviceScaleFactor:1,mobile:true});await call('Page.navigate',{url:'http://127.0.0.1:18791/'});await until('!!window.__brawler&&__brawler.ready()');
await ev("document.querySelectorAll('.screen').forEach(e=>e.hidden=true);document.getElementById('hud').hidden=false;document.getElementById('controls').hidden=false;__brawler.game.start(null,'hero');__brawler.game.drain();__brawler.game.mode='pause'");
const reports=[];
for(const [width,height] of [[915,412],[360,800]])for(const route of ['hero','franklin']){
 await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
 const report=await ev(`(()=>{const b=__brawler,g=b.game,r=b.renderer();g.franklinUnlocked=true;g.start(null,'${route}');g.stage=6;g.resetWorld();g.makePlayer();g.viewWidth=r.resize().w;g.activeGate=g.nextGate=2;g.p.x=1800;g.p.y=407;g.p.inv=1000;g.spawnBoss();g.mode='play';g.step(1/120,{});const e=g.enemies[0];e.x=2650;e.z=0;g.broadcastSummons.phase='vulnerable';g.broadcastSummons.timer=0;g.camera=g.receiverCamera();const texts=[],fill=r.ctx.fillText;r.ctx.fillText=function(s,...args){texts.push(s);return fill.call(this,s,...args)};r.draw(g,0);r.ctx.fillText=fill;const initial=g.p.x,screen=g.p.x-g.camera;for(let i=0;i<120;i++){g.step(1/120,{mx:1});g.drain();}g.mode='pause';return {texts,initial,screen,x:g.p.x,width:g.viewWidth};})()`);
 assert(report.screen>0&&report.screen<report.width);assert(report.x>report.initial+150,'manual movement blocked');if(width===360)assert(report.texts.some(t=>t==='→ HIT THE EXPOSED CORE →'));
 const start=await ev(`(()=>{const b=__brawler,g=b.game,r=b.renderer(),e=g.enemies.find(e=>e.kind==='broadcast-rig');e.hp=0;g.enemies=[e];g.machineDefeated=true;g.broadcastSummons.active=false;g.broadcastSummons.defeatTime=4;g.broadcastSummons.exitX=g.p.x-230;g.mode='play';g.drain();r.draw(g,0);const displayed=r.lastView.camera;g.resolveBroadcast();for(const event of g.drain())b.handleEvent(event);return displayed;})()`);
 await until('__brawler.scenes().active&&!__brawler.scenes().loading');
 const handoff=await ev('({opening:__brawler.scenes().scene.openingCamera,camera:__brawler.game.camera,id:__brawler.scenes().scene.id})');assert(Math.abs(handoff.opening-start)<.01,'handoff reset displayed camera');
 for(let n=0;n<160;n++){await ev('(()=>{const s=__brawler.scenes();if(s.active)s.skip();})()');if(await ev('__brawler.game.mode==="play"&&!__brawler.scenes().active'))break;await sleep(50);}
 const end=await ev('({mode:__brawler.game.mode,duke:__brawler.game.enemies.some(e=>e.kind==="duke"&&e.hp>0),owner:__brawler.game.encounterCamera()?.kind})');assert(end.mode==='play'&&end.duke&&end.owner==='duke');reports.push({width,height,route,...report,start,handoff,end});
}
fs.writeFileSync(path.join(out,'receiver-handoff-browser.json'),JSON.stringify({passed:true,reports},null,2));console.log('PASS mobile guidance, manual control, actual displayed-camera handoff and skip into physical Duke on both routes');
}finally{ws?.close();chrome.kill();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
