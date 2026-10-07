#!/usr/bin/env python3
"""Verify identities, atlas integrity, alpha safety, and decoded-frame semantics.

Atlas placement is intentionally excluded from the frozen v6 contract: pages may
be repacked for dependency loading, but pixels, registration, timing and action
metadata must remain exact.
"""
import hashlib
import json
from pathlib import Path
import unittest

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def semantic_baseline_errors(meta, baseline, assets):
    """Compare retained source frames, allowing only physical atlas relocation.

    Callable by the HTTP/site test too. New actions and portrait banks are allowed;
    deletion, frame reordering, pixel changes, timing or registration changes fail.
    """
    errors, images, crop_hashes = [], {}, {}
    if baseline.get('schemaVersion') != 1:
        return ['unsupported semantic-baseline schema']
    try:
        for kind, expected_bank in baseline['characters'].items():
            bank = meta['characters'].get(kind, {})
            for name, expected in expected_bank.items():
                label = f'{kind}/{name}'
                action = bank.get(name)
                if action is None:
                    errors.append(f'{label}: missing action')
                    continue
                if {k: v for k, v in action.items() if k != 'frames'} != expected['metadata']:
                    errors.append(f'{label}: action metadata changed')
                frames = action.get('frames', [])
                if len(frames) != len(expected['frames']):
                    errors.append(f'{label}: frame count changed')
                for index, (frame, old) in enumerate(zip(frames, expected['frames'])):
                    if {k: v for k, v in frame.items() if k not in ('p', 'x', 'y')} != old['metadata']:
                        errors.append(f'{label}/{index}: frame geometry, timing or contact changed')
                    page_index = frame['p']
                    if page_index not in images:
                        images[page_index] = Image.open(assets / meta['pages'][page_index]['file']).convert('RGBA')
                    key = tuple(frame[k] for k in ('p', 'x', 'y', 'w', 'h'))
                    if key not in crop_hashes:
                        _, x, y, w, h = key
                        crop_hashes[key] = hashlib.sha256(images[page_index].crop((x, y, x + w, y + h)).tobytes()).hexdigest()
                    if crop_hashes[key] != old['rgbaSHA256']:
                        errors.append(f'{label}/{index}: decoded RGBA pixels changed')
    finally:
        for image in images.values():
            image.close()
    return errors


