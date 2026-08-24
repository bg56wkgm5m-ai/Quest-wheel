# Questwheel v2

Questwheel is a private, offline-friendly RPG-style planner.

## v2 changes
- Opens on the actual current day and current week each time the app launches
- Quest/default durations now range from 2 minutes to 10 hours
- Scheduled blocks accept any whole-minute duration from 2 to 600 minutes
- Each quest can have its own persistent colour
- Day-wheel segments use quest colours
- Week view now shows all seven days as miniature 24-hour schedule wheels
- Reclaimed time still appears as free-time segments

## Existing v1 data
v2 intentionally keeps the same local-storage key as v1. If you replace the files in the same GitHub Pages site, your existing quests and schedule should remain. Older quests without a saved colour automatically fall back to their category colour.

## Updating your GitHub Pages copy
Replace the old root files with the v2 files from this folder: `index.html`, `app.js`, `styles.css`, `manifest.webmanifest`, `sw.js`, and the `icons` folder.

After GitHub Pages republishes, reopen Questwheel. The service worker uses a new cache version so updated files replace the old cached version.

## Privacy
Quest and schedule data stays in local browser storage. GitHub hosts only the app code.

## Backup warning
Clearing Safari website data for the Questwheel site can erase local planner data. Export/import backup is a good next feature.
