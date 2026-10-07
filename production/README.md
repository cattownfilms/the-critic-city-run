# Production evidence

THE CRITIC: COMING ATTRACTIONS v6 retains the accepted nine character banks and thirteen original atlas pages. `new-assets.json` records their baseline hashes, the supplied source hashes, appended runtime files, identity verification, and source limitations. The original pages are unchanged; the expanded campaign does not replace the accepted combat artwork.

| Runtime bank | Supplied source label | Role |
| --- | --- | --- |
| `pizzeria-boss` | Cream Scarf | Pizzeria Headliner, temporary public name; matches the supplied male performance clip |
| `marty` | Red Pullover | Marty Sherman, contextual story artwork |
| `duke` | Blue Polo | Duke Phillips, contextual story artwork |
| `turkey-dinner` | Turkey Dinner | Immediate health pickup with retained idle, collect, and disappear performances |
| `trash-can` | Trash Can | Breakable prop with retained idle and dent/explode performance |

Marty and Duke were verified against character references and are not assigned ordinary enemy AI. The theater Booth Enforcer uses the existing Shermometer v3 bank. The new sprites retain every supplied action in the three imported character banks. Teal Cap remains in the original source collection rather than adding an unnecessary roster slot.

`tools/import_production_assets.py --uploads /path/to/uploads` reproduces the supplied-asset import from the external source archives. It appends nine 1024-pixel WebP pages using quality 95 and lossless alpha, suppresses detected green-key color spill, and applies one scale per bank. Grounded poses and defeats meet the combat floor; the Pizzeria Headliner's native left-facing linked strike declares `canonicalFacing: -1`. `tests/production-assets.test.py` checks unchanged baseline hashes, canonical roles, derived hashes, atlas padding and bounds, source timing, floor contact, and chroma residue.

The generated backgrounds and assembled scene plates live in `assets/environments/` and `assets/cutscenes/`; `cutscene-art.json` records generated-art provenance and the image-production prompts. Authored scene data lives in `data/cutscenes.js`; campaign, enemy, boss, prop, and item definitions live in `data/campaign.js`. Dialogue stays in scene data rather than the artwork. Original videos, import ZIPs, private assignment logs, browser saves, and credentials remain outside the public runtime and source release. Provenance records identify source filenames and hashes without embedding those private source packages.

`v4-asset-build.json` records selected earlier clip frames, fixed take scale and targeted Franklin residue cleanup. `assets/source-map.json` contains the retained baseline frame provenance, including shared Shermometer entrances. `assets/music-map.json` maps the five supplied recordings and their hashes; the expanded campaign deliberately reuses those arrangements.

`Franklin-Source-Map.json` and `Franklin-Action-Catalog.md` describe the retained source move set. `Franklin-v02-Cleanup-Validation.json` describes the new full-resolution residue repair. The file named `Franklin-v01-HISTORICAL-Archived-Import-Test.json` applies only to the earlier v01 package. No current live Sprite Forge import is claimed for v02.
