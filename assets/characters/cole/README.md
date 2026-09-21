# Cole / Blender motion study

`cole-study.blend` is the editable prototype, generated with the installed Blender 5.2.1 LTS. Select `Cole_Rig` to inspect the armature. The timeline contains four marked clips:

| Clip | Frames | Rendered frames |
| --- | --- | --- |
| Idle | 1–8 | 8 |
| Walk | 13–24 | 12 |
| Sprint | 29–40 | 12 |
| Stop | 45–52 | 8 |

The leg targets use two-bone IK; boots copy target orientation. Rigid armature weights articulate the torso, head, arms and split coat tails. All meshes, materials, rig and motion are authored for this project; no downloaded character assets are required. This is a blockout, not a final sculpt or production cloth rig.

Rebuild from the repository root:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python tools/blender/cole-study.py
node tools/pack-cole-study.mjs
npm run dev
```

Open `/character-lab.html`. The same page is included in the Pages build. Blender is only needed when regenerating the art; normal builds use the committed PNG/JSON. Full-resolution intermediate renders and Blender backups are ignored by Git.

The camera renders transparent 128×192 frames, packed into 64×96 cells. These are downsampled render sprites, not hand-cleaned pixel art. Lighting is baked for the comparison; production integration would need a lighting/mask decision. Ground shadow is an approximation in the study. The viewer holds the last stop frame and supports scrubbing, mirroring, speed controls and reduced-motion initial pause.

Before replacing the playable sprite: review coat shape and hat proportions, improve ankle roll/contact and stop timing, add deformation across shoulders/knees, then tune the palette at actual gameplay scale. The playable character is deliberately unchanged until this comparison is reviewed.
