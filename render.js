/* The Critic: Coming Attractions. Layered environments and source-atlas playback. */
(function(root){'use strict';
const {clamp,STAGES,LENGTH,YMIN,YMAX}=Brawler;
function canvas(w,h){const a=document.createElement('canvas');a.width=w;a.height=h;return a;}
function rect(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h);}
function text(c,s,x,y,size,col,align='left',weight=700){c.font=`${weight} ${size}px system-ui, sans-serif`;c.fillStyle=col;c.textAlign=align;c.fillText(s,x,y);}
function rnd(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function line(c,x,y,x2,y2,col,w=1){c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
const PALETTES=[['#100f30','#81506e','#e6a788','#141e37','#324560','#85e7d0','#ffbd80'],['#070f23','#1d3c50','#467177','#0b202c','#244657','#64dec8','#e9c875'],['#10102b','#674c7a','#d88b79','#18263f','#32445d','#b7a1f4','#ffb183'],['#100d2e','#6c365e','#d6806b','#241934','#3a3550','#72e2c7','#ffdd97'],['#080f2d','#29366b','#566286','#172445','#482b51','#a3d3ff','#f0c88d'],['#190f23','#713b4b','#b77c58','#2f263b','#503d45','#d7eac0','#ffc18d'],['#080b22','#17394b','#574a7c','#102b38','#243b54','#78f3db','#dbb6ff']];
class Renderer{
 constructor(node,sprites,images){this.c=node;this.ctx=node.getContext('2d',{alpha:false});this.sprites=sprites;this.images=images;this.art=new Map();this.brokenProps=new WeakMap();this.area=-1;this.fx=[];this.time=0;this.dpr=1;this.rect={x:0,y:0,scale:1,w:960,h:540};this.resize();}
 // Optional scene art loads independently of the combat banks. A delayed or unavailable
 // illustration leaves an authored geometry backdrop visible rather than a blank scene.
 artwork(name){if(this.art.has(name))return this.art.get(name);this.art.set(name,null);const inline=root.BRAWLER_ASSETS,src=inline?inline.files?.[name]:(root.BRAWLER_CONFIG?.assetBase||'assets/')+name;if(!src)return null;const im=new Image();im.onload=()=>this.art.set(name,im);im.onerror=()=>this.art.set(name,false);im.src=src;return null;}
 resize(){const w=innerWidth,h=innerHeight;this.dpr=Math.min(devicePixelRatio||1,2);this.c.width=Math.round(w*this.dpr);this.c.height=Math.round(h*this.dpr);this.c.style.width=w+'px';this.c.style.height=h+'px';if(w>h){this.rect={x:0,y:0,scale:h/540,w:w/h*540,h:540};}else{const s=w/760;this.rect={x:0,y:Math.max(96,(h-215-540*s)/2),scale:s,w:760,h:540};}return this.rect;}
 makeCity(stage){this.area=stage;if(stage>=4){this.makeInterior(stage);return;}const p=PALETTES[stage]||PALETTES[0],r=rnd(9137+stage*23);this.back=canvas(1700,340);let c=this.back.getContext('2d');
  const sky=c.createLinearGradient(0,0,0,340);sky.addColorStop(0,p[0]);sky.addColorStop(.65,p[1]);sky.addColorStop(1,p[2]);c.fillStyle=sky;c.fillRect(0,0,1700,340);
  for(let j=0;j<60;j++)rect(c,Math.floor(r()*1700),r()*140,1,1,'#cbb2c5');
  c.fillStyle='#f4ccbb';c.beginPath();c.arc(1160,95,26,0,Math.PI*2);c.fill();
  for(let layer=0;layer<2;layer++){let x=0;while(x<1700){const w=28+r()*60,h=55+r()*150,y=310-h;rect(c,x,y,w,h,layer?'#253049':'#3b3454');if(r()>.7)line(c,x+w/2,y,x+w/2,y-35,'#2c2f46',2);for(let xx=x+6;xx<x+w-3;xx+=10)for(let yy=y+9;yy<308;yy+=14)if(r()>.56)rect(c,xx,yy,3,5,r()>.4?'#b09a8b':'#69677e');x+=w+5;}}
  this.front=canvas(LENGTH+800,350);c=this.front.getContext('2d');
  const names=stage===0?['MIDNIGHT COFFEE','VIDEO CLUB','LAST SHOW','DELI / OPEN','PALACE CINEMA','NIGHT OWL']:stage===1?['DOWNTOWN  8 AV','LAST TRAIN','PLATFORM 02','UPTOWN EXPRESS','EXIT / BROADWAY','NO SERVICE']:stage===2?['NIGHT SKY','RADIO / CITY','ROOFTOP CLUB','ON AIR','THE HEIGHTS','EXIT']:['GRAND PREMIERE','COMING ATTRACTIONS','BOX OFFICE','TONIGHT ONLY','AFTER HOURS','THE END'];
  let x=-50,ix=0;
  while(x<LENGTH+700){const w=230+Math.floor(r()*145),top=18+Math.floor(r()*75),b=stage===1?'#17313e':ix%2?p[3]:p[4];
   rect(c,x,top,w,324-top,b);rect(c,x+8,top+8,w-16,4,'#4d5261');rect(c,x-3,top-6,w+6,7,'#151f32');
   // Brick / tile courses, intentionally subdued behind the actors.
   for(let yy=top+20;yy<318;yy+=14){line(c,x,yy,x+w,yy,stage===1?'#294a56':'#424658',1);for(let xx=x+(Math.floor(yy/14)%2)*28;xx<x+w;xx+=56)line(c,xx,yy,xx,yy+14,'#303b4c',1);}
   for(let xx=x+24;xx<x+w-24;xx+=60)for(let yy=top+29;yy<184;yy+=61){rect(c,xx-3,yy-3,39,45,'#101829');const win=r()>.55?'#c2936c':'#2c6072';rect(c,xx,yy,33,39,win);line(c,xx+16,yy,xx+16,yy+39,'#172537',3);line(c,xx,yy+18,xx+33,yy+18,'#172537',3);rect(c,xx-5,yy+40,43,4,'#5b5c67');}
   // Shop glass / doors, awning and geometric display.
   rect(c,x+16,227,w-32,94,'#0a1728');for(let j=0;j<3;j++){const sx=x+24+j*(w-48)/3;rect(c,sx,238,(w-58)/3,78,j===1?'#1a3f48':'#234151');line(c,sx+8,244,sx+31,284,'#396070',1);}
   rect(c,x+w*.46,240,4,76,'#48716f');rect(c,x+w*.53,275,3,10,'#ead195');
   const accent=ix%2?p[5]:p[6];rect(c,x+5,201,w-10,34,'#101628');c.shadowColor=accent;c.shadowBlur=7;line(c,x+10,203,x+w-10,203,accent,2);text(c,names[ix%names.length],x+w/2,224,14,accent,'center',800);c.shadowBlur=0;
   if(stage!==1){for(let ax=x+10;ax<x+w-12;ax+=22)rect(c,ax,235,22,10,(Math.floor(ax/22)%2)?'#3e6469':'#bbb3a1');}
   rect(c,x+18,320,w-36,7,'#566068');rect(c,x+8,326,w-16,5,'#172333');
   if(ix%2===0&&stage!==1){const fx=x+w-55;line(c,fx,top+17,fx,195,'#0b1321',3);line(c,fx+31,top+17,fx+31,195,'#0b1321',3);for(let fy=top+24;fy<195;fy+=12)line(c,fx,fy,fx+31,fy,'#60727d',2);}
   if(stage===2){const tx=x+w*.5;rect(c,tx-38,top-5,75,8,'#19222e');rect(c,tx-27,top-54,55,49,'#453f40');for(let bx=tx-25;bx<tx+29;bx+=9)line(c,bx,top-53,bx,top-5,'#7a6b58',2);c.fillStyle='#242d3a';c.beginPath();c.moveTo(tx-35,top-54);c.lineTo(tx,top-70);c.lineTo(tx+35,top-54);c.fill();}
   x+=w+12;ix++;
  }
  if(stage===1){rect(c,0,10,LENGTH+800,19,'#081521');for(let i=90;i<LENGTH+700;i+=510){rect(c,i,20,22,303,'#11232e');rect(c,i-10,19,42,10,'#49666a');rect(c,i-6,304,35,22,'#233c45');for(let y=32;y<300;y+=28)rect(c,i+5,y,3,3,'#658185');}for(let i=100;i<LENGTH+700;i+=420){rect(c,i,175,130,42,'#d7c287');text(c,'8 AV',i+65,202,24,'#132b36','center');}}
  if(stage===3){const tx=2480;rect(c,tx,108,380,208,'#302136');rect(c,tx+13,125,354,68,'#e8bf76');rect(c,tx+22,134,336,49,'#402037');text(c,'THE CRITIC:',tx+190,157,21,'#ffdc93','center',900);text(c,'COMING ATTRACTIONS',tx+190,177,17,'#ffdc93','center',900);for(let bx=tx+14;bx<tx+370;bx+=18){c.fillStyle='#fff0b9';c.beginPath();c.arc(bx,128,2.4,0,7);c.fill();c.beginPath();c.arc(bx,190,2.4,0,7);c.fill();}rect(c,tx+61,221,260,102,'#120e22');for(let xx=tx+70;xx<tx+325;xx+=50){rect(c,xx,225,40,93,'#813647');rect(c,xx+4,230,32,88,'#422438');}text(c,'WORLD PREMIERE',tx+190,211,13,'#f4d8a9','center');}
 }
 makeInterior(stage){const p=PALETTES[stage]||PALETTES[4],width=LENGTH+800;this.back=canvas(1700,340);let c=this.back.getContext('2d');const gr=c.createLinearGradient(0,0,0,340);gr.addColorStop(0,p[0]);gr.addColorStop(1,p[2]);c.fillStyle=gr;c.fillRect(0,0,1700,340);this.front=canvas(width,350);c=this.front.getContext('2d');
  if(stage===4){
   rect(c,0,0,width,324,'#121b37');rect(c,0,12,width,12,'#3b324f');rect(c,0,53,width,4,'#4c4567');
   for(let x=-50;x<width;x+=900){
    // The screen and balcony sit behind the fighting aisle; seating stays outside it.
    rect(c,x+60,69,432,208,'#080c1f');rect(c,x+68,77,416,193,'#848aac');rect(c,x+75,85,402,178,'#c3c6d1');
    const glow=c.createLinearGradient(x+75,85,x+475,263);glow.addColorStop(0,'#d6d8da');glow.addColorStop(1,'#9da8c5');c.fillStyle=glow;c.fillRect(x+75,85,402,178);
    rect(c,x+42,61,19,236,'#51283e');rect(c,x+492,61,22,236,'#51283e');for(let sx=x+42;sx<x+59;sx+=5)line(c,sx,68,sx,289,'#713d50',2);for(let sx=x+494;sx<x+513;sx+=5)line(c,sx,68,sx,289,'#713d50',2);
    rect(c,x+580,75,235,177,'#202c4f');rect(c,x+582,80,231,4,'#58618d');rect(c,x+585,253,231,12,'#57617c');
    for(let sx=x+603;sx<x+802;sx+=26){rect(c,sx,92,12,151,'#303b5a');line(c,sx+3,95,sx+3,238,'#475476',1);}
    for(let row=0;row<2;row++)for(let sx=x+3;sx<x+855;sx+=53){if(sx>x+488&&sx<x+577)continue;const y=286+row*23;rect(c,sx+3,y,39,22,row?'#543343':'#633e52');rect(c,sx,y+18,45,6,'#201c31');line(c,sx+9,y+3,sx+35,y+3,'#946277',2);}
   }
   rect(c,0,320,width,5,'#615779');
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
 emit(ev){const color=ev.type==='parry'?'#86ffe2':ev.type==='pickup'?'#acffe1':'#ffd5a3';if(['hit','parry','block','break','slam','pickup','signalSweep','projectileImpact'].includes(ev.type)){
  this.fx.push({type:ev.type,x:ev.x,y:ev.y,t:0,life:ev.type==='hit'?.37:.45,color,heavy:ev.heavy,damage:ev.damage,heal:ev.heal,combo:ev.combo,face:ev.face});}}
 frame(who,name,t=0,duration=0,forceLoop){
  const dict=this.sprites.characters[who==='booth-enforcer'?'sherm-slam':who],a=dict?.[name]||dict?.idle;if(!a)return null;
  let ms=t*1000;if(duration>0)ms=ms/(duration*1000)*a.ms;
  const loop=forceLoop??(a.loop&&!duration);ms=loop?ms%a.ms:Math.min(Math.max(0,ms),a.ms-.001);
  const progress=clamp(ms/a.ms,0,1);let f=a.frames[a.frames.length-1];for(const ff of a.frames){ms-=ff.ms;if(ms<0){f=ff;break;}}
  return {a,f,progress};
 }
 available(who,name){const chosen=this.frame(who,name);return !!(chosen&&this.images[chosen.f.p]);}
 sprite(c,who,name,x,y,face=1,t=0,duration=0,opts={}){
  const chosen=this.frame(who,name,t,duration,opts.loop);if(!chosen)return;const {a,f,progress}=chosen,im=this.images[f.p];if(!im)return;
  const sc=opts.scale||1,u=clamp((progress-.35)/.40,0,1),support=a.groundedDefeat?-(f.contactY||0)*u*u*(3-2*u):0;
  c.save();c.translate(x,y);c.scale(face*(a.canonicalFacing===-1?-1:1)*sc,sc);if(opts.alpha!==undefined)c.globalAlpha=opts.alpha;
  c.drawImage(im,f.x,f.y,f.w,f.h,f.ox,f.oy+support,f.w,f.h);c.restore();return chosen;
 }
 shadow(c,who,name,x,y,face,t,duration,sc=1,z=0,alpha=.35){
  const ch=this.frame(who,name,t,duration);if(!ch)return;const {a,f,progress}=ch,prone=!!a.groundedDefeat;
  const blend=prone?clamp(progress*1.8,0,1):0,wide=Math.max(25,Math.min(145,f.w*.46));
  const cx=x+(prone?(f.ox+f.w/2)*face*sc*blend:0),rx=(32+(wide-32)*blend)*sc*Math.max(.5,1-z/260);
  c.save();c.globalAlpha=alpha;c.fillStyle='#050c15';c.beginPath();c.ellipse(cx,y+2,rx,prone?5:7*sc,0,0,Math.PI*2);c.fill();c.restore();
 }
 showcase(node,g,t){
  const w=node.clientWidth,h=node.clientHeight,dpr=Math.min(devicePixelRatio||1,2);if(node.width!==Math.round(w*dpr)||node.height!==Math.round(h*dpr)){node.width=Math.round(w*dpr);node.height=Math.round(h*dpr);}
  const c=node.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);const bg=c.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#11192d');bg.addColorStop(1,'#264247');c.fillStyle=bg;c.fillRect(0,0,w,h);
  c.save();c.globalAlpha=.28;for(let i=0;i<8;i++){c.fillStyle=i%2?'#7cdac3':'#eabc89';c.fillRect(i*w/7-10,15,2,h-42);}c.restore();
  const who=g.playerKind||'hero',name=Brawler.playerAnimation(who,t<.65?'dance-enter':'dance-loop'),aa=this.sprites.characters[who][name]||this.sprites.characters[who].idle;
  const minx=Math.min(...aa.frames.map(f=>f.ox)),maxx=Math.max(...aa.frames.map(f=>f.ox+f.w)),miny=Math.min(...aa.frames.map(f=>f.oy)),maxy=Math.max(...aa.frames.map(f=>f.oy+f.h));
  const sc=Math.min(1.5,(w-45)/(maxx-minx),(h-46)/(maxy-miny)),x=w/2-(minx+maxx)*sc/2,y=h-25-Math.max(0,maxy)*sc;
  this.shadow(c,who,name,x,y,1,t,0,sc,0,.3);this.sprite(c,who,name,x,y,1,t<.65?t:t-.65,t<.65?.65:0,{scale:sc,loop:t>=.65});
  text(c,who==='franklin'?'FRANKLIN':'JAY SHERMAN',w/2,h-7,10,'#d2efe2','center',800);
 }
 scene(c,g,w,time){if(g.stage>=4){this.interiorScene(c,g,w,time);return;}const p=PALETTES[g.stage]||PALETTES[0];const cam=g.camera;for(let j=-1;j<4;j++)c.drawImage(this.back,Math.floor(j*1700-cam*.20),0);c.drawImage(this.front,-Math.floor(cam*.72),0);
  // Atmospheric sign glows are behind sprites, not a full-screen color wash.
  c.save();c.globalAlpha=.13;for(let i=0;i<6;i++){const x=i*390-(cam*.72%390);const gr=c.createRadialGradient(x,230,1,x,250,110);gr.addColorStop(0,i%2?p[5]:p[6]);gr.addColorStop(1,'transparent');c.fillStyle=gr;c.fillRect(x-110,145,220,160);}c.restore();
  const grd=c.createLinearGradient(0,324,0,540);grd.addColorStop(0,'#354454');grd.addColorStop(.55,'#283544');grd.addColorStop(1,'#111a2a');c.fillStyle=grd;c.fillRect(0,324,w,216);rect(c,0,323,w,4,'#889097');rect(c,0,329,w,4,'#162331');
  // Receding sidewalk courses give the depth movement a visible plane.
  for(const yy of [353,389,433,485])line(c,0,yy,w,yy,'#435060',1);
  const offset=cam%150;for(let x=-150;x<w+200;x+=150){line(c,x-offset,325,x-offset-80,491,'#38485a',1);}
  for(let j=0;j<14;j++){let x=(j*233+41-cam*.94)%(w+240);if(x<0)x+=w+240;const yy=360+(j*71%110);c.save();c.globalAlpha=.10;c.fillStyle=j%2?p[5]:p[6];c.beginPath();c.ellipse(x,yy,23+j%4*13,3,0,0,7);c.fill();c.restore();}
  // Drain grilles and scuffed tile edges.
  for(let x=150;x<LENGTH;x+=610){const xx=x-cam;if(xx<-100||xx>w+100)continue;rect(c,xx,467,76,13,'#121f2b');for(let k=0;k<10;k++)line(c,xx+5+k*7,470,xx+5+k*7,478,'#53616c',2);}
  if(g.stage===3){const x=2505-cam;rect(c,x,333,240,112,'#5f283b');for(let n=0;n<4;n++)line(c,x+8,338+n*29,x+232,338+n*29,'#8a4451',1);}
  // Decorative curb is outside the playable lane.
  rect(c,0,492,w,9,'#64737a');rect(c,0,501,w,5,'#091324');rect(c,0,506,w,34,'#0e1627');for(let x=-cam%86;x<w;x+=86)line(c,x,493,x,501,'#1c2939',2);
  if(g.activeGate>=0){const gx=Brawler.GATES[g.activeGate]+492-cam;if(gx>0&&gx<w){c.save();c.globalAlpha=.35+.12*Math.sin(time*6);for(let yy=334;yy<470;yy+=18)line(c,gx-3,yy,gx+3,yy+10,'#ffaf8d',3);c.restore();}}
  if(g.activeGate<0){const dx=Math.min(w-55,LENGTH-130-cam);if(dx>80){text(c,g.nextGate===3?'EXIT':'GO',dx,301,17,'#8effd7','center',900);line(c,dx-10,310,dx+10,310,'#8effd7',2);line(c,dx+10,310,dx+5,305,'#8effd7',2);line(c,dx+10,310,dx+5,315,'#8effd7',2);}}
 }
 interiorScene(c,g,w,time){const stage=g.stage,cam=g.camera,p=PALETTES[stage]||PALETTES[4];for(let j=-1;j<4;j++)c.drawImage(this.back,Math.floor(j*1700-cam*.2),0);c.drawImage(this.front,-Math.floor(cam*.72),0);
  const im=this.artwork('environments/'+({4:'cinema',5:'pizzeria',6:'broadcast'}[stage]||'broadcast')+'.webp');if(im){c.save();c.beginPath();c.rect(0,0,w,324);c.clip();const crop=({4:.66,5:.67,6:.63})[stage]||.63,sourceH=im.height*crop,tile=im.width/sourceH*324,offset=cam*.72;for(let j=Math.floor(offset/tile)-1;j<=Math.floor((offset+w)/tile)+1;j++)c.drawImage(im,0,0,im.width,sourceH,Math.floor(j*tile-offset),0,Math.ceil(tile),324);c.restore();
   if(stage===4){const sx=1760-cam;rect(c,sx-13,75,446,221,'#21192e');rect(c,sx,88,420,195,'#8093af');const light=c.createLinearGradient(sx,88,sx+420,283);light.addColorStop(0,'#b5c0d2');light.addColorStop(1,'#758ba7');c.fillStyle=light;c.fillRect(sx+7,95,406,181);rect(c,sx-22,73,13,233,'#5b293f');rect(c,sx+429,73,13,233,'#5b293f');line(c,sx-9,294,sx+429,294,'#726780',3);}
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
   if(g.activeGate===2||g.bossSpawned){const bx=2490-cam;rect(c,bx,305,285,17,'#516776');rect(c,bx,321,285,5,'#132333');line(c,bx,174,bx,304,'#8397a5',4);line(c,bx+285,174,bx+285,304,'#8397a5',4);line(c,bx,175,bx+285,175,'#6d8597',4);
    if(this.available('duke','idle'))this.sprite(c,'duke',g.bossDefeated?'hurt':'idle',bx+74,305,-1,this.time,0,{scale:.63});
    if(this.available('marty','idle'))this.sprite(c,'marty','idle',bx+207,305,-1,this.time,0,{scale:.63});
   }
  }else{rect(c,0,492,w,9,'#78887e');rect(c,0,501,w,39,'#101829');}
  if(g.activeGate>=0){const gx=Brawler.GATES[g.activeGate]+492-cam;if(gx>0&&gx<w){c.save();c.globalAlpha=.35+.12*Math.sin(time*6);for(let yy=336;yy<475;yy+=18)line(c,gx-3,yy,gx+3,yy+10,p[6],3);c.restore();}}
  if(g.activeGate<0){const dx=Math.min(w-55,LENGTH-130-cam);if(dx>80){text(c,g.nextGate===3?'EXIT':'GO',dx,301,17,'#8effd7','center',900);line(c,dx-10,310,dx+10,310,'#8effd7',2);line(c,dx+10,310,dx+5,305,'#8effd7',2);line(c,dx+10,310,dx+5,315,'#8effd7',2);}}
 }
 dangerMarker(c,x,y,r,time,color='#ffc56f',progress=0){c.save();c.globalAlpha=.12;c.fillStyle=color;c.beginPath();c.ellipse(x,y,r,r*.34,0,0,Math.PI*2);c.fill();c.globalAlpha=.8;c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.ellipse(x,y,r,r*.34,0,0,Math.PI*2);c.stroke();const inner=Math.max(4,r*(1-clamp(progress,0,1)));c.globalAlpha=.6;c.beginPath();c.ellipse(x,y,inner,inner*.34,0,0,Math.PI*2);c.stroke();line(c,x-7,y,x+7,y,color,1);line(c,x,y-5,x,y+5,color,1);c.restore();}
 projectionWindows(c,g,time){const a=g.projection;if(!a||!a.windowXs)return;const top=(a.windowY||158)-80;const face=this.artwork('story/projection-woman.webp'),shadow=this.artwork('story/projection-shadow.webp');
  const left=a.windowXs[0]-g.camera-51,right=a.windowXs[a.windowXs.length-1]-g.camera+51;rect(c,left,top-17,right-left,135,'#25324f');line(c,left,top-14,right,top-14,'#647099',3);text(c,'PROJECTION BOOTH',((left+right)/2),top-24,10,'#b2c0e3','center',800);
  a.windowXs.forEach((wx,i)=>{const x=wx-g.camera;rect(c,x-42,top-5,84,109,'#57698b');rect(c,x-36,top,72,97,'#080d23');const visible=!a.disabled&&a.visible&&a.window===i;
   if(visible){const im=a.phase==='telegraph'&&a.timer<.3&&shadow?shadow:face;if(im){c.save();c.beginPath();c.rect(x-34,top+2,68,91);c.clip();const scale=Math.max(68/im.width,91/im.height),iw=im.width*scale,ih=im.height*scale;c.drawImage(im,x-iw/2,top+2+(91-ih)/2,iw,ih);c.restore();}else{c.fillStyle='#0c1028';c.beginPath();c.ellipse(x,top+59,25,40,0,0,Math.PI*2);c.fill();for(const ex of [x-11,x+11]){c.fillStyle='#ddd9ee';c.beginPath();c.ellipse(ex,top+43,8,5,ex<x?.2:-.2,0,Math.PI*2);c.fill();c.fillStyle='#738cda';c.beginPath();c.arc(ex,top+43,3,0,Math.PI*2);c.fill();}}
    if(a.phase==='telegraph'||a.phase==='throw'){c.strokeStyle='#ffc677';c.lineWidth=2;c.strokeRect(x-37,top-1,74,99);const handX=x+(i%2?-29:29);rect(c,handX-8,top+74,16,12,'#e3b2b3');c.fillStyle='#c8c5c7';c.beginPath();c.arc(handX,top+65,10,0,Math.PI*2);c.fill();c.fillStyle='#333a54';c.beginPath();c.arc(handX,top+65,4,0,Math.PI*2);c.fill();}
   }
   rect(c,x-44,top+98,88,7,a.disabled?'#475569':'#8594b7');if(a.disabled){text(c,'OFF',x,top+60,11,'#72839b','center');}
  });
  if(a.telegraph)this.dangerMarker(c,a.telegraph.x-g.camera,a.telegraph.y,a.telegraph.radius||32,time,'#ffca83',(a.telegraph.t||0)/(a.telegraph.duration||1.1));
  for(const o of g.projectiles||[])this.dangerMarker(c,o.targetX-g.camera,o.targetY,o.radius||32,time,'#ffca83',(o.age||0)/(o.duration||.65));
 }
 prop(c,o,x,y){if(o.hp<=0){if((o.kind==='bin'||o.kind==='trash-can')&&this.available('trash-can','break')){if(!this.brokenProps.has(o))this.brokenProps.set(o,this.time);const age=this.time-this.brokenProps.get(o);if(age<.8)this.sprite(c,'trash-can','break',x,y,1,age,.8,{alpha:clamp((.8-age)/.2,0,1)});}return;}if(o.kind==='circuit'){rect(c,x-23,y-65,46,63,'#182b3d');rect(c,x-20,y-61,40,36,'#4c617c');rect(c,x-16,y-57,32,21,'#0c1e2c');for(let n=0;n<3;n++){rect(c,x-11+n*8,y-52,4,11,o.hp<(o.maxHp||45)*.5?'#ffbc79':'#96f0ce');}rect(c,x-15,y-26,30,17,'#293b4e');line(c,x-9,y-24,x+9,y-12,'#cfb36e',2);line(c,x+9,y-24,x-9,y-12,'#cfb36e',2);text(c,'HIT',x,y-73,11,'#ffe5a4','center',800);return;}
  if(o.kind==='bin'||o.kind==='trash-can'){if(this.available('trash-can','idle')){this.sprite(c,'trash-can',o.hp<(o.maxHp||24)*.5?'dent':'idle',x,y,1,this.time,0);return;}rect(c,x-20,y-52,40,51,'#1a343d');rect(c,x-23,y-55,46,7,'#678177');rect(c,x-13,y-42,26,5,'#182b35');for(let xx=x-15;xx<x+20;xx+=10)line(c,xx,y-29,xx,y-3,'#49655f',2);rect(c,x-22,y-4,44,4,'#0b1e2b');}else{rect(c,x-23,y-44,46,43,'#7e6352');rect(c,x-21,y-42,42,4,'#bca07b');rect(c,x-20,y-25,40,3,'#443c3c');line(c,x-20,y-40,x+20,y-3,'#b49872',4);line(c,x+20,y-40,x-20,y-3,'#a88b6b',4);}}
 machine(c,e,x,y,alpha=1){const dead=e.hp<=0,attack=e.state==='attack',wind=e.state==='windup',pulse=dead?0:(settings.reducedMotion?.65:(.55+.30*Math.sin(this.time*9)));c.save();c.translate(x,y);c.globalAlpha=alpha;
  c.fillStyle='#080d1d';c.beginPath();c.ellipse(0,3,86,15,0,0,Math.PI*2);c.fill();rect(c,-77,-29,154,26,'#384861');rect(c,-84,-19,31,17,'#121e30');rect(c,53,-19,31,17,'#121e30');
  rect(c,-62,-166,124,137,'#455970');rect(c,-53,-154,106,103,dead?'#222838':'#89a6b4');rect(c,-47,-148,94,87,'#11293d');
  rect(c,-72,-190,144,24,'#596b81');rect(c,-66,-186,132,15,'#192639');text(c,dead?'OFF AIR':'ON AIR',0,-174,12,dead?'#728099':'#f5c987','center',900);
  for(let side=-1;side<=1;side+=2){rect(c,side<0?-92:70,-140,22,86,'#314a61');rect(c,side<0?-97:68,-150,29,13,'#738b9b');line(c,side*82,-161,side*96,-211,'#839baa',4);c.fillStyle=dead?'#46536b':attack?'#fff2bb':wind?'#ffc07f':'#99e7da';c.beginPath();c.arc(side*97,-214,8,0,Math.PI*2);c.fill();}
  if(!dead){c.save();c.beginPath();c.rect(-46,-146,92,83);c.clip();c.globalAlpha=pulse;for(let yy=-143;yy<-64;yy+=7)line(c,-45,yy,45,yy,'#6facb5',1);c.strokeStyle=attack?'#ffe8ac':'#9dceca';c.lineWidth=2;c.beginPath();for(let n=0;n<=12;n++){const sx=-43+n*7,sy=-104+Math.sin(n*.65+this.time*3)*17;if(n===0)c.moveTo(sx,sy);else c.lineTo(sx,sy);}c.stroke();c.restore();}
  rect(c,-41,-48,83,12,'#132536');for(let n=0;n<7;n++)rect(c,-33+n*10,-45,5,6,dead?'#43516a':n%2?'#d4bc8b':'#91cdb9');
  if(attack&&!dead){c.globalAlpha=.35;c.strokeStyle='#c4ffe6';c.lineWidth=3;c.beginPath();c.ellipse(0,-25,91,24,0,0,Math.PI*2);c.stroke();}c.restore();
 }
 bossWarnings(c,g){for(const e of g.enemies){if(e.hp<=0||!e.telegraph||!['windup','attack'].includes(e.state))continue;const a=e.telegraph,t=e.state==='attack'?1:clamp(e.timer/(e.move?.wind||.8),0,1),x=a.x-g.camera;if(a.kind==='spot'){this.dangerMarker(c,x,a.y,a.radius||60,this.time,'#e0b7ff',t);}else{const reach=a.range||170,lane=a.lane||32,x2=x+(a.face||e.face)*reach;c.save();c.globalAlpha=.12+t*.13;c.fillStyle=e.kind==='broadcast-rig'?'#d8acff':'#ffc28b';c.fillRect(Math.min(x,x2),a.y-lane,reach,lane*2);c.globalAlpha=.85;c.strokeStyle='#f0cfaa';c.lineWidth=2;c.strokeRect(Math.min(x,x2),a.y-lane,reach,lane*2);c.restore();}}for(const o of g.projectiles||[])if(o.kind==='signal')this.dangerMarker(c,o.targetX-g.camera,o.targetY,o.radius||44,this.time,'#a8ffe3',(o.age||0)/(o.duration||.7));}
 draw(g,dt){this.time+=dt;const c=this.ctx;const r=this.rect;if(this.area!==g.stage)this.makeCity(g.stage);c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#080e1d';c.fillRect(0,0,innerWidth,innerHeight);c.save();c.translate(r.x,r.y);c.scale(r.scale,r.scale);c.beginPath();c.rect(0,0,r.w,540);c.clip();const shake=(settings.reducedMotion?0:g.shake);if(shake>0.15)c.translate(Math.sin(this.time*115)*shake,Math.cos(this.time*89)*shake*.35);this.scene(c,g,r.w,this.time);
  this.bossWarnings(c,g);
  for(const e of g.enemies){if(e.entry?.route==='sewer'){
   const x=e.x-g.camera,y=e.y;c.save();c.fillStyle='#0a1421';c.beginPath();c.ellipse(x,y+1,54,13,0,0,Math.PI*2);c.fill();c.strokeStyle='#96aca4';c.lineWidth=3;c.stroke();
   if(e.entry.phase==='waiting'){c.fillStyle='#334756';c.fill();for(let j=-35;j<=35;j+=10)line(c,x+j,y-7,x+j+7,y+7,'#788d94',2);}c.restore();
  }}
  const actors=[];for(const e of g.enemies){if(e.hidden||e.hp<=0&&e.timer>2.4)continue;actors.push({type:'enemy',e,y:e.y});}for(const o of g.props)actors.push({type:'prop',o,y:o.y});for(const o of g.pickups)actors.push({type:'pickup',o,y:o.y});actors.push({type:'hero',y:g.p.y});actors.sort((a,b)=>a.y-b.y||(a.type==='hero'?1:-1));
  for(const a of actors){
   if(a.type==='prop'){this.prop(c,a.o,a.o.x-g.camera,a.o.y);continue;}
   if(a.type==='pickup'){const x=a.o.x-g.camera,y=a.o.y;const bob=settings.reducedMotion?0:Math.sin(this.time*5)*3;c.fillStyle='#192536';c.beginPath();c.ellipse(x,y+2,a.o.kind==='turkey-dinner'?24:16,5,0,0,7);c.fill();if(a.o.kind==='turkey-dinner'&&this.available('turkey-dinner','idle')){this.sprite(c,'turkey-dinner','idle',x,y+bob,1,this.time,0);text(c,'+',x,y-61+bob,16,'#a1ffd6','center');}else{rect(c,x-9,y-28+bob,18,23,'#ecceb1');rect(c,x-11,y-30+bob,22,4,'#fff0d8');rect(c,x-8,y-21+bob,16,6,'#a54e53');text(c,'+',x,y-40+bob,16,'#a1ffd6','center');}continue;}
   const e=a.type==='hero'?g.p:a.e,x=e.x-g.camera;if(x<-220||x>r.w+220)continue;const sc=a.type==='hero'?1.05:(e.elite?1.15:1);let alpha=e.hp<=0?Math.max(0,1-Math.max(0,(a.type==='hero'?e.deadT:e.timer)-1.7)/.7):1;
   const kind=a.type==='hero'?(g.playerKind||'hero'):e.kind,drawName=a.type==='hero'?Brawler.playerAnimation(g.playerKind,e.anim):e.anim;
   if(!e.entry||e.entry.route!=='sewer')this.shadow(c,kind,drawName,x,e.y,e.face,a.type==='hero'?e.animT:e.state==='dead'?e.timer:e.animT,e.animDuration,sc,e.z||0,alpha*(a.type==='hero'?.42:.32));
   if(a.type==='hero'){
    const blink=e.inv>0&&e.hp>0?(.78+.22*Math.sin(this.time*45)):1;this.sprite(c,g.playerKind||'hero',Brawler.playerAnimation(g.playerKind,e.anim),x,e.y-e.z,e.face,e.animT,e.animDuration,{alpha:blink,scale:sc});
    if(e.counter>0){c.strokeStyle='#9dffe2';c.lineWidth=2;c.beginPath();c.ellipse(x,e.y+4,41,11,0,0,7);c.stroke();}
   }else{
    let anim=e.anim,t=e.animT,dur=e.animDuration;
    if(e.state==='dead')t=e.timer;
    if(e.state==='hurt')t=e.timer;
    if(e.boss&&e.state==='attack'){t=e.timer;dur=e.move.duration;}
    if(e.state==='windup'||e.state==='attack'){if(e.kind==='bear'&&e.variant===1)anim='swipe';if(e.kind==='bear'&&e.variant===2)anim='overhead';if(e.kind==='bear'&&e.variant===3)anim='backhand';}
    c.save();if(e.entry?.route==='sewer'){c.beginPath();c.rect(x-180,-500,360,e.y+504);c.clip();}
    if(e.kind==='broadcast-rig')this.machine(c,e,x,e.y-(e.z||0),alpha);else this.sprite(c,e.kind,anim,x,e.y-(e.z||0)+(e.entryDepth||0),e.face,t,dur,{scale:sc,alpha});c.restore();
    if(e.entry?.route==='sewer'){c.strokeStyle='#607b81';c.lineWidth=4;c.beginPath();c.ellipse(x,e.y+2,54,13,0,0,Math.PI);c.stroke();}
    if(e.hp>0&&(!e.entry||e.targetable)){const hy=e.y-201*sc;rect(c,x-24,hy,48,4,'#101522');rect(c,x-24,hy,48*e.hp/e.maxHp,4,e.elite?'#ffb979':'#d697a2');if(e.state==='windup'){const t=clamp(e.timer/(e.move?.wind||Brawler.EINFO[e.kind].wind),0,1);c.save();c.globalAlpha=.14+t*.26;c.fillStyle='#ff845e';c.beginPath();c.ellipse(x+e.face*38,e.y,65,17,0,0,7);c.fill();c.restore();text(c,'!',x,hy-8,24,'#ffdb92','center',900);}}
   }
  }
  for(const o of g.projectiles||[]){const x=o.x-g.camera,y=o.y-(o.z||0);c.save();c.translate(x,y);if(!settings.reducedMotion)c.rotate((o.age||0)*14);if(o.kind==='signal'){c.fillStyle='#defff1';c.beginPath();c.arc(0,0,11,0,Math.PI*2);c.fill();c.strokeStyle='#94ffe1';c.lineWidth=3;c.beginPath();c.arc(0,0,17,0,Math.PI*2);c.stroke();for(let n=0;n<4;n++){const a=n*Math.PI/2;line(c,Math.cos(a)*19,Math.sin(a)*19,Math.cos(a)*25,Math.sin(a)*25,'#d7bbff',2);}}else{c.fillStyle='#e4d9c5';c.strokeStyle='#383b52';c.lineWidth=2;c.beginPath();c.arc(0,0,14,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#4b5267';for(let n=0;n<3;n++){const a=n*Math.PI*2/3;c.beginPath();c.arc(Math.cos(a)*7,Math.sin(a)*7,3,0,Math.PI*2);c.fill();}}c.restore();}
  for(const f of this.fx){f.t+=dt;const q=f.t/f.life,x=f.x-g.camera,y=f.y;c.save();c.globalAlpha=1-q;if(f.type==='hit'||f.type==='parry'||f.type==='block'){
    const rr=(f.heavy?18:11)*(1+q*1.8);c.translate(x,y);c.strokeStyle=f.color;c.lineWidth=f.heavy?4:2;for(let j=0;j<7;j++){const a=j/7*Math.PI*2;c.beginPath();c.moveTo(Math.cos(a)*rr*.5,Math.sin(a)*rr*.5);c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);c.stroke();}if(f.type==='parry')text(c,'PARRY',0,-40-q*10,14,f.color,'center',900);
   }else if(f.type==='slam'||f.type==='projectileImpact'){c.strokeStyle=f.type==='projectileImpact'?'#bcf9e1':'#ead3b7';c.lineWidth=3;c.beginPath();c.ellipse(x,y,20+q*50,4+q*8,0,0,7);c.stroke();}
   else if(f.type==='signalSweep'){line(c,x,y,x+(f.face||-1)*610,y,'#a7ffe1',5);line(c,x,y-9,x+(f.face||-1)*610,y-9,'#d5bbff',2);}
   else if(f.type==='pickup'){text(c,'+'+(f.heal||18),x,y-45-q*30,20,'#aaffda','center');}
   else if(f.type==='break'){for(let j=0;j<7;j++)rect(c,x+Math.sin(j*9)*q*58,y-20-q*45+q*q*65,4,7,'#ad9b87');}
   c.restore();}
  this.fx=this.fx.filter(f=>f.t<f.life);
  if(g.bannerT>0&&g.p.z===0&&!g.p.action){const t=Math.min(1,g.bannerT*2);c.save();c.globalAlpha=t;const bw=230;rect(c,(r.w-bw)/2,95,bw,30,'#101c30');text(c,g.banner,(r.w)/2,116,16,g.banner==='BLOCK CLEAR'?'#8ff0cf':'#ffe0b0','center',900);c.restore();}
  if(g.stageBanner>0&&g.p.z===0&&!g.p.action){const q=Math.min(1,g.stageBanner);c.save();c.globalAlpha=q;const x=r.w/2;rect(c,x-185,142,370,56,'#12172be6');text(c,STAGES[g.stage].sub,x,163,10,'#99b4c8','center',600);text(c,STAGES[g.stage].name.toUpperCase(),x,185,21,'#fff1d8','center',900);c.restore();}
  c.restore();}
}
root.CityRenderer=Renderer;
})(window);
