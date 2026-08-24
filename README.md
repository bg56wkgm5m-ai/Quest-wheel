# Questwheel v4

This build keeps the same `questwheel-v1` localStorage key, so updating the existing GitHub Pages site should preserve v1–v3.1 planner data.

## v4 changes
- Swipe animation follows the finger and transitions the old/new day wheels horizontally.
- Header uses relative day language plus compact exact dates, including tomorrow, one week hence, week + N days, and fortnight hence (with past equivalents).
- Simultaneous/overlapping activities are supported and drawn as concentric tracks rather than painting over one another.
- Main wheel hour ticks now point inward; only the compact hour numbers sit outside the ring, reducing clipping.
- Colour controls now use native radio inputs for reliable iPhone selection.
- Quest panel heading now says “Quests”.
- Standalone blocks can always be created without first making a quest.
- Repetition is available for standalone blocks even when the quest log is empty.
- Nested quests have stronger indentation, branch lines/connectors, and explicit “subtask of” hierarchy labels.
- v4 assets are versioned and the service worker remains network-first for navigation to avoid the v2/v3 cache-mixing problem.

## Update
Upload all v4 files/folders to the same GitHub Pages repository. Old versioned assets can remain in the repository; `index.html` points only to the v4 files.

After Pages republishes, open the site once in Safari with `?v=4` appended to the URL. You should see `v4` beside Questwheel. Do not clear Safari website data, since that contains your local Questwheel data.
