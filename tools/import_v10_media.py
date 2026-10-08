#!/usr/bin/env python3
"""Append reviewed supplemental performances; never rewrite original atlases/actions.

Input is the full-resolution frame directory produced from the original 24fps
reels. Source files stay outside the repository. A filename discrepancy is
recorded explicitly rather than silently changing the original filename.
"""
from pathlib import Path
import argparse,copy,hashlib,json,subprocess
import numpy as np
from scipy import ndimage
from PIL import Image
from import_v8_media import encode,jwrite
ROOT=Path(__file__).resolve().parents[1]
CLIPS={'spike':'63060a9c-5403-4844-ac8f-a814b819e403','duke':'df8d7ed2-e798-410c-bdfb-ba0966676917','hero':'86c2f815-af99-496a-b263-2063835597dc','franklin':'455b9939-e04e-4754-8aad-9d82f3ea8971'}
# Hand-reviewed chronological pose selections, not blanket fixed-rate sampling.
ACTIONS={
 'spike':{
  'v10-walk':([3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33],True,'gameplay',1),
  'v10-can-windup':([48,52,56,60,64,68,72,75,77,78,79,80],False,'gameplay',1),
  'v10-can-release':([81,82,84,86,88,90,92,94,96],False,'gameplay',1),
  'v10-strong-release':([118,121,124,127,130,132,134,136,137,139,141,144,148],False,'optional',1),
  'v10-backoff':([162,164,166,168,169,170,175,177,180,183],False,'gameplay',1),
  'v10-recoil':([201,202,204,207,211,215,219,222,225,228],False,'gameplay',1)},
 'duke':{
  'v10-button':([8,10,12,13,14,16,18,20,23,26,29,33],False,'scene',1),
  'v10-shoulder':([45,46,48,49,50,52,54,56,58,60,62,64,67],False,'gameplay',1),
  'v10-backhand':([72,74,76,78,80,81,89,91,94,97,100,102],False,'gameplay',1),
  'v10-one-two':([104,106,108,111,112,113,114,117,118,119,120],False,'gameplay',1),
  'v10-flurry':([120,122,123,126,128,130,133,135,137,140,142,144],False,'gameplay',1),
  'v10-retreat':([145,147,149,151,153,155,157,159,161,163,165,167],True,'gameplay',1),
  'v10-defeat':([176,180,184,188,192,196,198,200,202,204,206,208,210,212,214,218,225,239],False,'gameplay',1)},
 'hero':{
  'v10-run-in':([9,10,13,14,15,16,17,18,19,20,21],False,'scene',1),
  'v10-stop':([22,24,26,28,30,32],False,'scene',1),
  'v10-point':([49,50,51,52,54,57,60,64,68,71],False,'scene',1),
  'v10-fall':([96,98,100,103,106,109,110,112,114,116,119,122,128,136],False,'gameplay',1),
  'v10-recover':([138,140,142,145,147,149,151,153,155,157,159,161,164,170],False,'gameplay',1),
  'v10-reunion':([180,182,184,186,188,191,194,198,204,212,226],False,'scene',1)},
 'franklin':{
  'v10-run-in':([1,3,5,7,9,11,13,15,17,19],True,'scene',1),
  'v10-stop':([20,22,24,26,28,30,32,34],False,'scene',1),
  'v10-point':([47,48,49,50,52,55,59,64,72,82],False,'scene',-1),
  'v10-fall':([98,99,100,101,102,103,104,105,106,108,110,112,114,116,120,130],False,'gameplay',1),
  'v10-recover':([137,139,140,142,144,146,148,150,152,154,158,162],False,'gameplay',1),
  'v10-victory':([180,182,184,186,188,190,194,200,212,226],False,'scene',1)}
}
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--rebuild-derived',action='store_true');ap.add_argument('--scratch',type=Path,required=True);ap.add_argument('--sources',type=Path,required=True);a=ap.parse_args()
 assets=ROOT/'assets';m=json.loads((assets/'sprites.json').read_text());base=copy.deepcopy(m)
 if a.rebuild_derived:
  original=json.loads(subprocess.check_output(['git','show','ba087d21a1699ffec1fd923d17a18b796ae37ab6:assets/sprites.json'],cwd=ROOT))
  for bank,actions in original['characters'].items():
   for name,data in actions.items():assert m['characters'][bank][name]==data
  assert m['pages'][:len(original['pages'])]==original['pages'];m=original;base=copy.deepcopy(m)
 assert not any(k.startswith('v10-') for b in m['characters'].values() for k in b),'Already imported; preserve current source'
 probes=json.loads((a.scratch/'source-probes.json').read_text());records=[];catalog=[];newpages=[]
 for bank,clip in CLIPS.items():
  raw=a.sources/(clip+'.mp4');probe=next(p for p in probes if p['filename']==raw.name);assert hashlib.sha256(raw.read_bytes()).hexdigest()==probe['sha256']
  scale=(186/453 if bank=='hero' else (196 if bank=='franklin' else 186)/572);cache={}
  def derive(index):
   if index in cache:return cache[index]
   rgb=np.array(Image.open(a.scratch/'frames'/clip/f'{index:04d}.png').convert('RGB')).astype(np.float32);r,g,b=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2];dom=g-np.maximum(r,b)
   candidate=(g>70)&(dom>12);seed=np.zeros(candidate.shape,dtype=bool);seed[0,:]=candidate[0,:];seed[-1,:]=candidate[-1,:];seed[:,0]=candidate[:,0];seed[:,-1]=candidate[:,-1];background=ndimage.binary_propagation(seed,mask=candidate)
   background|=(dom>70)&(g>r*1.5)&(g>b*1.5)
   alpha=np.where(background,np.clip((45-dom)*255/33,0,255),255).astype('uint8')
   if bank=='hero':alpha[(np.indices(alpha.shape)[0]>630)&(np.min(rgb,axis=2)>185)&((np.max(rgb,axis=2)-np.min(rgb,axis=2))<35)]=0
   labels,n=ndimage.label(alpha>120);sizes=np.bincount(labels.ravel());sizes[0]=0;body=sizes.argmax();selected=ndimage.binary_dilation(labels==body,iterations=2)
   # Detached cans/dust are independent props; the body remains the largest object.
   alpha[~selected]=0
   spill=background&(dom>8)&(g>70);rgb[:,:,1][spill]=np.minimum(g[spill],np.maximum(r,b)[spill]+8)
   ys,xs=np.where(alpha>120);root=float(np.median(xs));rgba=np.dstack((np.clip(rgb,0,255).astype('uint8'),alpha));rgba[alpha==0,:3]=0;im=Image.fromarray(rgba);bounds=im.getchannel('A').getbbox();left,top,right,bottom=bounds
   im=im.crop(bounds).convert('RGBa').resize((round((right-left)*scale),round((bottom-top)*scale)),Image.Resampling.LANCZOS).convert('RGBA')
   frame=dict(w=im.width,h=im.height,ox=round((left-root)*scale,3),oy=round((top-662)*scale,3),contactX=0,contactY=0,sourceClip=raw.name,sourceFrame=index)
   detail=dict(source=raw.name,sourceSHA256=probe['sha256'],sourceFrame=index,sourceSeconds=index/24,sourceBounds=list(bounds),sourcePivot=[root,662],fixedScale=scale,flip=False,cleanup='Float chroma alpha ramp; edge-connected soft key plus saturated enclosed-green key; green costume retained; source dust removed from Jay floor; largest connected actor; detached props excluded',registration='Fixed clip scale and floor 662; horizontal median actor pivot removes baked travel; aerial displacement preserved',decodedRuntimeSHA256=hashlib.sha256(im.tobytes()).hexdigest())
   cache[index]=(im,frame,detail);return cache[index]
  for name,(indices,loop,category,facing) in ACTIONS[bank].items():
   # A separate compact lossless atlas for each action avoids repacking old banks.
   frames=[];tiles=[];x=y=3;rowh=0;width=1024;plate=Image.new('RGBA',(1024,1024))
   for pos,index in enumerate(indices):
    im,fr,detail=derive(index)
    if x+im.width+3>width:y+=rowh+3;x=3;rowh=0
    assert y+im.height<1024,(bank,name,index,im.size,y)
    frame=dict(fr,p=len(m['pages']),x=x,y=y,ms=round((indices[pos+1]-index if pos+1<len(indices) else 2)*1000/24))
    plate.paste(im,(x,y));x+=im.width+3;rowh=max(rowh,im.height);frames.append(frame);records.append(dict(detail,bank=bank,action=name,runtimeFrame=pos,category=category,canonicalFacing=facing,runtimeRect={k:frame[k] for k in ['p','x','y','w','h']},ox=frame['ox'],oy=frame['oy']))
   dest=assets/'dependency'/f'{name}-{bank}.webp';encode(plate.crop((0,0,width,y+rowh+3)),dest)
   page=dict(file=str(dest.relative_to(assets)),width=width,height=y+rowh+3,bytes=dest.stat().st_size,bank=bank,group=category,encoding='source-derived lossless WebP; fixed clip scale')
   m['pages'].append(page);newpages.append(str(dest.relative_to(ROOT)))
   m['characters'][bank][name]=dict(label=name.replace('-',' ').title(),frames=frames,ms=sum(f['ms'] for f in frames),loop=loop,canonicalFacing=facing,original=True,sourceDescription='Reviewed supplemental Flow take; manual chronological pose selection, fixed scale and ground; engine owns world travel.',groundedDefeat=name=='v10-defeat')
   catalog.append(dict(character=bank,action=name,filename=raw.name,sourceRange=[indices[0],indices[-1]],seconds=[indices[0]/24,indices[-1]/24],frames=indices,category=category,scale=scale,pixelFlip=False,rendererFacing=facing,runtimeUsage=name))
 for bank,actions in m['characters'].items():
  loader=m['loading'];new=[(name,data) for name,data in actions.items() if name.startswith('v10-')]
  for name,data in new:loader['actions'].setdefault(bank,{})[name]=sorted({f['p'] for f in data['frames']})
  ids=[f['p'] for _,data in new for f in data['frames']]
  for section in ['gallery','gameplay','scenes']:loader[section][bank]=sorted(set(loader[section].get(bank,[])+ids))
  for category in ['gameplay','scene','optional']:
   ids=[f['p'] for n,data in new if ACTIONS[bank][n][2]==category for f in data['frames']];loader['groups'].setdefault(bank,{}).setdefault(category,[]);loader['groups'][bank][category]=sorted(set(loader['groups'][bank][category]+ids))
  m['counts'][bank]={'actions':len(actions),'frames':sum(len(d['frames']) for d in actions.values())}
 m['uniqueCrops']=len({(f['p'],f['x'],f['y'],f['w'],f['h']) for bank in m['characters'].values() for d in bank.values() for f in d['frames']});m['revision']='v10 reviewed supplemental performances appended to v9'
 assert m['pages'][:len(base['pages'])]==base['pages']
 for bank,actions in base['characters'].items():
  for name,data in actions.items():assert m['characters'][bank][name]==data
 jwrite(assets/'sprites.json',m)
 sm=json.loads((assets/'source-map.json').read_text());sm['v10FrameDerivatives']=records;sm['v10ProductionMap']='production/v10-assets.json';sm['currentRuntimePages']=m['pages'];sm['currentRevision']=m['revision'];sm['currentFrameReferences']=sum(c['frames'] for c in m['counts'].values());jwrite(assets/'source-map.json',sm)
 jwrite(ROOT/'production/v10-assets.json',dict(schemaVersion=1,baselineCommit='ba087d21a1699ffec1fd923d17a18b796ae37ab6',sourceVideos=probes,filenameDiscrepancy={'requested':'df8d7ed2-e798-410c-bdfb-ba096667b917.mp4','present':CLIPS['duke']+'.mp4','disposition':'Matching Duke supplemental performance inspected; actual filename retained; no original renamed'},review='All 240 frames in each reel inspected in chronological contact sheets; originals untouched',actions=catalog,frameDerivatives=records,projectileSourceCenterAtRelease={'filename':CLIPS['spike']+'.mp4','sourceFrame':81,'sourceCenter':[839,512],'sourcePivot':[656,662],'fixedScale':186/572,'faceRelativeX':(839-656)*186/572,'heightAboveGround':(662-512)*186/572,'release':'first detached frame; actor mask omits can, engine owns travel'},rejections=['Jay frames 1-8: clipped entry; old run remains the gameplay locomotion bank','Duke backhand frames 82-88: broad white smear obscures torso; clean surrounding poses selected','Spike detached rolling travel omitted from actor; existing independent Trash Can retained','Long identical holds and source transition gaps excluded'],preservedUnused=['Spike alternate stronger release: optional/gallery; not a new mechanic'],baselinePageSHA256={p['file']:hashlib.sha256((assets/p['file']).read_bytes()).hexdigest() for p in base['pages']},newPages=newpages))
 print('Appended',len(catalog),'actions;',len(records),'reviewed poses;',len(newpages),'atlases')
if __name__=='__main__':main()