class ProductionAssets(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.meta = json.loads((ROOT / 'assets/sprites.json').read_text())
        cls.provenance = json.loads((ROOT / 'production/new-assets.json').read_text())
        cls.baseline = json.loads((ROOT / 'tests/v6-frame-semantic-baseline.json').read_text())
        # Page indices are packaging details. Resolve the banks under test to their
        # actual referenced pages rather than assuming new assets start at page 13.
        indices = {frame['p'] for entry in cls.provenance['banks']
                   for action in cls.meta['characters'][entry['bank']].values()
                   for frame in action['frames']}
        cls.images = {index: Image.open(ROOT / 'assets' / cls.meta['pages'][index]['file']).convert('RGBA')
                      for index in indices}

    @classmethod
    def tearDownClass(cls):
        for image in cls.images.values():
            image.close()

    def test_accepted_baseline_frames_and_animation_semantics_are_preserved(self):
        self.assertEqual(self.baseline['schemaVersion'], 1)
        self.assertRegex(self.baseline['sourceMetadataSHA256'], r'^[0-9a-f]{64}$')
        self.assertGreaterEqual(len(self.baseline['characters']), 14)
        frozen_actions = sum(len(bank) for bank in self.baseline['characters'].values())
        frozen_frames = sum(len(action['frames']) for bank in self.baseline['characters'].values()
                            for action in bank.values())
        self.assertEqual(frozen_actions, 189)
        self.assertEqual(frozen_frames, 2811)
        errors = semantic_baseline_errors(self.meta, self.baseline, ROOT / 'assets')
        self.assertEqual(errors, [], '\n'.join(errors[:20]))

    def test_original_source_atlas_files_retain_historical_provenance(self):
        # Original files remain as provenance; runtime pages may reference the
        # dependency-specific repack instead. This does not constrain page IDs.
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
            # Lossless repacking preserves decoded pixels. A full 1024px RGBA
            # dependency page remains below its 4 MiB uncompressed footprint.
            self.assertLess(page['bytes'], 4 * 1024 * 1024)
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

    def test_dependencies_are_character_scoped_and_scene_poses_are_small(self):
        loading = self.meta['loading']
        self.assertEqual(loading['schemaVersion'], 1)
        for kind, bank in self.meta['characters'].items():
            all_pages = sorted({f['p'] for action in bank.values() for f in action['frames']})
            self.assertEqual(loading['gallery'][kind], all_pages)
            for index in all_pages:
                self.assertEqual(self.meta['pages'][index]['bank'], kind)
            for name, action in bank.items():
                self.assertEqual(loading['actions'][kind][name], sorted({f['p'] for f in action['frames']}))
            self.assertTrue(set(loading['gameplay'][kind]) <= set(all_pages))
        ordinary = ['bear', 'hippo', 'sherm-punch', 'sherm-shove', 'sherm-slam', 'striped', 'raptor']
        scene_bytes = sum(self.meta['pages'][p]['bytes'] for kind in ordinary for p in loading['scenes'][kind])
        whole_bytes = sum(self.meta['pages'][p]['bytes'] for kind in ordinary for p in loading['gallery'][kind])
        self.assertLess(scene_bytes, whole_bytes * .35)
        # Personality performances stay available by exact animation dependency.
        # The renderer falls back to loaded idle until an optional page arrives.
        context = 'anxious-fidget vest-adjust heel-toe-shuffle toe-tap head-scratch shoulder-roll knee-bounce lean-peek shiver balance-wobble double-take panic-settle sigh disgust-grimace nose-pinch wave-off grumpy-idle startled-hop'
        for name in context.split():
            self.assertTrue(set(loading['actions']['hero'][name]) <= set(loading['gallery']['hero']), name)
            self.assertTrue(set(loading['actions']['hero'][name]) - set(loading['gameplay']['hero']), name)

    def test_supplied_portraits_have_independent_ui_geometry(self):
        portraits = json.loads((ROOT / 'assets/portraits.json').read_text())
        self.assertEqual(self.meta['portraits'], portraits)
        for speaker, expected in [('jay', 8), ('duke', 4), ('marty', 8), ('franklin', 4)]:
            data = portraits['speakers'][speaker]
            self.assertEqual((data['width'], data['height']), (256, 256))
            frames = data['expressions']['talk']['frames']
            self.assertEqual(len(frames), expected)
            for frame in frames:
                with Image.open(ROOT / frame['image']) as image:
                    self.assertEqual(image.size, (256, 256))
                    self.assertEqual(image.mode, 'RGBA')
                    self.assertGreater(image.getchannel('A').getextrema()[1], 0)
                self.assertGreater(frame['ms'], 0)
        emotions = portraits['speakers']['duke']['expressions']
        for name in ['joy', 'sadness', 'anger', 'fear', 'surprise', 'determination', 'pain']:
            self.assertFalse(emotions[name]['loop'])
            self.assertEqual(len(emotions[name]['frames']), 1)

    def test_marty_cage_is_the_retained_supplied_registered_performance(self):
        marty = self.meta['characters']['marty']
        self.assertEqual(len(marty['scared-idle']['frames']), 4)
        self.assertEqual(len(marty['trapped']['frames']), 14)
        self.assertEqual(marty['trapped'], marty['caged'])
        self.assertFalse(marty['trapped']['loop'])
        for frame in marty['trapped']['frames']:
            self.assertRegex(frame['sourceFrameId'], r'^frame-[0-9a-f-]+$')
        provenance = json.loads((ROOT / 'production/v7-assets.json').read_text())
        self.assertEqual(len(provenance['suppliedSources']), 4)
        for source in provenance['suppliedSources']:
            self.assertRegex(source['sourceSHA256'], r'^[0-9a-f]{64}$')
        for filename, expected in provenance['runtimeSHA256'].items():
            self.assertEqual(sha(ROOT / filename), expected, filename)

    def test_cartwheel_has_distinct_complete_grounded_poses(self):
        action = self.meta['characters']['franklin']['cartwheel-run']
        self.assertFalse(action['loop'])
        self.assertEqual(len(action['frames']), 6)
        self.assertEqual(action['ms'], sum(frame['ms'] for frame in action['frames']))
        provenance = json.loads((ROOT / 'production/v7-assets.json').read_text())['generatedCartwheel']
        hashes = set()
        for frame, record in zip(action['frames'], provenance['frames']):
            page = self.meta['pages'][frame['p']]
            with Image.open(ROOT / 'assets' / page['file']) as image:
                crop = image.convert('RGBA').crop((frame['x'], frame['y'], frame['x']+frame['w'], frame['y']+frame['h']))
                digest = hashlib.sha256(crop.tobytes()).hexdigest()
                self.assertEqual(digest, record['decodedCropSHA256'])
                hashes.add(digest)
            self.assertEqual(record['sourceCanvas'], [320, 256])
            self.assertEqual(record['sourcePivot'], [160, 230])
            self.assertLessEqual(abs(frame['oy']+frame['h']), 2)
            self.assertGreater(frame['w'], 70)
        self.assertEqual(len(hashes), 6, 'Cartwheel cannot be a rotated or duplicated static placeholder')
        self.assertGreater(action['frames'][2]['w'], action['frames'][-1]['w']*1.5)
        self.assertLessEqual(abs(action['frames'][-1]['h']-self.meta['characters']['franklin']['idle']['frames'][0]['h']), 12)

    def test_source_map_rectangles_resolve_to_the_preserved_decoded_pixels(self):
        source_map = json.loads((ROOT / 'assets/source-map.json').read_text())
        images, hashes = {}, {}
        try:
            for record in source_map['frameDerivatives']:
                self.assertIn('legacyV6RuntimeRect', record)
                frame = record['runtimeRect']
                key = tuple(frame[name] for name in ('p', 'x', 'y', 'w', 'h'))
                if key not in hashes:
                    page, x, y, width, height = key
                    if page not in images:
                        images[page] = Image.open(ROOT / 'assets' / self.meta['pages'][page]['file']).convert('RGBA')
                    hashes[key] = hashlib.sha256(images[page].crop((x, y, x+width, y+height)).tobytes()).hexdigest()
                self.assertEqual(hashes[key], record['decodedRuntimeSHA256'])
            self.assertEqual(len(source_map['v7FrameDerivatives']), 38)
            self.assertEqual(source_map['currentRuntimePages'], self.meta['pages'])
            self.assertEqual(source_map['currentFrameReferences'], sum(len(action['frames']) for bank in self.meta['characters'].values() for action in bank.values()))
        finally:
            for image in images.values():
                image.close()


if __name__ == '__main__':
    unittest.main(verbosity=2)
