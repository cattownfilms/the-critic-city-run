const fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process');
// Fixed-clock recordings of the actual scene renderer; no gameplay or asset edits.
const root=process.cwd(),out=process.env.CRITIC_SCREENSHOTS||path.join(root,'tests/screenshots-playtest/pass2-continuity');
setTimeout(()=>{console.error('Probe timeout');chrome.kill();server.kill();process.exit(1)},300000).unref();
fs.mkdirSync(out,{recursive:true});
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
const reports=[];
for(const [width,height] of [[915,412],[360,800]]){
 await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
 await ev("__brawler.scenes().play(CriticCutscenes.scenes.opening,()=>{})");await until('__brawler.scenes().active&&!__brawler.scenes().loading');
 await ev(`(()=>{const s=__brawler.scenes();s.index=s.shots.findIndex(x=>x.id==='screen-emergence');s._shot();s.time=s.totalTime=0;s.emissionTimelines.set('opening-attractions',0);s._motionUpdate=s.update;s.update=function(){};s._motionUpdate.call(s,0);})()`);
 const stem=`mob-${process.env.PHASE}-${width}x${height}`,frames=path.join(out,stem);fs.mkdirSync(frames,{recursive:true});const trace=[];
 for(let i=0;i<72;i++){
  const state=await ev(`(()=>{const s=__brawler.scenes();for(let n=0;n<3;n++){if(s.shot.id==='hatchi-matchi'&&s.time>=1.2)s.advance();s._motionUpdate.call(s,1/30);}return {shot:s.shot.id,time:s.time,total:s.totalTime,actors:s.actorStates,emissions:s.shot.emissions?.map(e=>({id:e.id,scale:e.scale}))};})()`);trace.push(state);
  const png=await call('Page.captureScreenshot',{format:'png'});const bytes=Buffer.from(png.data,'base64');fs.writeFileSync(path.join(frames,String(i).padStart(3,'0')+'.png'),bytes);
  if(i===38||i===50||i===62)fs.writeFileSync(path.join(out,`${stem}-${state.shot}.png`),bytes);
 }
 cp.execFileSync('python',['-c',"from PIL import Image; from pathlib import Path; import sys; frames=[Image.open(p).convert('RGB') for p in sorted(Path(sys.argv[1]).glob('*.png'))]; frames[0].save(sys.argv[2],save_all=True,append_images=frames[1:],duration=100,loop=0)",frames,path.join(out,stem+'.gif')]);
 reports.push({width,height,trace});await ev('(()=>{const s=__brawler.scenes();s.update=s._motionUpdate;delete s._motionUpdate;s.skip();})()');
}
fs.writeFileSync(path.join(out,`mob-${process.env.PHASE}-trace.json`),JSON.stringify(reports,null,2));console.log('Saved motion evidence',process.env.PHASE);
}finally{ws?.close();chrome.kill();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
