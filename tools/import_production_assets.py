#!/usr/bin/env python3
"""Append supplied Sprite Forge banks without repacking any accepted baseline atlas.

Usage: python tools/import_production_assets.py --uploads /path/to/supplied/uploads
Requires Pillow. Uploads stay outside the source/runtime; provenance contains hashes.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import tempfile
import zipfile

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BANKS = (
    ('pizzeria-boss', 'Cream-Scarf-Character-IMPORT-v01.zip', 182, 'Pizzeria Boss (temporary name)'),
    ('marty', 'Red-Pullover-Character-IMPORT-v01.zip', 135, 'Marty Sherman'),
    ('duke', 'Blue-Polo-Character-IMPORT-v01.zip', 186, 'Duke Phillips'),
    ('turkey-dinner', 'Turkey Dinner-Sprite Forge.zip', 52, 'Turkey Dinner'),
    ('trash-can', 'Trash Can-Sprite Forge.zip', 72, 'Trash Can'),
)


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def unzip(path: Path, dest: Path) -> None:
    with zipfile.ZipFile(path) as z:
        for name in z.namelist():
            target = (dest / name).resolve()
            if not target.is_relative_to(dest.resolve()):
                raise ValueError('Unsafe source archive path')
        z.extractall(dest)


def compile_uploads(uploads: Path, root: Path = ROOT) -> dict:
    assets = root / 'assets'
    meta_path = assets / 'sprites.json'
    meta = json.loads(meta_path.read_text())
    original_pages = list(meta['pages'])
    original_characters = dict(meta['characters'])
    baseline_bank_hashes = {kind: hashlib.sha256(json.dumps(bank, sort_keys=True, separators=(',', ':')).encode()).hexdigest() for kind, bank in original_characters.items()}
    baseline_page_hashes = {page['file']: sha(assets / page['file']) for page in original_pages}
    existing = [kind for kind, *_ in BANKS if kind in meta['characters']]
    if existing:
        raise ValueError('Production banks already exist; use a clean baseline before reimporting: ' + ', '.join(existing))
    crops = []
    provenance = []
    with tempfile.TemporaryDirectory(prefix='critic-assets-') as temp_dir:
        temp = Path(temp_dir)
        unzip(uploads / 'Enemy-Batch-03-Collection-v01.zip', temp / 'batch')
        for kind, source, height, label in BANKS:
            src = uploads / source
            if not src.exists():
                src = temp / 'batch' / 'imports' / source
            local = temp / kind
            unzip(src, local)
            manifest = json.loads((local / 'manifest.json').read_text())
            entity = manifest['entities'][0]
            canonical = entity['authoringCanonical']
            output = entity['outputFrame']
            scale = height / canonical['bodyHeight']
            bank = {}
            for action in entity['actions']:
                frames = []
                first_bbox = None
                grounded = action['id'] not in ('jump', 'rebound-jump', 'land')
                for source_frame in sorted(action['frames'], key=lambda f: f['order']):
                    image = Image.open(local / source_frame['file']).convert('RGBA')
                    bbox = image.getbbox()
                    if bbox is None:
                        image = Image.new('RGBA', (1, 1))
                        bbox = (output['pivotX'], output['groundY'], output['pivotX'] + 1, output['groundY'] + 1)
                    else:
                        image = image.crop(bbox)
                    # These two costumes contain no green. Suppress only detected
                    # green-key spill, without changing alpha or any silhouette.
                    if kind in ('pizzeria-boss', 'marty', 'duke'):
                        pixel_data = image.get_flattened_data() if hasattr(image, 'get_flattened_data') else image.getdata()
                        image.putdata([(r, min(g, max(r, b)), b, a) if g > 90 and g > r * 1.5 and g > b * 1.5 else (r, g, b, a) for r, g, b, a in pixel_data])
                    if first_bbox is None:
                        first_bbox = bbox
                    width = max(1, round(image.width * scale))
                    frame_height = max(1, round(image.height * scale))
                    image = image.resize((width, frame_height), Image.Resampling.LANCZOS)
                    # Remove only transparent hidden RGB. The archive already supplies
                    # clean alpha, so no green/magenta costume pixels are re-keyed.
                    pixel_data = image.get_flattened_data() if hasattr(image, 'get_flattened_data') else image.getdata()
                    image.putdata([(r, g, b, a) if a else (0, 0, 0, 0) for r, g, b, a in pixel_data])
                    stationary = action['id'] in ('idle', 'walk', 'run') and kind not in ('turkey-dinner', 'trash-can')
                    pivot_x = (bbox[0] + bbox[2]) / 2 if stationary else (first_bbox[0] + first_bbox[2]) / 2
                    if kind in ('turkey-dinner', 'trash-can'):
                        pivot_x = output['pivotX']
                    ox = round((bbox[0] - pivot_x) * scale, 3)
                    oy = -frame_height if grounded else round((bbox[1] - output['groundY']) * scale, 3)
                    if kind in ('turkey-dinner', 'trash-can'):
                        oy = round((bbox[1] - output['groundY']) * scale, 3)
                    duration = source_frame.get('durationMs') or round(1000 / action['fps'])
                    frame = {'ox': ox, 'oy': oy, 'ms': duration, 'contactY': 0, 'contactX': 0}
                    frames.append(frame)
                    crops.append((image, frame))
                action_id = action['id']
                bank[action_id] = {
                    'frames': frames, 'ms': sum(frame['ms'] for frame in frames),
                    'loop': action['loopMode'] == 'loop', 'label': action['label'],
                    'sourceDescription': action.get('description', ''), 'original': True,
                    'groundedDefeat': action_id.startswith('death'),
                }
                if kind == 'pizzeria-boss' and action_id == 'opposite-strike':
                    bank[action_id]['canonicalFacing'] = -1
            if kind == 'trash-can':
                # Animation aliases share original frames; no source performance is deleted.
                bank['break'] = dict(bank['custom-dent-and-explode'], label='Dent and break')
                bank['dent'] = dict(bank['custom-dent-and-explode'], label='Dented', frames=bank['custom-dent-and-explode']['frames'][2:8])
                bank['dent']['ms'] = sum(frame['ms'] for frame in bank['dent']['frames'])
            meta['characters'][kind] = bank
            meta['counts'][kind] = {'actions': len(bank), 'frames': sum(len(a['frames']) for a in bank.values())}
            provenance.append({
                'bank': kind, 'label': label, 'sourceArchive': source, 'sourceSHA256': sha(src),
                'canonicalSourceName': entity['name'], 'sourceEntityId': entity['id'],
                'runtimeNeutralHeight': height, 'retainedActions': [a['id'] for a in entity['actions']],
                'registration': 'One scale per bank. Grounded poses aligned to combat floor; locomotion centered. Attack root motion retained within each authored performance. Jump source motion retained.',
                'limitations': 'No independent hurt performance supplied; idle is used for brief hit reaction.' if kind == 'pizzeria-boss' else 'Contextual story character only; never an ordinary enemy.' if kind in ('marty', 'duke') else '',
            })
            if kind in ('pizzeria-boss', 'marty', 'duke'):
                idle_source = entity['actions'][0]['frames'][0]['file']
                icon = Image.open(local / idle_source).convert('RGBA')
                icon = icon.crop(icon.getbbox())
                pixel_data = icon.get_flattened_data() if hasattr(icon, 'get_flattened_data') else icon.getdata()
                icon.putdata([(r, min(g, max(r, b)), b, a) if g > 90 and g > r * 1.5 and g > b * 1.5 else (r, g, b, a) for r, g, b, a in pixel_data])
                icon.thumbnail((320, 420), Image.Resampling.LANCZOS)
                (assets / 'story').mkdir(exist_ok=True)
                icon.save(assets / 'story' / (kind + '.webp'), lossless=True, method=6)

    # Shelf packing appends pages and leaves all baseline decoded pixels untouched.
    page_index = len(meta['pages'])
    page_size = 1024
    atlas = Image.new('RGBA', (page_size, page_size))
    x = y = row_height = used_y = 0
    packed = 0
    def finish_page():
        nonlocal atlas, page_index, x, y, row_height, used_y
        filename = f'atlas-production-{page_index:02}.webp'
        final = atlas.crop((0, 0, page_size, max(1, used_y)))
        final.save(assets / filename, quality=95, method=6, exact=True)
        meta['pages'].append({'file': filename, 'width': page_size, 'height': final.height,
                              'bytes': (assets / filename).stat().st_size, 'encoding': 'WebP quality 95; lossless alpha; supplied frames scaled once; boss green-key fringe suppressed'})
        page_index += 1
        atlas = Image.new('RGBA', (page_size, page_size))
        x = y = row_height = used_y = 0
    for image, frame in crops:
        if x + image.width + 4 > page_size:
            x = 0
            y += row_height + 4
            row_height = 0
        if y + image.height + 4 > page_size:
            finish_page()
        atlas.paste(image, (x + 2, y + 2))
        frame.update({'p': page_index, 'x': x + 2, 'y': y + 2, 'w': image.width, 'h': image.height})
        x += image.width + 4
        row_height = max(row_height, image.height)
        used_y = max(used_y, y + image.height + 4)
        packed += 1
    if used_y:
        finish_page()
    meta['uniqueCrops'] += packed
    meta['revision'] = 'Coming Attractions production banks; original v5 banks preserved'
    assert meta['pages'][:len(original_pages)] == original_pages
    assert all(meta['characters'][kind] == bank for kind, bank in original_characters.items())
    meta_path.write_text(json.dumps(meta, separators=(',', ':')))

    story = assets / 'story'
    clear = uploads / '01-1000085752.jpg'
    if not clear.exists():
        clear = uploads / '1000085752.jpg'
    shadow = uploads / '02-1000085739.jpg'
    if not shadow.exists():
        shadow = uploads / '1000085739.jpg'
    Image.open(clear).crop((772, 110, 1000, 328)).save(story / 'projection-woman.webp', quality=95, method=6)
    image = Image.open(shadow).crop((298, 0, 1238, 716))
    image.thumbnail((564, 430), Image.Resampling.LANCZOS)
    image.save(story / 'projection-shadow.webp', quality=94, method=6)
    production = root / 'production'
    production.mkdir(exist_ok=True)
    report = {
        'title': 'THE CRITIC: COMING ATTRACTIONS',
        'banks': provenance, 'baselineBanksPreserved': list(original_characters),
        'baselinePagesPreserved': len(original_pages), 'appendedPages': len(meta['pages']) - len(original_pages),
        'baselineBankSHA256': baseline_bank_hashes, 'baselinePageSHA256': baseline_page_hashes,
        'optimization': 'New production pages only: WebP quality 95 with lossless alpha, 1024px sheets. Baseline atlases are byte-for-byte untouched. Boss green-key color spill suppressed without changing alpha.',
        'suppliedSourceInventory': [{'file': p.name, 'bytes': p.stat().st_size, 'sha256': sha(p)} for p in sorted(uploads.iterdir()) if p.is_file()],
        'referenceArt': [
            {'file': 'assets/story/projection-woman.webp', 'source': clear.name, 'sourceSHA256': sha(clear), 'crop': [772, 110, 1000, 328], 'role': 'Canonical projection-window woman face; supplied screenshot crop, no redesign'},
            {'file': 'assets/story/projection-shadow.webp', 'source': shadow.name, 'sourceSHA256': sha(shadow), 'crop': [298, 0, 1238, 716], 'role': 'Supplied eyes-in-shadow first reveal'},
        ],
        'identityVerification': 'Red Pullover visually verified as Marty Sherman against The Critic family reference; Blue Polo visually verified as Duke Phillips against official episode still. Neither is assigned ordinary enemy AI. Cream Scarf matches the supplied output (6).mp4 male boss identity and is the temporary-named Pizzeria Boss. Booth Enforcer uses existing Shermometer v3 artwork, not Marty or Duke.',
        'omissions': 'Teal Cap remains in the supplied source collection, which is preserved outside the public runtime. No roster slot is added merely for quantity. Raw media, private prompt logs, and import manifests are not published.',
        'inspectedExtraVideo': {'output (6).mp4': 'Cream Scarf guard, hand gesture, lunging cross, double-punch performance, matches Pizzeria Boss visual identity', '0e86bd1e-a6a2-40a2-b0bb-5a9d0309c042.mp4': 'Duke Phillips (Blue Polo source label) idle, point, guard and rising-fist jump; retained source only'},
    }
    runtime_files = [assets / page['file'] for page in meta['pages'][len(original_pages):]]
    runtime_files += [story / (kind + '.webp') for kind in ('pizzeria-boss', 'marty', 'duke')]
    runtime_files += [story / 'projection-woman.webp', story / 'projection-shadow.webp']
    report['runtimeSHA256'] = {path.relative_to(root).as_posix(): sha(path) for path in runtime_files}
    (production / 'new-assets.json').write_text(json.dumps(report, indent=2) + '\n')
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--uploads', type=Path, required=True)
    options = parser.parse_args()
    report = compile_uploads(options.uploads.resolve())
    print(json.dumps({'banks': [entry['bank'] for entry in report['banks']], 'appendedPages': report['appendedPages']}))
