"""Bundle the authoring source and complete runtime dependencies for offline play."""
from pathlib import Path
import argparse, json, base64, mimetypes
ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--output', default='The-Critic-Coming-Attractions-v6.html')
args = parser.parse_args()
A = ROOT / 'assets'
meta = json.loads((A / 'sprites.json').read_text())
encoded = {}
for path in sorted(A.rglob('*')):
    if path.is_file() and path.suffix.lower() in {'.png', '.webp', '.jpg', '.jpeg', '.mp3', '.wav'}:
        mime = mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
        encoded[path.relative_to(A).as_posix()] = 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode()
html = (ROOT / 'index.html').read_text()
for name in ['style.css', 'cutscenes.css']:
    html = html.replace('<link rel="stylesheet" href="' + name + '">', '<style>' + (ROOT / name).read_text() + '</style>')
html = html.replace('<link rel="manifest" href="manifest.webmanifest">', '')
html = html.replace('href="assets/icon.png"', 'href="' + encoded['icon.png'] + '"')
for name in ['data/campaign.js', 'engine.js', 'render.js', 'config.js', 'gamepad.js', 'controller-ui.js', 'data/cutscenes.js', 'cutscenes.js', 'app.js']:
    code = (ROOT / name).read_text()
    if name == 'config.js':
        code += '\nwindow.BRAWLER_ASSETS=' + json.dumps({'sprites': meta, 'files': encoded}, separators=(',', ':')) + ';'
    html = html.replace('<script src="' + name + '"></script>', '<script>' + code.replace('</script', '<\\/script') + '</script>')
output = ROOT / args.output
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(html)
print(output, output.stat().st_size)
