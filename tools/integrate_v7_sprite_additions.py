#!/usr/bin/env python3
"""Integrate generated cartwheel poses without altering accepted body banks."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'


def write_json(path, data):
    path.write_text(json.dumps(data, separators=(',', ':')) + '\n')


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def encode(image, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.tmp')
    image.save(temporary, 'WEBP', lossless=True, exact=True, method=6)
    with Image.open(temporary) as decoded:
        decoded.load()
        if decoded.size != image.size:
            raise ValueError(f'Invalid encoded dimensions: {path}')
    temporary.replace(path)


def derive_portraits(meta):
    portraits = json.loads((ASSETS / 'portraits.json').read_text())
    frame = meta['characters']['pizzeria-boss']['idle']['frames'][0]
    with Image.open(ASSETS / meta['pages'][frame['p']]['file']) as atlas:
        body = atlas.convert('RGBA').crop((frame['x'], frame['y'], frame['x']+frame['w'], frame['y']+frame['h']))
    bust = body.crop((17, 0, 96, 88)).resize((230, 256), Image.Resampling.NEAREST)
    plate = Image.new('RGBA', (256, 256))
    plate.paste(bust, (13, 0))
    encode(plate, ASSETS / 'portraits/pizzeria/talk-00.webp')
    bust = Image.open(ASSETS / 'story/projection-woman-pixel.webp').convert('RGBA').resize((192, 224), Image.Resampling.NEAREST)
    plate = Image.new('RGBA', (256, 256))
    plate.paste(bust, (32, 32))
    encode(plate, ASSETS / 'portraits/projectionist/talk-00.webp')
    for key, name in [('pizzeria', 'PIZZERIA HEADLINER'), ('projectionist', 'PROJECTIONIST')]:
        data = {'name': name, 'width': 256, 'height': 256, 'expressions': {}}
        frame = {'image': f'assets/portraits/{key}/talk-00.webp', 'ms': 1000}
        for expression in ('neutral', 'talk', 'silent'):
            data['expressions'][expression] = {'frames': [frame], 'loop': False}
        portraits['speakers'][key] = data
    for speaker, filename, expressions in [
            ('jay', 'shock.webp', ['surprise', 'shock', 'worried', 'fear']),
            ('jay', 'disgust.webp', ['disgust']),
            ('marty', 'fear.webp', ['fear', 'scared', 'worried'])]:
        if (ASSETS / 'portraits' / speaker / filename).is_file():
            for expression in expressions:
                portraits['speakers'][speaker]['expressions'][expression] = {
                    'frames': [{'image': f'assets/portraits/{speaker}/{filename}', 'ms': 1000}], 'loop': False}
    for expression in ('joy', 'relief'):
        portraits['speakers']['marty']['expressions'][expression] = portraits['speakers']['marty']['expressions']['silent']
    write_json(ASSETS / 'portraits.json', portraits)
    meta['portraits'] = portraits


def update_source_map(meta, provenance):
    path = ASSETS / 'source-map.json'
    source_map = json.loads(path.read_text())
    # Order in this old map is chronological even where sourceFrame is a video
    # index rather than a runtime index. Retain its old rectangle as evidence.
    indices = {}
    for record in source_map['frameDerivatives']:
        key = (record['character'], record['action'])
        index = indices.get(key, 0)
        indices[key] = index+1
        frame = meta['characters'][key[0]][key[1]]['frames'][index]
        record.setdefault('legacyV6RuntimeRect', record['runtimeRect'])
        record['runtimeRect'] = {name: frame[name] for name in ('p', 'x', 'y', 'w', 'h')}
    new_frames = []
    cage_source = next(source for source in provenance['suppliedSources'] if source['canonicalName'] == 'Marty Sherman')
    for name in ('scared-idle', 'trapped', 'caged'):
        for index, frame in enumerate(meta['characters']['marty'][name]['frames']):
            new_frames.append({'character': 'marty', 'action': name, 'runtimeFrame': index,
                'source': cage_source['sourceArchive'], 'sourceSHA256': cage_source['sourceSHA256'],
                'sourceFrameId': frame['sourceFrameId'], 'runtimeRect': {key: frame[key] for key in ('p', 'x', 'y', 'w', 'h')},
                'ox': frame['ox'], 'oy': frame['oy'], 'ms': frame['ms']})
    for index, (frame, record) in enumerate(zip(meta['characters']['franklin']['cartwheel-run']['frames'], provenance['generatedCartwheel']['frames'])):
        new_frames.append({'character': 'franklin', 'action': 'cartwheel-run', 'runtimeFrame': index,
            'source': record['source'], 'sourceSHA256': record['sourceSHA256'],
            'runtimeRect': {key: frame[key] for key in ('p', 'x', 'y', 'w', 'h')},
            'ox': frame['ox'], 'oy': frame['oy'], 'ms': frame['ms'], 'decodedRuntimeSHA256': record['decodedCropSHA256']})
    source_map['v7FrameDerivatives'] = new_frames
    source_map['v7ProductionMap'] = 'production/v7-assets.json'
    source_map['currentRuntimePages'] = meta['pages']
    source_map['currentRevision'] = meta['revision']
    source_map['currentFrameReferences'] = sum(len(action['frames']) for bank in meta['characters'].values() for action in bank.values())
    write_json(path, source_map)


def main():
    meta = json.loads((ASSETS / 'sprites.json').read_text())
    derive_portraits(meta)
    frames, images, records = [], [], []
    durations = [80, 90, 90, 90, 90, 100]
    poses = ['anticipation', 'palm plant', 'split handstand', 'one-palm rotation', 'touchdown', 'recovery']
    for index in range(6):
        source = ASSETS / 'generated/franklin-cartwheel' / f'cartwheel-run_{index:03d}.webp'
        image = Image.open(source).convert('RGBA')
        if image.size != (320, 256):
            raise ValueError(f'Expected shared 320x256 generated canvas: {source}')
        # Narrow technical matte repair: only distinctly red pixels within three
        # pixels of existing transparency. Pink skin, salmon sash, plum outlines
        # and interior artwork are preserved; this is never a global color key.
        edge = image.getchannel('A').point(lambda alpha: 255 if alpha == 0 else 0).filter(ImageFilter.MaxFilter(7))
        pixels, cleared = [], 0
        for (red, green, blue, alpha), boundary in zip(image.get_flattened_data(), edge.get_flattened_data()):
            if boundary and alpha and red > 200 and green < 70 and blue < 95 and red > 2.8*green and red > 2.6*blue:
                pixels.append((red, green, blue, 0))
                cleared += 1
            else:
                pixels.append((red, green, blue, alpha))
        image.putdata(pixels)
        bounds = image.getchannel('A').getbbox()
        left, top, right, bottom = bounds
        crop = image.crop(bounds)
        images.append(crop)
        frames.append({'ox': left-160, 'oy': top-230, 'w': crop.width, 'h': crop.height,
                       'ms': durations[index], 'contactY': 230-bottom, 'contactX': 0})
        records.append({'source': str(source.relative_to(ROOT)), 'sourceSHA256': sha(source),
                        'sourceCanvas': [320, 256], 'sourcePivot': [160, 230], 'pose': poses[index],
                        'distinctRedMattePixelsCleared': cleared,
                        'decodedCropSHA256': hashlib.sha256(crop.tobytes()).hexdigest()})
    width = 3 + sum(image.width+3 for image in images[:3])
    second_width = 3 + sum(image.width+3 for image in images[3:])
    row_height = max(image.height for image in images[:3])
    second_height = max(image.height for image in images[3:])
    atlas = Image.new('RGBA', (max(width, second_width), 3+row_height+3+second_height+3))
    for row in range(2):
        x, y = 3, 3 if row == 0 else 6+row_height
        for index in range(row*3, row*3+3):
            atlas.paste(images[index], (x, y))
            frames[index].update({'x': x, 'y': y})
            x += images[index].width+3
    output = ASSETS / 'dependency/franklin-cartwheel-run-00.webp'
    encode(atlas, output)
    existing = next((index for index, page in enumerate(meta['pages']) if page['file'] == str(output.relative_to(ASSETS))), None)
    page_id = len(meta['pages']) if existing is None else existing
    page = {'file': str(output.relative_to(ASSETS)), 'width': atlas.width, 'height': atlas.height,
            'bytes': output.stat().st_size, 'bank': 'franklin', 'group': 'gameplay',
            'encoding': 'lossless-webp-exact-rgba'}
    if existing is None:
        meta['pages'].append(page)
    else:
        meta['pages'][page_id] = page
    for frame in frames:
        frame['p'] = page_id
    meta['characters']['franklin']['cartwheel-run'] = {'label': 'Cartwheel / running attack',
        'frames': frames, 'ms': sum(durations), 'loop': False, 'original': False,
        'sourceDescription': 'Generated missing action, six distinct fixed-scale poses registered on ground230. Physics and damage remain engine-controlled.',
        'sourceImpact': sum(durations[:2])/sum(durations), 'canonicalFacing': 1}
    for purpose in ('gameplay', 'gallery'):
        meta['loading'][purpose]['franklin'] = sorted(set(meta['loading'][purpose]['franklin']+[page_id]))
    meta['loading']['actions']['franklin']['cartwheel-run'] = [page_id]
    meta['loading']['groups']['franklin']['gameplay'] = sorted(set(meta['loading']['groups']['franklin']['gameplay']+[page_id]))
    meta['counts']['franklin'] = {'actions': len(meta['characters']['franklin']), 'frames': sum(len(a['frames']) for a in meta['characters']['franklin'].values())}
    write_json(ASSETS / 'sprites.json', meta)
    provenance = json.loads((ROOT / 'production/v7-assets.json').read_text())
    provenance['runtimeSHA256'][str(output.relative_to(ROOT))] = sha(output)
    for path in list((ASSETS / 'portraits').rglob('*.webp'))+[ASSETS / 'portraits.json']:
        provenance['runtimeSHA256'][str(path.relative_to(ROOT))] = sha(path)
    provenance['dependencyAtlasBytes'] = sum(page['bytes'] for page in meta['pages'])
    provenance['generatedCartwheel'] = {'action': 'franklin/cartwheel-run', 'frames': records,
        'processing': 'Shared320x256 canvas, shared scale/pivot; no per-frame scale. Narrow edge-connected distinct red matte cleanup; all body colors retained.',
        'runtimeAtlas': str(output.relative_to(ROOT)), 'runtimeSHA256': sha(output)}
    write_json(ROOT / 'production/v7-assets.json', provenance)
    update_source_map(meta, provenance)
    print(json.dumps({'action': 'franklin/cartwheel-run', 'frames': len(frames), 'page': page_id,
                      'bytes': page['bytes'], 'sourceImpact': meta['characters']['franklin']['cartwheel-run']['sourceImpact'],
                      'mattePixelsCleared': [record['distinctRedMattePixelsCleared'] for record in records]}))


if __name__ == '__main__':
    main()
