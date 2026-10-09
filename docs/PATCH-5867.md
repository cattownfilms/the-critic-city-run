# 5867 scene micro-patch

Based on reviewed main d4853d66. The supplied annotation text defines the four changes; the recording was not available at its named Downloads path.

- Projection booths share one world-position camera target between engine and cinematic ownership. The camera settles exactly and ignores player movement until that circuit clears. Existing gate bounds intersect the visible fighting area; activation waits until the player reaches that area.
- The subtle projector beam uses booth/world coordinates, a slow low-amplitude flicker, and constant opacity under reduced motion. Circuit shutdown removes its beam.
- A short physical staging beat moves the selected player screen-left and waits for the camera before the existing single Rabbi emergence. Dialogue and combat are unchanged.
- The physical Duke phase shares fixed framing and visible arena bounds. The cage remains on the right, including checkpoint restoration. Machine combat and destruction do not use this lock.

Focused verification: `node tests/5867.test.js`, `node tests/5857.test.js`, `python tests/5867-browser.test.py --url local`; normal standalone and launcher builders. Browser fixtures cover portrait/landscape booth motion, beam anchoring, both routes at the Rabbi entrance, and Duke arena visibility. Results and motion artifacts are attached to the focused Actions run. Physical Android observations remain user-side.

No save schema, artwork, ending, dialogue, combat tuning, or release version change. Cache identifier: `v11-5867-20261009`.
