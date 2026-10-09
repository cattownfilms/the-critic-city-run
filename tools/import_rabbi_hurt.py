"""Append the supplied four-frame Sprite Forge Hurt; never repack old atlases."""
import argparse,hashlib,io,json,zipfile
from pathlib import Path
from PIL import Image
from import_v8_media import encode,jwrite
R=Path(__file__).resolve().parents[1];A=R/'assets'
p=argparse.ArgumentParser();p.add_argument('archive',type=Path);a=p.parse_args()
raw=a.archive.read_bytes();sha=hashlib.sha256(raw).hexdigest()
with zipfile.ZipFile(io.BytesIO(raw)) as z:
 data=json.loads(z.read('sprite-sheet.json'));action=data['layout']['actions'][0]
 assert action['id']=='hurt' and action['fps']==8 and action['frameCount']==4 and action['loopMode']=='one-shot'
 source=Image.open(io.BytesIO(z.read('sprite-sheet.png'))).convert('RGBA')
 m=json.loads((A/'sprites.json').read_text());assert 'hurt' not in m['characters']['pizzeria-boss'],'Already imported; preserve existing work'
 # All four baked 832px cells retain their shared pivot; one fixed .25 scale.
 scale=.25;cell=208;sheet=Image.new('RGBA',(cell*4,cell));frames=[];page=len(m['pages']);cleaned=0
 for n,f in enumerate(action['frames']):
  im=source.crop((f['x'],f['y'],f['x']+832,f['y']+832));pix=im.load()
  for y in range(832):
   for x in range(832):
    r,g,b,alpha=pix[x,y]
    if alpha and r>80 and b>55 and min(r,b)>g*1.8 and r<b*2.4:
     v=int(min(r,b)*.48);pix[x,y]=(v,v,v,alpha);cleaned+=1
  im=im.resize((cell,cell),Image.Resampling.LANCZOS);sheet.paste(im,(n*cell,0));frames.append(dict(p=page,x=n*cell,y=0,w=cell,h=cell,ox=-104,oy=-189.8,ms=125,canonicalFacing=1,sourceFrameId=f['id']))
 name='dependency/rabbi-sprite-forge-hurt.webp';encode(sheet,A/name)
 m['pages'].append(dict(file=name,width=832,height=208,bytes=(A/name).stat().st_size,bank='pizzeria-boss',group='gameplay',encoding='lossless WebP; registered Sprite Forge cells'))
 m['characters']['pizzeria-boss']['hurt']=dict(label='Hurt',loop=False,ms=500,canonicalFacing=1,frames=frames,sourceDescription='Creamy Scarf Sprite Forge; four frames / 8 FPS / one shot; fixed .25 scale')
 for group in ['gameplay','gallery','scenes']:
  if 'pizzeria-boss' in m.get('loading',{}).get(group,{}):m['loading'][group]['pizzeria-boss'].append(page)
 jwrite(A/'sprites.json',m)
 jwrite(R/'production/rabbi-hurt.json',dict(source=a.archive.name,sha256=sha,character='pizzeria-boss',action='hurt',fps=8,loop=False,sourceFrames=[f['id'] for f in action['frames']],scale=scale,pivot=[104,189.8],canonicalFacing=1,flip=False,cleanup='Existing Rabbi saturated-magenta neutralization rule; alpha preserved before uniform resampling',pixelsCorrected=cleaned,runtime=name,runtimeSHA256=hashlib.sha256((A/name).read_bytes()).hexdigest()))
 print(sha,name)
