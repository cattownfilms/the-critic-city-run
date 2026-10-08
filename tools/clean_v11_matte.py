"""Conservative Rabbi-only spill correction; original atlases remain immutable."""
import json,hashlib
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation
from import_v8_media import encode,jwrite
R=Path(__file__).resolve().parents[1];A=R/'assets'
m=json.loads((A/'sprites.json').read_text());assert not m.get('matteOverrides'),'Matte derivation already integrated';bank=m['characters']['pizzeria-boss'];pages={};regions={}
for action in bank.values():
 for f in action['frames']:regions.setdefault(f['p'],set()).add((f['x'],f['y'],f['w'],f['h']))
records=[]
for pi,crops in regions.items():
 old=m['pages'][pi]['file'];im=Image.open(A/old).convert('RGBA');arr=np.array(im);before=arr.copy();mask=np.zeros(arr.shape[:2],bool)
 for x,y,w,h in crops:
  c=arr[y:y+h,x:x+w];rgb=c[:,:,:3].astype(float);r,g,b=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2];alpha=c[:,:,3];edge=binary_dilation(alpha<80,iterations=2)
  mag=(r>80)&(b>55)&(np.minimum(r,b)>g*1.8)&(r<b*2.4)&(alpha>0)
  green=(g>r+20)&(g>b+15)&edge&(alpha>0)
  # Magenta spill on the sideburn becomes neutral dark hair, not a transparent hole.
  lum=np.minimum(r,b)*.48
  for ch in range(3):c[:,:,ch][mag]=lum[mag]
  c[:,:,1][green]=np.maximum(r,b)[green]
  mask[y:y+h,x:x+w]|=mag|green
 if not mask.any():continue
 name=f'dependency/v11-matte-rabbi-{pi}.webp';encode(Image.fromarray(arr),A/name)
 ni=len(m['pages']);m['pages'].append({**m['pages'][pi],'file':name,'bytes':(A/name).stat().st_size})
 m.setdefault('matteOverrides',{})[str(pi)]=ni
 records.append({'originalPage':pi,'derivedPage':ni,'originalFile':old,'file':name,'pixelsCorrected':int(mask.sum()),'originalSHA256':hashlib.sha256((A/old).read_bytes()).hexdigest(),'derivedSHA256':hashlib.sha256((A/name).read_bytes()).hexdigest(),'rule':'Rabbi crops only: saturated magenta to neutral hair; green edge channel limited to red/blue. Alpha and all other pixels unchanged.'})
# Loading groups include the derived runtime dependency pages.
for group in m.get('loadingGroups',{}).values():
 if isinstance(group,dict) and 'pages' in group:
  for rec in records:
   if rec['originalPage'] in group['pages'] and rec['derivedPage'] not in group['pages']:group['pages'].append(rec['derivedPage'])
sm=json.loads((A/'source-map.json').read_text());sm['v11MatteMap']='production/v11-matte.json';sm['currentRuntimePages']=m['pages'];jwrite(A/'source-map.json',sm)
jwrite(A/'sprites.json',m);jwrite(R/'production/v11-matte.json',{'character':'pizzeria-boss','records':records})
print('Derived matte pages',len(records),'corrected pixels',sum(r['pixelsCorrected'] for r in records))
