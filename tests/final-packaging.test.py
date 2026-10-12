"""Byte parity and update-safe installation contract; never installs on the host."""
from pathlib import Path
import base64,gzip,hashlib,json,re
html=Path('The-Critic-Coming-Attractions-v11.html').read_bytes()
launcher=Path('The-Critic-Coming-Attractions-v11-Play.sh').read_bytes()
header,payload=launcher.split(b'\n__CRITIC_EMBEDDED_BRAWLER_V11__\n',1)
assert gzip.decompress(base64.b64decode(payload))==html
assert hashlib.sha256(html).hexdigest().encode() in header
assert b"HOST='127.0.0.1';PORT=8788" in header
assert b".local/share/cattown/critic-brawler" in header
assert b"index-before-v11.html" in header and b'tmp.replace(f)' in header
for name in ['app.js','engine.js','cutscenes.js','style.css','cutscenes.css','config.js']:
 assert Path(name).read_bytes() in html,name
for key in ['cattown.critic.brawler.v3.save','cattown.critic.brawler.v3.profile','cattown.critic.brawler.v2.settings']:
 assert key.encode() in html
Path('tests/final-packaging-results.json').write_text(json.dumps(dict(passed=True,htmlSHA256=hashlib.sha256(html).hexdigest(),launcherSHA256=hashlib.sha256(launcher).hexdigest(),origin='http://127.0.0.1:8788/'),indent=2))
print('PASS standalone embeds, launcher payload/hash, atomic update/backup, stable origin and save keys')
