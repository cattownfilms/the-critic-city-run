const assert=require('node:assert/strict');
const {CinematicCamera}=require('../engine.js');
const d=require('../data/cutscenes.js');
let count=0;function test(name,fn){fn();console.log('PASS',name);count++;}
test('Eased pan reaches target without overshoot; completion fires once',()=>{let done=0;const c=new CinematicCamera(120);c.shot('one',{x:720,y:10,zoom:1.04},{duration:1,onComplete:()=>done++});let last=120,steps=[];for(let i=0;i<120;i++){const p=c.update(1/60);assert(p.x>=last&&p.x<=720);steps.push(p.x-last);last=p.x;}assert.equal(c.pose.x,720);assert.equal(done,1);assert(steps[0]<steps[20]);assert(steps[59]<steps[40]);});
test('Retarget, pause and cancellation preserve displayed pose',()=>{const c=new CinematicCamera();c.shot('a',{x:500});c.update(.2);const x=c.pose.x;c.shot('b',{x:20});assert.equal(c.pose.x,x);c.update(0);assert.equal(c.pose.x,x);c.cancel();c.update(1);assert.equal(c.pose.x,x);});
test('Repeated shot keys cannot restart interpolation; reduced motion settles',()=>{const c=new CinematicCamera();for(let i=0;i<12;i++){c.shot('a',{x:300},{reduced:true});c.update(.02);}assert.equal(c.pose.x,300);assert(!c.active);});
test('Reunion remains first, Jay speaks on both routes, collapse cannot be advanced early',()=>{for(const route of ['hero','franklin']){const s=d.resolveScene(d.scenes.ending,route);assert.equal(s.shots[0].id,'marty-freed');assert.equal(s.shots.at(-2).speaker,'JAY');assert.equal(s.shots.at(-2).dialogue,"Oh my God! What's that?!?");assert(s.shots.at(-1).minTime>=7);assert.equal(s.shots.at(-1).images.length,7);}});
console.log(count+' focused camera checks passed');
