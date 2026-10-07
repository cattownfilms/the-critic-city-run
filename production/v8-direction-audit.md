# V8 source direction and registration audit

The reviewed v7 source contained 14 banks and 193 actions. Every action was inspected through first, middle and last decoded atlas crops at its original orientation and ground registration. Ten ambiguous sequences were inspected in full: Franklin idle, guard-enter, guard, recover, lead-punch, rear-punch and power-punch; Shermometer v1 swat-alt; Accordion Bear backhand; and Cinema Headliner attack. The newly supplied Spike and Franklin cartwheel performances were reviewed chronologically, including every 24fps can-release frame around separation.

The renderer's requested `face:+1` means right. Native left-facing artwork declares `canonicalFacing:-1`; individual frame declarations override the action declaration. The renderer mirrors the complete registered crop, including its horizontal offset and shadow, so these repairs require no bitmap resampling, recentering, timing change or pivot change. Existing source pixels remain exact. Every repaired original action is retained under `legacy-source-<action>` and mapped explicitly in `assets/sprites.json`, `assets/source-map.json` and `v8-assets.json`.

| Action | Verified source direction | V8 correction |
| --- | --- | --- |
| Franklin `idle`, `guard-enter`, `guard`, `recover` | Entire performance faces left | Action `canonicalFacing:-1` |
| Franklin `lead-punch` | Frames 0–9 left; frames 10–14 right | Frames 0–9 declare `canonicalFacing:-1` |
| Franklin `power-punch` | Frames 0–3 left; frames 4–12 right | Frames 0–3 declare `canonicalFacing:-1` |
| Cinema Headliner `attack` | Frame 0 strikes left; frames 1–11 right | Only frame 0 declares `canonicalFacing:-1` |
| Shermometer v1 `swat-alt` | Active strike frames 8–10 left; surrounding poses frontal | Action `canonicalFacing:-1` |
| Franklin `cartwheel-run` | Supplied cartwheel travels/strikes right | Source-derived replacement declares `canonicalFacing:+1`; original generated six-pose action retained |

Same-frame legacy source aliases keep their original serialized metadata while the renderer normalizes their display through the audited active counterpart, including gallery bounds and shadows. The archived generated cartwheel has different frames and retains its own direction.

Marty's idle, walk and run are natively right-facing, visible in his gaze, nose, leading arm/foot and gait. Their source metadata and pixels require no flip. His cage/scared poses are emotional acting with no travel direction. The ending's leftward travel must choose `face:-1`; moving a right-facing actor to the left is a scene choreography error rather than an asset error.

| Bank / canonical character | Finding |
| --- | --- |
| `hero` / Jay Sherman | Locomotion/combat face right. Dance and spinning performances intentionally turn/front-view; retained. |
| `bear` / Accordion Bear | Right-facing travel/strikes. Backhand's left-reaching arm is windup; active strike travels right. |
| `hippo` / Green Hippo | Right-facing travel; many idle/reaction/double-punch poses frontal. |
| `sherm-punch` / Shermometer v1 | Main travel/attack right; frontal idles/reactions. Left swat repaired as above. |
| `sherm-shove` / Shermometer v2 | Travel/shove right; frontal setup and reactions. |
| `sherm-slam` / Shermometer v3 | Travel right; overhead/slam attacks frontal/downward. |
| `striped` / Fred K | Ordinary travel/combat right; entrance includes frontal reveal. |
| `raptor` / JP Raptor Esq | Travel and directional ordinary/alternate strikes right. |
| `franklin` / Franklin | Travel/jump and most strikes right. Verified left actions/frames repaired; intentional turns and rear-punch source sequence retained. New supplied cartwheel right. |
| `pizzeria-boss` / Cinema Headliner | Travel/guard-reset right. Existing `opposite-strike` native left declaration already correct. One attack frame repaired. New upper-body screen performances right. |
| `marty` / Marty Sherman | Idle/walk/run and ordinary gestures right. Cage acting frontal; no source direction change. |
| `duke` / Duke Phillips | Idle/folded-idle/travel/jump/attack/lead-jab right. |
| `turkey-dinner` / Turkey Dinner | Neutral prop/item; actor-facing contract does not apply. |
| `trash-can` / Trash Can | Neutral prop. New detached can has centered rotation pivot. |
| `spike` / Spike | Source-derived idle/travel/punch/reactions/throw right. No frame mirroring needed. Grounded defeat retains the authored fall. |

Franklin rear-punch contains authored turns and mixed orientation; it is retained as a source performance without a blanket flip. Neutral/front-view poses, dances, taunts and defeat body turns are not inferred to be directional errors from one limb or a final prone head position.

New actor frames use a fixed horizontal source pivot of 640 pixels and one clip-wide scale, with ground contact at zero. The detached can uses a centered pivot. All 28 Spike death frames satisfy `oy + h == 0`, from kneeling through the final prone pose; sprite height is never normalized independently per frame. The visible can first separates at source frame 55 (2.291667s). Its measured center in bank coordinates is face-relative +121.8397 pixels and 126.3763 pixels above the floor. Both actor and detached can use the fixed 1.08 display scale, so the physical projectile source applies that scale and spawns at +131.5869/−136.4864 world units relative to the actor. Spike's sampled `trash-throw` release pose is fraction 7/19; Franklin's strongest lateral cartwheel pose is fraction 11/26. Engine timing can align these source poses to the accepted physical attack/release times without changing their damage or active windows.

Decoded atlas QA found zero opaque green-screen residue pixels across 4,522,682 new pixels with alpha at least 128. Source limitations remain explicit: the Cinema Headliner capture clips his feet and a later lunge; these states are used only where upper-body framing is appropriate. Spike's overhead can is briefly clipped in the source; the intro uses a fully framed earlier lift. The audit establishes source identity, alpha, registration and facing. Separate browser route checks verify actual story movement and both requested faci