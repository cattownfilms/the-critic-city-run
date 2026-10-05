"""Bundle the exact source build into an offline HTML file, no CDN or network requests."""
from pathlib import Path
import json,base64,mimetypes
ROOT=Path(__file__).resolve().parents[1];A=ROOT/'assets'
meta=json.loads((A/'sprites.json').read_text());files=['title.png','icon.png','franklin-icon.png','theme.mp3','music-broadway.mp3','music-uptown.mp3','music-rooftops.mp3','music-theater.mp3']+[p['file'] for p in meta['pages']]+[p.name for p in sorted(A.glob('*.wav'))]
encoded={}
for name in files:
 mime=mimetypes.guess_type(name)[0] or 'application/octet-stream';encoded[name]='data:'+mime+';base64,'+base64.b64encode((A/name).read_bytes()).decode()
html=(ROOT/'index.html').read_text();html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+(ROOT/'style.css').read_text()+'</style>');html=html.replace('<link rel="manifest" href="manifest.webmanifest">','');html=html.replace('href="assets/icon.png"','href="'+encoded['icon.png']+'"')
for name in ['engine.js','render.js','config.js','gamepad.js','controller-ui.js','app.js']:
 s=(ROOT/name).read_text()
 if name=='config.js':s+='\nwindow.BRAWLER_ASSETS='+json.dumps({'sprites':meta,'files':encoded},separators=(',',':'))+';'
 html=html.replace('<script src="'+name+'"></script>','<script>'+s.replace('</script','<\\/script')+'</script>')
output=ROOT/'The-Critic-City-Brawler-v5.html';output.write_text(html);print(output,output.stat().st_size)
