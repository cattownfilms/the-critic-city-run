/* Authored pixel stages, actor timelines, and compact route-aware dialogue. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(root);else root.CriticCutscenes=factory(root);})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
const actor=(id,character,x,y=318,extra={})=>({id,character,x,y,animation:'idle',scale:1,...extra});
const hero=(x=255,extra={})=>actor('player','selected',x,318,extra);
const duke=(x=610,extra={})=>actor('duke','duke',x,318,extra);
const cage=(x=822,extra={})=>({x,y:318,w:116,h:155,...extra});
const boy=(x=822,extra={})=>actor('marty','marty',x,311,{scale:.92,animation:'scared-idle',lookAt:'player',...extra});
const move=(fromX,toX,duration=1.4,start=0,extra={})=>({fromX,toX,duration,start,...extra});
const dialogue=(speaker,text,extra={})=>({speaker,dialogue:text,manual:true,minTime:.22,...extra});
const route=(jay,franklin,extra={})=>({routeDialogue:{hero:{speaker:'JAY',dialogue:jay,portrait:'jay',expression:'neutral'},franklin:{speaker:'FRANKLIN',dialogue:franklin,portrait:'franklin',expression:'neutral'}},manual:true,minTime:.22,...extra});
const endingParty=()=>[hero(280,{routes:['hero']}),hero(155,{routes:['franklin']}),actor('jay','hero',280,318,{routes:['franklin']})];
const cast=['sherm-punch','sherm-shove','sherm-slam','striped','raptor','bear','hippo'];
const screens=[{x:451,y:62,w:82,h:63},{x:556,y:62,w:82,h:63},{x:661,y:62,w:82,h:63},{x:451,y:144,w:82,h:63},{x:556,y:144,w:82,h:63},{x:661,y:144,w:82,h:63},{x:768,y:78,w:82,h:63}];
const emissions=cast.map((character,i)=>({id:'attraction-'+i,character,screen:i,start:i*.37,duration:1.3,toX:[340,415,570,670,720,780,860][i],toY:318,scale:.86}));
// The opening crowd has one continuous timeline and lands left of Marty’s cage.
const openingScreens=screens.map((screen,i)=>i===6?{...screen,x:346,y:78}:screen);
const openingFormation=[{x:400,y:338,scale:.83,approach:45},{x:464,y:306,scale:.75,approach:44},{x:540,y:344,scale:.78,approach:40},{x:604,y:306,scale:.74,approach:37},{x:661,y:343,scale:.70,approach:33},{x:578,y:350,scale:.75,approach:43},{x:700,y:303,scale:.67,approach:27}];
const openingEmissions=cast.map((character,i)=>{const f=openingFormation[i];return {id:'attraction-'+i,character,screen:i,start:i*.37,duration:1.1,toX:f.x,toY:f.y,scale:f.scale,face:-1,animation:'walk',approach:{toX:f.x-f.approach,duration:1.45}};});
const openingBase=[actor('jay','hero',260,318,{image:'cutscenes/jay-seated.webp',imageHeight:224,imagePivot:{x:128,y:208}}),duke(610),actor('ally','franklin',145,318,{routes:['franklin'],face:1,scale:.96})];
const revealed=[actor('jay','hero',270,318,{animation:'hurt'}),duke(610),boy(822,{lookAt:'jay'}),actor('ally','franklin',145,318,{routes:['franklin'],face:1,scale:.96})];
const chase=(id,title,environment,destination,jay,franklin)=>({id,title,environment,destination,shots:[
 {id:'transport',auto:2.2,minTime:1.8,actors:[duke(250,{animation:'walk',motion:move(250,690,2.2)}),boy(360,{motion:move(360,800,2.2)}),hero(80,{animation:'run',motion:move(-90,185,1,1.2)})],cage:cage(360,{carried:true,motion:move(360,800,2.2)}),destination},
 route(jay,franklin,{actors:[hero(185,{animation:'idle'}),duke(690,{animation:'walk',motion:move(690,1060,1.5)}),boy(800,{motion:move(800,1170,1.5)})],cage:cage(800,{carried:true,motion:move(800,1170,1.5)})})
 ]});
const scenes={
 opening:{id:'opening',title:'COMING ATTRACTIONS / ON THE AIR',music:'title',environment:'studio',background:'cutscenes/pixel-studio.webp',screens:openingScreens,shots:[
  dialogue('DUKE','Ratings are low. I need you to give this a glowing review, Sherman!',{id:'duke-approach',portrait:'duke',actors:[openingBase[0],duke(610,{animation:'walk',motion:move(840,610,1.3)}),openingBase[2]],minTime:1.3,chair:true}),
  dialogue('JAY','It Stinks!',{id:'refusal',portrait:'jay',expression:'disgust',actors:openingBase,chair:true}),
  dialogue('DUKE','I thought you might say that... Allow me to give you a little motivation...',{id:'motivation',portrait:'duke',expression:'smug',actors:openingBase,chair:true}),
  dialogue('MARTY','Dad!',{id:'marty-reveal',portrait:'marty',expression:'worried',actors:revealed,cage:cage(),curtainReveal:1,minTime:1}),
  dialogue('JAY','Marty!',{id:'father-reaction',portrait:'jay',expression:'worried',actors:revealed,cage:cage()}),
  dialogue('DUKE',"If television can't bring the audience to us, perhaps we'll just bring the television to the audience!",{id:'activation',portrait:'duke',expression:'smug',actors:[revealed[0],duke(615,{animation:'attack'}),revealed[2],revealed[3]],cage:cage(),powered:true,sound:'swish'}),
  {id:'screen-emergence',auto:4.1,minTime:3.8,actors:revealed,cage:cage(),powered:true,emissions:openingEmissions,emissionGroup:'opening-attractions',alarm:true,sound:'slam',flash:.14},
  dialogue('JAY','Hatchi Matchi!!!',{id:'hatchi-matchi',portrait:'jay',expression:'shocked',actors:[actor('jay','hero',260,318,{animation:'jump'}),duke(),boy(),revealed[3]],cage:cage(),powered:true,emissions:openingEmissions,emissionGroup:'opening-attractions'}),
  {id:'window-launch',auto:1.9,minTime:1.8,actors:[actor('jay','hero',260,318,{animation:'hurt',motion:move(260,-95,1,.35,{fromY:318,toY:135,arc:55}),rotate:-22}),actor('ally','franklin',145,318,{routes:['franklin'],animation:'jump',motion:move(145,-70,.85,.85,{fromY:318,toY:145,arc:55})}),duke(610,{animation:'walk',motion:move(610,1090,1.8)}),boy(822,{motion:move(822,1302,1.8)})],cage:cage(822,{motion:move(822,1302,1.8)}),powered:true,emissions:openingEmissions,emissionGroup:'opening-attractions',emissionActions:{'*':{advance:38,duration:1.8,animation:'walk'},'attraction-0':{advance:22,duration:.28,animation:'walk',after:.22,afterAnimation:'attack'}},brokenWindow:true,glass:true,sound:'heavy',shake:.35},
  {id:'street-recovery',gameplayEntry:true,environment:'broadway',background:null,caption:'BROADWAY'}
 ]},
 'stage-02-intro':chase('stage-02-intro','LAST TRAIN UPTOWN','subway','UPTOWN EXPRESS',"You're filthy stinking rich and you're still taking public transit?!","I'm baby New Year!!!"),
 'stage-03-intro':chase('stage-03-intro','ABOVE THE AVENUE','rooftop','ROOF ACCESS / PREMIERE',"Stairs! My one weakness!","The peanut is neither a pea or a nut! Oh wait… It is a nut."),
 'stage-04-intro':chase('stage-04-intro','THEATER DISTRICT','theater','PALACE CINEMA',"Ah, isn't this where we saw Cats? Not the musical, I think they were literally eating out of the garbage…","I can say my name backward. Nilknarf!"),
 'stage4-clear':{id:'stage4-clear',title:'THE PREMIERE CONTINUES',environment:'theater',shots:[
  dialogue('FRANKLIN',"Nilknarf!",{routes:['hero'],portrait:'franklin',actors:[hero(270),actor('franklin','franklin',565)]}),
  route("Ah the theater, where nothing is sharper than my rapier wit!","I'm not wearing pants.",{actors:[hero(270,{animation:'walk',motion:move(270,470,1.1)})]})
 ]},
 'stage-05-intro':{id:'stage-05-intro',title:'PALACE CINEMA',environment:'cinema',shots:[
  {id:'transport',auto:2,minTime:1.8,screenForeshadow:true,actors:[duke(250,{animation:'walk',motion:move(250,690,2)}),boy(360,{motion:move(360,800,2)}),hero(80,{animation:'run',motion:move(-90,185,1,.8)})],cage:cage(360,{carried:true,motion:move(360,800,2)}),destination:'SERVICE EXIT / LITTLE ITALY'},
  {id:'booth-eyes',auto:1.5,minTime:1.25,actors:[hero(260)],booth:{phase:'shadow',active:1},circuits:3,screenForeshadow:true},
  {id:'booth-light',portrait:'projectionist',speaker:'PROJECTIONIST',auto:1,minTime:.9,actors:[hero(260)],booth:{phase:'lit',active:1},circuits:3,sound:'swish',screenForeshadow:true},
  route("That's one very hostile projectionist.","This looks like a job for the robot puncher!",{actors:[hero(260)],booth:{phase:'lit',active:1},circuits:3,objective:'DISABLE THE 3 PROJECTION CIRCUITS',expression:'focused',screenForeshadow:true})
 ]},
 'boss-projection-intro':{id:'boss-projection-intro',title:'THE PROJECTION BOOTH',environment:'cinema',shots:[
  {id:'booth-eyes',auto:1,minTime:.9,actors:[hero(260)],booth:{phase:'shadow',active:1},circuits:3},
  {id:'booth-light',portrait:'projectionist',speaker:'PROJECTIONIST',auto:1,minTime:.9,actors:[hero(260)],booth:{phase:'lit',active:1},circuits:3,sound:'swish'},
  route('Three circuits. At least this theater has an off switch.','Lights first. Then the exit.',{actors:[hero(260)],booth:{phase:'lit',active:1},circuits:3,objective:'DISABLE THE 3 PROJECTION CIRCUITS',expression:'focused'})
 ]},
 'boss-projection-defeat':{id:'boss-projection-defeat',title:'END OF REEL',environment:'cinema',shots:[
  {id:'booth-shutdown',auto:1.2,minTime:1,actors:[hero(260)],booth:{phase:'off'},circuits:0,sound:'slam',destination:'BOOTH POWER / OFF'},
  route("I usually don't sit through the credits…","This isn't my house.",{actors:[hero(260,{animation:'walk',motion:move(260,530,1.2)})],booth:{phase:'off'},circuits:0,destination:'BOOTH POWER / OFF'})
 ]},
 'stage-06-intro':chase('stage-06-intro','LITTLE ITALY','pizzeria','BROADCAST TOWER',"I'm going to fight my boss. Do I dare live out the American dream?","Everbody seen the leprechaun say, “Yeah!”"),
 'boss-cinema-intro':{id:'boss-cinema-intro',title:'THE MAIN ATTRACTION',environment:'cinema',shots:[
  {id:'screen-shadow',auto:1.3,minTime:1.1,actors:[hero(235)],screenForeshadow:true,sound:'swish'},
  {id:'screen-emergence',auto:1.6,minTime:1.4,actors:[hero(235),actor('headliner','pizzeria-boss',635,318,{animation:'walk',afterAnimation:'guard-reset',after:1.4,face:1,scale:1.24,emerging:true,motion:move(242,635,1.6,0,{fromY:180,toY:318})})],screenForeshadow:true,flash:.12,sound:'slam'},
  dialogue('VIOLENT AUSTRIAN RABBI',"Welcome to your Bar Mitsfa. It's time to become a man. A dead man.",{portrait:'pizzeria',actors:[hero(235),actor('headliner','pizzeria-boss',635,318,{animation:'guard-reset',face:-1,scale:1.24})]}),
  route('I usually leave before the credits.','You’re blocking the exit.',{actors:[hero(235),actor('headliner','pizzeria-boss',635,318,{face:-1,scale:1.24})]})
 ]},
 'boss-cinema-defeat':{id:'boss-cinema-defeat',title:'THE CREDITS',environment:'cinema',shots:[
  route("Finally! A believable performance.","23 Skidoo!!!",{actors:[hero(235),actor('headliner','pizzeria-boss',635,318,{animation:'death',face:-1,scale:1.24})]})
 ]},
 'boss-spike-intro':{id:'boss-spike-intro',title:'SPIKE',environment:'pizzeria',shots:[
  {id:'door-opens',auto:1,minTime:.85,door:{opening:true},actors:[hero(235)],sound:'step2'},
  dialogue('SPIKE','You’re not getting past me.',{portrait:'spike',door:{open:true},actors:[hero(235),actor('spike','spike',670,318,{animation:'walk',face:-1,scale:1.08,motion:move(840,670,1.1)})],minTime:1.1}),
  route("Stick to social commentary, jerk.","Put the can down, Spike. Do the right thing.",{door:{open:true},actors:[hero(235),actor('spike','spike',670,318,{animation:'throw-ready',face:-1,scale:1.08})]})
 ]},
 'boss-spike-defeat':{id:'boss-spike-defeat',title:'THE SERVICE ROUTE',environment:'pizzeria',shots:[
  route("Stay down, Spike. Like your diminishing box-office returns.","I'll take a pepperoni and 2 plains.",{actors:[hero(235),actor('spike','spike',670,318,{animation:'death',face:-1,scale:1.08})],destination:'BROADCAST TOWER'})
 ]},
 'stage-07-intro':{id:'stage-07-intro',title:'LIVE FROM PHILLIPS',environment:'broadcast',screens,shots:[
  {id:'last-transport',auto:2.3,minTime:2,actors:[duke(390,{animation:'walk',motion:move(390,638,2.1)}),boy(502,{motion:move(502,792,2.1)}),hero(100,{animation:'run',motion:move(-60,265,1.5,.6)})],cage:cage(502,{carried:true,motion:move(502,792,2.1)}),destination:'TRANSMISSION CORE',alarm:true},
  dialogue('DUKE',"You should have taken the deal, Sherman.",{portrait:'duke',actors:[hero(265),duke(638),boy(792)],cage:cage(792),powered:true,alarm:true}),
  route("You should know I have too much integrity, Duke!","Which way is the bus station?",{actors:[hero(265,{animation:'walk',motion:move(265,345,1)}),duke(638),boy(792)],cage:cage(792),powered:true,alarm:true})
 ]},
 'boss-broadcast-intro':{id:'boss-broadcast-intro',title:'THE FINAL BROADCAST',environment:'broadcast',screens,shots:[
  dialogue('DUKE','Live. Everywhere. All at once!',{portrait:'duke',expression:'smug',actors:[hero(280),duke(638,{animation:'attack'}),boy(792)],cage:cage(792),powered:true,alarm:true}),
  {id:'broadcast-surges',auto:2.4,minTime:2.2,actors:[hero(280,{animation:'guard'}),duke(638),boy(792)],cage:cage(792),powered:true,alarm:true,emissions:emissions.slice(0,5).map((e,i)=>({...e,start:i*.25,toX:450+i*82})),flash:.16,sound:'slam'},
  route('Not one more frame.',"Hands off my grandson.",{actors:[hero(280,{animation:'walk',motion:move(280,370,1)}),duke(638),boy(792)],cage:cage(792),powered:true,alarm:true,objective:'STOP THE BROADCAST'})
 ]},
 'boss-broadcast-defeat':{id:'boss-broadcast-defeat',title:'SIGNAL LOST',environment:'broadcast',screens,shots:[
  {id:'signal-dies',auto:1.2,minTime:1,actors:[hero(280),duke(638,{animation:'hurt'}),boy(792)],cage:cage(792),powered:false,flash:.18,sound:'slam'},
  dialogue('DUKE','You don’t get to cancel me!',{portrait:'duke',expression:'angry',actors:[hero(280),duke(515,{animation:'walk',motion:move(638,515,1)}),boy(792)],cage:cage(792),minTime:1}),
  route('Then let’s discuss your performance.','Come down here.',{actors:[hero(280),duke(515,{animation:'folded-idle',face:-1}),boy(792)],cage:cage(792)})
 ]},
 'boss-duke-intro':{id:'boss-duke-intro',title:'DUKE PHILLIPS',environment:'broadcast',shots:[
  dialogue('DUKE','I own this network!',{portrait:'duke',expression:'angry',actors:[hero(280),duke(550,{animation:'lead-jab',face:-1,motion:move(605,550,.8)}),boy(792)],cage:cage(792),minTime:.8}),
  route('Yes. And I’m cancelling my subscription.','You don’t own me.',{actors:[hero(280,{animation:'guard'}),duke(550,{face:-1}),boy(792)],cage:cage(792)})
 ]},
 'boss-duke-defeat':{id:'boss-duke-defeat',title:'THE LAST WORD',environment:'broadcast',shots:[
  dialogue('DUKE','Fine! Take him!',{portrait:'duke',expression:'defeated',actors:[hero(280),duke(570,{animation:'death',face:-1}),boy(792)],cage:cage(792),auto:1.8,minTime:1.5}),
  route('That’s the first sensible thing you’ve said.',"Nilknarf!",{actors:[hero(280),duke(570,{animation:'death',face:-1}),boy(792)],cage:cage(792,{open:true}),destination:'MARTY / CAGE OPEN'})
 ]},
 ending:{id:'ending',title:'THAT’S A WRAP',environment:'broadcast',music:'title',shots:[
  {id:'marty-freed',auto:1.6,minTime:1.3,actors:[hero(280,{routes:['hero']}),hero(155,{routes:['franklin']}),boy(280,{animation:'run',y:318,motion:move(792,350,1.4,0,{fromY:311,toY:318})}),duke(660,{animation:'death',face:-1}),actor('jay','hero',280,318,{routes:['franklin'],animation:'walk',motion:move(-30,280,1.3)})],cage:cage(792,{open:true})},
  dialogue('MARTY','Dad!',{portrait:'marty',expression:'happy',actors:[...endingParty(),boy(350,{animation:'idle',y:318})]}),
  route('Marty. Are you all right?','Safe now, Marty?',{actors:[...endingParty(),boy(350,{animation:'idle',y:318})]}),
  dialogue('MARTY','I am now.',{portrait:'marty',expression:'happy',actors:[...endingParty(),boy(350,{animation:'idle',y:318})]}),
  route('Now let’s find something good to watch.',"Has anyone seen the remote control?",{actors:[...endingParty(),boy(350,{animation:'idle',y:318})],caption:'MARTY IS SAFE. THE BROADCAST IS OFF. NEW YORK GETS ITS REALITY BACK.'})
 ]}
};
// Expressions supplied in the revised campaign script.
scenes['stage-02-intro'].shots[1].routeDialogue.hero.expression='smug';
scenes['stage-03-intro'].shots[1].routeDialogue.hero.expression='worried';
// Still actors face their scene partner; moving actors derive travel direction.
for(const scene of Object.values(scenes))for(const shot of scene.shots)for(const a of shot.actors||[]){
 if(a.face!==undefined||a.lookAt!==undefined||a.motion&&a.motion.fromX!==a.motion.toX)continue;
 const ids=(shot.actors||[]).map(p=>p.id);
 if(a.id==='player'||a.id==='jay')a.lookAt=ids.includes('marty')?'marty':ids.includes('duke')?'duke':ids.includes('headliner')?'headliner':ids.includes('spike')?'spike':ids.includes('franklin')?'franklin':undefined;
 else if(a.id==='duke')a.lookAt=ids.includes('player')?'player':'jay';
 else if(a.id==='marty')a.lookAt=ids.includes('jay')?'jay':'player';
 else if(a.id==='headliner'||a.id==='spike')a.lookAt='player';
}
// Every playable reaction resolves the chosen route; Jay remains Marty’s father in shared story beats.
function resolveShot(shot,routeKind='hero'){const chosen=shot.routeDialogue?.[routeKind==='franklin'?'franklin':'hero'];return chosen?{...shot,...chosen}:shot;}
function resolveScene(scene,routeKind='hero'){return {...scene,shots:scene.shots.filter(s=>!s.routes||s.routes.includes(routeKind)).map(s=>resolveShot(s,routeKind))};}
function portraitFrames(meta,id,expression='neutral'){const bank=(meta?.portraits?.speakers||meta?.portraits)?.[id],expressions=bank?.expressions;expression=({smug:'joy',angry:'anger',defeated:'pain',shocked:'surprise',worried:'fear',focused:'determination',happy:'joy'})[expression]||expression;let frames=expressions?.[expression]?.frames||expressions?.neutral?.frames||expressions?.talk?.frames;if(!frames&&expressions){const first=Object.values(expressions).find(e=>e?.frames?.length);frames=first?.frames;}return (frames||[]).map(f=>({...f,image:String(f.image||f.file||'').replace(/^assets\//,'')}));}
function portraitPath(meta,id,expression='neutral'){return portraitFrames(meta,id,expression)[0]?.image||'portraits/'+id+'/talk-00.webp';}
function dependencies(id,routeKind='hero',meta){const scene=scenes[id];if(!scene)return {banks:[],animations:{},images:[]};meta=meta||root.BRAWLER_ASSETS?.sprites||root.__brawler?.meta?.();const resolved=resolveScene(scene,routeKind),banks=new Set(),animations={},images=new Set();
 for(const shot of resolved.shots){const bg=Object.prototype.hasOwnProperty.call(shot,'background')?shot.background:scene.background;if(bg)images.add(bg);for(const a of shot.actors||[]){if(a.routes&&!a.routes.includes(routeKind))continue;const who=a.character==='selected'?routeKind:a.character;if(a.image){images.add(a.image);continue;}banks.add(who);(animations[who]||(animations[who]=new Set())).add(a.animation||'idle');if(a.afterAnimation)animations[who].add(a.afterAnimation);}
  if(shot.powered&&(shot.screens||scene.screens)){for(const who of cast){banks.add(who);(animations[who]||(animations[who]=new Set())).add('idle');}}for(const e of shot.emissions||[]){banks.add(e.character);(animations[e.character]||(animations[e.character]=new Set())).add(e.animation||'idle');if(e.approach)animations[e.character].add('idle');const action=shot.emissionActions?.[e.id]||shot.emissionActions?.['*'];if(action?.animation)animations[e.character].add(action.animation);if(action?.afterAnimation)animations[e.character].add(action.afterAnimation);}if(shot.portrait||shot.speaker){const who=shot.portrait||({JAY:'jay',DUKE:'duke',MARTY:'marty',FRANKLIN:'franklin','VIOLENT AUSTRIAN RABBI':'pizzeria'}[shot.speaker]);if(who){const frames=portraitFrames(meta,who,shot.expression||'neutral');if(frames.length)for(const f of frames)images.add(f.image);else images.add(portraitPath(meta,who,shot.expression||'neutral'));}}if(shot.booth&&shot.booth.phase==='lit')images.add('story/projection-woman-pixel.webp');}
 return {banks:[...banks],animations:Object.fromEntries(Object.entries(animations).map(([k,v])=>[k,[...v]])),images:[...images]};}
return {title:'THE CRITIC: COMING ATTRACTIONS',scenes,resolveShot,resolveScene,portraitPath,portraitFrames,dependencies,cast};
});
