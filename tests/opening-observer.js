/* Observe delegated simulation/completion calls. Never change physics or progress. */
window.observeOpening=function(pauseOnDescent=false){
 const b=__brawler,g=b.game,s=b.scenes(),step=g.step,finish=s.finish;
 const log=window.openingLog={frames:[],completions:[],first:null,pausedOnDescent:false};
 s.finish=function(...args){const active=this.active,id=this.scene?.id;const result=finish.apply(this,args);if(active)log.completions.push({id,completion:{...this.lastCompletion}});return result;};
 g.step=function(...args){const result=step.apply(this,args),arrival=b.openingArrival();
  if(arrival?.started&&log.frames.length<500){const f={t:this.t,x:this.p.x,y:this.p.y,z:this.p.z,vz:this.p.vz,anim:this.p.anim,hp:this.p.hp,action:this.p.action?.name||null,input:b.getInput(),attacks:this.stats.attackStarts||0,arrival:{...arrival},ui:['game','hud','controls'].every(id=>!document.getElementById(id).hidden)};log.frames.push(f);
   if(!log.first)log.first=f;
   if(pauseOnDescent&&!log.pausedOnDescent&&arrival.active&&f.z>0){log.pausedOnDescent=true;b.pause();}
  }return result;
 };
};
