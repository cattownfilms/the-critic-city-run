# THE CRITIC: COMING ATTRACTIONS — Known limitations

- Physical Android phones and Logitech controllers were not tested. Browser touch and Gamepad API fixtures are documented separately from hardware testing.
- The pizzeria boss and projection-window woman use temporary display identities (Pizzeria Headliner and Projectionist). The boss’s internal key is `pizzeria-boss`; renaming is centralized in the campaign definition. The supplied video’s cream-scarf model is used. The two supplied JPGs show the projection woman; the described additional storefront photo was not among the bytes supplied in this execution.
- The soundtrack has the five supplied recordings. Added stages deliberately reuse those arrangements; no new music or voice recordings were generated.
- Original source videos and oversized Sprite Forge archives remain outside the public runtime. `tools/import_production_assets.py` reproduces the new derivatives when those supplied archives are available.
- Original packed atlas pages mix many characters and poses, so most original atlas content is still core. New performances load by stage/gallery dependency; music and scene/environment images load separately. Offline HTML includes everything and is correspondingly large.
- Saves remain origin-specific. An old local save is not automatically transferred to GitHub Pages. Denied storage allows play but cannot retain progress after closing the tab.
- The final machine is a readable code-drawn animated boss over generated environmental art. Cutscenes use still art, controlled camera movement and sprite reactions rather than fully animated video.
