const assert=require('node:assert/strict'),B=require('../engine'),C=require('../data/cutscenes');
for(const width of [760,1199])for(let booth=0;booth<3;booth++){
 const g=new B.Game();g.start();g.stage=4;g.resetWorld();g.viewWidth=width;g.activeGate=booth;g.p.x=B.GATES[booth];g.configureProjection();g.enemies=[];g.p.inv=999;const target=B.clamp(g.projection.booths[booth].x-width/2,0,B.LENGTH-width);g.camera=Math.max(0,target-180);let last=g.camera,maxDelta=0;
 for(let n=0;n<300;n++){g.step(1/60,{mx:n%120<60?1:-1,my:0});g.drain();maxDelta=Math.max(maxDelta,Math.abs(g.camera-last));last=g.camera;assert.equal(g.cameraTrace.target,target);}
 assert.equal(g.camera,target);assert(maxDelta<16);const p=g.p;assert(p.x>=g.arenaBounds().left&&p.x<=g.arenaBounds().right);
 for(let n=0;n<60;n++){g.step(1/60,{mx:-1,my:0});g.drain();assert.equal(g.camera,target);}
 const before=g.camera;g.disableCircuit(booth);assert.equal(g.encounterCamera(),null);assert.equal(g.camera,before);console.log('PASS booth centered, stationary, collision and release',width,booth);
}
for(const width of [760,1199]){
 const g=new B.Game();g.start();g.stage=6;g.resetWorld();g.viewWidth=width;g.machineDefeated=true;g.enemies=[];g.finishDukeConfrontation(false);g.p.x=2400;g.p.inv=999;g.camera=g.encounterCamera().x;const e=g.enemies[0];e.entry=null;e.state='seek';e.x=2500;e.y=407;
 for(let n=0;n<180;n++){g.step(1/60,{mx:-1,my:0});g.drain();assert(g.p.x>=g.arenaBounds().left);assert(e.x>=g.arenaBounds().left&&e.x<=g.arenaBounds().right);assert(g.storyCage.x-g.camera>0&&g.storyCage.x-g.camera<width-70);}
 const save=g.snapshot();const restored=new B.Game();restored.viewWidth=width;restored.start(save);assert.equal(restored.encounterCamera()?.kind,'duke');assert(restored.storyCage);assert.equal(restored.camera,restored.encounterCamera().x);g.dukeDefeated=true;assert.equal(g.encounterCamera(),null);console.log('PASS final Duke arena, Marty, restore and release',width);
}
const shots=C.scenes['boss-cinema-intro'].shots;assert.equal(shots[0].id,'cinema-marks');assert(shots[0].awaitMarks&&shots[0].awaitCamera);assert.equal(shots.filter(s=>s.id==='screen-emergence').length,1);console.log('PASS marks and camera precede single emergence');
