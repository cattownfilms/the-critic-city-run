"""Bundle the authoring source and complete runtime dependencies for offline play."""
from pathlib import Path
import argparse, json, base64, mimetypes, subprocess, re
ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--output', default='The-Critic-Coming-Attractions-v7.html')
args = parser.parse_args()
A = ROOT / 'assets'
meta = json.loads((A / 'sprites.json').read_text())
# Historical atlases and retired illustrations remain source/provenance material.
# The standalone edition embeds every current playable and optional-gallery dependency once.
required = {page['file'] for page in meta['pages']}
required.update(path.name for path in A.iterdir() if path.suffix.lower() in {'.png', '.mp3', '.wav'})
scene_images = json.loads(subprocess.check_output(['node', '-e', "const d=require('./data/cutscenes.js');const m=require('./assets/sprites.json');console.log(JSON.stringify([...new Set(Object.keys(d.scenes).flatMap(id=>['hero','franklin'].flatMap(route=>d.dependencies(id,route,m).images)))]));"], cwd=ROOT))
required.update(scene_images)
# Environments and runtime projection art have their own rendering dependencies.
required.update(path.relative_to(A).as_posix() for path in (A/'environments').glob('*.webp'))
required.update(path.relative_to(A).as_posix() for path in (A/'story').glob('*-pixel.webp'))
encoded = {}
for name in sorted(required):
    path = A/name
    if not path.is_file():
        raise FileNotFoundError('Missing runtime dependency: '+name)
    mime = mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
    encoded[name] = 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode()
html = (ROOT / 'index.html').read_text()
for name in ['style.css', 'cutscenes.css']:
    html = re.sub(r'<link rel="stylesheet" href="'+re.escape(name)+r'(?:\?[^"]*)?">', lambda match: '<style>'+(ROOT/name).read_text()+'</style>', html)
html = html.replace('<link rel="manifest" href="manifest.webmanifest">', '')
html = html.replace('href="assets/icon.png"', 'href="' + encoded['icon.png'] + '"')
for name in ['data/campaign.js', 'engine.js', 'render.js', 'config.js', 'gamepad.js', 'controller-ui.js', 'data/cutscenes.js', 'cutscenes.js', 'app.js']:
    code = (ROOT / name).read_text()
    if name == 'config.js':
        code += '\nwindow.BRAWLER_ASSETS=' + json.dumps({'sprites': meta, 'files': encoded}, separators=(',', ':')) + ';'
    html = re.sub(r'<script src="'+re.escape(name)+r'(?:\?[^"]*)?"></script>', lambda match: '<script>'+code.replace('</script', '<\\/script')+'</script>', html)
if re.search(r'<script[^>]+src=|<link[^>]+rel="stylesheet"', html):
    raise RuntimeError('Standalone still contains an external script or stylesheet dependency.')
output = ROOT / args.output
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(html)
print(output, output.stat().st_size)
