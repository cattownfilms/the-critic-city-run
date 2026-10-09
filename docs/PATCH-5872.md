# 5872 seven-item cinematic polish

Baseline: 8b9e48d (5867). No save schema or gameplay balance changes.

## Verified source intake

Searched HOME/current workspace, project assets, `~/storage/downloads`, `/storage/emulated/0/Download`, and `/sdcard/Download`. The storage aliases resolve to the same Downloads directory. No unrelated piano recording was selected.

- Review: `/storage/emulated/0/Download/2026-10-09_180258_812_Session_review.mp4`, 56,992,560 bytes, 175.933333 seconds, SHA-256 `2a98f851a118b4f1023c2824cb3438366b89582978ac028e3f7201bcc1d79d0f`. Sampled across the review, with detailed frames around 01:28. Reference only; not published.
- Music: `/storage/emulated/0/Download/The Critic TV theme arranged for piano (6).mp3`, 919,343 bytes, 40 seconds, SHA-256 `4e3c55cbfb9e3d19f42c970149d3c20c798d16a4b6b235813ecf3958ba2f3af6`. Copied byte-for-byte to `assets/music-ending-piano.mp3`. Existing recordings unchanged.

The installed ffprobe had an x265 ABI mismatch. Compatible ffmpeg/DVD/bluray packages were extracted into the external task evidence directory; no installed toolchain or shell settings changed.

## Corrections

1. Only the requested Jay replies change. Rabbi/Duke lines and Franklin alternatives stay intact.
2. Duke's old button offset used the entire image bottom, including its stand, as a changing foot pivot. Background Duke now uses the cage wheels' floor contact for both idle and button poses, preserving authored positions and registration.
3. Jay's Duke response uses the requested wording.
4. Final-scene compositions are fixed per scene instead of being recalculated for each speaker. The machine exit approaches the same final arena composition; defeat/reunion start and hold the last rendered pose. No new camera system.
5. Reviewed Jay beats use existing point/double-take mouth and emotional frames once over a bounded speaking interval, then stop. No generated mouth frames. Portrait cycling stops with that interval.
6. The unchanged memorial text uses a restrained serif hierarchy. The supplied cue is preloaded, fades in at the settled skyline card, does not loop, and respects volume/mute/pause. Continue/Skip immediately stop music at neutral results. Title/gameplay tracks are preserved.
7. Booth reveal waits for camera settlement. Existing fixed lock remains shared with gameplay. Shadow eyes align to the existing portrait; the landscape dialogue inset leaves the player visible. Light and throws remain world-fixed.

## Focused validation

`node tests/5872.test.js`, `node tests/5867.test.js`, `node tests/v11-playtest-engine.test.js`; Chromium direct-scene fixtures `tests/5867-browser.test.py` and `tests/5872-browser.test.py`. Normal standalone/Termux builders. Motion traces/screenshots and music playback state are archived with the focused Actions run. Physical Android audio/display observations remain user-side. No full campaign or all-browser matrix run.

Build identifier: `v11-5872-20261009`; game version 11.0.0, save schema 5.
