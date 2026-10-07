#!/usr/bin/env python3
"""Append source-derived v8 performances and documented facing corrections.

Requires Pillow, numpy, scipy and ffmpeg. Raw clips/extracted frames remain outside
the repository. Existing atlases are never repacked or rewritten.
"""
from __future__ import annotations
import argparse
import copy
import hashlib
import json
from pathlib import Path
import subprocess
import numpy as np
from scipy import ndimage
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FPS = 12
CLIPS = ['1000085765.mp4', '1000085783.mp4', '1000085785.mp4', '1000085787.mp4']
FACING_ACTIONS = [('franklin', name) for name in ('idle', 'guard-enter', 'guard', 'recover')]+[('sherm-punch', 'swat-alt')]
FACING_FRAMES = {('franklin', 'lead-punch'): list(range(10)), ('franklin', 'power-punch'): list(range(4)), ('pizzeria-boss', 'attack'): [0]}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def jwrite(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix+'.tmp')
    temporary.write_text(json.dumps(data, separators=(',', ':'))+'\n')
    temporary.replace(path)


def encode(image, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.tmp')
    try:
        for method in (6, 4):
            image.save(temporary, 'WEBP', lossless=True, exact=True, method=method)
            try:
                with Image.open(temporary) as decoded:
                    decoded.load()
                    if decoded.convert('RGBA').tobytes() == image.tobytes():
                        temporary.replace(path)
                        return
            except (OSError, ValueError):
                pass
        raise ValueError(f'Failed exact encode: {path}')
    finally:
        temporary.unlink(missing_ok=True)


def sample(start, end):
    return list(range(start, end+1, 2))


def chroma(path, mode='actor', clip=None, index=0):
    original = np.asarray(Image.open(path).convert('RGB')).astype(np.int16)
    red, green, blue = original[:, :, 0], original[:, :, 1], original[:, :, 2]
    dominance = green-np.maximum(red, blue)
    alpha = np.full(red.shape, 255, dtype=np.uint8)
    boundary = (green > 45) & (dominance > 12)
    alpha[boundary] = np.clip((45-dominance[boundary])*255/33, 0, 255).astype(np.uint8)
    key = (green > 80) & (dominance > 45)
    alpha[key] = 0
    # These three supplied costumes contain no green. Suppress only measured
    # green-screen spill; preserve skin, sash, jeans, scarf, cap and white effects.
    spill = (green > 45) & (dominance > 8)
    original[:, :, 1][spill] = np.maximum(red, blue)[spill]
    if clip == '1000085785' and (mode == 'projectile' or index >= 55):
        labels, count = ndimage.label(alpha > 96)
        sizes = np.bincount(labels.ravel())
        sizes[0] = 0
        actor = int(sizes.argmax())
        if mode == 'projectile':
            sizes[actor] = 0
            component = int(sizes.argmax())
            if sizes[component] < 500:
                raise ValueError(f'No fully detached can at frame {index}')
        else:
            component = actor
        # Restore fractional boundary alpha around the selected connected object.
        selected = ndimage.binary_dilation(labels == component, iterations=2)
        alpha[~selected] = 0
    rgba = np.dstack((np.clip(original, 0, 255).astype(np.uint8), alpha))
    rgba[alpha == 0, :3] = 0
    return Image.fromarray(rgba)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--uploads', type=Path, required=True)
    parser.add_argument('--scratch', type=Path, required=True)
    args = parser.parse_args()
    assets = ROOT / 'assets'
    meta = json.loads((assets / 'sprites.json').read_text())
    if 'spike' in meta['characters']:
        raise ValueError('V8 already imported. Reproduce from reviewed v7 baseline, never double-import.')
    baseline = copy.deepcopy(meta)
    sources = []
    for name in CLIPS:
        source = args.uploads / name
        folder = args.scratch / source.stem
        folder.mkdir(parents=True, exist_ok=True)
        if not (folder / '0000.png').exists():
            subprocess.run(['ffmpeg', '-v', 'error', '-i', str(source), '-fps_mode', 'passthrough', '-start_number', '0', str(folder/'%04d.png')], check=True)
        probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(source)]))
        video = next(stream for stream in probe['streams'] if stream['codec_type'] == 'video')
        sources.append({'file': name, 'bytes': source.stat().st_size, 'sha256': sha(source), 'sourceFPS': video['r_frame_rate'],
                        'sourceFrames': int(video['nb_frames']), 'duration': float(probe['format']['duration']),
                        'sourceCanvas': [video['width'], video['height']]})
    aliases, facing = {}, []
    def preserve(bank, action):
        alias = 'legacy-source-'+action
        if alias not in meta['characters'][bank]:
            meta['characters'][bank][alias] = copy.deepcopy(meta['characters'][bank][action])
        aliases[bank+'/'+action] = bank+'/'+alias
        return alias
    for bank, action in FACING_ACTIONS:
        preserve(bank, action)
        meta['characters'][bank][action]['canonicalFacing'] = -1
        facing.append({'bank': bank, 'action': action, 'canonicalFacing': -1, 'reason': 'Verified native left-facing source; action-level renderer mirror corrects facing without changing pixels or pivots.'})
    for (bank, action), indices in FACING_FRAMES.items():
        preserve(bank, action)
        for index in indices:
            meta['characters'][bank][action]['frames'][index]['canonicalFacing'] = -1
        facing.append({'bank': bank, 'action': action, 'frames': indices, 'canonicalFacing': -1,
                       'reason': 'Only native left-facing setup frames corrected; right-facing strikes retain their source direction.'})
    preserve('franklin', 'cartwheel-run')
    meta['sourcePreservationAliases'] = aliases
    meta['characters']['spike'] = {}
    cache, records, grouped = {}, [], {}
    scales = {'1000085765': 196/572, '1000085787': 186/574, '1000085785': 186/574, '1000085783': 190/580}
    source_hashes = {record['file'].removesuffix('.mp4'): record['sha256'] for record in sources}
    def derive(clip, index, mode='actor', grounding='ground'):
        key = (clip, index, mode, grounding)
        if key in cache:
            return cache[key]
        image = chroma(args.scratch/clip/f'{index:04d}.png', mode, clip, index)
        bounds = image.getchannel('A').getbbox()
        if bounds is None:
            raise ValueError(f'Empty derived frame {clip}/{index}')
        left, top, right, bottom = bounds
        cropped = image.crop(bounds)
        factor = scales[clip]
        size = (max(1, round(cropped.width*factor)), max(1, round(cropped.height*factor)))
        cropped = cropped.convert('RGBa').resize(size, Image.Resampling.LANCZOS).convert('RGBA')
        if mode == 'projectile':
            ox, oy = -cropped.width/2, -cropped.height/2
            pivot = [(left+right)/2, (top+bottom)/2]
        else:
            ox, oy = (left-640)*factor, -cropped.height
            pivot = [640, bottom]
        frame = {'ox': round(ox, 3), 'oy': round(oy, 3), 'w': cropped.width, 'h': cropped.height,
                 'contactX': 0, 'contactY': 0, 'sourceClip': clip+'.mp4', 'sourceFrame': index}
        details = {'source': clip+'.mp4', 'sourceSHA256': source_hashes[clip], 'sourceFrame': index,
                   'sourceSeconds': index/24, 'sourceBounds': list(bounds), 'sourcePivot': pivot,
                   'fixedScale': factor, 'mode': mode, 'grounding': grounding,
                   'decodedRuntimeSHA256': hashlib.sha256(cropped.tobytes()).hexdigest()}
        cache[key] = (cropped, frame, details)
        return cache[key]
    def action(bank, name, clip, indices, loop=False, group='gameplay', mode='actor', grounding='ground', impact=None):
        frames = []
        for position, index in enumerate(indices):
            image, frame, details = derive(clip, index, mode, grounding)
            frame = dict(frame, ms=round((position+1)*1000/FPS)-round(position*1000/FPS))
            frames.append(frame)
            grouped.setdefault((bank, group), []).append((image, frame))
            records.append(dict(details, bank=bank, action=name, runtimeFrame=position, ms=frame['ms']))
        data = {'label': name.replace('-', ' ').title()+' / supplied v8', 'frames': frames, 'ms': sum(frame['ms'] for frame in frames),
                'loop': loop, 'original': True, 'canonicalFacing': 1, 'groundedDefeat': name == 'death',
                'sourceDescription': 'Supplied 24fps performance sampled at12fps with one clip-wide scale. Horizontal source pivot640; grounded poses maintain contact. No generated replacement.'}
        if grounding == 'screen':
            data['framing'] = 'source-clipped-upperbody-for-screen-only'
        if impact is not None:
            data['sourceImpact'] = impact
        meta['characters'][bank][name] = data
    action('franklin', 'cartwheel-run', '1000085765', sample(12, 62), impact=11/26)
    action('franklin', 'cartwheel-source-v8', '1000085765', sample(0, 94), group='optional')
    for name, start, end, loop, group in [
        ('idle', 0, 22, True, 'scene'), ('walk', 24, 56, True, 'scene'), ('run', 60, 94, True, 'gameplay'),
        ('attack', 96, 114, False, 'gameplay'), ('cross', 120, 134, False, 'gameplay'),
        ('hurt', 136, 164, False, 'scene'), ('death', 168, 222, False, 'gameplay')]:
        action('spike', name, '1000085787', sample(start, end), loop, group)
    action('spike', 'source-performance-v8', '1000085787', sample(0, 238), group='optional')
    action('spike', 'throw-windup', '1000085785', sample(8, 42))
    action('spike', 'throw-ready', '1000085785', [34, 36, 38])
    action('spike', 'trash-throw', '1000085785', sample(42, 78), impact=7/19)
    action('spike', 'throw-source-v8', '1000085785', sample(0, 94), group='optional')
    action('trash-can', 'thrown', '1000085785', [55, 57, 59, 61, 63], loop=True, mode='projectile', grounding='center')
    action('pizzeria-boss', 'screen-guard', '1000085783', sample(0, 42), loop=True, grounding='screen')
    action('pizzeria-boss', 'screen-taunt', '1000085783', sample(58, 86), grounding='screen')
    action('pizzeria-boss', 'screen-punch', '1000085783', sample(98, 130), grounding='screen', impact=7/17)
    # Exact bitmap deduplication within each bank; registration stays on frames.
    reused = {}
    appended = []
    for bank in ['franklin', 'spike', 'trash-can', 'pizzeria-boss']:
        for group in ['scene', 'gameplay', 'optional']:
            entries = grouped.get((bank, group), [])
            unique = {}
            for image, frame in entries:
                identity = (bank, image.size, hashlib.sha256(image.tobytes()).hexdigest())
                if identity in reused:
                    frame.update(reused[identity])
                else:
                    item = unique.setdefault(identity, {'image': image, 'frames': [], 'identity': identity})
                    item['frames'].append(frame)
            pages = []
            for item in sorted(unique.values(), key=lambda value: (-value['image'].height, -value['image'].width)):
                image = item['image'];placement = None
                for page in pages:
                    for shelf in page['shelves']:
                        if image.height <= shelf['h'] and shelf['x']+image.width+3 <= 1024:
                            placement = (page, shelf['x'], shelf['y']);shelf['x'] += image.width+3;break
                    if placement:break
                    if page['nextY']+image.height+3 <= 1024:
                        y = page['nextY'];page['shelves'].append({'x': 6+image.width, 'y': y, 'h': image.height});page['nextY'] += image.height+3
                        placement = (page, 3, y);break
                if placement is None:
                    page = {'image': Image.new('RGBA', (1024, 1024)), 'shelves': [{'x': image.width+6, 'y': 3, 'h': image.height}], 'nextY': image.height+6, 'entries': []}
                    pages.append(page);placement = (page, 3, 3)
                page, x, y = placement;page['image'].paste(image, (x, y));page['entries'].append((item, x, y))
            for number, page in enumerate(pages):
                width = max(shelf['x'] for shelf in page['shelves']);height = page['nextY']
                output = assets / 'dependency' / f'v8-{bank}-{group}-{number:02d}.webp'
                encode(page['image'].crop((0, 0, width, height)), output)
                page_id = len(meta['pages'])
                meta['pages'].append({'file': str(output.relative_to(assets)), 'width': width, 'height': height, 'bytes': output.stat().st_size,
                                      'bank': bank, 'group': group, 'encoding': 'source-derived lossless WebP; exact RGBA; one clip-wide scale'})
                appended.append(str(output.relative_to(ROOT)))
                for item, x, y in page['entries']:
                    reused[item['identity']] = {'p': page_id, 'x': x, 'y': y}
                    for frame in item['frames']:frame.update(reused[item['identity']])
    for bank, actions in meta['characters'].items():
        loader = meta['loading']
        loader['actions'].setdefault(bank, {})
        for name, data in actions.items():
            loader['actions'][bank][name] = sorted({frame['p'] for frame in data['frames']})
        loader['gallery'][bank] = sorted({frame['p'] for data in actions.values() for frame in data['frames']})
        new_scene = sorted({frame['p'] for (kind, group), entries in grouped.items() if kind == bank and group == 'scene' for _, frame in entries})
        new_core = sorted({frame['p'] for (kind, group), entries in grouped.items() if kind == bank and group in ('scene', 'gameplay') for _, frame in entries})
        loader['scenes'][bank] = sorted(set(loader['scenes'].get(bank, [])+new_scene))
        loader['gameplay'][bank] = sorted(set(loader['gameplay'].get(bank, [])+new_core))
        loader['groups'].setdefault(bank, {})
        for group in ('scene', 'gameplay', 'optional'):
            ids = {frame['p'] for _, frame in grouped.get((bank, group), [])}
            loader['groups'][bank][group] = sorted(set(loader['groups'][bank].get(group, [])+list(ids)))
        meta['counts'][bank] = {'actions': len(actions), 'frames': sum(len(data['frames']) for data in actions.values())}
    old_cart_pages = set(meta['loading']['actions']['franklin']['legacy-source-cartwheel-run'])
    meta['loading']['gameplay']['franklin'] = [page for page in meta['loading']['gameplay']['franklin'] if page not in old_cart_pages]
    meta['loading']['groups']['franklin']['gameplay'] = [page for page in meta['loading']['groups']['franklin']['gameplay'] if page not in old_cart_pages]
    meta['loading']['groups']['franklin']['optional'] = sorted(set(meta['loading']['groups']['franklin']['optional']+list(old_cart_pages)))
    portraits = json.loads((assets / 'portraits.json').read_text())
    portraits['speakers']['pizzeria']['name'] = 'CINEMA HEADLINER'
    spike_expressions = {}
    for expression, source_index, filename in [('neutral', 0, 'talk-00.webp'), ('hurt', 146, 'hurt.webp')]:
        image = chroma(args.scratch/'1000085787'/f'{source_index:04d}.png')
        bust = image.crop((530, 70, 770, 365)).convert('RGBa').resize((208, 256), Image.Resampling.LANCZOS).convert('RGBA')
        plate = Image.new('RGBA', (256, 256));plate.paste(bust, (24, 0))
        path = assets / 'portraits/spike' / filename;encode(plate, path);appended.append(str(path.relative_to(ROOT)))
        spike_expressions[expression] = {'frames': [{'image': str(path.relative_to(ROOT)), 'ms': 1000}], 'loop': False}
    spike_expressions['talk'] = spike_expressions['neutral'];spike_expressions['silent'] = spike_expressions['neutral']
    spike_expressions['worried'] = spike_expressions['hurt'];spike_expressions['fear'] = spike_expressions['hurt']
    portraits['speakers']['spike'] = {'name': 'SPIKE', 'width': 256, 'height': 256, 'expressions': spike_expressions}
    jwrite(assets/'portraits.json', portraits);meta['portraits'] = portraits
    meta['uniqueCrops'] = len({(frame['p'], frame['x'], frame['y'], frame['w'], frame['h'])
                              for actions in meta['characters'].values() for data in actions.values() for frame in data['frames']})
    meta['revision'] = 'v8 supplied cartwheel / Spike / audited source-facing corrections'
    jwrite(assets/'sprites.json', meta)
    source_map = json.loads((assets/'source-map.json').read_text())
    for record in source_map['v7FrameDerivatives']:
        if record['character'] == 'franklin' and record['action'] == 'cartwheel-run':record['action'] = 'legacy-source-cartwheel-run'
    current = []
    for record in records:
        frame = meta['characters'][record['bank']][record['action']]['frames'][record['runtimeFrame']]
        current.append(dict(record, runtimeRect={key: frame[key] for key in ('p', 'x', 'y', 'w', 'h')}, ox=frame['ox'], oy=frame['oy']))
    source_map['v8FrameDerivatives'] = current;source_map['v8ProductionMap'] = 'production/v8-assets.json';source_map['sourcePreservationAliases'] = aliases
    source_map['currentRuntimePages'] = meta['pages'];source_map['currentRevision'] = meta['revision'];source_map['currentFrameReferences'] = sum(count['frames'] for count in meta['counts'].values())
    jwrite(assets/'source-map.json', source_map)
    provenance = {'schemaVersion': 1, 'title': 'THE CRITIC: COMING ATTRACTIONS', 'baselineCommit': '29e97395',
        'sourceVideos': sources, 'baselinePagesPreserved': len(baseline['pages']),
        'baselinePageSHA256': {page['file']: sha(assets/page['file']) for page in baseline['pages']},
        'sourcePreservationAliases': aliases,
        'preservedActionSHA256': {key: hashlib.sha256(json.dumps(baseline['characters'][key.split('/')[0]][key.split('/')[1]], sort_keys=True, separators=(',', ':')).encode()).hexdigest() for key in aliases},
        'directionalCorrections': facing, 'martyAudit': 'Idle, walk and run are natively right-facing; no source flip. Ending fixes motion-owned scene facing.',
        'allBankAudit': 'All14v7banks/193actions inspected first/middle/last; complete sequences checked where mixed. Existingpizzeria opposite-strike -1 retained. Intentionalturns and personality gestures remain unchanged.',
        'normalization': 'Supplied green-screen footage sampled at12fps. One scale per clip; fixedhorizontal pivot640; groundedbottom aligned. Premultiplied-alpha scale; targetedgreen spill only. Detachedcan removed fromSpike actorafterframe55 and retained as centeredthrown-can performance.',
        'uniformScales': scales, 'frameDerivatives': current,
        'sourceImpacts': {'franklin/cartwheel-run': 11/26, 'spike/trash-throw': 7/19},
        'projectileSourceCenterAtRelease': {'sourceFrame': 55, 'sourceSeconds': 55/24, 'sourceCanBounds': [886, 150, 1146, 390],
                                          'sourceGroundY': 660, 'fixedScale': 186/574,
                                          'faceRelativeX': (1016-640)*186/574, 'heightAboveGround': (660-270)*186/574,
                                          'visibleHandX': 81, 'visibleHandHeight': 104,
                                          'runtimeSpawn': {'faceRelativeX': 120, 'heightAboveGround': 125},
                                          'maximumCenterErrorPixels': 2},
        'limitations': ['CreamScarf sourcefeet clipped: newscreenstates are upper-body-only; existinggroundbank retained.', 'CreamScarf lunge7.45–8.12s omitted because sourcehead/bodyleave frame.', 'Spikeoverheadcan topclipped in source1.75–2s; introready usesfully-framed earlierlift. Sourcecapturedprop geometry is preserved.', '12fps sampling preserves everyauthored performance, notevery24fps video frame. Rawsourcevideos retained outsidepublicruntime.'],
        'runtimeSHA256': {path: sha(ROOT/path) for path in appended},
        'mutableManifestSHA256': {'assets/portraits.json': sha(assets/'portraits.json'), 'assets/sprites.json': sha(assets/'sprites.json'), 'assets/source-map.json': sha(assets/'source-map.json')},
        'sourceExclusions': ['rawsuppliedclips', 'extractedPNGframes', 'privateprompts', 'browserlocalprofiles']}
    jwrite(ROOT/'production/v8-assets.json', provenance)
    assert meta['pages'][:len(baseline['pages'])] == baseline['pages']
    for key, alias in aliases.items():
        kind, name = key.split('/');alias_kind, alias_name = alias.split('/')
        assert meta['characters'][alias_kind][alias_name] == baseline['characters'][kind][name]
    print(json.dumps({'appendedPages': len(meta['pages'])-len(baseline['pages']), 'runtimeBytes': sum((ROOT/path).stat().st_size for path in appended),
                      'spikeActions': list(meta['characters']['spike']), 'facingCorrections': len(facing), 'preservationAliases': len(aliases),
                      'sourceImpacts': provenance['sourceImpacts']}))


if __name__ == '__main__':
    main()
