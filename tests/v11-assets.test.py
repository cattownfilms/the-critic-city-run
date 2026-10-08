from pathlib import Path
import hashlib,json,subprocess,unittest
from PIL import Image
R=Path(__file__).resolve().parents[1]
class V11Assets(unittest.TestCase):
 def test_sources_and_old_banks(self):
  m=json.loads((R/'assets/sprites.json').read_text());p=json.loads((R/'production/v11-assets.json').read_text());old=json.loads(subprocess.check_output(['git','show',p['baselineCommit']+':assets/sprites.json'],cwd=R))
  self.assertEqual(len(p['sourceVideos']),3);self.assertEqual(len({x['sha256'] for x in p['sourceVideos']}),3)
  for b,actions in old['characters'].items():
   for n,a in actions.items():self.assertEqual(m['characters'][b][n],a)
  for f,sha in p['baselinePageSHA256'].items():self.assertEqual(hashlib.sha256((R/'assets'/f).read_bytes()).hexdigest(),sha)
  for d in p['frameDerivatives']:
   f=m['characters'][d['character']][d['action']]['frames'][d['runtimeFrame']];im=Image.open(R/'assets'/m['pages'][f['p']]['file']).convert('RGBA');crop=im.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h']));self.assertEqual(hashlib.sha256(crop.tobytes()).hexdigest(),d['decodedSHA256']);self.assertFalse(d['flip']);self.assertEqual(d['pivot'][1],662)
 def test_matte_is_derived_and_preserves_alpha(self):
  m=json.loads((R/'assets/sprites.json').read_text());p=json.loads((R/'production/v11-matte.json').read_text())
  for r in p['records']:
   old=R/'assets'/r['originalFile'];new=R/'assets'/r['file'];self.assertEqual(hashlib.sha256(old.read_bytes()).hexdigest(),r['originalSHA256']);self.assertEqual(hashlib.sha256(new.read_bytes()).hexdigest(),r['derivedSHA256']);self.assertEqual(m['matteOverrides'][str(r['originalPage'])],r['derivedPage']);self.assertEqual(Image.open(old).getchannel('A').tobytes(),Image.open(new).getchannel('A').tobytes());self.assertGreater(r['pixelsCorrected'],0)
if __name__=='__main__':unittest.main()
