/* The Critic: Coming Attractions. Authored campaign adapter; legacy enemy IDs are save-compatible. */
(function(root){'use strict';
const STAGES=[
 {id:'broadway',name:'Broadway Blocks',sub:'AFTER HOURS',scene:'broadway',music:'broadway',exit:'UPTOWN',purpose:'Follow Duke’s escaping broadcast convoy through recognisable New York.',waves:[['sherm-punch','sherm-punch'],['sherm-punch','sherm-shove','bear'],['sherm-punch','sherm-shove','striped']]},
 {id:'subway',name:'Last Train Uptown',sub:'UNDER THE AVENUE',scene:'subway',music:'subway',exit:'ROOFTOPS',purpose:'Take the subway past the first trailers spilling into the city.',intro:'stage-02-intro',waves:[['sherm-punch','sherm-shove','sherm-slam'],['sherm-shove','sherm-punch','raptor'],['sherm-slam','sherm-punch','hippo','sherm-shove']]},
 {id:'rooftop',name:'Above the Avenue',sub:'THE ROOFTOP CIRCUIT',scene:'rooftop',music:'rooftop',exit:'THE PREMIERE',purpose:'Trace Duke’s signal across rooftop transmitters toward the premiere.',intro:'stage-03-intro',waves:[['sherm-punch','sherm-shove','striped'],['sherm-slam','sherm-punch','bear'],['sherm-shove','sherm-slam','raptor','sherm-punch']]},
 {id:'theater',name:'Theater District',sub:'FRANKLIN / THE PREMIERE',scene:'theater',music:'theater',exit:'PALACE CINEMA',purpose:'Get past Franklin and discover that Marty has already been moved to the broadcast tower.',intro:'stage-04-intro',boss:{kind:'franklin',alternateKind:'sherm-slam',hp:420,definition:'franklin'},waves:[['sherm-punch','sherm-slam','hippo'],['sherm-shove','sherm-punch','striped','sherm-slam'],['sherm-punch','sherm-shove','raptor','sherm-slam']]},
 {id:'cinema',name:'Palace Cinema',sub:'THE SHOW WILL NOT STOP',scene:'cinema',music:'theater',exit:'LITTLE ITALY',purpose:'Silence the projection booths, then defeat the cream-scarf headliner escaping the cinema screen.',intro:'stage-05-intro',projection:true,boss:{kind:'pizzeria-boss',hp:330,definition:'pizzeria-boss',intro:'boss-cinema-intro'},waves:[['sherm-punch','sherm-shove','sherm-punch'],['sherm-punch','sherm-shove','bear'],['sherm-slam','sherm-punch','sherm-shove']]},
 {id:'little-italy',name:'Little Italy',sub:'A VERY SHORT INTERMISSION',scene:'little-italy',music:'broadway',exit:'BROADCAST TOWER',purpose:'Get past Spike’s trash-can ambush outside the pizzeria on Duke’s service route.',intro:'stage-06-intro',boss:{kind:'spike',hp:340,definition:'spike',intro:'boss-spike-intro'},waves:[['sherm-punch','sherm-shove','sherm-punch'],['sherm-slam','sherm-punch','raptor'],['sherm-shove','sherm-punch','sherm-slam']]},
 {id:'broadcast',name:'Broadcast Tower',sub:'DUKE’S LAST BROADCAST',scene:'broadcast',music:'rooftop',exit:'MARTY',purpose:'Disable the transmitter, confront Duke himself, and rescue Marty after Duke falls.',intro:'stage-07-intro',boss:{kind:'broadcast-rig',hp:460,definition:'broadcast-rig',intro:'boss-broadcast-intro'},finalBoss:{kind:'duke',hp:340,definition:'duke',intro:'boss-duke-intro'},waves:[['sherm-punch','sherm-shove','sherm-slam'],['sherm-punch','sherm-shove','hippo'],['sherm-slam','sherm-punch','sherm-shove']]}
];
const EINFO={
 bear:{hp:56,speed:95,damage:11,range:104,wind:.53,attack:.52,hit:.23,radius:32,name:'Accordion Bear',score:140},
 hippo:{hp:102,speed:74,damage:17,range:117,wind:.68,attack:.58,hit:.24,radius:43,name:'Green Hippo',score:220},
 'sherm-punch':{hp:45,speed:136,damage:9,range:86,wind:.45,attack:.41,hit:.17,radius:27,name:'Shermometer v1',score:120},
 'sherm-shove':{hp:56,speed:99,damage:11,range:104,wind:.56,attack:.52,hit:.23,radius:29,name:'Shermometer v2',score:140},
 'sherm-slam':{hp:94,speed:76,damage:16,range:117,wind:.70,attack:.58,hit:.24,radius:34,name:'Shermometer v3',score:200},
 striped:{hp:56,speed:134,damage:11,range:95,wind:.48,attack:.47,hit:.20,radius:28,name:'Fred K',score:160},
 raptor:{hp:72,speed:103,damage:13,range:116,wind:.61,attack:.55,hit:.24,radius:35,name:'JP Raptor Esq',score:180},
 franklin:{hp:420,speed:124,damage:14,range:110,wind:.65,attack:.65,hit:.25,radius:30,name:'Franklin',score:1200},
 'booth-enforcer':{hp:280,speed:95,damage:15,range:117,wind:.85,attack:.8,hit:.3,radius:34,name:'Shermometer v3',score:1300},
 'pizzeria-boss':{hp:330,speed:110,damage:14,range:112,wind:.65,attack:.7,hit:.25,radius:32,name:'Cinema Headliner',score:1600,renderScale:1.24},
 spike:{hp:340,speed:115,damage:16,range:500,wind:.9,attack:.78,hit:.32,radius:36,name:'Spike',score:1800,renderScale:1.08},
 duke:{hp:340,speed:145,damage:17,range:118,wind:.75,attack:.68,hit:.25,radius:36,name:'Duke Phillips',score:2400,renderScale:1.1},
 'broadcast-rig':{hp:460,speed:0,damage:15,range:580,wind:1.05,attack:.7,hit:.25,radius:58,name:'Duke’s Broadcast System',score:2400},
 'projection-woman':{damage:9,name:'Projectionist',radius:32}
};
const BOSS_DEFINITIONS={
 duke:{recovery:.7,hurtRecovery:.4,cooldown:.45,phaseCooldown:.3,moves:[
  {name:'LEAD JAB',anim:'lead-jab',windAnim:'folded-idle',wind:.6,duration:.48,hits:[.18],reach:108,lane:30,damage:14},
  {name:'EXECUTIVE CROSS',anim:'attack',windAnim:'folded-idle',wind:.7,duration:.68,hits:[.27],reach:122,lane:34,damage:19,recovery:.85},
  {name:'HOSTILE TAKEOVER',anim:'attack',windAnim:'folded-idle',wind:.8,duration:.82,hits:[.42],reach:116,lane:34,damage:18,rush:215,recovery:.95}
 ]},
 'booth-enforcer':{recovery:.85,moves:[
  {name:'AISLE RUSH',anim:'attack',wind:.85,duration:.9,hits:[.42],reach:117,lane:45,damage:15,rush:115},
  {name:'OVERHEAD SLAM',anim:'slam-overhead-alt',wind:.9,duration:.78,hits:[.34],reach:125,lane:48,damage:17,all:true,recovery:1.05}
 ]},
 'pizzeria-boss':{recovery:.85,moves:[
  {name:'GUARDED ONE-TWO',anim:'attack',secondAnim:'opposite-strike',switchAt:.36,windAnim:'guard-reset',wind:.72,duration:.72,hits:[.26,.49],reach:108,lane:30,damage:12,guarded:true},
  {name:'SIDEWALK RUSH',anim:'attack',windAnim:'guard-reset',wind:.85,duration:.85,hits:[.44],reach:110,lane:30,damage:15,rush:210},
  {name:'HEAVY COUNTER',anim:'opposite-strike',windAnim:'guard-reset',wind:.95,duration:.85,hits:[.43],reach:128,lane:42,damage:16,recovery:1.05}
 ]},
 spike:{recovery:1.05,ranged:true,preferredDistance:220,attackDistance:500,retreatDistance:145,moves:[
  {name:'CAN TOSS',anim:'trash-throw',windAnim:'throw-ready',wind:.9,duration:.78,hits:[.32],sourceImpact:7/19,damage:16,radius:38,area:'trash-can',flight:.9},
  {name:'LOW SKIP',anim:'trash-throw',windAnim:'throw-ready',wind:1.05,duration:.85,hits:[.35],sourceImpact:7/19,damage:15,radius:36,area:'trash-can',flight:1.0,low:true,recovery:1.15},
  {name:'BACK OFF',anim:'attack',windAnim:'idle',wind:.68,duration:.65,hits:[.28],reach:128,lane:35,damage:17,recovery:.85}
 ]},
 'broadcast-rig':{stationary:true,recovery:1.3,moves:[
  {name:'SWEEPING SIGNAL',anim:'attack',wind:1.12,duration:.62,hits:[.22],reach:610,lane:23,damage:15,area:'lane'},
  {name:'STATIC BURST',anim:'attack',wind:1.18,duration:.65,hits:[.25],radius:67,damage:16,area:'spot'},
  {name:'LIVE FEED',anim:'attack',wind:1.02,duration:.92,hits:[.24],radius:44,damage:12,area:'projectile',recovery:1.55}
 ]}
};
const ITEMS={coffee:{name:'Coffee',health:18,meter:8,score:25},'turkey-dinner':{name:'Turkey Dinner',health:46,meter:12,score:50}};
const PROPS={bin:{name:'Trash Can',alias:'trash-can'},'trash-can':{name:'Trash Can'},box:{name:'Box'},circuit:{name:'Booth Circuit',health:45}};
const PROJECTION={colors:['#ffc36b','#73e3e4','#c2a0ff'],windowXs:[170,390,610,830,1050,1270,1490,1710,1930,2110,2310,2530,2750],shadow:.4,reveal:.55,wind:1.15,flight:.7,cooldown:2.4};
function propsFor(stage){return [{id:1,x:900,y:445,hp:20,kind:'trash-can',scale:1.35,drop:'coffee'},{id:2,x:1810,y:445,hp:24,kind:'box',scale:1.35,drop:stage>=4?'turkey-dinner':'coffee'},{id:3,x:2540,y:354,hp:20,kind:'box',scale:1.35,drop:'coffee'}];}
const API={STAGES,EINFO,BOSS_DEFINITIONS,ITEMS,PROPS,PROJECTION,propsFor};if(typeof module!=='undefined')module.exports=API;else root.CriticCampaign=API;
})(typeof window!=='undefined'?window:globalThis);
