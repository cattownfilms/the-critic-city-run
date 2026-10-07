/* The Critic: Coming Attractions. Layered environments and source-atlas playback. */
(function(root){'use strict';
const {clamp,STAGES,LENGTH,YMIN,YMAX}=Brawler;
function canvas(w,h){const a=document.createElement('canvas');a.width=w;a.height=h;return a;}
function rect(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h);}
function text(c,s,x,y,size,col,align='left',weight=700){c.font=`${weight} ${size}px system-ui, sans-serif`;c.fillStyle=col;c.textAlign=align;c.fillText(s,x,y);}
function rnd(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function line(c,x,y,x2,y2,col,w=1){c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
const CINEMA_BOOTHS=[170,390,610,830,1050,1270,1490,1710,1930,2110,2310,2530,2750];
const CINEMA_SCREENS=[640,1500,2450];
const PALETTES=[['#100f30','#81506e','#e6a788','#141e37','#324560','#85e7d0','#ffbd80'],['#070f23','#1d3c50','#467177','#0b202c','#244657','#64dec8','#e9c875'],['#10102b','#674c7a','#d88b79','#18263f','#32445d','#b7a1f4','#ffb183'],['#100d2e','#6c365e','#d6806b','#241934','#3a3550','#72e2c7','#ffdd97'],['#080f2d','#29366b','#566286','#172445','#482b51','#a3d3ff','#f0c88d'],['#190f23','#713b4b','#b77c58','#2f263b','#503d45','#d7eac0','#ffc18d'],['#080b22','#17394b','#574a7c','#102b38','#243b54','#78f3db','#dbb6ff']];
class Renderer{
 constructor(node,sprites,images){this.c=node;this.ctx=node.getContext('2d',{alpha:false});this.sprites=sprites;this.images=images;this.facingAliases=new Map(Object.entries(sprites.sourcePreservationAliases||{}).map(([active,archived])=>[archived,active]));this.art=new Map();this.brokenProps=new WeakMap();this.area=-1;this.fx=[];this.time=0;this.dpr=1;this.signalFlashT=0;this.signalOffT=0;this.rect={x:0,y:0,scale:1,w:960,h:540};this.resize();}
 // Optional scene art loads independently of the combat banks. A delayed or unavailable
 // illustration leaves an authored geometry backdrop visible rather than a blank scene.
 artwork(name){if(this.art.has(name))return this.art.get(name);this.art.set(name,null);const inline=root.BRAWLER_ASSETS,src=inline?inline.files?.[name]:(root.BRAWLER_CONFIG?.assetBase||'assets/')+name;if(!src)return null;const im=new Image();im.onload=()=>this.art.set(name,im);im.onerror=()=>this.art.set(name,false);im.src=src;return null;}
 resize(){const w=innerWidth,h=innerHeight;this.dpr=Math.min(devicePixelRatio||1,2);this.c.width=Math.round(w*this.dpr);this.c.height=Math.round(h*this.dpr);this.c.style.width=w+'px';this.c.style.height=h+'px';if(w>h){this.rect={x:0,y:0,scale:h/540,w:w/h*540,h:540};}else{const s=w/760;this.rect={x:0,y:Math.max(96,(h-215-540*s)/2),scale:s,w:760,h:540};}return this.rect;}
 makeCity(stage){this.area=stage;if(stage>=4){this.frontSize=null;this.makeInterior(stage);return;}this.makeDistrict(stage);}
 makeDistrict(stage){
  const width=LENGTH+800,p=PALETTES[stage],r=rnd(9137+stage*23);this.frontSize={w:width,h:350};
  // Early districts share the sprite banks' restrained two-pixel background grid.
  // Architecture changes, while the accepted combat floor and camera remain fixed.
  this.back=canvas(850,170);let c=this.back.getContext('2d');c.scale(.5,.5);
  for(let y=0;y<340;y+=12){const col=y<96?p[0]:y<205?p[1]:p[2];rect(c,0,y,1700,12,col);}
  if(stage!==1){for(let x=0;x<1700;){const bw=32+Math.floor(r()*38)*2,bh=70+Math.floor(r()*90)*2,y=322-bh;rect(c,x,y,bw,bh,'#242f47');rect(c,x+4,y+4,bw-8,bh-4,'#30364f');for(let yy=y+12;yy<318;yy+=18)for(let xx=x+8;xx<x+bw-6;xx+=12)if(r()>.48)rect(c,xx,yy,4,6,r()>.5?'#8a8587':'#48546b');if(r()>.7)rect(c,x+bw/2-2,y-28,4,28,'#222c44');x+=bw+6;}}
  else{rect(c,0,0,1700,340,'#101e2b');for(let y=20;y<324;y+=28)for(let x=0;x<1700;x+=58)rect(c,x+2+(y%56?0:29),y,54,24,'#263b47');}
  this.front=canvas(Math.ceil(width/2),175);c=this.front.getContext('2d');c.scale(.5,.5);
  if(stage===0)this.broadway(c,width);
  else if(stage===1)this.subway(c,width);
  else if(stage===2)this.rooftop(c,width);
  else this.premiere(c,width);
 }
 poster(c,x,y,w,h,title,color,style=0){rect(c,x-4,y-4,w+8,h+8,'#899195');rect(c,x,y,w,h,'#121b31');rect(c,x+3,y+3,w-6,h-19,color);const cx=x+w/2;
  if(style%3===0){rect(c,cx-5,y+13,10,h-43,'#171b30');rect(c,cx-14,y+h-35,28,10,'#151c2e');rect(c,cx-9,y+21,18,6,'#d3bf95');}
  else if(style%3===1){rect(c,cx-16,y+21,32,26,'#24324c');rect(c,cx-11,y+15,22,18,'#18253d');rect(c,cx-21,y+43,42,12,'#17243a');rect(c,cx-8,y+24,5,4,'#d3d3a4');rect(c,cx+4,y+24,5,4,'#d3d3a4');}
  else{for(let n=0;n<3;n++)rect(c,x+7+n*12,y+18+n*7,8,32,'#c1c4bc');rect(c,x+4,y+53,w-8,4,'#17273c');}
  text(c,title,cx,y+h-5,8,'#ece1c1','center',800);
 }
 broadway(c,width){
  const studio=620;rect(c,0,28,studio,296,'#26364b');rect(c,0,28,studio,10,'#53647b');for(let x=8;x<studio;x+=30)rect(c,x,52,12,180,'#3a4861');
  rect(c,30,62,560,55,'#0c182b');line(c,36,65,584,65,'#88e7d4',4);text(c,'PHILLIPS BROADCASTING',310,91,23,'#d8f0dc','center',900);text(c,'COMING ATTRACTIONS',310,111,11,'#ffc591','center',800);
  for(let x=32;x<590;x+=108){rect(c,x,136,88,62,'#101e32');rect(c,x+5,141,78,52,'#285364');rect(c,x+15,150,58,27,'#719caf');line(c,x+20,182,x+72,182,'#ccceb7',3);}
  rect(c,44,222,212,102,'#121b2a');for(let x=54;x<254;x+=48){rect(c,x,230,39,86,'#285269');line(c,x+3,230,x+3,316,'#809795',2);rect(c,x+29,269,3,13,'#d8d2a0');}
  rect(c,276,222,315,38,'#111b2e');text(c,'ON AIR',435,246,22,'#ffe19d','center',900);for(let x=300;x<589;x+=93)this.poster(c,x,273,60,44,'TONIGHT',x%2?'#8e6478':'#507489',Math.floor(x/93));rect(c,0,321,studio,7,'#73868b');
  for(let x=650,i=0;x<width;x+=410,i++){rect(c,x,47+(i%2)*22,395,279-(i%2)*22,i%2?'#31384b':'#24384a');rect(c,x-5,42+(i%2)*22,405,8,'#4c5365');
   for(let yy=85;yy<195;yy+=52)for(let xx=x+27;xx<x+367;xx+=63){rect(c,xx-3,yy-3,37,39,'#111b2d');rect(c,xx,yy,31,33,i%2?'#a98768':'#3d7180');line(c,xx+15,yy,xx+15,yy+33,'#25354b',3);}
   rect(c,x+8,207,379,35,'#101b2b');const col=i%2?'#8ddecd':'#ffc785';text(c,['BROADWAY / MEDIA ROW','MIDNIGHT COFFEE','VIDEO CLUB','LAST SHOW'][i%4],x+197,231,15,col,'center',800);line(c,x+15,211,x+380,211,col,3);
   rect(c,x+17,249,235,74,'#153143');rect(c,x+25,255,97,63,'#325464');rect(c,x+133,255,112,63,'#3a5965');line(c,x+126,250,x+126,321,'#77968f',3);rect(c,x+266,244,109,81,'#102032');this.poster(c,x+281,256,42,58,'COMING',i%2?'#8b4c66':'#526e8c',i);this.poster(c,x+331,256,32,58,'SOON','#6f5973',i+1);rect(c,x+4,322,389,6,'#6a777d');
  }
  this.taxi(c,1010,317);this.taxi(c,2250,317);
 }
 taxi(c,x,y){rect(c,x,y-27,149,23,'#c99c44');rect(c,x+20,y-51,87,25,'#e3b852');rect(c,x+27,y-47,32,18,'#314b5b');rect(c,x+64,y-47,35,18,'#324c5c');rect(c,x+55,y-59,35,8,'#cfba77');text(c,'TAXI',x+72,y-52,6,'#172538','center');rect(c,x+4,y-20,7,8,'#fff0b1');rect(c,x+135,y-20,8,8,'#ec876b');for(const xx of [x+24,x+120]){rect(c,xx-10,y-9,20,12,'#101b2b');rect(c,xx-6,y-5,12,8,'#65717a');}line(c,x+16,y-15,x+134,y-15,'#9c7335',2);}
 subway(c,width){
  rect(c,0,0,width,324,'#1d303d');for(let y=10;y<194;y+=26)for(let x=-29;x<width;x+=58){rect(c,x+(Math.floor(y/26)%2)*29,y,55,23,'#607578');rect(c,x+2+(Math.floor(y/26)%2)*29,y+2,51,2,'#7d8d88');}
  rect(c,0,104,width,12,'#2a5666');rect(c,0,116,width,5,'#13283a');rect(c,0,192,width,126,'#070f1e');
  for(let x=90;x<width;x+=800){rect(c,x,43,258,49,'#111e31');rect(c,x+4,47,250,41,'#263b4a');text(c,'42 STREET / UPTOWN',x+129,73,17,'#e9dab4','center',900);rect(c,x+320,138,162,38,'#192c3c');text(c,'LAST TRAIN',x+401,164,17,'#9ae5d5','center',800);}
  // Rails, dark tunnels and a visible subway car are all behind the raised platform.
  for(let yy=278;yy<324;yy+=14)line(c,0,yy,width,yy,'#46555c',3);for(let x=10;x<width;x+=48)rect(c,x,290,18,24,'#29384a');
  for(let x=520;x<width;x+=1280){rect(c,x,142,760,143,'#71868c');rect(c,x,142,760,10,'#bbc5c1');rect(c,x,152,760,7,'#344e5d');rect(c,x,274,760,9,'#283c4c');
   for(let sx=x+16,n=0;sx<x+740;sx+=108,n++){if(n%3===1){rect(c,sx,168,82,103,'#9aa7a2');rect(c,sx+7,174,28,44,'#22384a');rect(c,sx+47,174,28,44,'#22384a');line(c,sx+41,169,sx+41,268,'#405967',2);}else{rect(c,sx,166,86,61,'#203647');rect(c,sx+5,171,76,51,'#477387');rect(c,sx+8,212,71,6,'#315668');}line(c,sx,250,sx+86,250,'#39586a',3);}
   rect(c,x+12,231,731,9,'#508080');text(c,'UPTOWN',x+385,267,12,'#223749','center',800);
  }
  for(let x=56;x<width;x+=420){rect(c,x-8,12,41,307,'#183041');rect(c,x,18,25,295,'#3c5c65');rect(c,x+5,23,5,286,'#71928e');rect(c,x-13,302,51,22,'#203a48');rect(c,x-14,10,52,14,'#617d7d');for(let y=45;y<298;y+=37)rect(c,x+17,y,3,4,'#a6b4a3');}
  rect(c,0,318,width,8,'#a5aaa2');rect(c,0,326,width,4,'#16283c');
 }
 rooftop(c,width){
  // Open sky dominates. Utilities stand on a low parapet, never on street facades.
  rect(c,0,281,width,43,'#293749');rect(c,0,278,width,8,'#6b7378');for(let x=0;x<width;x+=74)line(c,x,288,x,324,'#1c2a3d',3);
  for(let x=330,i=0;x<width;x+=900,i++){rect(c,x,161,182,162,'#465363');rect(c,x-8,155,199,12,'#758088');rect(c,x+50,214,82,109,'#172638');rect(c,x+59,222,64,100,'#324555');rect(c,x+111,267,5,13,'#bbc1a1');text(c,'ROOF ACCESS',x+91,200,11,'#c5d0be','center',800);rect(c,x+160,183,15,7,'#cc906c');
   rect(c,x+294,243,199,79,'#4b606b');rect(c,x+302,252,183,64,'#233b4c');for(let xx=x+312;xx<x+480;xx+=16)line(c,xx,258,xx,311,'#73898a',5);rect(c,x+322,235,54,10,'#7d8a8c');rect(c,x+414,222,40,25,'#596f79');
   const tx=x+624;rect(c,tx-56,97,112,116,'#554b48');for(let xx=tx-50;xx<tx+55;xx+=13)rect(c,xx,101,6,107,'#89795c');rect(c,tx-63,97,126,8,'#242d3e');rect(c,tx-63,207,126,9,'#263749');c.fillStyle='#303549';c.beginPath();c.moveTo(tx-69,98);c.lineTo(tx,58);c.lineTo(tx+69,98);c.closePath();c.fill();for(let side=-1;side<=1;side+=2){line(c,tx+side*41,215,tx+side*60,322,'#1b293c',8);}line(c,tx-57,258,tx+57,301,'#697780',3);line(c,tx+57,258,tx-57,301,'#697780',3);
  }
  for(let x=90;x<width;x+=720){rect(c,x,228,47,94,'#586b75');rect(c,x-5,222,57,11,'#829095');for(let y=239;y<317;y+=13)line(c,x+7,y,x+39,y,'#293e4f',3);line(c,x+72,280,x+72,92,'#182840',5);line(c,x+40,106,x+108,106,'#8b9094',3);line(c,x+46,86,x+97,128,'#8b9094',3);}
  const bx=2260;rect(c,bx,95,408,127,'#343e54');rect(c,bx+8,104,392,108,'#526172');for(let xx=bx+20;xx<bx+390;xx+=71)line(c,xx,109,xx,209,'#26364c',6);line(c,bx+15,110,bx+390,205,'#839094',4);line(c,bx+15,205,bx+390,110,'#839094',4);for(const xx of [bx+60,bx+335])line(c,xx,223,xx+15,323,'#22354b',9);
 }
 premiere(c,width){
  for(let x=-30,i=0;x<width;x+=700,i++){rect(c,x,21,683,303,i%2?'#302839':'#263049');rect(c,x+4,21,675,8,'#68526c');for(let xx=x+20;xx<x+667;xx+=74){rect(c,xx,40,48,83,'#111d32');rect(c,xx+5,45,38,73,'#64536e');rect(c,xx+15,45,7,73,'#837177');}
   rect(c,x+32,126,622,85,'#823e59');rect(c,x+41,134,604,69,'#ead3a0');rect(c,x+50,143,586,50,'#37203c');text(c,i===3?'THE CRITIC:':'GRAND PREMIERE',x+344,164,24,'#ffe9bc','center',900);text(c,i===3?'COMING ATTRACTIONS':'PALACE / TONIGHT ONLY',x+344,186,17,'#ecb7aa','center',900);
   for(let xx=x+48;xx<x+647;xx+=21){rect(c,xx,136,5,5,'#fff1c8');rect(c,xx,201,5,5,'#fff1c8');}line(c,x+25,120,x+654,120,'#bf81cb',4);line(c,x+26,215,x+654,215,'#81dbc6',4);
   rect(c,x+236,220,211,103,'#151729');for(let xx=x+250;xx<x+440;xx+=47){rect(c,xx,228,36,94,'#385466');rect(c,xx+4,233,28,82,'#1b2d40');rect(c,xx+22,274,3,14,'#b8b7a2');}this.poster(c,x+61,234,64,80,'FEATURE','#765082',i);this.poster(c,x+148,234,64,80,'NOW','#657e82',i+1);
   rect(c,x+477,227,135,97,'#31374b');rect(c,x+481,232,127,35,'#172236');text(c,'BOX OFFICE',x+544,255,14,'#ffce90','center',800);rect(c,x+494,278,101,38,'#224b5b');line(c,x+544,277,x+544,317,'#79948c',3);rect(c,x+485,270,119,7,'#b5a77c');
   for(const xx of [x+223,x+453]){rect(c,xx-9,218,18,106,'#726379');rect(c,xx-13,215,26,7,'#a89995');}
   rect(c,x+3,321,677,7,'#76737e');
  }
 }
 makeInterior(stage){const p=PALETTES[stage]||PALETTES[4],width=LENGTH+800;this.back=canvas(1700,340);let c=this.back.getContext('2d');const gr=c.createLinearGradient(0,0,0,340);gr.addColorStop(0,p[0]);gr.addColorStop(1,p[2]);c.fillStyle=gr;c.fillRect(0,0,1700,340);this.front=canvas(width,350);c=this.front.getContext('2d');
  if(stage===4){
   // One auditorium wall, not repeated window photographs. The live booth is
   // composited separately at its real authored world coordinates.
   rect(c,0,0,width,324,'#14223d');rect(c,0,10,width,12,'#3d3150');rect(c,0,51,width,6,'#58607a');
   for(let x=0;x<width;x+=240){rect(c,x+5,62,223,198,'#23334f');for(let xx=x+16;xx<x+222;xx+=25)rect(c,xx,74,8,172,'#2c3c59');}
   for(let x=650;x<width;x+=820){rect(c,x-7,180,139,144,'#48243b');rect(c,x+1,187,124,133,'#101b31');rect(c,x+11,196,47,121,'#593c4d');rect(c,x+65,196,47,121,'#593c4d');rect(c,x+6,167,113,15,'#233c46');text(c,'EXIT',x+63,179,12,'#9dd9bf','center',800);rect(c,x+42,242,8,4,'#baa889');rect(c,x+73,242,8,4,'#baa889');}
   // The small film screens are world-space architectural openings. Live
   // performers are composited inside them by cinemaScreens after the wall.
   for(let row=0;row<3;row++)for(let x=0;x<width;x+=62){if((x%820)>595&&(x%820)<710)continue;const y=257+row*22;rect(c,x+6,y,46,23,row===2?'#603c50':'#724659');rect(c,x+12,y+4,34,2,'#a57283');rect(c,x+1,y+16,8,12,'#291f35');rect(c,x+50,y+16,8,12,'#291f35');rect(c,x+5,y+21,47,4,'#231f32');}
   rect(c,0,320,width,5,'#716782');
  }else if(stage===5){
   for(let x=-70,i=0;x<width;x+=560,i++){
    rect(c,x,49,550,275,i%2?'#493844':'#3c3040');for(let yy=65;yy<226;yy+=19)line(c,x,yy,x+550,yy,'#624751');
    for(let sx=x+28;sx<x+520;sx+=100){rect(c,sx,78,56,96,'#161d31');rect(c,sx+5,83,46,86,'#785451');line(c,sx+28,83,sx+28,169,'#242238',4);}
    rect(c,x+11,198,528,39,'#721f31');rect(c,x+20,203,510,29,'#a74539');text(c,i%2?'LITTLE ITALY':'PIZZERIA',x+275,225,22,'#ffe7b6','center',900);
    for(let sx=x+13;sx<x+540;sx+=30)rect(c,sx,237,30,19,Math.floor((sx-x)/30)%2?'#dfcdb4':'#46735d');
    rect(c,x+22,260,363,61,'#19212c');for(let sx=x+28;sx<x+385;sx+=83){rect(c,sx,266,75,51,'#4b615a');line(c,sx+8,270,sx+30,310,'#739085',1);}
    rect(c,x+413,255,107,68,'#181b27');rect(c,x+421,262,89,58,'#69574a');line(c,x+465,262,x+465,320,'#191c29',4);rect(c,x+449,292,4,9,'#e8c786');
    text(c,'HOT • FRESH',x+180,291,17,'#e9c994','center',800);rect(c,x+3,320,544,7,'#938476');
   }
  }else{
   rect(c,0,0,width,324,'#0b152c');
   for(let x=0;x<width;x+=410){
    rect(c,x+7,16,20,308,'#244453');rect(c,x+17,23,5,290,'#60868a');rect(c,x+40,34,330,260,'#172941');
    for(let row=0;row<3;row++)for(let col=0;col<3;col++){const sx=x+53+col*101,sy=49+row*74;rect(c,sx-3,sy-3,91,65,'#455367');rect(c,sx,sy,85,59,(row+col)%2?'#274963':'#3b355e');for(let ly=sy+5;ly<sy+54;ly+=8)line(c,sx+5,ly,sx+78,ly,'#526479',1);line(c,sx+7,sy+49,sx+41,sy+17,'#9fc5bb',2);line(c,sx+41,sy+17,sx+77,sy+41,'#9fc5bb',2);}
    rect(c,x+46,278,314,42,'#294052');for(let sx=x+59;sx<x+349;sx+=24){rect(c,sx,287,12,6,'#91dac0');rect(c,sx,302,12,5,'#6969a3');}
    line(c,x+28,11,x+381,11,'#89a1b9',4);text(c,x>2000?'TRANSMISSION CORE':'BROADCAST CONTROL',x+202,32,10,'#b3d9db','center');
   }
   rect(c,0,317,width,7,'#7b9c9f');
  }
 }
 emit(ev){if(ev.type==='summonsDismissed'){this.signalFlashT=.48;this.signalOffT=3;}const color=ev.type==='parry'?'#86ffe2':ev.type==='pickup'?'#acffe1':'#ffd5a3';if(['hit','parry','block','break','slam','pickup','signalSweep','projectileImpact'].includes(ev.type)){
  this.fx.push({type:ev.type,x:ev.x,y:ev.y,t:0,life:ev.type==='hit'?.37:.45,color:ev.color||color,broken:ev.broken,heavy:ev.heavy,damage:ev.damage,heal:ev.heal,combo:ev.combo,face:ev.face,kind:ev.kind});}}
 frame(who,name,t=0,duration=0,forceLoop){
  const dict=this.sprites.characters[who==='booth-enforcer'?'sherm-slam':who],a=dict?.[name]||dict?.idle;if(!a)return null;
  let ms=t*1000;if(duration>0)ms=ms/(duration*1000)*a.ms;
  const loop=forceLoop??(a.loop&&!duration);ms=loop?ms%a.ms:Math.min(Math.max(0,ms),a.ms-.001);
  const progress=clamp(ms/a.ms,0,1);let f=a.frames[a.frames.length-1];for(const ff of a.frames){ms-=ff.ms;if(ms<0){f=ff;break;}}
  return {a,f,progress};
 }
 nativeFacing(who,name,f,a=this.sprites.characters[who]?.[name]){
  // Archives retain their exact source metadata. Display the eight same-frame
  // archived actions with the audited direction of their active counterpart.
  // The six-frame older cartwheel is a different performance and keeps its own face.
  const counterpart=this.facingAliases.get(who+'/'+name);
  if(counterpart&&a){const [bank,action]=counterpart.split('/'),active=this.sprites.characters[bank]?.[action],index=a.frames.indexOf(f);
   if(active&&active.frames.length===a.frames.length&&index>=0){const fixed=active.frames[index];return (fixed.canonicalFacing??active.canonicalFacing??1)===-1?-1:1;}
  }
  return (f?.canonicalFacing??a?.canonicalFacing??1)===-1?-1:1;
 }
 animationBounds(who,name,face=1){
  const a=this.sprites.characters[who]?.[name]||this.sprites.characters[who]?.idle;if(!a)return null;
  const bounds=a.frames.map(f=>{const native=face*this.nativeFacing(who,name,f,a);return native<0?[-f.ox-f.w,-f.ox]:[f.ox,f.ox+f.w];});
  return {minX:Math.min(...bounds.map(b=>b[0])),maxX:Math.max(...bounds.map(b=>b[1])),minY:Math.min(...a.frames.map(f=>f.oy)),maxY:Math.max(...a.frames.map(f=>f.oy+f.h))};
 }
 available(who,name){const chosen=this.frame(who,name);return !!(chosen&&this.images[chosen.f.p]);}
 sprite(c,who,name,x,y,face=1,t=0,duration=0,opts={}){
  let chosen=this.frame(who,name,t,duration,opts.loop);if(!chosen)return;let im=this.images[chosen.f.p];
  if(!im){this.onMissingAnimation?.(who,name);const idle=this.frame(who,'idle',t,0,true);if(!idle||!this.images[idle.f.p])return;chosen=idle;im=this.images[idle.f.p];}
  const {a,f,progress}=chosen;
  const sc=opts.scale||1,u=clamp((progress-.35)/.40,0,1),support=a.groundedDefeat?-(f.contactY||0)*u*u*(3-2*u):0;
  c.save();c.translate(x,y);c.scale(face*this.nativeFacing(who,name,f,a)*sc,sc);if(opts.alpha!==undefined)c.globalAlpha=opts.alpha;
  c.drawImage(im,f.x,f.y,f.w,f.h,f.ox,f.oy+support,f.w,f.h);c.restore();return chosen;
 }
 shadow(c,who,name,x,y,face,t,duration,sc=1,z=0,alpha=.35){
  const ch=this.frame(who,name,t,duration);if(!ch)return;const {a,f,progress}=ch,prone=!!a.groundedDefeat;
  const blend=prone?clamp(progress*1.8,0,1):0,wide=Math.max(25,Math.min(145,f.w*.46));
  const native=this.nativeFacing(who,name,f,a);
  const cx=x+(prone?(f.ox+f.w/2)*face*native*sc*blend:0),rx=(32+(wide-32)*blend)*sc*Math.max(.5,1-z/260);
  c.save();c.globalAlpha=alpha;c.fillStyle='#050c15';c.beginPath();c.ellipse(cx,y+2,rx,prone?5:7*sc,0,0,Math.PI*2);c.fill();c.restore();
 }
 showcase(node,g,t){
  const w=node.clientWidth,h=node.clientHeight,dpr=Math.min(devicePixelRatio||1,2);if(node.width!==Math.round(w*dpr)||node.height!==Math.round(h*dpr)){node.width=Math.round(w*dpr);node.height=Math.round(h*dpr);}
  const c=node.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);const bg=c.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#11192d');bg.addColorStop(1,'#264247');c.fillStyle=bg;c.fillRect(0,0,w,h);
  c.save();c.globalAlpha=.28;for(let i=0;i<8;i++){c.fillStyle=i%2?'#7cdac3':'#eabc89';c.fillRect(i*w/7-10,15,2,h-42);}c.restore();
  const who=g.playerKind||'hero',name=Brawler.playerAnimation(who,t<.65?'dance-enter':'dance-loop'),aa=this.sprites.characters[who][name]||this.sprites.characters[who].idle;
  const bounds=this.animationBounds(who,name),minx=bounds.minX,maxx=bounds.maxX,miny=bounds.minY,maxy=bounds.maxY;
  const sc=Math.min(1.5,(w-45)/(maxx-minx),(h-46)/(maxy-miny)),x=w/2-(minx+maxx)*sc/2,y=h-25-Math.max(0,maxy)*sc;
  this.shadow(c,who,name,x,y,1,t,0,sc,0,.3);this.sprite(c,who,name,x,y,1,t<.65?t:t-.65,t<.65?.65:0,{scale:sc,loop:t>=.65});
  text(c,who==='franklin'?'FRANKLIN':'JAY SHERMAN',w/2,h-7,10,'#d2efe2','center',800);
 }
 scene(c,g,w,time){
  if(g.stage>=4){this.interiorScene(c,g,w,time);return;}const stage=g.stage,cam=g.camera,p=PALETTES[stage];c.save();c.imageSmoothingEnabled=false;
  for(let j=-1;j<4;j++)c.drawImage(this.back,Math.floor(j*1700-cam*.20),0,1700,340);
  c.drawImage(this.front,-Math.floor(cam*.72),0,this.frontSize.w,this.frontSize.h);c.restore();
  const top=['#354454','#3c515b','#293849','#3d354b'][stage],bottom=['#182738','#192b3b','#182639','#1b2235'][stage];
  for(let y=324;y<492;y+=12)rect(c,0,y,w,12,y<370?top:y<445?['#2a3949','#314754','#233246','#322d42'][stage]:bottom);
  rect(c,0,323,w,5,stage===1?'#afb3a2':'#7a8790');rect(c,0,330,w,3,'#142437');
  const seam=stage===2?'#354459':stage===1?'#607273':'#455064';for(const yy of [354,392,438,484])line(c,0,yy,w,yy,seam,1);
  const offset=cam%150;for(let x=-150;x<w+200;x+=150)line(c,x-offset,326,x-offset-80,489,seam,1);
  if(stage===0){for(let x=150;x<LENGTH;x+=610){const xx=x-cam;if(xx<-100||xx>w+100)continue;rect(c,xx,467,76,13,'#142333');for(let k=0;k<10;k++)line(c,xx+5+k*7,470,xx+5+k*7,478,'#617078',2);}rect(c,0,492,w,9,'#71808a');rect(c,0,501,w,39,'#0c192c');}
  else if(stage===1){
   // The warning strip and rails remain beyond the accepted playable YMAX.
   rect(c,0,490,w,8,'#d5bd76');for(let x=-cam%32;x<w;x+=32)rect(c,x,492,17,4,'#766b44');rect(c,0,499,w,41,'#07121f');for(let x=-cam%44;x<w;x+=44)rect(c,x,505,15,32,'#293c4b');line(c,0,508,w,508,'#83908d',4);line(c,0,536,w,536,'#687e84',4);
  }else if(stage===2){
   for(let x=230;x<LENGTH;x+=630){const xx=x-cam;if(xx<-110||xx>w+100)continue;rect(c,xx,451,100,23,'#152639');for(let k=0;k<8;k++)rect(c,xx+7+k*12,456,5,12,'#4a5b68');}
   rect(c,0,494,w,12,'#6e7681');rect(c,0,506,w,34,'#253145');for(let x=-cam%70;x<w;x+=70)line(c,x,511,x,540,'#4a5268',2);
  }else{
   const carpet=2390-cam;rect(c,carpet,333,386,154,'#633247');for(let yy=338;yy<488;yy+=28)line(c,carpet+9,yy,carpet+377,yy,'#854559',1);line(c,carpet+6,333,carpet+6,487,'#c69a82',3);line(c,carpet+380,333,carpet+380,487,'#c69a82',3);
   for(let x=190;x<LENGTH;x+=560){const xx=x-cam;for(const px of [xx,xx+183]){rect(c,px-4,288,8,58,'#9b916d');rect(c,px-11,341,22,6,'#4a4253');rect(c,px-8,282,16,10,'#d2b47a');}line(c,xx+6,303,xx+178,311,'#9c4663',5);}rect(c,0,493,w,9,'#817788');rect(c,0,502,w,38,'#121a2c');
  }
  this.exitCue(c,g,w,time,p[6]);
 }
 exitCue(c,g,w,time,color){const cam=g.camera;if(g.activeGate>=0){const gx=Brawler.GATES[g.activeGate]+492-cam;if(gx>0&&gx<w){c.save();c.globalAlpha=.35+(settings.reducedMotion?0:.12*Math.sin(time*6));for(let yy=336;yy<475;yy+=18)line(c,gx-3,yy,gx+3,yy+10,color,3);c.restore();}}
  if(g.activeGate<0){const dx=Math.min(w-55,LENGTH-130-cam);if(dx>80){text(c,g.nextGate===3?'EXIT':'GO',dx,301,17,'#8effd7','center',900);line(c,dx-10,310,dx+10,310,'#8effd7',2);line(c,dx+10,310,dx+5,305,'#8effd7',2);line(c,dx+10,310,dx+5,315,'#8effd7',2);}}
 }
 interiorScene(c,g,w,time){const stage=g.stage,cam=g.camera,p=PALETTES[stage]||PALETTES[4];for(let j=-1;j<4;j++)c.drawImage(this.back,Math.floor(j*1700-cam*.2),0);c.drawImage(this.front,-(stage===4?cam:Math.floor(cam*.72)),0);
  if(stage===4)this.cinemaScreens(c,g,time);
  const im=stage===4?null:this.artwork('environments/'+({5:'pizzeria',6:'broadcast'}[stage]||'broadcast')+'.webp');if(im){c.save();c.beginPath();c.rect(0,0,w,324);c.clip();const crop=({4:.66,5:.67,6:.63})[stage]||.63,sourceH=im.height*crop,tile=im.width/sourceH*324,offset=cam*.72;for(let j=Math.floor(offset/tile)-1;j<=Math.floor((offset+w)/tile)+1;j++)c.drawImage(im,0,0,im.width,sourceH,Math.floor(j*tile-offset),0,Math.ceil(tile),324);c.restore();

  }
  const gr=c.createLinearGradient(0,324,0,540);gr.addColorStop(0,stage===4?'#39314c':stage===6?'#2c4656':'#48515a');gr.addColorStop(.65,stage===4?'#22243b':stage===6?'#182b40':'#2a3643');gr.addColorStop(1,'#10172b');c.fillStyle=gr;c.fillRect(0,324,w,216);rect(c,0,324,w,4,stage===4?'#9d8aa8':'#799092');rect(c,0,329,w,3,'#111d31');
  for(const yy of [353,389,433,485])line(c,0,yy,w,yy,stage===4?'#4d435c':'#435969',1);const offset=cam%150;for(let x=-150;x<w+200;x+=150)line(c,x-offset,325,x-offset-80,491,stage===4?'#41384f':'#384b59',1);
  if(stage===4){
   // A broad central aisle stays empty. Rows below the lane frame the auditorium
   // without covering ankles, movement space, pickups or telegraphs.
   rect(c,0,492,w,48,'#101729');for(let sx=-((cam*.85)%63);sx<w+63;sx+=63){rect(c,sx+5,506,49,34,'#422737');rect(c,sx+9,502,41,7,'#745062');line(c,sx+11,507,sx+46,507,'#966777',2);rect(c,sx+1,524,7,16,'#292134');rect(c,sx+53,524,7,16,'#292134');}
   c.save();c.globalAlpha=.09;c.fillStyle='#aacaf7';c.beginPath();c.moveTo(w*.66,125);c.lineTo(0,260);c.lineTo(0,312);c.closePath();c.fill();c.restore();
   this.projectionWindows(c,g,time);
  }else if(stage===6){
   for(let x=110;x<LENGTH;x+=390){const xx=x-cam;if(xx<-130||xx>w+130)continue;line(c,xx,491,xx+65,491,'#71aeac',2);line(c,xx,495,xx+65,495,'#172b38',2);}
   rect(c,0,500,w,40,'#0a1829');line(c,0,499,w,499,'#6d949f',3);
   if(g.activeGate===2||g.bossSpawned){this.broadcastPorts(c,g,time);this.broadcastStairs(c,g);const bx=2490-cam;rect(c,bx,305,285,17,'#516776');rect(c,bx,321,285,5,'#132333');line(c,bx,174,bx,304,'#8397a5',4);line(c,bx+285,174,bx+285,304,'#8397a5',4);line(c,bx,175,bx+285,175,'#6d8597',4);
    if(!['duke','resolved'].includes(g.finalPhase)&&this.available('duke','idle'))this.sprite(c,'duke','idle',bx+74,305,-1,this.time,0,{scale:.63});
    if(this.available('marty','idle'))this.sprite(c,'marty',g.finalPhase==='resolved'?'scared-idle':'trapped',bx+207,305,-1,this.time,0,{scale:.63});
   }
  }else{rect(c,0,492,w,9,'#78887e');rect(c,0,501,w,39,'#101829');this.pizzeriaDoor(c,g);}
  this.exitCue(c,g,w,time,p[6]);
 }
 pizzeriaDoor(c,g){
  // This source door stays registered to the boss, unlike the distant facade parallax.
  if(g.activeGate!==2&&!g.bossSpawned)return;const x=2630-g.camera,y=407,boss=g.enemies.find(e=>e.kind==='spike'),entry=boss?.entry,open=!!boss&&(entry?.phase!=='waiting');
  rect(c,x-82,y-213,164,205,'#343346');rect(c,x-89,y-222,178,20,'#844146');rect(c,x-83,y-218,166,12,'#d1b581');text(c,'PIZZERIA',x,y-207,11,'#263249','center',900);
  rect(c,x-62,y-198,124,185,'#a29c8b');rect(c,x-54,y-190,108,177,'#111b2d');
  if(!open){rect(c,x-51,y-187,102,173,'#57645f');rect(c,x-43,y-179,86,66,'#8a9b8b');line(c,x,y-185,x,y-16,'#24384a',4);rect(c,x-10,y-89,4,15,'#e8d5a0');rect(c,x+7,y-89,4,15,'#e8d5a0');}
  else{rect(c,x-51,y-185,20,173,'#776d59');line(c,x-29,y-184,x-29,y-14,'#bea37a',3);rect(c,x-23,y-173,61,154,'#172033');line(c,x-20,y-37,x+36,y-37,'#4d3b42',2);}
  rect(c,x-77,y-12,154,6,'#92958b');rect(c,x-84,y-6,168,6,'#4b5661');
 }
 broadcastStairs(c,g){const x=2630-g.camera;
  // Duke walks from the controls down this short staircase into the unchanged arena.
  for(let n=0;n<7;n++){const sx=x-17-n*23,sy=324+n*12;rect(c,sx-23,sy,46,13,'#344b5c');line(c,sx-23,sy,sx+23,sy,'#90a5ae',2);}
  line(c,x+24,295,x-138,379,'#8399a6',3);for(let n=0;n<4;n++)line(c,x+24-n*46,295+n*24,x+24-n*46,324+n*24,'#617d8f',3);
 }
 dangerMarker(c,x,y,r,time,color='#ffc56f',progress=0){c.save();c.globalAlpha=.12;c.fillStyle=color;c.beginPath();c.ellipse(x,y,r,r*.34,0,0,Math.PI*2);c.fill();c.globalAlpha=.8;c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.ellipse(x,y,r,r*.34,0,0,Math.PI*2);c.stroke();const inner=Math.max(4,r*(1-clamp(progress,0,1)));c.globalAlpha=.6;c.beginPath();c.ellipse(x,y,inner,inner*.34,0,0,Math.PI*2);c.stroke();line(c,x-7,y,x+7,y,color,1);line(c,x,y-5,x,y+5,color,1);c.restore();}
 cinemaScreens(c,g,time){
  for(const wx of CINEMA_SCREENS){const x=wx-g.camera;if(x<-140||x>this.rect.w+140)continue;
   rect(c,x-117,239,234,87,'#141c2d');rect(c,x-111,244,222,77,'#8792ab');rect(c,x-105,246,210,75,'#abb8c7');
   rect(c,x-125,239,8,87,'#593047');rect(c,x+117,239,8,87,'#593047');
   c.save();c.beginPath();c.rect(x-105,246,210,75);c.clip();c.imageSmoothingEnabled=false;
   const boss=g.enemies.find(e=>e.kind==='pizzeria-boss'),hasEmerged=boss&&!boss.entry,emergingHere=boss?.entry?.sourceX===wx&&!boss.hidden;
   if(!hasEmerged&&!emergingHere&&!g.bossDefeated){this.sprite(c,'pizzeria-boss','screen-taunt',x,336,-1,time,0,{scale:.43,loop:true,alpha:wx===2450?.85:.58});}
   c.globalAlpha=.15;for(let y=247;y<321;y+=4)line(c,x-104,y,x+104,y,'#26384e',1);c.restore();
  }
 }
 boothEyes(c,x,top,t,playerX){
  // A choreographed glance, glance, blink and locked look. No random flashing.
  const blink=t>=.20&&t<.26,look=t<.10?-2:t<.20?2:playerX<x?-2:2;
  for(const ex of [x-13,x+13]){rect(c,ex-7,top+45,14,blink?2:7,'#e9e6ef');if(!blink){rect(c,ex-2+look,top+46,4,6,'#8aaff2');rect(c,ex-1+look,top+47,2,4,'#15254c');}}
 }
 projectionWindows(c,g,time){
  const a=g.projection;if(!a)return;const xs=a.windowXs?.length?a.windowXs:CINEMA_BOOTHS,top=(a.windowY||196)-72,colors=['#ffc36b','#73e3e4','#c2a0ff'];
  const portrait=this.artwork('story/projection-woman-pixel.webp')||this.artwork('portraits/projectionist/talk-00.webp');
  // Wall, aperture and actor all use exactly wx-camera. Each booth stays on its wall.
  for(let i=0;i<xs.length;i++){const wx=xs[i],x=wx-g.camera;if(x<-85||x>this.rect.w+85)continue;const id=a.booths?.[i]?.circuitId??(i%3),circuit=a.circuits?.[id],on=!a.disabled&&(circuit?circuit.active:true),col=circuit?.color||colors[id],visible=on&&a.visible&&a.window===i;
   rect(c,x-67,top-20,134,157,'#293650');rect(c,x-64,top-17,128,151,'#36445e');line(c,x-67,top-22,x+67,top-22,'#65768d',4);
   rect(c,x-57,top-4,114,124,'#182539');rect(c,x-54,top-2,108,120,'#6c7e92');rect(c,x-48,top,96,112,'#080f22');
   if(visible){c.save();c.beginPath();c.rect(x-48,top,96,112);c.clip();c.imageSmoothingEnabled=false;
    rect(c,x-48,top,96,112,'#283348');
    if(portrait){const sc=Math.min(96/portrait.width,112/portrait.height),iw=portrait.width*sc,ih=portrait.height*sc;c.drawImage(portrait,Math.round(x-iw/2),Math.round(top+112-ih),Math.round(iw),Math.round(ih));}
    else{rect(c,x-23,top+15,46,90,'#272135');rect(c,x-19,top+25,38,53,'#cfa4b4');rect(c,x-22,top+18,44,14,'#312338');rect(c,x-26,top+28,9,65,'#312338');rect(c,x+17,top+28,9,65,'#312338');}
    if(a.phase==='shadow'){rect(c,x-48,top,96,112,'#080f22');this.boothEyes(c,x,top,a.timer,g.p.x-g.camera);}
    else if(a.phase==='reveal'&&a.timer<.30){c.globalAlpha=1-clamp(a.timer/.30,0,1);rect(c,x-48,top,96,112,'#080f22');c.globalAlpha=1;}
    if(a.phase==='telegraph'||a.phase==='throw'){const handX=x;rect(c,handX-8,top+66,16,14,'#d9a8b0');if(a.phase==='telegraph')this.reel(c,handX,a.windowY||196,14,col);}
    c.restore();
   }
   rect(c,x-61,top+114,122,8,'#8393a6');rect(c,x-55,top+122,110,5,'#15293c');
   rect(c,x-36,top+127,72,17,'#112235');text(c,String(id+1),x-23,top+140,14,on?col:'#718393','center',900);rect(c,x-8,top+132,35,7,on?col:'#405363');
   if(!on){text(c,'OFF',x,top+64,17,'#6b7b90','center',900);line(c,x-36,top+15,x+36,top+96,'#283d53',3);}
   if(visible&&a.phase!=='recover'){c.strokeStyle=col;c.lineWidth=3;c.strokeRect(x-49,top-1,98,114);}
   // The group cable visibly repeats along the fixed back wall.
   const busY=286+id*5;line(c,x,top+144,x,busY,on?col:'#415368',2);line(c,x-110,busY,x+110,busY,on?col:'#415368',2);
  }
  const circuits=g.props.filter(o=>o.kind==='circuit');for(const o of circuits){const id=o.circuitId??o.window??0,x=o.x-g.camera,col=o.hp>0?(o.color||colors[id]):'#415368',turnY=286+id*5;
   line(c,x,turnY,x,o.y-76,'#0b192b',6);line(c,x,turnY,x,o.y-76,col,2);
  }
  if(circuits.length){const done=3-(a.circuits?.filter(q=>q.active).length??circuits.filter(q=>q.hp>0).length),x=this.rect.w/2;
   rect(c,x-209,469,418,30,'#101b2deb');text(c,a.disabled?'PROJECTION BOOTH DISABLED':'DISABLE THE 3 PROJECTION CIRCUITS',x,482,13,a.disabled?'#a6efd5':'#eadac0','center',900);
   text(c,`${done} / 3 CIRCUITS OFF`,x,495,12,'#b4c5d6','center',800);
  }
 }
 broadcastPorts(c,g,time){const on=!g.machineDefeated&&!['duke','resolved'].includes(g.finalPhase);
  for(const wx of [2170,2650]){const x=wx-g.camera;if(x<-90||x>this.rect.w+90)continue;
   rect(c,x-66,122,132,124,'#516579');rect(c,x-59,129,118,110,'#102538');rect(c,x-54,134,108,100,on?'#467a84':'#18253a');
   const incoming=g.enemies.find(e=>e.entry?.route==='broadcast'&&e.entry.sourceX===wx&&!e.hidden);
   if(on){c.save();c.beginPath();c.rect(x-54,134,108,100);c.clip();if(!incoming)this.sprite(c,'sherm-punch','idle',x,230,-1,time,0,{scale:.43,alpha:.7});c.globalAlpha=.3;for(let y=138;y<231;y+=8)line(c,x-51,y,x+51,y,'#a1f1d8',1);c.restore();}
   else{text(c,'SIGNAL OFF',x,188,13,'#9bb2c4','center',900);}
   line(c,x-56,239,x+56,239,on?'#96f1d4':'#445465',3);
  }
  if(g.broadcastSummons?.active){const count=g.enemies.filter(e=>e.broadcastSummon&&e.hp>0&&!e.hidden).length,x=this.rect.w/2;rect(c,x-155,59,310,24,'#13243be8');text(c,`BROADCAST WAVE ${g.broadcastSummons.wave||0}  /  ${count} ON AIR`,x,76,12,'#bcebd7','center',800);}
  if(this.signalFlashT>0){c.save();c.globalAlpha=this.signalFlashT/.48*.52;rect(c,0,0,this.rect.w,324,'#e6fff3');c.restore();}
 }
 projectionWarnings(c,g){if(g.stage!==4)return;const a=g.projection,reels=(g.projectiles||[]).filter(o=>o.kind==='reel');
  if(a?.telegraph&&!reels.length){const q=a.telegraph;this.dangerMarker(c,q.x-g.camera,q.y,Math.max(40,q.radius||32),this.time,q.color||'#ffca83',(q.t||0)/(q.duration||1.15));}
  for(const q of reels)this.dangerMarker(c,(q.phase==='bounce'?q.x:q.targetX)-g.camera,q.targetY,Math.max(40,q.radius||32),this.time,q.color||'#ffca83',(q.age||0)/(q.duration||.7));
 }
 reel(c,x,y,r,color='#ffc36b'){c.save();c.translate(x,y);c.fillStyle='#ebe0ca';c.strokeStyle='#182538';c.lineWidth=3;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();c.stroke();c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(0,0,r-3,0,Math.PI*2);c.stroke();c.fillStyle='#3d485c';for(let n=0;n<4;n++){const a=n*Math.PI/2;c.beginPath();c.arc(Math.cos(a)*r*.50,Math.sin(a)*r*.50,Math.max(3,r*.20),0,Math.PI*2);c.fill();}rect(c,-2,-2,4,4,'#8d9baa');c.restore();}
 prop(c,o,x,y){
  const sc=o.kind==='circuit'?1:(o.scale||1.35);c.save();c.translate(x,y);c.scale(sc,sc);this.propBody(c,o,0,0);c.restore();
 }
 propBody(c,o,x,y){
  if(o.kind==='circuit'){const col=o.hp>0?(o.color||'#ffc36b'):'#47576b',id=(o.circuitId??o.window??0)+1;
   rect(c,x-29,y-76,58,74,'#112337');rect(c,x-25,y-71,50,62,o.hp>0?'#52647a':'#324151');rect(c,x-24,y-71,48,6,col);rect(c,x-18,y-59,36,24,'#102336');text(c,String(id),x,y-40,21,col,'center',900);
   rect(c,x-18,y-28,36,17,'#263b51');for(let n=0;n<5;n++)line(c,x-13,y-25+n*3,x+13,y-25+n*3,'#728397',1);rect(c,x-30,y-5,60,5,'#0b1d2c');
   text(c,o.hp>0?'HIT':'OFF',x,y-83,12,col,'center',900);if(o.hp>0){rect(c,x-24,y-79,48,3,'#102034');rect(c,x-24,y-79,48*o.hp/(o.maxHp||45),3,col);}return;
  }
  if(o.hp<=0){if((o.kind==='bin'||o.kind==='trash-can')&&this.available('trash-can','break')){if(!this.brokenProps.has(o))this.brokenProps.set(o,this.time);const age=this.time-this.brokenProps.get(o);if(age<.8)this.sprite(c,'trash-can','break',x,y,1,age,.8,{alpha:clamp((.8-age)/.2,0,1)});}return;}
  if(o.kind==='bin'||o.kind==='trash-can'){if(this.available('trash-can','idle')){this.sprite(c,'trash-can',o.hp<(o.maxHp||24)*.5?'dent':'idle',x,y,1,this.time,0);return;}rect(c,x-24,y-71,48,69,'#1a343d');rect(c,x-28,y-74,56,8,'#678177');rect(c,x-16,y-58,32,5,'#182b35');for(let xx=x-18;xx<x+24;xx+=12)line(c,xx,y-48,xx,y-4,'#49655f',3);rect(c,x-26,y-4,52,4,'#0b1e2b');}
  else{rect(c,x-28,y-59,56,57,'#7e6352');rect(c,x-26,y-56,52,5,'#bca07b');rect(c,x-26,y-32,52,4,'#443c3c');line(c,x-25,y-54,x+25,y-4,'#b49872',4);line(c,x+25,y-54,x-25,y-4,'#a88b6b',4);}
 }
 machine(c,e,x,y,alpha=1){const dead=e.hp<=0,attack=e.state==='attack',wind=e.state==='windup',pulse=dead?0:(settings.reducedMotion?.65:(.55+.30*Math.sin(this.time*9)));c.save();c.translate(x,y);c.globalAlpha=alpha;
  c.fillStyle='#080d1d';c.beginPath();c.ellipse(0,3,86,15,0,0,Math.PI*2);c.fill();rect(c,-77,-29,154,26,'#384861');rect(c,-84,-19,31,17,'#121e30');rect(c,53,-19,31,17,'#121e30');
  rect(c,-62,-166,124,137,'#455970');rect(c,-53,-154,106,103,dead?'#222838':'#89a6b4');rect(c,-47,-148,94,87,'#11293d');
  rect(c,-72,-190,144,24,'#596b81');rect(c,-66,-186,132,15,'#192639');text(c,dead?'OFF AIR':'ON AIR',0,-174,12,dead?'#728099':'#f5c987','center',900);
  for(let side=-1;side<=1;side+=2){rect(c,side<0?-92:70,-140,22,86,'#314a61');rect(c,side<0?-97:68,-150,29,13,'#738b9b');line(c,side*82,-161,side*96,-211,'#839baa',4);c.fillStyle=dead?'#46536b':attack?'#fff2bb':wind?'#ffc07f':'#99e7da';c.beginPath();c.arc(side*97,-214,8,0,Math.PI*2);c.fill();}
  if(!dead){c.save();c.beginPath();c.rect(-46,-146,92,83);c.clip();c.globalAlpha=pulse;for(let yy=-143;yy<-64;yy+=7)line(c,-45,yy,45,yy,'#6facb5',1);c.strokeStyle=attack?'#ffe8ac':'#9dceca';c.lineWidth=2;c.beginPath();for(let n=0;n<=12;n++){const sx=-43+n*7,sy=-104+Math.sin(n*.65+this.time*3)*17;if(n===0)c.moveTo(sx,sy);else c.lineTo(sx,sy);}c.stroke();c.restore();}
  rect(c,-41,-48,83,12,'#132536');for(let n=0;n<7;n++)rect(c,-33+n*10,-45,5,6,dead?'#43516a':n%2?'#d4bc8b':'#91cdb9');
  if(attack&&!dead){c.globalAlpha=.35;c.strokeStyle='#c4ffe6';c.lineWidth=3;c.beginPath();c.ellipse(0,-25,91,24,0,0,Math.PI*2);c.stroke();}c.restore();
 }
 bossWarnings(c,g){for(const e of g.enemies){if(e.hp<=0||!['windup','attack'].includes(e.state))continue;const preview=['pizzeria-boss','spike','duke','booth-enforcer'].includes(e.kind)&&e.move?{kind:e.move.all?'spot':'lane',x:e.x,y:e.y,face:e.face,range:e.move.reach,lane:e.move.lane,radius:e.move.reach}:null,a=e.telegraph||preview;if(!a)continue;const t=e.state==='attack'?1:clamp(e.timer/(e.move?.wind||.8),0,1),x=a.x-g.camera;if(a.kind==='spot'){this.dangerMarker(c,x,a.y,a.radius||60,this.time,'#e0b7ff',t);}else{const reach=a.range||170,lane=a.lane||32,x2=x+(a.face||e.face)*reach;c.save();c.globalAlpha=.12+t*.13;c.fillStyle=e.kind==='broadcast-rig'?'#d8acff':'#ffc28b';c.fillRect(Math.min(x,x2),a.y-lane,reach,lane*2);c.globalAlpha=.85;c.strokeStyle='#f0cfaa';c.lineWidth=2;c.strokeRect(Math.min(x,x2),a.y-lane,reach,lane*2);c.restore();}}for(const o of g.projectiles||[])if(o.kind==='signal')this.dangerMarker(c,o.targetX-g.camera,o.targetY,o.radius||44,this.time,'#a8ffe3',(o.age||0)/(o.duration||.7));}
 draw(g,dt){this.time+=dt;this.signalFlashT=Math.max(0,this.signalFlashT-dt);this.signalOffT=Math.max(0,this.signalOffT-dt);const c=this.ctx;const r=this.rect;if(this.area!==g.stage)this.makeCity(g.stage);c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#080e1d';c.fillRect(0,0,innerWidth,innerHeight);c.save();c.translate(r.x,r.y);c.scale(r.scale,r.scale);c.beginPath();c.rect(0,0,r.w,540);c.clip();const shake=(settings.reducedMotion?0:g.shake);if(shake>0.15)c.translate(Math.sin(this.time*115)*shake,Math.cos(this.time*89)*shake*.35);this.scene(c,g,r.w,this.time);
  this.bossWarnings(c,g);
  for(const e of g.enemies){if(e.entry?.route==='sewer'){
   const x=e.x-g.camera,y=e.y;c.save();c.fillStyle='#0a1421';c.beginPath();c.ellipse(x,y+1,54,13,0,0,Math.PI*2);c.fill();c.strokeStyle='#96aca4';c.lineWidth=3;c.stroke();
   const lidOffset=e.entry.phase==='waiting'?0:68;c.fillStyle='#334756';c.beginPath();c.ellipse(x+lidOffset,y-3,50,12,0,0,Math.PI*2);c.fill();c.strokeStyle='#879b9f';c.lineWidth=2;c.stroke();for(let j=-35;j<=35;j+=10)line(c,x+lidOffset+j,y-10,x+lidOffset+j+7,y+4,'#788d94',2);c.restore();
  }}
  const actors=[];for(const e of g.enemies){if(e.hidden||e.hp<=0&&e.timer>2.4)continue;actors.push({type:'enemy',e,y:e.y});}for(const o of g.props)actors.push({type:'prop',o,y:o.y});for(const o of g.pickups)actors.push({type:'pickup',o,y:o.y});actors.push({type:'hero',y:g.p.y});actors.sort((a,b)=>a.y-b.y||(a.type==='hero'?1:-1));
  for(const a of actors){
   if(a.type==='prop'){this.prop(c,a.o,a.o.x-g.camera,a.o.y);continue;}
   if(a.type==='pickup'){const x=a.o.x-g.camera,y=a.o.y;const bob=settings.reducedMotion?0:Math.sin(this.time*5)*3;c.fillStyle='#192536';c.beginPath();c.ellipse(x,y+2,a.o.kind==='turkey-dinner'?24:16,5,0,0,7);c.fill();if(a.o.kind==='turkey-dinner'&&this.available('turkey-dinner','idle')){this.sprite(c,'turkey-dinner','idle',x,y+bob,1,this.time,0);text(c,'+',x,y-61+bob,16,'#a1ffd6','center');}else{rect(c,x-9,y-28+bob,18,23,'#ecceb1');rect(c,x-11,y-30+bob,22,4,'#fff0d8');rect(c,x-8,y-21+bob,16,6,'#a54e53');text(c,'+',x,y-40+bob,16,'#a1ffd6','center');}continue;}
   const e=a.type==='hero'?g.p:a.e,x=e.x-g.camera;if(x<-220||x>r.w+220)continue;const baseSc=a.type==='hero'?1.05:(e.renderScale||Brawler.EINFO[e.kind]?.renderScale||(e.elite?1.15:1)),emerging=e.entry&&['screen','broadcast'].includes(e.entry.route)&&e.entry.phase==='emerge',entryProgress=emerging?clamp(e.entry.elapsed/(e.entry.duration||1.15),0,1):1,sc=baseSc*(emerging?(e.entryScale??(.28+.72*entryProgress)):1);let alpha=e.hp<=0?Math.max(0,1-Math.max(0,(a.type==='hero'?e.deadT:e.timer)-1.7)/.7):1;
   const kind=a.type==='hero'?(g.playerKind||'hero'):e.kind,drawName=a.type==='hero'?Brawler.playerAnimation(g.playerKind,e.anim):e.anim;
   if((!e.entry||e.entry.route!=='sewer')&&!emerging)this.shadow(c,kind,drawName,x,e.y,e.face,a.type==='hero'?e.animT:e.state==='dead'?e.timer:e.animT,e.animDuration,sc,e.z||0,alpha*(a.type==='hero'?.42:.32));
   if(a.type==='hero'){
    const blink=e.inv>0&&e.hp>0?(.78+.22*Math.sin(this.time*45)):1;this.sprite(c,g.playerKind||'hero',Brawler.playerAnimation(g.playerKind,e.anim),x,e.y-e.z,e.face,e.animT,e.animDuration,{alpha:blink,scale:sc});
    if(e.counter>0){c.strokeStyle='#9dffe2';c.lineWidth=2;c.beginPath();c.ellipse(x,e.y+4,41,11,0,0,7);c.stroke();}
   }else{
    let anim=e.anim,t=e.animT,dur=e.animDuration;
    if(e.state==='dead')t=e.timer;
    if(e.state==='hurt')t=e.timer;
    if(e.state==='windup'||e.state==='attack'){if(e.kind==='bear'&&e.variant===1)anim='swipe';if(e.kind==='bear'&&e.variant===2)anim='overhead';if(e.kind==='bear'&&e.variant===3)anim='backhand';}
    c.save();if(e.entry?.route==='sewer'){c.beginPath();c.rect(x-180,-500,360,e.y+504);c.clip();}else if(emerging&&entryProgress<.28){const sourceX=e.entry.sourceX-g.camera;c.beginPath();if(e.entry.route==='screen')c.rect(sourceX-105,246,210,75);else c.rect(sourceX-54,134,108,100);c.clip();}
    if(e.kind==='broadcast-rig')this.machine(c,e,x,e.y-(e.z||0),alpha);else this.sprite(c,e.kind,anim,x,e.y-(e.z||0)+(e.entryDepth||0),e.face,t,dur,{scale:sc,alpha});c.restore();
    if(e.entry?.route==='sewer'){c.strokeStyle='#607b81';c.lineWidth=4;c.beginPath();c.ellipse(x,e.y+2,54,13,0,0,Math.PI);c.stroke();}
    if(e.hp>0&&(!e.entry||e.targetable)){const hy=e.y-201*sc;rect(c,x-24,hy,48,4,'#101522');rect(c,x-24,hy,48*e.hp/e.maxHp,4,e.elite?'#ffb979':'#d697a2');if(e.state==='windup'){const t=clamp(e.timer/(e.move?.wind||Brawler.EINFO[e.kind].wind),0,1);c.save();c.globalAlpha=.14+t*.26;c.fillStyle='#ff845e';c.beginPath();c.ellipse(x+e.face*38,e.y,65,17,0,0,7);c.fill();c.restore();text(c,'!',x,hy-8,24,'#ffdb92','center',900);}}
   }
  }
  this.projectionWarnings(c,g);
  for(const o of g.projectiles||[]){const x=o.x-g.camera,y=o.y-(o.z||0);c.save();c.translate(x,y);if(o.kind==='trash-can'){if(!settings.reducedMotion)c.rotate((o.age||0)*4*(o.face||1));this.sprite(c,'trash-can','thrown',0,0,o.face||1,o.age||0,0,{scale:o.renderScale||1.08,loop:true});}else if(o.kind==='signal'){c.fillStyle='#defff1';c.beginPath();c.arc(0,0,11,0,Math.PI*2);c.fill();c.strokeStyle='#94ffe1';c.lineWidth=3;c.beginPath();c.arc(0,0,17,0,Math.PI*2);c.stroke();for(let n=0;n<4;n++){const a=n*Math.PI/2;line(c,Math.cos(a)*19,Math.sin(a)*19,Math.cos(a)*25,Math.sin(a)*25,'#d7bbff',2);}}else{if(!settings.reducedMotion)c.rotate((o.age||0)*14);this.reel(c,0,0,21,o.color||'#ffca83');}c.restore();}
  for(const f of this.fx){f.t+=dt;const q=f.t/f.life,x=f.x-g.camera,y=f.y;c.save();c.globalAlpha=1-q;if(f.type==='hit'||f.type==='parry'||f.type==='block'){
    const rr=(f.heavy?18:11)*(1+q*1.8);c.translate(x,y);c.strokeStyle=f.color;c.lineWidth=f.heavy?4:2;for(let j=0;j<7;j++){const a=j/7*Math.PI*2;c.beginPath();c.moveTo(Math.cos(a)*rr*.5,Math.sin(a)*rr*.5);c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);c.stroke();}if(f.type==='parry')text(c,'PARRY',0,-40-q*10,14,f.color,'center',900);
   }else if(f.type==='slam'||f.type==='projectileImpact'){c.strokeStyle=f.type==='projectileImpact'?(f.kind==='reel'?'#ffcf89':'#bcf9e1'):'#ead3b7';c.lineWidth=3;c.beginPath();c.ellipse(x,y,20+q*50,4+q*8,0,0,7);c.stroke();}
   else if(f.type==='signalSweep'){line(c,x,y,x+(f.face||-1)*610,y,'#a7ffe1',5);line(c,x,y-9,x+(f.face||-1)*610,y-9,'#d5bbff',2);}
   else if(f.type==='pickup'){text(c,'+'+(f.heal||18),x,y-45-q*30,20,'#aaffda','center');}
   else if(f.type==='break'){if(f.kind==='circuit'){for(let j=0;j<6;j++){const a=j*Math.PI/3;line(c,x+Math.cos(a)*q*12,y-40+Math.sin(a)*q*8,x+Math.cos(a)*q*42,y-40+Math.sin(a)*q*27,f.color,3);}if(f.broken){c.strokeStyle=f.color;c.lineWidth=3;c.beginPath();c.ellipse(x,y-39,20+q*35,12+q*21,0,0,Math.PI*2);c.stroke();}}else for(let j=0;j<7;j++)rect(c,x+Math.sin(j*9)*q*58,y-20-q*45+q*q*65,4,7,'#ad9b87');}
   c.restore();}
  this.fx=this.fx.filter(f=>f.t<f.life);
  if(g.bannerT>0&&g.p.z===0&&!g.p.action){const t=Math.min(1,g.bannerT*2);c.save();c.globalAlpha=t;const bw=Math.min(r.w-70,Math.max(230,g.banner.length*10+28));rect(c,(r.w-bw)/2,95,bw,30,'#101c30');text(c,g.banner,(r.w)/2,116,16,g.banner==='BLOCK CLEAR'?'#8ff0cf':'#ffe0b0','center',900);c.restore();}
  if(g.stageBanner>0&&g.p.z===0&&!g.p.action){const q=Math.min(1,g.stageBanner);c.save();c.globalAlpha=q;const x=r.w/2;rect(c,x-185,142,370,56,'#12172be6');text(c,STAGES[g.stage].sub,x,163,10,'#99b4c8','center',600);text(c,STAGES[g.stage].name.toUpperCase(),x,185,21,'#fff1d8','center',900);c.restore();}
  c.restore();}
}
root.CityRenderer=Renderer;
})(window);
