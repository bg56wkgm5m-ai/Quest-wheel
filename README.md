# Questwheel

Questwheel is a private, offline-friendly RPG-style planner.

## Current features
- Quest log with categories and default durations
- Schedule quests into time blocks
- 24-hour circular day wheel
- Mark a block complete with actual time used
- Finishing early converts unused scheduled time into reclaimed free time
- Weekly overview
- Data stored locally in the browser using localStorage
- Installable PWA and offline cache

## Install on iPhone
A PWA needs to be served over HTTPS. The easiest free route is GitHub Pages:

1. Create a free GitHub account if you do not already have one.
2. Create a new repository, for example `questwheel`.
3. Upload the contents of this folder (not the zip itself).
4. In the repository: Settings → Pages.
5. Under "Build and deployment", choose "Deploy from a branch".
6. Choose the `main` branch and `/ (root)`, then Save.
7. Open the resulting GitHub Pages address in Safari on your iPhone.
8. Tap Share → Add to Home Screen.

Your quest/schedule data is stored locally on that browser/device. It is not sent to GitHub.

## Important
If you clear Safari website data for the hosted site, the app's local data can be erased.
A later version should add Export/Import backup.
