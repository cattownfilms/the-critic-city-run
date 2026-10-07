#!/usr/bin/env python3
"""Losslessly repack retained sprites into character/purpose dependency pages.

Run with --source-meta a metadata snapshot and optional --inputs-dir containing
the four supplied Sprite Forge exports. Source ZIPs and private project prompts
are never copied into the repository. Existing atlas files remain provenance;
only the new dependency pages are referenced by current runtime metadata.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'
PAGE_SIZE = 1024
PAD = 3
SCENE_POSES = {'idle', 'walk', 'hurt', 'folded-idle', 'finger-point'}
HERO_CORE = set('run jump land attack death dance-enter dance-loop charge-entry belly-bash guard-enter guard jab cross front-kick duck rising-elbow held-front-kick high-block mid-guard palm-strike jab-impact cross-impact spinning-backfist low-finisher-windup rising-palm-impact lead-palm-impact rear-palm-impact exerted-guard rise apex fall jump-start-v4 rise-v4 apex-v4 fall-v4 land-v4 air-kick-v4'.split())
FRANKLIN_CORE = set('run jump land attack jab cross jab-impact death guard-enter guard lead-punch rear-punch front-kick held-front-kick spin-kick leap-slam slam-windup slam-air ground-slam slam-hold impact-combo power-punch recover taunt victory dance rise apex fall duck cartwheel-run'.split())
SOURCE_EXPORTS = {
    'jay': ('Character-1000085555', 'Character-1000085555.zip', '73935a42003adf70b44355490e826bcf61748a23f6f32ab894d82af1eee6a1d1', 'Jay Sherman'),
    'duke': ('Duke-Sprite-Forge', 'Duke-Sprite Forge.zip', '1b69cfa7721b1851abf3dfaaf3c6c5016f7b96d38b64ad87fd4801dd77972bd2', 'Duke Phillips'),
    'marty': ('Marty-Sprite-Forge', 'Marty-Sprite Forge.zip', 'f5ea46bf04464501ff5cd5924aaa0705852197270370d415f5def453cb2e6d6b', 'Marty Sherman'),
    'franklin': ('Franklin-Sprite-Forge', 'Franklin-Sprite Forge.zip', '02fdbedc970b506cb5ef9ec107a834558ccd37bc7e1320e10971445ef8913ed2', 'Franklin'),
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def save_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, separators=(',', ':'), ensure_ascii=False) + '\n')


def encode_webp(image, output):
    temporary = output.with_suffix('.tmp')
    for method in (6, 4):
        image.save(temporary, 'WEBP', lossless=True, exact=True, method=method)
        try:
            with Image.open(temporary) as decoded:
                decoded.load()
                if decoded.convert('RGBA').tobytes() == image.convert('RGBA').tobytes():
                    temporary.replace(output)
                    return
        except (OSError, ValueError):
            pass
    raise ValueError(f'Failed exact RGBA WebP encoding: {output}')


def group_for(bank, name):
    if name in SCENE_POSES:
        return 'scene'
    if bank == 'hero':
        return 'gameplay' if name in HERO_CORE else 'optional'
    if bank == 'franklin':
        return 'gameplay' if name in FRANKLIN_CORE else 'optional'
    if bank == 'marty':
        return 'cage' if name in ('trapped', 'caged', 'scared-idle') else 'optional'
    return 'gameplay'


def import_portraits(inputs, meta):
    manifest = {'schemaVersion': 1, 'title': 'THE CRITIC: COMING ATTRACTIONS',
                'geometry': 'UI portraits use fixed full-canvas geometry; no gameplay body-height normalization.',
                'speakers': {}}
    records, extra = [], {}
    for speaker, (folder, archive, source_hash, name) in SOURCE_EXPORTS.items():
        base = inputs / folder
        exported = json.loads((base / 'manifest.json').read_text())
        entity = exported['entities'][0]
        actions = {action['id']: action for action in entity['actions']}
        portrait = actions['portrait']
        speaker_meta = {'name': name, 'width': 256, 'height': 256, 'expressions': {}}
        outdir = ASSETS / 'portraits' / speaker
        outdir.mkdir(parents=True, exist_ok=True)
        talk = []
        for index, frame in enumerate(portrait['frames']):
            image = Image.open(base / frame['file']).convert('RGBA').resize((256, 256), Image.Resampling.NEAREST)
            output = outdir / f'talk-{index:02d}.webp'
            encode_webp(image, output)
            talk.append({'image': str(output.relative_to(ROOT)), 'ms': frame['durationMs']})
        speaker_meta['expressions']['neutral'] = {'frames': talk, 'loop': True}
        speaker_meta['expressions']['talk'] = {'frames': talk, 'loop': True}
        # A fixed pose can be chosen without inventing facial expression changes.
        speaker_meta['expressions']['silent'] = {'frames': talk[:1], 'loop': False}
        if speaker == 'duke':
            emotions = actions['portrait-emotions']
            names = ['neutral', 'joy', 'sadness', 'anger', 'fear', 'surprise', 'determination', 'pain']
            for index, frame in enumerate(emotions['frames']):
                image = Image.open(base / frame['file']).convert('RGBA').resize((256, 256), Image.Resampling.NEAREST)
                output = outdir / f'emotion-{index:02d}.webp'
                encode_webp(image, output)
                key = names[index] if index < len(names) else f'source-pose-{index:02d}'
                speaker_meta['expressions'][key] = {'frames': [{'image': str(output.relative_to(ROOT)), 'ms': frame['durationMs']}], 'loop': False}
            # Dialogue uses the supplied mouth loop; named poses are intentionally static.
            speaker_meta['expressions']['neutral-talk'] = {'frames': talk, 'loop': True}
        manifest['speakers'][speaker] = speaker_meta
        records.append({'sourceArchive': archive, 'sourceSHA256': source_hash,
                        'entityId': entity['id'], 'canonicalName': name,
                        'retainedActions': [action['id'] for action in entity['actions']],
                        'portraitFrames': len(portrait['frames']),
                        'processing': 'Full-canvas 256x256 nearest-neighbor UI scaling; alpha and palette preserved; lossless WebP.',
                        'limitations': 'No cartwheel performance supplied.' if speaker == 'franklin' else 'Marty source portrait is a talk loop; its generated facial performance is not a distinct fear expression.' if speaker == 'marty' else ''})
        if speaker == 'marty':
            output_frame = entity['outputFrame']
            scale = 135 / 430
            size = (round(output_frame['width'] * scale), round(output_frame['height'] * scale))
            pivot_x, ground_y = output_frame['pivotX'] * scale, output_frame['groundY'] * scale
            for source_action, new_name in [('idle', 'scared-idle'), ('custom-trapped', 'trapped')]:
                source = actions[source_action]
                frames = []
                for index, frame in enumerate(source['frames']):
                    image = Image.open(base / frame['file']).convert('RGBA').resize(size, Image.Resampling.NEAREST)
                    bounds = image.getchannel('A').getbbox()
                    if not bounds:
                        raise ValueError(f'Empty supplied frame {frame["file"]}')
                    x, y, right, bottom = bounds
                    crop = image.crop(bounds)
                    newframe = {'ox': round(x-pivot_x, 3), 'oy': round(y-ground_y, 3),
                                'ms': frame['durationMs'], 'w': crop.width, 'h': crop.height,
                                'contactY': round(ground_y-bottom, 3), 'contactX': 0,
                                'sourceFrameId': frame['id']}
                    frames.append(newframe)
                    extra[('marty', new_name, index)] = crop
                meta['characters']['marty'][new_name] = {'frames': frames, 'ms': sum(frame['ms'] for frame in frames),
                    'loop': source['loopMode'] == 'loop', 'label': 'Marty / frightened idle' if new_name == 'scared-idle' else 'Marty / cage struggle',
                    'sourceDescription': 'Supplied registered performance; one shared canvas, source pivot, and scale for all frames.',
                    'original': True}
            meta['characters']['marty']['caged'] = copy.deepcopy(meta['characters']['marty']['trapped'])
            for index in range(len(meta['characters']['marty']['caged']['frames'])):
                extra[('marty', 'caged', index)] = extra[('marty', 'trapped', index)]
    save_json(ASSETS / 'portraits.json', manifest)
    meta['portraits'] = manifest
    return records, extra


def repack(meta, original, extra):
    images = {index: Image.open(ASSETS / page['file']).convert('RGBA') for index, page in enumerate(original['pages'])}
    pages, action_pages, gameplay, gallery, scenes, groups = [], {}, {}, {}, {}, {}
    crop_cache = {}
    for bank, actions in meta['characters'].items():
        action_pages[bank] = {}
        retained_crops = {}
        grouped = {}
        for name, action in actions.items():
            group = group_for(bank, name)
            grouped.setdefault(group, {})[name] = action
        groups[bank] = {}
        for group in ('scene', 'gameplay', 'cage', 'optional'):
            if group not in grouped:
                continue
            # One exact decoded bitmap per bank. Scene ownership comes first so
            # opening poses never pull in full combat or optional source pages.
            # Registration remains on each frame, independent of shared pixels.
            unique = {}
            for name, action in grouped[group].items():
                for index, frame in enumerate(action['frames']):
                    key = (bank, name, index)
                    if key in extra:
                        crop = extra[key]
                    else:
                        source_key = tuple(frame[k] for k in ('p', 'x', 'y', 'w', 'h'))
                        if source_key not in crop_cache:
                            p, x, y, w, h = source_key
                            crop_cache[source_key] = images[p].crop((x, y, x+w, y+h))
                        crop = crop_cache[source_key]
                    identity = (crop.size, digest(crop.tobytes()))
                    if identity in retained_crops:
                        frame.update(retained_crops[identity])
                        continue
                    entry = unique.setdefault(identity, {'image': crop, 'frames': [], 'identity': identity})
                    entry['frames'].append(frame)
            packed = []
            for entry in sorted(unique.values(), key=lambda item: (-item['image'].height, -item['image'].width)):
                w, h = entry['image'].size
                if w+2*PAD > PAGE_SIZE or h+2*PAD > PAGE_SIZE:
                    raise ValueError(f'Oversize crop {bank}/{group}: {w}x{h}')
                placement = None
                for page in packed:
                    for shelf in page['shelves']:
                        if h <= shelf['height'] and shelf['x']+w+PAD <= PAGE_SIZE:
                            placement = (page, shelf['x'], shelf['y'])
                            shelf['x'] += w+PAD
                            break
                    if placement:
                        break
                    y = page['nextY']
                    if y+h+PAD <= PAGE_SIZE:
                        shelf = {'x': PAD+w+PAD, 'y': y, 'height': h}
                        page['shelves'].append(shelf)
                        page['nextY'] = y+h+PAD
                        placement = (page, PAD, y)
                        break
                if not placement:
                    page = {'image': Image.new('RGBA', (PAGE_SIZE, PAGE_SIZE)), 'shelves': [{'x': PAD+w+PAD, 'y': PAD, 'height': h}], 'nextY': PAD+h+PAD, 'entries': []}
                    packed.append(page)
                    placement = (page, PAD, PAD)
                page, x, y = placement
                page['image'].paste(entry['image'], (x, y))
                page['entries'].append((entry, x, y))
            group_pages = []
            for number, page in enumerate(packed):
                width = max(shelf['x'] for shelf in page['shelves'])
                height = page['nextY']
                output = ASSETS / 'dependency' / f'{bank}-{group}-{number:02d}.webp'
                output.parent.mkdir(parents=True, exist_ok=True)
                encode_webp(page['image'].crop((0, 0, width, height)), output)
                page_id = len(pages)
                pages.append({'file': str(output.relative_to(ASSETS)), 'width': width, 'height': height,
                              'bytes': output.stat().st_size, 'bank': bank, 'group': group,
                              'encoding': 'lossless-webp-exact-rgba'})
                group_pages.append(page_id)
                for entry, x, y in page['entries']:
                    retained_crops[entry['identity']] = {'p': page_id, 'x': x, 'y': y}
                    for frame in entry['frames']:
                        frame.update({'p': page_id, 'x': x, 'y': y})
            groups[bank][group] = sorted({frame['p'] for action in grouped[group].values() for frame in action['frames']})
        for name, action in actions.items():
            action_pages[bank][name] = sorted({frame['p'] for frame in action['frames']})
        scenes[bank] = groups[bank].get('scene', [])
        gameplay[bank] = sorted(set(groups[bank].get('scene', []) + groups[bank].get('gameplay', []) + groups[bank].get('cage', [])))
        gallery[bank] = sorted({page for ids in groups[bank].values() for page in ids})
    meta['pages'] = pages
    referenced_files = {page['file'] for page in pages}
    for path in (ASSETS / 'dependency').glob('*.webp'):
        if str(path.relative_to(ASSETS)) not in referenced_files:
            path.unlink()
    meta['loading'] = {'schemaVersion': 1, 'gameplay': gameplay, 'gallery': gallery,
                       'scenes': scenes, 'actions': action_pages, 'groups': groups,
                       'policy': 'Load selected character and current stage gameplay. Story poses, UI portraits, and optional unique performances load by dependency. No discarded animations.'}
    for image in images.values():
        image.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-meta', type=Path, required=True)
    parser.add_argument('--inputs-dir', type=Path)
    parser.add_argument('--baseline-commit', default='20f6a80e468f69e53baffea4268e6df0ee4f92cb')
    args = parser.parse_args()
    source_bytes = args.source_meta.read_bytes()
    original = json.loads(source_bytes)
    meta = copy.deepcopy(original)
    records, extra = import_portraits(args.inputs_dir, meta) if args.inputs_dir else ([], {})
    repack(meta, original, extra)
    meta['revision'] = 'v7 dependency atlases / pixel UI portraits / retained source performances'
    meta['counts'] = {bank: {'actions': len(actions),
                            'frames': sum(len(action['frames']) for action in actions.values())}
                      for bank, actions in meta['characters'].items()}
    save_json(ASSETS / 'sprites.json', meta)
    runtime_paths = [ASSETS / page['file'] for page in meta['pages']]
    runtime_paths += list((ASSETS / 'portraits').rglob('*.webp')) if (ASSETS / 'portraits').exists() else []
    runtime_paths += [ASSETS / 'portraits.json'] if (ASSETS / 'portraits.json').exists() else []
    provenance = {'schemaVersion': 1, 'title': 'THE CRITIC: COMING ATTRACTIONS',
        'baselineCommit': args.baseline_commit, 'baselineMetadataSHA256': digest(source_bytes),
        'sourceAtlasBytes': sum(page['bytes'] for page in original['pages']),
        'dependencyAtlasBytes': sum(page['bytes'] for page in meta['pages']),
        'processing': 'Exact decoded RGBA lossless per-bank/per-purpose repack. Only atlas p/x/y change for retained frames. Original atlas files remain historical provenance, unreferenced by runtime.',
        'suppliedSources': records,
        'runtimeSHA256': {str(path.relative_to(ROOT)): digest(path.read_bytes()) for path in sorted(runtime_paths)},
        'sourceExclusions': ['Original supplied ZIPs', 'source videos', 'private project prompts', 'source authoring project metadata'],
        'semanticBaseline': 'tests/v6-frame-semantic-baseline.json'}
    save_json(ROOT / 'production/v7-assets.json', provenance)
    print(json.dumps({'pages': len(meta['pages']), 'runtimeBytes': provenance['dependencyAtlasBytes'],
                      'gameplayBytes': {bank: sum(meta['pages'][p]['bytes'] for p in ids) for bank, ids in meta['loading']['gameplay'].items()},
                      'sceneBytes': {bank: sum(meta['pages'][p]['bytes'] for p in ids) for bank, ids in meta['loading']['scenes'].items()}}))


if __name__ == '__main__':
    main()
