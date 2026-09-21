# Warped City character motion candidate

Artwork by Luis Zuno / Ansimuz, CC0/public domain.
Source: https://opengameart.org/content/warped-city
Creator storefront: https://ansimuz.itch.io/warped-city
Downloaded 2026-09-20 from the creator's OpenGameArt release:
https://opengameart.org/sites/default/files/warped_city_files.zip

These are the 32 unmodified PNG frames from SPRITES/player/{idle,walk,run,jump}.
The accompanying LICENSE.txt is copied verbatim. No music is included.
Original PSD sources for these animations are also in the upstream archive.

The runtime crops a fixed 71×55 rectangle starting at (0,12), pivot x=38,
from every 71×67 source image, with a 58px logical cell height to match Cole’s
transparent shoe margin. It does not trim frames independently, preserving
foot alignment and authored body movement. Walk is 16 frames / 0.8 seconds;
run is 8 / 0.4 seconds at full sprint. These playback timings are game tuning.

Gravity is the default protagonist. `src/gravity-palette.ts` recolors decoded
frames once at load time, preserving their alpha and geometry. Hair detection
separates the shared purple stockings from the hair shadow. Skin is unchanged.
The original PNGs remain untouched. Combat mechanics and timing are unchanged;
the character's appearance and jump art use the same female protagonist.

Preview: character-lab.html compares the original palette with Gravity.
`?character=original` previews the unmodified palette; `?character=cole` retains
the legacy prototype for development. Investigation gestures use idle pending
custom gesture art. The current narrative canon lives in docs/STORY_BIBLE.md.

Shortlist considered:
- Warped City: selected for separate authored walk/run cycles and CC0 source art.
- Ion Reaver (https://chierit.itch.io/cyberpunk-character-ion-reaver): paid,
  extensive animation set and editable Aseprite source; not purchased.
- Cyberpunk Character Pack 2 (https://oco.itch.io/cyberpunk-character-pack-2):
  paid Detective silhouette is promising, but a separate walk is not listed;
  not purchased.
