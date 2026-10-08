"""Append-only source provenance and supplemental pixel/registration contract."""
from pathlib import Path
import hashlib,json,subprocess,unittest
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
class SupplementalAssets(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.meta=json.loads((ROOT/'assets/sprites.json').read_text());cls.record=json.loads((ROOT/'production/v10-assets.json').read_text())
 def test_original_pages_and_actions_preserved(self):
  old=json.loads(subprocess.check_output(['git','show',self.record['baselineCommit']+':assets/sprites.json'],cwd=ROOT))
  self.assertEqual(self.meta['pages'][:len(old['pages'])],old['pages'])
  for bank,actions in old['characters'].items():
   for name,data in actions.items():self.assertEqual(self.meta['characters'][bank][name],data)
  for name,sha in self.record['baselinePageSHA256'].items():self.assertEqual(hashlib.sha256((ROOT/'assets'/name).read_bytes()).hexdigest(),sha)
 def test_provenance_and_pixels_resolve(self):
  self.assertEqual(len(self.record['sourceVideos']),4);self.assertEqual(len(self.record['actions']),25)
  pages={}
  for d in self.record['frameDerivatives']:
   f=self.meta['characters'][d['bank']][d['action']]['frames'][d['runtimeFrame']]
   self.assertEqual(f['sourceFrame'],d['sourceFrame']);self.assertEqual(d['sourcePivot'][1],662);self.assertFalse(d['flip'])
   if f['p'] not in pages:pages[f['p']]=Image.open(ROOT/'assets'/self.meta['pages'][f['p']]['file']).convert('RGBA')
   crop=pages[f['p']].crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h']))
   self.assertEqual(hashlib.sha256(crop.tobytes()).hexdigest(),d['decodedRuntimeSHA256'])
   self.assertTrue(crop.getchannel('A').getbbox())
  for action in self.record['actions']:
   self.assertEqual(action['frames'],sorted(set(action['frames'])))
   self.assertEqual(action['sourceRange'],[action['frames'][0],action['frames'][-1]])
 def test_release_frame_is_not_baked_projectile_travel(self):
  bank=self.meta['characters']['spike'];self.assertEqual(bank['v10-can-windup']['frames'][-1]['sourceFrame'],80)
  self.assertEqual(bank['v10-can-release']['frames'][0]['sourceFrame'],81)
  self.assertEqual(self.record['projectileSourceCenterAtRelease']['sourceFrame'],81)
 def test_no_source_video_in_public_manifest(self):
  files=json.loads((ROOT/'PUBLIC-FILES.json').read_text())['sha256'];self.assertFalse(any(n.lower().endswith('.mp4') for n in files))
if __name__=='__main__':unittest.main()
