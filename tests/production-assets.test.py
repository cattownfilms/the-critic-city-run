#!/usr/bin/env python3
"""Verify source identity, atlas integrity, alpha safety, and baseline preservation."""
import hashlib
import json
from pathlib import Path
import unittest

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class ProductionAssets(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.meta = json.loads((ROOT / 'assets/sprites.json').read_text())
        cls.provenance = json.loads((ROOT / 'production/new-assets.json').read_text())
        cls.images = {}
        for index, page in enumerate(cls.meta['pages']):
            if index >= cls.provenance['baselinePagesPreserved']:
                cls.images[index] = Image.open(ROOT / 'assets' / page['file']).convert('RGBA')

    def test_accepted_baseline_banks_and_decoded_assets_are_untouched(self):
        for kind, expected in self.provenance['baselineBankSHA256'].items():
            bank = self.meta['characters'][kind]
            actual = hashlib.sha256(json.dumps(bank, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
            self.assertEqual(actual, expected, kind)
        for filename, expected in self.provenance['baselinePageSHA256'].items():
            self.assertEqual(sha(ROOT / 'assets' / filename), expected, filename)

    def test_character_identity_matches_reference_roles(self):
        banks = {bank['bank']: bank for bank in self.provenance['banks']}
        self.assertEqual(banks['pizzeria-boss']['canonicalSourceName'], 'Cream Scarf')
        self.assertEqual(banks['marty']['canonicalSourceName'], 'Red Pullover')
        self.assertEqual(banks['duke']['canonicalSourceName'], 'Blue Polo')
        self.assertNotIn('booth-enforcer', self.meta['characters'])
        self.assertEqual(self.meta['characters']['pizzeria-boss']['opposite-strike']['canonicalFacing'], -1)
        for kind in ('duke', 'marty'):
            self.assertIn('Contextual story character only', banks[kind]['limitations'])

    def test_provenance_hashes_match_every_shipped_derived_file(self):
        hashes = self.provenance['runtimeSHA256']
        self.assertGreaterEqual(len(hashes), 6)
        for filename, expected in hashes.items():
            self.assertRegex(expected, r'^[0-9a-f]{64}$')
            self.assertEqual(sha(ROOT / filename), expected, filename)
        for source in self.provenance['suppliedSourceInventory']:
            self.assertRegex(source['sha256'], r'^[0-9a-f]{64}$')
            self.assertGreater(source['bytes'], 0)
        for bank in self.provenance['banks']:
            self.assertRegex(bank['sourceSHA256'], r'^[0-9a-f]{64}$')
        self.assertFalse(any(path.suffix.lower() in ('.mp4', '.zip', '.canvas') for path in (ROOT / 'assets').rglob('*')))

    def test_new_atlas_dimensions_alpha_and_download_budget(self):
        for index, image in self.images.items():
            page = self.meta['pages'][index]
            self.assertEqual(image.size, (page['width'], page['height']))
            self.assertLessEqual(page['width'], 1024)
            self.assertLessEqual(page['height'], 1024)
            self.assertLess(page['bytes'], 1024 * 1024)
            self.assertEqual((ROOT / 'assets' / page['file']).stat().st_size, page['bytes'])
            self.assertEqual(image.getchannel('A').getextrema(), (0, 255))

    def test_every_frame_duration_crop_and_padding_is_valid(self):
        checked = 0
        for entry in self.provenance['banks']:
            kind = entry['bank']
            bank = self.meta['characters'][kind]
            for name, action in bank.items():
                self.assertGreater(action['ms'], 0, (kind, name))
                self.assertEqual(action['ms'], sum(frame['ms'] for frame in action['frames']))
                for frame in action['frames']:
                    image = self.images[frame['p']]
                    x, y, width, height = (frame[key] for key in ('x', 'y', 'w', 'h'))
                    self.assertGreater(frame['ms'], 0)
                    self.assertGreaterEqual(x, 2)
                    self.assertGreaterEqual(y, 2)
                    self.assertLessEqual(x + width + 2, image.width)
                    self.assertLessEqual(y + height + 2, image.height)
                    alpha = image.getchannel('A')
                    for crop in ((x - 2, y, x, y + height), (x, y - 2, x + width, y), (x + width, y, x + width + 2, y + height), (x, y + height, x + width, y + height + 2)):
                        self.assertEqual(alpha.crop(crop).getextrema(), (0, 0), (kind, name, crop))
                    checked += 1
        self.assertGreater(checked, 300)

    def test_death_frames_remain_on_the_floor(self):
        for kind in ('pizzeria-boss', 'marty', 'duke'):
            for name, action in self.meta['characters'][kind].items():
                if not name.startswith('death'):
                    continue
                self.assertTrue(action['groundedDefeat'])
                for frame in action['frames']:
                    self.assertAlmostEqual(frame['oy'] + frame['h'], 0, places=3, msg=(kind, name))
                    self.assertEqual(frame['contactY'], 0)

    def test_key_green_does_not_reappear_on_boss_edges(self):
        # Character clothes have no green. Allow minimal lossy-codec chroma noise,
        # but reject opaque chroma-key fringes rather than matching exact pixels.
        residue = opaque = 0
        for action in self.meta['characters']['pizzeria-boss'].values():
            for frame in action['frames']:
                image = self.images[frame['p']]
                crop = image.crop((frame['x'], frame['y'], frame['x'] + frame['w'], frame['y'] + frame['h']))
                pixels = crop.get_flattened_data() if hasattr(crop, 'get_flattened_data') else crop.getdata()
                for red, green, blue, alpha in pixels:
                    if alpha >= 128:
                        opaque += 1
                        residue += green > 90 and green > red * 1.5 and green > blue * 1.5
        self.assertLess(residue / max(1, opaque), 0.0002)


if __name__ == '__main__':
    unittest.main(verbosity=2)
