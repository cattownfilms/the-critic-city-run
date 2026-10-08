#!/usr/bin/env python3
"""Import only the three hash-verified v11 takes; append to the reviewed v10 banks."""
from pathlib import Path
import argparse,copy,hashlib,json
import numpy as np
from scipy import ndimage
from PIL import Image
from import_v8_media import encode,jwrite
ROOT=Path(__file__).resolve().parents[1]
# Chronological selections reviewed across all 577 original frames.
TAKES=[('230c230e-cb83-4b1a-8161-1f972526a463.mp4','duke','e23d0d7a5533084a66ed3ee6f32a260a4e77795e5b7ced984277fdf1b5d7a324',186/572),('2c15e195-b3c2-4f23-a395-79124eb77d54.mp4','duke','439ca8c29ee8dc60d77eef50674281b72c7114e148eb84dda7fc780054e64901',186/572),('output (8).mp4','marty','c7356dbe6fb6fe5ea86c4af5315c7a2b1906d3183a322cd1d4a47714897238c7',142/572)]
ACTIONS=[
 (1,'v11-cart-push',[28,30,32,34,37,40,43,46,49,52,54,57,60,63,66,69],True,'cutscene'),
 (1,'v11-cart-stop',[80,82,85,88,91,94,98,102,106],False,'cutscene'),
 (1,'v11-cart-pull',[125,128,131,134,137,140,143,146,149,152,156,160,164,168,172,176],True,'preserved-unused'),
 (1,'v11-cart-adjust',[108,110,113,116,119,122],False,'preserved-unused'),
 (1,'v11-cart-release',[199,202,205,208,211,214,217,220,223,226],False,'cutscene'),
 (2,'v11-cautious-retreat',[32,35,38,41,44,47,50,53,56,59,62,65,68,71,74],True,'gameplay'),
 (2,'v11-confrontation',[174,177,180,183,186,190,194,198,202],True,'cutscene'),
 (3,'v11-worried-look',[0,3,6,9,12,15,18,21,24,27,30,33,36,40,44,48],False,'cutscene'),
 (3,'v11-captive-idle',[49,53,57,61,65,69,73,77,81,85,89,93,96],True,'cutscene')]
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--scratch',type=Path,required=True);ap.add_argument('--sources',type=Path,required=True);args=ap.parse_args();assets=ROOT/'assets';m=json.loads((assets/'sprites.json').read_text());base=copy.deepcopy(m)
 assert not any(n.startswith('v11-') for b in m['characters'].values() for n in b)
 probes=json.loads((args.scratch/'source-probes.json').read_text());records=[];catalog=[];pages=[];cache={}
 for i,(filename,bank,sha,scale) in enumerate(TAKES,1):
  assert hashlib.sha256((args.sources/filename).read_bytes()).hexdigest()==sha
  next(p for p in probes if p['filename']==filename)['character']=bank
  for take,name,indices,loop,category in ACTIONS:
   if take!=i:continue
   plate=Image.new('RGBA',(1024,1024));x=y=3;rowh=0;frames=[]
   for pos,index in enumerate(indices):
    rgb=np.array(Image.open(args.scratch/'frames'/str(i)/f'{index:04d}.png').convert('RGB')).astype(np.float32);r,g,b=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2];dom=g-np.maximum(r,b);candidate=(g>70)&(dom>12);seed=np.zeros(candidate.shape,bool);seed[0,:]=candidate[0,:];seed[-1,:]=candidate[-1,:];seed[:,0]=candidate[:,0];seed[:,-1]=candidate[:,-1];bg=ndimage.binary_propagation(seed,mask=candidate);bg|=(dom>70)&(g>r*1.5)&(g>b*1.5);alpha=np.where(bg,np.clip((45-dom)*255/33,0,255),255).astype('uint8');labels,n=ndimage.label(alpha>120);sizes=np.bincount(labels.ravel());sizes[0]=0;alpha[~ndimage.binary_dilation(labels==sizes.argmax(),iterations=2)]=0
    spill=bg&(dom>8);rgb[:,:,1][spill]=np.minimum(g[spill],np.maximum(r,b)[spill]+8)
    yy,xx=np.indices(alpha.shape);body=(alpha>120)&(yy>500)&(yy<640);root=float(np.median(xx[body]));floor=662
    skin=(alpha>120)&(yy>200)&(yy<400)&(xx>root)&(r>g*1.07)&(g>b*1.12);hand=None
    if bank=='duke' and take==1 and skin.any():
     hx=np.percentile(xx[skin],98);near=skin&(xx>hx-12);hand={'x':round((float(np.median(xx[near]))-root)*scale,3),'y':round((float(np.median(yy[near]))-floor)*scale,3)}
    rgba=np.dstack((rgb.clip(0,255).astype('uint8'),alpha));rgba[alpha==0,:3]=0;im=Image.fromarray(rgba);bounds=im.getchannel('A').getbbox();left,top,right,bottom=bounds;im=im.crop(bounds).convert('RGBa').resize((round((right-left)*scale),round((bottom-top)*scale)),Image.Resampling.LANCZOS).convert('RGBA')
    if x+im.width+3>1024:y+=rowh+3;x=3;rowh=0
    assert y+im.height<1024
    fr=dict(p=len(m['pages']),x=x,y=y,w=im.width,h=im.height,ox=round((left-root)*scale,3),oy=round((top-floor)*scale,3),ms=round((indices[pos+1]-index if pos+1<len(indices) else 3)*1000/24),contactX=0,contactY=0,sourceClip=filename,sourceFrame=index)
    if hand:fr['handContact']=hand
    plate.paste(im,(x,y));frames.append(fr);records.append(dict(character=bank,action=name,source=filename,sha256=sha,sourceFrame=index,sourceSeconds=index/24,scale=scale,pivot=[root,floor],facing=1,flip=False,runtimeFrame=pos,rect={k:fr[k] for k in ['p','x','y','w','h']},decodedSHA256=hashlib.sha256(im.tobytes()).hexdigest(),handContact=hand));x+=im.width+3;rowh=max(rowh,im.height)
   dest=assets/'dependency'/f'{name}-{bank}.webp';encode(plate.crop((0,0,1024,y+rowh+3)),dest);m['pages'].append(dict(file=str(dest.relative_to(assets)),width=1024,height=y+rowh+3,bytes=dest.stat().st_size,bank=bank,group=category,encoding='source-derived lossless WebP'));pages.append(str(dest.relative_to(ROOT)));m['characters'][bank][name]=dict(label=name.replace('-',' ').title(),frames=frames,ms=sum(f['ms'] for f in frames),loop=loop,canonicalFacing=1,original=True,sourceDescription='V11 manually reviewed source poses; fixed scale, grounded pivot; engine owns translation. No prop baked into Duke.')
   ids=[len(m['pages'])-1];loader=m['loading'];loader['actions'].setdefault(bank,{})[name]=ids
   for section in ['gallery','gameplay','scenes']:loader[section][bank]=sorted(set(loader[section].get(bank,[])+ids))
   loader['groups'].setdefault(bank,{}).setdefault(category,[]).extend(ids)
   catalog.append(dict(character=bank,action=name,filename=filename,frames=indices,range=[indices[0],indices[-1]],seconds=[indices[0]/24,indices[-1]/24],category=category,scale=scale,pivot='horizontal lower-body median; fixed source floor 662',flip=False,facing=1,runtimeUsage=name,propFree=bank=='duke'))
 for bank,actions in m['characters'].items():m['counts'][bank]={'actions':len(actions),'frames':sum(len(d['frames']) for d in actions.values())}
 m['uniqueCrops']=len({(f['p'],f['x'],f['y'],f['w'],f['h']) for b in m['characters'].values() for d in b.values() for f in d['frames']});m['revision']='v11 Duke mime, cautious retreat and Marty reactions appended to v10';jwrite(assets/'sprites.json',m)
 sm=json.loads((assets/'source-map.json').read_text());sm.update(v11ProductionMap='production/v11-assets.json',v11FrameDerivatives=records,currentRuntimePages=m['pages'],currentRevision=m['revision'],currentFrameReferences=sum(c['frames'] for c in m['counts'].values()));jwrite(assets/'source-map.json',sm)
 jwrite(ROOT/'production/v11-assets.json',dict(schemaVersion=1,baselineCommit='8757424f41b7f7cc9a3eebaa927298473988d56b',sourceVideos=probes,uniqueSourceCount=3,review='All 577 source frames reviewed chronologically, plus full-resolution action samples; no attachment aliases or unrelated videos ingested.',cleanup='Float chroma alpha ramp; edge-connected background and saturated enclosed green; conservative spill suppression; largest connected actor; no global red/pink removal',actions=catalog,frameDerivatives=records,newPages=pages,baselinePageSHA256={p['file']:hashlib.sha256((assets/p['file']).read_bytes()).hexdigest() for p in base['pages']},rejectedRanges=[{'take':1,'ranges':[[0,27],[70,79],[177,198],[227,239]],'reason':'Preparation, redundant gait repetitions or idle tails; retained in original source'}, {'take':2,'ranges':[[0,31],[75,173],[203,239]],'reason':'Redundant guard/backstep repetitions; strongest single retreat selected; no new attack inferred'}, {'take':3,'ranges':[],'reason':'No new locomotion/release present; two restrained reaction/idle segments only'}],preservedUnused=['v11-cart-adjust','v11-cart-pull'],comparison='Keep v10 Duke attacks/defeat, existing Marty run/reunion; new source replaces only cautious retreat and adds prop-free cart performance.'))
 print('Appended',len(catalog),'actions',len(records),'poses',len(pages),'pages')
if __name__=='__main__':main()
