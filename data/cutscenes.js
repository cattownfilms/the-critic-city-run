/* Authored arcade scenes. Dialogue is rendered by the game, never baked into art. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CriticCutscenes=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const studio='cutscenes/studio.webp',rupture='cutscenes/rupture.webp',rescue='cutscenes/rescue.webp';
const player=(animation='idle')=>[{character:'hero',animation,x:.24,y:.76,scale:.7}];
const beat=(speaker,dialogue,extra={})=>({speaker,dialogue,manual:true,...extra});
const scenes={
 opening:{id:'opening',title:'THE CRITIC: COMING ATTRACTIONS',music:'title',shots:[
  beat('DUKE','Ratings are low. I need you to give this a glowing review, Sherman!',{background:studio,camera:{x:66,y:24,zoom:1.5},pan:{x:-1,y:0},fade:.3}),
  beat('JAY','It Stinks!',{background:studio,camera:{x:22,y:38,zoom:1.6},sound:'backhand'}),
  beat('DUKE','I thought you might say that... Allow me to give you a little motivation...',{background:studio,camera:{x:65,y:24,zoom:1.55},zoom:.02}),
  beat('MARTY','Dad!',{background:studio,camera:{x:90,y:42,zoom:1.5}}),
  beat('JAY','Marty!',{background:studio,camera:{x:20,y:38,zoom:1.55},sound:'hit'}),
  beat('DUKE',"If television can't bring the audience to us, perhaps we'll just bring the television to the audience!",{background:studio,camera:{x:68,y:45,zoom:1.04},pan:{x:1,y:0},zoom:.02}),
  beat('','',{background:rupture,camera:{x:50,y:45,zoom:1.02},crossfade:.22,flash:.24,shake:.7,sound:'slam',auto:1.3,manual:false}),
  beat('JAY','Hatchi Matchi!!!',{background:rupture,camera:{x:24,y:47,zoom:1.05},fade:.18})
 ]},
 'stage-02-intro':{id:'stage-02-intro',title:'LAST TRAIN UPTOWN',shots:[
  beat('JAY','The train. Of course he took the train.',{sprites:player('nose-pinch')}),
  beat('MARTY','Dad! We’re going uptown!',{sprites:player('idle')})
 ]},
 'stage-03-intro':{id:'stage-03-intro',title:'ABOVE THE AVENUE',shots:[
  beat('DUKE','Sherman! Your audience awaits!',{sound:'bear-call'}),
  beat('JAY','I’m here for my son.',{sprites:player('shoulder-roll')})
 ]},
 'stage-04-intro':{id:'stage-04-intro',title:'THEATER DISTRICT',shots:[
  beat('MARTY','Dad! I’m in the theater!',{sprites:player('idle')}),
  beat('JAY','Stay where I can hear you!',{sprites:player('vest-adjust')})
 ]},
 'stage4-clear':{id:'stage4-clear',title:'THE TRAIL CONTINUES',shots:[
  beat('FRANKLIN','Duke took Marty through the theater.',{routes:['hero'],sprites:[{character:'franklin',animation:'idle',x:.7,y:.76,scale:.7}]}),
  beat('JAY','Then that’s where I’m going.',{routes:['hero'],sprites:player('wave-off')}),
  beat('JAY','Marty’s still inside. Keep going!',{routes:['franklin'],sprites:player('idle')})
 ]},
 'stage-05-intro':{id:'stage-05-intro',title:'NOW SHOWING',shots:[
  beat('JAY','Marty?',{sprites:player('idle')}),
  beat('','',{foreground:'story/projection-shadow.webp',foregroundStyle:'portrait',auto:1,manual:false}),
  beat('JAY','That’s not the projectionist.',{foreground:'story/projection-woman.webp',foregroundStyle:'portrait'})
 ]},
 'boss-projection-intro':{id:'boss-projection-intro',title:'THE PROJECTION BOOTH',shots:[
  beat('','',{foreground:'story/projection-shadow.webp',foregroundStyle:'portrait',auto:.8,manual:false}),
  beat('','',{foreground:'story/projection-woman.webp',foregroundStyle:'portrait',sound:'swish',auto:.9,manual:false}),
  beat('JAY','Those projectors are keeping her here.',{sprites:player('idle')})
 ]},
 'boss-projection-defeat':{id:'boss-projection-defeat',title:'END OF REEL',shots:[
  beat('','',{auto:.7,manual:false,flash:.18,sound:'slam'}),
  beat('MARTY','Dad! Duke’s taking me to the broadcast building!'),
  beat('JAY','I’m coming, Marty!',{sprites:player('wave-off')})
 ]},
 'stage-06-intro':{id:'stage-06-intro',title:'LATE SHOW ON THE BLOCK',shots:[
  beat('JAY','The broadcast building. Just a few more blocks.',{sprites:player('idle')}),
  beat('','',{foreground:'story/pizzeria-boss.webp',foregroundStyle:'portrait',auto:.9,manual:false})
 ]},
 'boss-pizzeria-intro':{id:'boss-pizzeria-intro',title:'PIZZERIA SHOWDOWN',shots:[
  beat('','',{foreground:'story/pizzeria-boss.webp',foregroundStyle:'portrait',sound:'step2',auto:.9,manual:false}),
  beat('JAY','I don’t have time for this.',{sprites:player('nose-pinch')}),
  beat('','',{foreground:'story/pizzeria-boss.webp',foregroundStyle:'portrait',auto:.8,manual:false})
 ]},
 'boss-pizzeria-defeat':{id:'boss-pizzeria-defeat',title:'KEEP MOVING',shots:[
  beat('JAY','A memorable performance. I’m still leaving.',{sprites:player('wave-off')})
 ]},
 'stage-07-intro':{id:'stage-07-intro',title:'LIVE FROM PHILLIPS',background:studio,shots:[
  beat('MARTY','Dad! Over here!',{camera:{x:90,y:42,zoom:1.17}}),
  beat('DUKE','Think of the ratings, Sherman!',{camera:{x:73,y:24,zoom:1.1}}),
  beat('JAY','Let him go.',{camera:{x:23,y:40,zoom:1.12}})
 ]},
 'boss-duke-intro':{id:'boss-duke-intro',title:'THE FINAL BROADCAST',background:rupture,shots:[
  beat('DUKE','Nobody leaves before the premiere!',{camera:{x:73,y:24,zoom:1.09},sound:'slam'}),
  beat('MARTY','Dad, the broadcast controls!',{camera:{x:90,y:42,zoom:1.08}}),
  beat('JAY','I’m pulling the plug.',{camera:{x:25,y:43,zoom:1.05}})
 ]},
 'boss-duke-defeat':{id:'boss-duke-defeat',title:'SIGNAL LOST',background:rupture,shots:[
  beat('','',{flash:.28,shake:.6,sound:'slam',auto:1,manual:false})
 ]},
 ending:{id:'ending',title:'THE CRITIC: COMING ATTRACTIONS',background:rescue,music:'title',shots:[
  beat('MARTY','Dad!',{camera:{x:30,y:41,zoom:1.1},crossfade:.4,fade:.4}),
  beat('JAY','Marty. Are you all right?',{camera:{x:32,y:42,zoom:1.1}}),
  beat('MARTY','I am now.',{camera:{x:35,y:42,zoom:1.07}}),
  beat('DUKE','You’ve ruined my premiere!',{camera:{x:78,y:40,zoom:1.1}}),
  beat('JAY','It Stinks!',{camera:{x:32,y:42,zoom:1.03},sound:'backhand'}),
  beat('','',{caption:'MARTY IS SAFE. THE BROADCAST IS OFF. NEW YORK GETS ITS REALITY BACK.',auto:2.5,manual:true,zoom:.015})
 ]}
};
return {title:'THE CRITIC: COMING ATTRACTIONS',scenes};
});
